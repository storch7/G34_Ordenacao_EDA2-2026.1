import { parseLogLine } from "@radixwatch/parser";
import type { IpCount, AnalysisResult } from "./types.js";

export type { IpCount, AnalysisResult } from "./types.js";

export interface LogEntry {
  ip: number;
  timestamp: number;
  method: string;
  endpoint: string;
  status: number;
  size: number;
}

export function convertIpToUint32(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function uint32ToIp(ip: number): string {
  return (
    ((ip >>> 24) & 0xff) +
    "." +
    ((ip >>> 16) & 0xff) +
    "." +
    ((ip >>> 8) & 0xff) +
    "." +
    (ip & 0xff)
  );
}

export function radixSortLSD(arr: Uint32Array): void {
  const n = arr.length;
  if (n <= 1) return;

  const output = new Uint32Array(n);
  const count = new Uint32Array(256);

  for (let pass = 0; pass < 4; pass++) {
    const shift = pass * 8;

    count.fill(0);

    for (let i = 0; i < n; i++) {
      const byte = (arr[i] >>> shift) & 0xff;
      count[byte]++;
    }

    let total = 0;
    for (let b = 0; b < 256; b++) {
      const c = count[b];
      count[b] = total;
      total += c;
    }

    for (let i = 0; i < n; i++) {
      const byte = (arr[i] >>> shift) & 0xff;
      output[count[byte]++] = arr[i];
    }

    arr.set(output);
  }
}

export function countGroupedIps(arr: Uint32Array): Array<{ ip: number; count: number }> {
  const result: Array<{ ip: number; count: number }> = [];
  const n = arr.length;
  if (n === 0) return result;

  let currentIp = arr[0];
  let currentCount = 1;

  for (let i = 1; i < n; i++) {
    if (arr[i] === currentIp) {
      currentCount++;
    } else {
      result.push({ ip: currentIp, count: currentCount });
      currentIp = arr[i];
      currentCount = 1;
    }
  }

  result.push({ ip: currentIp, count: currentCount });

  return result;
}

export function extractTop100(
  counted: Array<{ ip: number; count: number }>,
  total: number
): IpCount[] {
  counted.sort((a, b) => b.count - a.count);

  return counted.slice(0, 100).map(({ ip, count }) => ({
    ip: uint32ToIp(ip),
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

export function analyzeLogFile(content: string): AnalysisResult {
  const start = performance.now();

  const lines = content.split("\n");
  const totalLines = lines.length;

  const ipBuffer = new Uint32Array(totalLines);
  let validCount = 0;

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i];
    if (!line) continue;

    const entry = parseLogLine(line);
    if (entry !== null) {
      ipBuffer[validCount++] = entry.ip;
    }
  }

  const ips = ipBuffer.subarray(0, validCount);

  radixSortLSD(ips);

  const counted = countGroupedIps(ips);

  const topIps = extractTop100(counted, validCount);

  const processingTimeMs = performance.now() - start;

  return {
    totalRequests: validCount,
    processingTimeMs,
    topIps,
  };
}
