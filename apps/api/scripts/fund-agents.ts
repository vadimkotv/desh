import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPublicClient, createWalletClient, http, parseAbi, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PrismaClient } from '../src/generated/prisma/client';
import { ARC_TESTNET } from '@agentipo/shared';

// Tops up every agent wallet on a local anvil fork of Arc: test USDC to invest with,
// and native balance to pay gas. Agent key indexes climb with every reseed, so a fixed
// mint range eventually leaves an agent with no USDC (every decision returns WATCH) or
// past anvil's ten pre-funded accounts with no gas at all (every settlement reverts
// with 'gas required exceeds allowance: 0').
// Usage: pnpm --filter @agentipo/api dev:fund-agents [amountUsdc=5000]
const amount = BigInt(Math.round(Number(process.argv[2] ?? 5_000) * 1e6));
const GAS_FLOOR = 10n ** 17n; // 0.1 native units is plenty for a few hundred txs
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
    const notes: string[] = [];

    const balance = await pub.readContract({ address: usdc, abi, functionName: 'balanceOf', args: [address] });
    if (balance < amount) {
      const hash = await wallet.writeContract({ address: usdc, abi, functionName: 'mint', args: [address, amount - balance] });
      await pub.waitForTransactionReceipt({ hash });
      notes.push(`USDC → ${Number(amount) / 1e6}`);
    }

    if ((await pub.getBalance({ address })) < GAS_FLOOR) {
      const hash = await wallet.sendTransaction({ to: address, value: GAS_FLOOR });
      await pub.waitForTransactionReceipt({ hash });
      notes.push('gas funded');
    }
    console.log(`${agent.name}: ${notes.length ? notes.join(', ') : 'already funded'} (${address})`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
