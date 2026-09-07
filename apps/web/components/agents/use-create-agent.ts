'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { ActionStatus } from '@/components/ui/action-button';
import { api } from '@/lib/api';
import { parseAgentForm } from './agent-form-parse';

// Validates the form with the shared schema, posts it, and refreshes the list.
export function useCreateAgent() {
  const router = useRouter();
  const [status, setStatus] = useState<ActionStatus>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = parseAgentForm(new FormData(form));
    if (!parsed.ok) return setStatus({ tone: 'error', text: parsed.error });
    setStatus({ tone: 'pending', text: 'Provisioning wallet + Hedera account…' });
    const result = await api.createAgent(parsed.value);
    if (!result.ok) return setStatus({ tone: 'error', text: `${result.status || 'offline'} · ${result.error}` });
    setStatus({ tone: 'ok', text: `created ${result.data.name}` });
    form.reset();
    router.refresh();
  }

  return { status, busy: status?.tone === 'pending', onSubmit };
}
