import { z } from 'zod';

// What a running agent is doing about one round, decided server-side by the SAME
// mandate gate the runtime uses — the dashboard renders this, it never re-derives it.
export const ReviewState = z.enum(['WAITING', 'REVIEWED', 'INVESTED']);
export type ReviewState = z.infer<typeof ReviewState>;

export const ReviewWatcherSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
});
export type ReviewWatcher = z.infer<typeof ReviewWatcherSchema>;

export const ReviewFeedItemSchema = z.object({
  roundId: z.string(),
  state: ReviewState,
  score: z.number().nullable(),
  watchers: z.array(ReviewWatcherSchema),
});
export type ReviewFeedItem = z.infer<typeof ReviewFeedItemSchema>;
