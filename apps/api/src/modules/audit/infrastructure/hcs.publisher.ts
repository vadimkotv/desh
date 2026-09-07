import { Injectable, Logger } from '@nestjs/common';
import { TopicCreateTransaction, TopicId, TopicMessageSubmitTransaction } from '@hiero-ledger/sdk';
import { AppConfig } from '../../../config/app-config';
import { HederaClientProvider } from '../../../common/hedera/hedera-client.provider';
import type { ConsensusPublisher, ConsensusReceipt } from '../domain/audit.port';

// Writes agent decisions to a Hedera Consensus Service topic. If no topic is configured
// one is created on first use and its id is logged so it can be pinned in .env.
@Injectable()
export class HcsPublisher implements ConsensusPublisher {
  private readonly log = new Logger(HcsPublisher.name);
  private topicId?: TopicId;

  constructor(
    private readonly hedera: HederaClientProvider,
    private readonly config: AppConfig,
  ) {}

  async publish(message: string): Promise<ConsensusReceipt> {
    const client = this.hedera.get();
    const topicId = await this.ensureTopic();
    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(client);
    const receipt = await response.getReceipt(client);
    const sequenceNumber = receipt.topicSequenceNumber ? Number(receipt.topicSequenceNumber.toString()) : 0;
    return { topicId: topicId.toString(), sequenceNumber };
  }

  private async ensureTopic(): Promise<TopicId> {
    if (this.topicId) return this.topicId;
    const configured = this.config.env.HEDERA_HCS_TOPIC_ID;
    if (configured) {
      this.topicId = TopicId.fromString(configured);
      return this.topicId;
    }
    const client = this.hedera.get();
    const tx = await new TopicCreateTransaction().setTopicMemo('AgentIPO agent decision audit log').execute(client);
    const receipt = await tx.getReceipt(client);
    if (!receipt.topicId) throw new Error('Topic creation returned no topicId');
    this.topicId = receipt.topicId;
    this.log.warn(`Created HCS topic ${this.topicId.toString()} — set HEDERA_HCS_TOPIC_ID to reuse it`);
    return this.topicId;
  }
}
