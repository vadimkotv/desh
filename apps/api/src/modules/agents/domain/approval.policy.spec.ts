import { describe, expect, it } from 'vitest';
import { approvalFor, isActionable } from './approval.policy';

describe('approvalFor', () => {
  it('lets an autonomous agent settle every verdict itself', () => {
    expect(approvalFor('AUTONOMOUS', 'INVEST')).toBe('NOT_REQUIRED');
    expect(approvalFor('AUTONOMOUS', 'PASS')).toBe('NOT_REQUIRED');
    expect(approvalFor('AUTONOMOUS', 'WATCH')).toBe('NOT_REQUIRED');
  });

  it('holds an advisory agents ticket for a human', () => {
    expect(approvalFor('ADVISORY', 'INVEST')).toBe('PENDING');
  });

  it('does not ask a human to approve doing nothing', () => {
    expect(approvalFor('ADVISORY', 'PASS')).toBe('NOT_REQUIRED');
    expect(approvalFor('ADVISORY', 'WATCH')).toBe('NOT_REQUIRED');
  });
});

describe('isActionable', () => {
  it('is true only while the proposal is still pending', () => {
    expect(isActionable('PENDING')).toBe(true);
    expect(isActionable('APPROVED')).toBe(false);
    expect(isActionable('REJECTED')).toBe(false);
    expect(isActionable('NOT_REQUIRED')).toBe(false);
  });
});
