import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { mnemonicToAccount } from 'viem/accounts';
import { PrismaClient } from '../src/generated/prisma/client';
import { DEMO_AGENTS } from './seed-agents';
import { DEMO_STARTUPS } from './seed-data';

// Demo fixtures: fictional startups whose "treasury"/"token" point at real mainnet
// contracts so The Graph providers return live data, plus three disagreeing agents.
async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const deadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  for (const demo of DEMO_STARTUPS) {
    if (await prisma.startup.findFirst({ where: { name: demo.name } })) continue;
    const startup = await prisma.startup.create({ data: demo.startup });
    await prisma.round.create({
      data: { startupId: startup.id, targetUsdc: demo.targetUsdc, minTicketUsdc: 10, deadline, milestones: demo.milestones },
    });
    console.log(`seeded startup ${startup.name}`);
  }

  const mnemonic = process.env.AGENT_MASTER_MNEMONIC;
  for (const demo of DEMO_AGENTS) {
    if (await prisma.agent.findFirst({ where: { name: demo.name } })) continue;
    const agent = await prisma.agent.create({ data: { ...demo, walletKind: 'LOCAL_KEY' } });
    const walletAddress = mnemonic ? mnemonicToAccount(mnemonic, { addressIndex: agent.keyIndex }).address : null;
    await prisma.agent.update({ where: { id: agent.id }, data: { walletAddress } });
    console.log(`seeded agent ${agent.name} (${walletAddress ?? 'no wallet: set AGENT_MASTER_MNEMONIC'})`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
