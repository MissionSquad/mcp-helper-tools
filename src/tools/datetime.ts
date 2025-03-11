import { DateTime } from 'luxon';
import { TimezoneConversionResult } from '../types.js';

export const dateTimeTools = {
  convertTimezone: {
    name: 'convertTimezone',
    description: 'Convert date/time between timezones using Luxon',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date/time string to convert (ISO 8601 format)'
        },
        fromTZ: {
          type: 'string',
          description: 'Source timezone (IANA timezone identifier)'
        },
        toTZ: {
          type: 'string',
          description: 'Target timezone (IANA timezone identifier)'
        },
        format: {
          type: 'string',
          description: 'Output format (full, date, time, iso)',
          enum: ['full', 'date', 'time', 'iso'],
          default: 'full'
        }
      },
      required: ['date', 'fromTZ', 'toTZ']
    },
    handler: async ({ 
      date, 
      fromTZ, 
      toTZ, 
      format = 'full' 
    }: { 
      date: string; 
      fromTZ: string; 
      toTZ: string; 
      format?: 'full' | 'date' | 'time' | 'iso' 
    }) => {
      try {
        const dt = DateTime.fromISO(date, { zone: fromTZ });
        
        if (!dt.isValid) {
          throw new Error(`Invalid date format or timezone: ${dt.invalidReason}`);
        }

        const converted = dt.setZone(toTZ);
        
        if (!converted.isValid) {
          throw new Error(`Invalid target timezone: ${converted.invalidReason}`);
        }

        let formattedOriginal: string;
        let formattedConverted: string;

        switch (format) {
          case 'full':
            formattedOriginal = dt.toLocaleString(DateTime.DATETIME_FULL);
            formattedConverted = converted.toLocaleString(DateTime.DATETIME_FULL);
            break;
          case 'date':
            formattedOriginal = dt.toLocaleString(DateTime.DATE_FULL);
            formattedConverted = converted.toLocaleString(DateTime.DATE_FULL);
            break;
          case 'time':
            formattedOriginal = dt.toLocaleString(DateTime.TIME_WITH_SECONDS);
            formattedConverted = converted.toLocaleString(DateTime.TIME_WITH_SECONDS);
            break;
          case 'iso':
            formattedOriginal = dt.toISO();
            formattedConverted = converted.toISO();
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        const result: TimezoneConversionResult = {
          originalDate: formattedOriginal,
          convertedDate: formattedConverted,
          fromTimezone: fromTZ,
          toTimezone: toTZ
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Timezone conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  listTimezones: {
    name: 'listTimezones',
    description: 'List all available IANA timezones',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: 'Filter timezones by region (e.g., America, Europe)',
          optional: true
        }
      }
    },
    handler: async ({ region }: { region?: string }) => {
      try {
        // Get list of unique timezone names from Luxon
        const zones = Array.from(new Set(
          Intl.supportedValuesOf('timeZone')
        ));
        
        const filteredZones = region
          ? zones.filter((zone: string) => zone.startsWith(region))
          : zones;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(zones, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to list timezones: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};