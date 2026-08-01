export type NotificationChannel = 'sms' | 'email' | 'push' | 'network';

export type BfsiTab = 'dashboard' | 'templates';

export interface BfsiUserProfile {
  email: string;
}

export interface BfsiTemplate {
  id: string;
  name: string;
  content: string;
  amount_threshold: number;
  channel_if_above: NotificationChannel;
  channel_if_below: NotificationChannel;
  routing_summary: string;
  created_at: string;
  updated_at: string;
}

export interface BfsiTemplateCreateInput {
  name: string;
  content: string;
  amount_threshold: number;
  channel_if_above: NotificationChannel;
  channel_if_below: NotificationChannel;
}

export interface BfsiDefaultConfigInput {
  amount_threshold: number;
  channel_if_above: NotificationChannel;
  channel_if_below: NotificationChannel;
}

export interface BfsiDefaultConfig {
  email: string;
  amount_threshold: number;
  channel_if_above: NotificationChannel;
  channel_if_below: NotificationChannel;
  routing_summary: string;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface BfsiNotificationLog {
  id: string;
  template_id: string;
  template_name: string;
  amount: number;
  channel: NotificationChannel;
  message: string;
  audience_email: string | null;
  audience_phone: string | null;
  routing_reason: string;
  price_paise: number;
  ai_tokens: number | null;
  status: string;
  created_at: string;
}

export interface BfsiNotificationLogsPage {
  items: BfsiNotificationLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  total_usage_paise: number;
}

export interface BfsiUsage {
  total_usage_paise: number;
  total_ai_tokens: number;
  send_count: number;
  notification_count: number;
  channel_prices: Record<NotificationChannel, number>;
  channel_counts: Record<NotificationChannel, number>;
  baseline_cost_paise: number;
  savings_paise: number;
  savings_percent: number;
}

export type BfsiDashboardView = 'overview' | 'logs';

export interface BfsiNotificationAudience {
  email: string | null;
  phone: string | null;
}

export interface BfsiV2SendInput {
  message_body: string;
  audience: {
    email?: string | null;
    phone?: string | null;
  };
}

export interface BfsiV2SendResponse {
  notification_id: string;
  channel: NotificationChannel;
  message: string;
  audience: BfsiNotificationAudience;
  amount: number | null;
  is_transaction: boolean;
  used_default_config: boolean;
  classification_reason: string;
  price_paise: number;
  status: string;
  routing_reason: string;
  created_at: string;
}

export const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push notification' },
];

export const AMOUNT_VARIABLE = '{amount}';

export const DEFAULT_TEMPLATE_CONTENT =
  'Hi, your transaction of {amount} rupees is successful.';

export const DEFAULT_SIM_SWAP_EMAIL_CONTENT = `Dear Customer,

We detected a SIM swap on your registered mobile number within the last 24 hours. For your security, please review this activity immediately.

If this was not you, block all transactions on your account using the link below:
https://bank.example.com/block-transactions

Once blocked, transactions cannot be resumed online. To unblock your account, please contact your bank branch or call our 24/7 helpline.

If this was you, no action is required.

Regards,
Bank Security Team`;

export interface BfsiSimSwapEmailConfig {
  email: string;
  email_content: string;
  created_at: string;
  updated_at: string;
}

export interface BfsiSimSwapEmailConfigInput {
  email_content: string;
}
