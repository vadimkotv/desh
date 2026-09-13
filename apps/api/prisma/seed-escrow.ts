import { createPublicClient, createWalletClient, decodeEventLog, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { toBaseUnits } from '../src/common/money';
import { arcTestnet } from '../src/modules/settlement/infrastructure/arc/arc-chain';
import { roundEscrowAbi } from '../src/modules/settlement/infrastructure/arc/escrow.abi';

export interface SeedEscrowRound {
  founder: string;
  targetUsdc: number;
  deadline: Date;
  milestoneBps: number[];
  equityBps: number;
}

// Mirrors CreateRoundUseCase for the seed: with an escrow configured, demo rounds are created
// on-chain too, so agents can settle into them. Without one the rounds stay off-chain.
export function escrowSeeder(env: NodeJS.ProcessEnv = process.env) {
  const { ARC_ESCROW_ADDRESS: escrow, ARC_PLATFORM_PRIVATE_KEY: key, ARC_RPC_URL: rpc } = env;
  if (!escrow || !key) return null;

  const chain = arcTestnet(rpc || undefined);
  const account = privateKeyToAccount(key as `0x${string}`);
  const publicClient = createPublicClient({ chain, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain, transport: http(rpc) });
  const address = escrow as `0x${string}`;

  return async (r: SeedEscrowRound): Promise<{ onchainRoundId: number; escrowAddress: string }> => {
    const hash = await wallet.writeContract({
      address, abi: roundEscrowAbi, functionName: 'createRound',
      args: [r.founder as `0x${string}`, toBaseUnits(r.targetUsdc), BigInt(Math.floor(r.deadline.getTime() / 1000)), r.milestoneBps, r.equityBps],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 });
    if (receipt.status !== 'success') throw new Error(`createRound reverted: ${hash}`);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== address.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: roundEscrowAbi, data: log.data, topics: log.topics });
        if (ev.eventName === 'RoundCreated') return { onchainRoundId: Number(ev.args.roundId), escrowAddress: address };
      } catch {
        /* not our event */
      }
    }
    throw new Error('RoundCreated event not found in receipt');
  };
}
