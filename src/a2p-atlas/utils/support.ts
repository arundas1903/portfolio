import type { SupportLevel } from '../types';

export function supportLabel(level: SupportLevel): string {
  switch (level) {
    case 'yes':
      return 'Supported';
    case 'no':
      return 'Not supported';
    case 'registration':
      return 'Registration required';
    case 'partial':
      return 'Partial / exceptions';
    case 'varies':
      return 'Varies by carrier';
    case 'na':
      return 'N/A';
    default:
      return 'Unknown';
  }
}

export function supportColor(level: SupportLevel): string {
  switch (level) {
    case 'yes':
      return '#34c759';
    case 'registration':
      return '#ff9f0a';
    case 'partial':
    case 'varies':
      return '#ffd60a';
    case 'no':
      return '#8e8e93';
    case 'na':
      return '#c7c7cc';
    default:
      return '#d1d1d6';
  }
}

export function isoFromGeo(isoProperty: string | number | undefined): string {
  if (!isoProperty || typeof isoProperty !== 'string') return '';
  if (isoProperty === '-99') return '';
  return isoProperty.toUpperCase();
}
