import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { DEMO_STARTUPS } from './seed-data';

// Demo fixtures: fictional startups whose "treasury"/"token" point at real mainnet
// contracts so The Graph providers return live data during the demo.
async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const deadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  for (const demo of DEMO_STARTUPS) {
    const existing = await prisma.startup.findFirst({ where: { name: demo.name } });
    if (existing) continue;
    const startup = await prisma.startup.create({ data: demo.startup });
    await prisma.round.create({
      data: {
        startupId: startup.id,
        targetUsdc: demo.targetUsdc,
        minTicketUsdc: 10,
        deadline,
        milestones: demo.milestones,
      },
    });
    console.log(`seeded ${startup.name}`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
