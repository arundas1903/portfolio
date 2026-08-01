import type { NetworkCheckInput, NetworkCheckResult } from '../types/payment-network';
import { API_BASE } from './chatAuth';

const BFSI_OWNER_EMAIL_HEADER = 'X-BFSI-Owner-Email';

export interface PaymentRegisterVerifyInput {
  phone_number: string;
  email: string;
  ownerEmail: string;
}

export interface PaymentRegisterVerifyResult {
  allowed: boolean;
  blocked_reason: string | null;
  sim_swap: NetworkCheckResult['sim_swap'];
  alert_email_sent: boolean;
}

export interface NetworkCheckResultWithPrice extends NetworkCheckResult {
  price_paise?: number | null;
}

export function getPaymentApiDocsUrl(): string {
  return `${API_BASE}/docs`;
}

function paymentHeaders(ownerEmail: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    [BFSI_OWNER_EMAIL_HEADER]: ownerEmail,
  };
}

export async function verifyPaymentRegistration(
  input: PaymentRegisterVerifyInput,
): Promise<PaymentRegisterVerifyResult> {
  const response = await fetch(`${API_BASE}/api/payment/register/verify`, {
    method: 'POST',
    headers: paymentHeaders(input.ownerEmail),
    body: JSON.stringify({
      phone_number: input.phone_number,
      email: input.email,
    }),
  });

  if (!response.ok) {
    let detail = 'Registration verification failed';
    try {
      const payload = await response.json();
      if (typeof payload.detail === 'string') {
        detail = payload.detail;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return response.json() as Promise<PaymentRegisterVerifyResult>;
}

export async function checkPaymentNetwork(
  input: NetworkCheckInput & { ownerEmail: string },
): Promise<NetworkCheckResultWithPrice> {
  const response = await fetch(`${API_BASE}/api/payment/network/check`, {
    method: 'POST',
    headers: paymentHeaders(input.ownerEmail),
    body: JSON.stringify({
      phone_number: input.phone_number,
      sim_swap: input.sim_swap ?? true,
      location: input.location ?? true,
    }),
  });

  if (!response.ok) {
    let detail = 'Network check failed';
    try {
      const payload = await response.json();
      if (typeof payload.detail === 'string') {
        detail = payload.detail;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return response.json() as Promise<NetworkCheckResultWithPrice>;
}
