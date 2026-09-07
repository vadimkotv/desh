import type { DueDiligencePreview } from '@agentipo/shared';
import { Badge, scoreTone } from '@/components/ui/badge';

type DdScoreBadgeProps = { preview: DueDiligencePreview | null };

// Compact due-diligence indicator for cards. `null` means the API returned
// 404 (no report yet) or the preview could not be loaded.
export function DdScoreBadge({ preview }: DdScoreBadgeProps) {
  if (!preview) return <Badge tone="neutral">DD · no report yet</Badge>;
  return <Badge tone={scoreTone(preview.score)}>DD · {Math.round(preview.score)}/100</Badge>;
}
