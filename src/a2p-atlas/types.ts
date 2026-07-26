export type SupportLevel = 'yes' | 'no' | 'registration' | 'partial' | 'varies' | 'na' | 'unknown';

export type ChannelKey = 'alphanumeric' | 'shortCode' | 'longCode' | 'tollFree';

export interface CountryChannels {
  alphanumeric: SupportLevel;
  shortCode: SupportLevel;
  longCode: SupportLevel;
  tollFree: SupportLevel;
}

export interface CountryRecord {
  name: string;
  iso2: string;
  dialCode: string;
  channels: CountryChannels;
  twoWaySms: SupportLevel;
  internationalSending: SupportLevel;
  twilioAlpha?: SupportLevel;
  sources: string[];
}

export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  alphanumeric: 'Alphanumeric Sender ID',
  shortCode: 'Short Code',
  longCode: 'Long Code',
  tollFree: 'Toll-Free',
};
