import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPublicClient, createWalletClient, http, parseAbi, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PrismaClient } from '../src/generated/prisma/client';
import { ARC_TESTNET } from '@agentipo/shared';

// Mints test USDC to every agent wallet that is short, on a local anvil fork of Arc.
// Agent key indexes climb with every reseed, so minting a fixed range eventually
// leaves an agent on an empty wallet and every decision comes back WATCH.
// Usage: pnpm --filter @agentipo/api dev:fund-agents [amountUsdc=5000]
const amount = BigInt(Math.round(Number(process.argv[2] ?? 5_000) * 1e6));
const usdc = ARC_TESTNET.usdc as Address;
const abi = parseAbi([
  'function mint(address to, uint256 amount)',
  'function balanceOf(address owner) view returns (uint256)',
]);

async function main(): Promise<void> {
  const rpc = process.env.ARC_RPC_URL;
  const key = process.env.ARC_PLATFORM_PRIVATE_KEY;
  if (!rpc || !key) throw new Error('ARC_RPC_URL and ARC_PLATFORM_PRIVATE_KEY are required');

  const chain = { id: ARC_TESTNET.id, name: 'arc-local', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 }, rpcUrls: { default: { http: [rpc] } } } as const;
  const pub = createPublicClient({ chain, transport: http(rpc) });
  const wallet = createWalletClient({ account: privateKeyToAccount(key as `0x${string}`), chain, transport: http(rpc) });

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const agents = await prisma.agent.findMany({ where: { walletAddress: { not: null } } });

  for (const agent of agents) {
    const address = agent.walletAddress as Address;
    const balance = await pub.readContract({ address: usdc, abi, functionName: 'balanceOf', args: [address] });
    if (balance >= amount) {
      console.log(`${agent.name}: ${Number(balance) / 1e6} USDC — skipped`);
      continue;
    }
    const hash = await wallet.writeContract({ address: usdc, abi, functionName: 'mint', args: [address, amount - balance] });
    await pub.waitForTransactionReceipt({ hash });
    console.log(`${agent.name}: topped up to ${Number(amount) / 1e6} USDC (${address})`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
