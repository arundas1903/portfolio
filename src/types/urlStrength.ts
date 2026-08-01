export type UrlRiskLevel = 'low' | 'medium' | 'high';

export interface UrlStrengthSignal {
  name: string;
  value: string;
  detail: string;
}

export interface UrlStrengthResult {
  input_url: string;
  final_url: string;
  risk_level: UrlRiskLevel;
  summary: string;
  reasons: string[];
  content_assessment: string;
  recommendation: string;
  technologies: string[];
  technical_signals: UrlStrengthSignal[];
  spam_flags: string[];
  domain: string;
  domain_age_days: number | null;
  domain_registered_at: string | null;
  source: string;
  ai_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}
