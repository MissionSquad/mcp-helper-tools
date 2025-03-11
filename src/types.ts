import { ProgressReporter } from './utils/progress.js';

export interface GeoLocation {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  offset: number;
  isp: string;
  org: string;
  as: string;
}

export interface RateLimitInfo {
  remaining: number;
  ttl: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface NetworkConnectivityResult {
  connected: boolean;
  error?: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  nodeVersion: string;
}

export interface TimezoneConversionResult {
  originalDate: string;
  convertedDate: string;
  fromTimezone: string;
  toTimezone: string;
}

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

export interface ToolContent {
  type: string;
  text: string;
}

export interface ToolResponse {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolHandler {
  (args: any, progress?: ProgressReporter): Promise<ToolResponse>;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: ToolHandler;
}

export interface ToolKit {
  [key: string]: Tool;
}