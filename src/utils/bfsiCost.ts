export function formatMicroPaise(microPaise: number): string {
  if (microPaise <= 0) {
    return '0 paise';
  }
  const paise = microPaise / 100;
  if (paise < 100) {
    return `${paise.toFixed(2)} paise`;
  }
  return `₹${(paise / 100).toFixed(4)}`;
}

export function formatAiCostLabel(log: {
  ai_cost_micro_paise: number;
  ai_prompt_tokens: number | null;
  ai_completion_tokens: number | null;
}): string {
  if (log.ai_cost_micro_paise <= 0) {
    return '—';
  }
  const tokens =
    (log.ai_prompt_tokens ?? 0) + (log.ai_completion_tokens ?? 0);
  return `${formatMicroPaise(log.ai_cost_micro_paise)} (${tokens} tok)`;
}
