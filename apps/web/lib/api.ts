import type * as S from '@agentipo/shared';
import type * as T from './api-types';
import { get, post } from './http';

export { API_URL, listOrEmpty, sseUrl } from './http';

// Single fetch call site for the dashboard. Works in server components and
// client components alike; every helper returns an ApiResult, never throws.
export const api = {
  health: () => get<T.Health>('/health'),
  authMode: () => get<{ privy: boolean }>('/auth/mode'),
  session: (accountId: string) => get<S.Session>(`/auth/accounts/${accountId}`),
  openSession: (body: S.SessionRequest) => post<S.Session>('/auth/session', body),
  setRole: (accountId: string, role: S.AccountRole) =>
    post<S.Session>(`/auth/accounts/${accountId}/role`, { role }),
  stats: () => get<S.Stats>('/stats'),
  rounds: () => get<T.RoundDetail[]>('/rounds'),
  startups: () => get<S.Startup[]>('/startups'),
  startup: (id: string) => get<S.Startup>(`/startups/${id}`),
  round: (id: string) => get<T.RoundDetail>(`/rounds/${id}`),
  roundReturns: (id: string) => get<S.RoundReturns>(`/rounds/${id}/returns`),
  exits: (id: string) => get<S.ExitEvent[]>(`/rounds/${id}/exits`),
  ddPreview: (roundId: string) => get<S.DueDiligencePreview>(`/due-diligence/rounds/${roundId}`),
  ddReport: (roundId: string) =>
    get<S.DueDiligenceReport>(`/due-diligence/rounds/${roundId}/report`),
  ddHistory: (roundId: string) =>
    get<T.DdHistoryPoint[]>(`/due-diligence/rounds/${roundId}/history`),
  signals: (startupId: string) => get<S.Signal[]>(`/data-room/startups/${startupId}/signals`),
  metrics: (startupId: string, agentId?: string) =>
    get<T.Disclosure>(`/data-room/startups/${startupId}/metrics${agentId ? `?agentId=${agentId}` : ''}`),
  accessRequests: (startupId: string) =>
    get<S.AccessRequest[]>(`/data-room/startups/${startupId}/access`),
  agents: () => get<S.Agent[]>('/agents'),
  reviewFeed: () => get<S.ReviewFeedItem[]>('/agents/feed'),
  agent: (id: string) => get<S.Agent>(`/agents/${id}`),
  agentDecisions: (id: string) => get<S.Decision[]>(`/agents/${id}/decisions`),
  decisions: () => get<S.Decision[]>('/decisions'),
  pendingDecisions: () => get<S.Decision[]>('/decisions/pending'),
  audit: () => get<S.AuditEntry[]>('/audit'),
  runs: (limit = 8) => get<S.RunEvent[][]>(`/runs?limit=${limit}`),
  receipts: () => get<T.Receipt[]>('/payments/receipts'),
  pricing: () => get<T.Pricing>('/payments/pricing'),
  walletUsdc: (address: string) => get<T.WalletBalance>(`/settlement/wallets/${address}/usdc`),
  onchainRound: (onchainId: number) => get<T.OnchainRound>(`/settlement/rounds/${onchainId}`),
  createAgent: (input: S.CreateAgent) => post<S.Agent>('/agents', input),
  createStartup: (input: S.CreateStartup) => post<S.Startup>('/startups', input),
  upsertMetric: (startupId: string, input: S.UpsertMetric) =>
    post<S.FounderMetric>(`/data-room/startups/${startupId}/metrics`, input),
  createRound: (input: S.CreateRound) => post<T.RoundDetail>('/rounds', input),
  registerIdentity: (id: string) => post<S.Agent>(`/agents/${id}/identity`),
  runAgent: (id: string) => post<S.Agent>(`/agents/${id}/run`),
  pauseAgent: (id: string) => post<S.Agent>(`/agents/${id}/pause`),
  startRun: (agentId: string, roundId?: string) =>
    post<T.RunHandle>(`/agents/${agentId}/runs${roundId ? `?roundId=${roundId}` : ''}`),
  swarm: (roundId: string) => post<T.SwarmResponse>(`/rounds/${roundId}/swarm`),
  approveDecision: (id: string) => post<S.Decision>(`/decisions/${id}/approve`, { approvedBy: 'operator' }),
  rejectDecision: (id: string) => post<S.Decision>(`/decisions/${id}/reject`, { approvedBy: 'operator' }),
  claim: (agentId: string, roundId: string) =>
    post<T.ClaimResult>(`/agents/${agentId}/claim?roundId=${roundId}`),
  finalizeRound: (id: string) => post<T.RoundDetail>(`/rounds/${id}/finalize`),
  releaseMilestone: (id: string) => post<T.RoundDetail>(`/rounds/${id}/milestones/release`),
  settleExit: (id: string, exit: S.SettleExit) => post<T.RoundDetail>(`/rounds/${id}/exit`, exit),
  syncRound: (id: string) => post<T.RoundDetail>(`/rounds/${id}/sync`),
  refreshDataRoom: (startupId: string) => post<unknown>(`/data-room/startups/${startupId}/refresh`),
  grantAccess: (id: string) => post<S.AccessRequest>(`/data-room/access/${id}/grant`),
  denyAccess: (id: string) => post<S.AccessRequest>(`/data-room/access/${id}/deny`),
  generateReport: (roundId: string) =>
    post<S.DueDiligenceReport>(`/due-diligence/rounds/${roundId}/generate`),
};
