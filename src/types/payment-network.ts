export type SimSwapStatus = 'no_swap' | 'recent_swap' | 'unknown';
export type NetworkRiskLevel = 'low' | 'medium' | 'high';

export interface SimSwapCheckResult {
  checked: boolean;
  status: SimSwapStatus;
  swapped_within_days: number | null;
  risk_level: NetworkRiskLevel;
}

export interface LocationCheckResult {
  checked: boolean;
  country: string;
  region: string;
  city: string;
  carrier: string;
}

export interface NetworkCheckInput {
  phone_number: string;
  sim_swap?: boolean;
  location?: boolean;
}

export interface NetworkCheckResult {
  phone_number: string;
  checked_at: string;
  sim_swap: SimSwapCheckResult | null;
  location: LocationCheckResult | null;
}

export function formatSimSwapStatus(status: SimSwapStatus): string {
  if (status === 'no_swap') return 'No recent SIM swap';
  if (status === 'recent_swap') return 'Recent SIM swap detected';
  return 'SIM swap status unknown';
}

export function isHighRiskNetworkCheck(result: NetworkCheckResult | null): boolean {
  return result?.sim_swap?.risk_level === 'high';
}

export function isRecentSimSwapForRegistration(result: NetworkCheckResult | null): boolean {
  if (!result?.sim_swap?.checked || result.sim_swap.status !== 'recent_swap') {
    return false;
  }
  const days = result.sim_swap.swapped_within_days;
  return days === null || days < 1;
}
