import { GeoLocation, RateLimitInfo } from '../types.js';
import { Cache, RateLimiter } from '../utils/cache.js';

const geoCache = new Cache<GeoLocation>(5 * 60 * 1000); // 5 minute cache
const rateLimiter = new RateLimiter(45, 60000); // 45 requests per minute

async function fetchGeoData(query: string): Promise<{ data: GeoLocation; rateLimit: RateLimitInfo }> {
  const fields = [
    'status',
    'message',
    'country',
    'countryCode',
    'region',
    'regionName',
    'city',
    'zip',
    'lat',
    'lon',
    'timezone',
    'offset',
    'isp',
    'org',
    'as',
    'query'
  ].join(',');

  const url = `http://ip-api.com/json/${encodeURIComponent(query)}?fields=${fields}`;
  
  const response = await fetch(url);
  const data = await response.json() as GeoLocation;
  
  const remaining = Number(response.headers.get('X-Rl') ?? '0');
  const ttl = Number(response.headers.get('X-Ttl') ?? '0');

  return {
    data,
    rateLimit: { remaining, ttl }
  };
}

export const geoTools = {
  geolocate: {
    name: 'geolocate',
    description: 'Get geolocation information for an IP address or domain',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'IP address or domain to lookup'
        }
      },
      required: ['query']
    },
    handler: async ({ query }: { query: string }) => {
      // Check cache first
      const cached = geoCache.get(query);
      if (cached) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              data: cached,
              source: 'cache'
            }, null, 2)
          }]
        };
      }

      // Check rate limit
      if (!rateLimiter.canMakeRequest()) {
        const timeToReset = rateLimiter.getTimeToReset();
        throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(timeToReset / 1000)} seconds.`);
      }

      try {
        const { data, rateLimit } = await fetchGeoData(query);
        
        // Update rate limiter based on response headers
        rateLimiter.incrementRequests();
        
        // Cache successful responses
        if (data.status === 'success') {
          geoCache.set(query, data);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              data,
              rateLimit,
              source: 'api'
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Geolocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  clearGeoCache: {
    name: 'clearGeoCache',
    description: 'Clear the geolocation cache',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      geoCache.clear();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Geolocation cache cleared'
          }, null, 2)
        }]
      };
    }
  }
};