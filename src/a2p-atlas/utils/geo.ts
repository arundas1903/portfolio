import countriesData from '../data/countries.json';
import type { CountryRecord } from '../types';

const countries = countriesData as CountryRecord[];

const NAME_TO_ISO = new Map<string, string>(
  countries.map((country) => [country.name.toLowerCase(), country.iso2])
);

/** world-atlas countries-110m uses abbreviated names and omits ISO codes */
const GEO_NAME_ALIASES: Record<string, string> = {
  'United States of America': 'US',
  'Dem. Rep. Congo': 'CD',
  'Dominican Rep.': 'DO',
  'Central African Rep.': 'CF',
  "Côte d'Ivoire": 'CI',
  Congo: 'CG',
  'Eq. Guinea': 'GQ',
  eSwatini: 'SZ',
  'North Korea': 'KP',
  'S. Sudan': 'SS',
  'Solomon Is.': 'SB',
  'Bosnia and Herz.': 'BA',
  'Lao PDR': 'LA',
  'S. Korea': 'KR',
  'N. Korea': 'KP',
};

export function isoFromGeoProperties(
  properties: Record<string, string | number | undefined>
): string {
  const isoField =
    properties['ISO3166-1-Alpha-2'] ??
    properties.ISO_A2_EH ??
    properties.ISO_A2;
  if (typeof isoField === 'string' && isoField && isoField !== '-99') {
    return isoField.toUpperCase();
  }

  const name = properties.name;
  if (typeof name !== 'string' || !name.trim()) return '';

  const alias = GEO_NAME_ALIASES[name];
  if (alias) return alias;

  return NAME_TO_ISO.get(name.toLowerCase()) ?? '';
}
