export interface LogEntry {
  ip: number; // Uint32 format
  timestamp: number;
  method: string;
  endpoint: string;
  status: number;
  size: number;
}

export function convertIpToUint32(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
