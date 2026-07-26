import React, { memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import type { ChannelKey, CountryRecord } from '../types';
import { isoFromGeoProperties } from '../utils/geo';
import { supportColor } from '../utils/support';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  countriesByIso: Map<string, CountryRecord>;
  channel: ChannelKey;
  selectedIso: string | null;
  onSelect: (iso2: string) => void;
}

function WorldMap({ countriesByIso, channel, selectedIso, onSelect }: WorldMapProps) {
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 147 }}
      className="a2p-map"
    >
      <ZoomableGroup center={[0, 10]} zoom={1}>
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, string> }> }) =>
            geographies.map((geo) => {
              const iso2 = isoFromGeoProperties(geo.properties);
              const country = iso2 ? countriesByIso.get(iso2) : undefined;
              const level = country?.channels[channel] ?? 'na';
              const fill = supportColor(level);
              const isSelected = iso2 === selectedIso;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    if (iso2) onSelect(iso2);
                  }}
                  style={{
                    default: {
                      fill,
                      outline: 'none',
                      stroke: isSelected ? '#0088ff' : '#ffffff',
                      strokeWidth: isSelected ? 1.2 : 0.25,
                      opacity: country ? 0.92 : 0.35,
                      cursor: country ? 'pointer' : 'default',
                    },
                    hover: {
                      fill,
                      outline: 'none',
                      stroke: '#0088ff',
                      strokeWidth: 0.8,
                      opacity: country ? 1 : 0.45,
                      cursor: country ? 'pointer' : 'default',
                    },
                    pressed: {
                      fill,
                      outline: 'none',
                      stroke: '#0088ff',
                      strokeWidth: 1,
                      opacity: 1,
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
}

export default memo(WorldMap);
