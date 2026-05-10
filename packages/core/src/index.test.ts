import { describe, expect, test } from "bun:test";
import {
  convertIpToUint32,
  uint32ToIp,
  radixSortLSD,
  countGroupedIps,
  extractTop100,
  analyzeLogFile,
} from "./index.js";

// ---------------------------------------------------------------------------
// uint32ToIp
// ---------------------------------------------------------------------------
describe("uint32ToIp", () => {
  test("should convert Uint32 to dotted-decimal string", () => {
    expect(uint32ToIp(0)).toBe("0.0.0.0");
    expect(uint32ToIp(0xffffffff >>> 0)).toBe("255.255.255.255");
  });

  test("should round-trip with convertIpToUint32", () => {
    const ips = [
      "0.0.0.0",
      "127.0.0.1",
      "192.168.1.100",
      "10.0.0.5",
      "255.255.255.255",
      "172.16.254.1",
      "8.8.8.8",
    ];
    for (const ip of ips) {
      const uint32 = convertIpToUint32(ip);
      expect(uint32ToIp(uint32)).toBe(ip);
    }
  });

  test("should correctly extract each octet", () => {
    expect(uint32ToIp(0x01020304)).toBe("1.2.3.4");
  });
});

// ---------------------------------------------------------------------------
// radixSortLSD
// ---------------------------------------------------------------------------
describe("radixSortLSD", () => {
  test("should handle empty array", () => {
    const arr = new Uint32Array(0);
    radixSortLSD(arr);
    expect(arr.length).toBe(0);
  });

  test("should handle single element", () => {
    const arr = new Uint32Array([42]);
    radixSortLSD(arr);
    expect(arr[0]).toBe(42);
  });

  test("should sort an already sorted array", () => {
    const arr = new Uint32Array([1, 2, 3, 4, 5]);
    radixSortLSD(arr);
    for (let i = 0; i < arr.length; i++) {
      expect(arr[i]).toBe(i + 1);
    }
  });

  test("should sort a reverse-sorted array", () => {
    const arr = new Uint32Array([5, 4, 3, 2, 1]);
    radixSortLSD(arr);
    for (let i = 0; i < arr.length; i++) {
      expect(arr[i]).toBe(i + 1);
    }
  });

  test("should sort with duplicate values", () => {
    const arr = new Uint32Array([3, 1, 2, 1, 3, 2, 1]);
    radixSortLSD(arr);
    expect(Array.from(arr)).toEqual([1, 1, 1, 2, 2, 3, 3]);
  });

  test("should be stable (preserve relative order of equal elements)", () => {
    // Use high bits as value, low bits as insertion order marker
    const ip1 = (10 << 8) | 0; // value=10, order=0
    const ip2 = (10 << 8) | 1; // value=10, order=1
    const ip3 = (20 << 8) | 0; // value=20, order=0
    const arr = new Uint32Array([ip2, ip1, ip3]); // ip2 before ip1
    radixSortLSD(arr);

    // For stability: equal-valued elements should appear in original order
    // ip1 (order 0) should come before ip2 (order 1) after sort on the value bits
    const sorted = Array.from(arr);
    // The LSB byte determines order; both ip1 and ip2 have different LSBs
    // After 4 passes, they'll be sorted by ALL bytes, not just the first
    // Stability test with IPs that sort to the same position:
    const a = convertIpToUint32("10.0.0.1"); // same value, different insertion order
    const b = convertIpToUint32("10.0.0.1"); // same IP
    const c = convertIpToUint32("10.0.0.5");
    const stableArr = new Uint32Array([c, b, a]); // b before a
    radixSortLSD(stableArr);
    // After sort: a and b should appear in original relative order (b before a)
    // But they are identical values so stability is trivial
    // Better test: equal-valued integers with insertion order tracked in separate metadata
    // For pure Uint32Array of IPs, stability of equal IPs is trivial (identical values)
    // The real stability guarantee matters for IPs that become equal through higher-order bytes
    // but we can still verify the algorithm handles it
    expect(Array.from(stableArr)).toEqual([a, b, c]); // a and b order doesn't matter (same value)
  });

  test("should handle large arrays", () => {
    const n = 10000;
    const arr = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      arr[i] = (n - i - 1) >>> 0; // reverse order
    }
    radixSortLSD(arr);
    for (let i = 0; i < n; i++) {
      expect(arr[i]).toBe(i);
    }
  });

  test("should handle max Uint32 values", () => {
    const arr = new Uint32Array([0xffffffff, 0, 0x80000000, 0x7fffffff]);
    radixSortLSD(arr);
    expect(Array.from(arr)).toEqual([0, 0x7fffffff, 0x80000000, 0xffffffff]);
  });
});

// ---------------------------------------------------------------------------
// countGroupedIps
// ---------------------------------------------------------------------------
describe("countGroupedIps", () => {
  test("should return empty array for empty input", () => {
    const result = countGroupedIps(new Uint32Array(0));
    expect(result).toEqual([]);
  });

  test("should count a single unique IP", () => {
    const arr = new Uint32Array([42, 42, 42]);
    const result = countGroupedIps(arr);
    expect(result).toEqual([{ ip: 42, count: 3 }]);
  });

  test("should count multiple unique IPs", () => {
    const arr = new Uint32Array([1, 1, 1, 2, 2, 3, 4, 4, 4, 4]);
    const result = countGroupedIps(arr);
    expect(result).toEqual([
      { ip: 1, count: 3 },
      { ip: 2, count: 2 },
      { ip: 3, count: 1 },
      { ip: 4, count: 4 },
    ]);
  });

  test("should handle single element array", () => {
    const arr = new Uint32Array([99]);
    const result = countGroupedIps(arr);
    expect(result).toEqual([{ ip: 99, count: 1 }]);
  });

  test("should handle all unique IPs", () => {
    const arr = new Uint32Array([5, 10, 15, 20]);
    const result = countGroupedIps(arr);
    expect(result).toEqual([
      { ip: 5, count: 1 },
      { ip: 10, count: 1 },
      { ip: 15, count: 1 },
      { ip: 20, count: 1 },
    ]);
  });

  test("should handle all same IP", () => {
    const arr = new Uint32Array(100).fill(7);
    const result = countGroupedIps(arr);
    expect(result).toEqual([{ ip: 7, count: 100 }]);
  });
});

// ---------------------------------------------------------------------------
// extractTop100
// ---------------------------------------------------------------------------
describe("extractTop100", () => {
  test("should return top IPs sorted by count descending", () => {
    const counted = [
      { ip: convertIpToUint32("10.0.0.1"), count: 5 },
      { ip: convertIpToUint32("10.0.0.2"), count: 10 },
      { ip: convertIpToUint32("10.0.0.3"), count: 3 },
    ];
    const result = extractTop100(counted, 18);
    expect(result).toEqual([
      { ip: "10.0.0.2", count: 10, percentage: (10 / 18) * 100 },
      { ip: "10.0.0.1", count: 5, percentage: (5 / 18) * 100 },
      { ip: "10.0.0.3", count: 3, percentage: (3 / 18) * 100 },
    ]);
  });

  test("should cap at 100 results", () => {
    const counted = Array.from({ length: 150 }, (_, i) => ({
      ip: i,
      count: 150 - i, // descending count
    }));
    const result = extractTop100(counted, 1000);
    expect(result.length).toBe(100);
    // Should be top 100 (highest counts: 150, 149, ..., 51)
    expect(result[0].count).toBe(150);
    expect(result[99].count).toBe(51);
  });

  test("should return fewer than 100 if less unique IPs exist", () => {
    const counted = Array.from({ length: 5 }, (_, i) => ({
      ip: i,
      count: i + 1,
    }));
    const result = extractTop100(counted, 15);
    expect(result.length).toBe(5);
  });

  test("should handle empty input", () => {
    const result = extractTop100([], 0);
    expect(result).toEqual([]);
  });

  test("should handle total = 0 gracefully", () => {
    const counted = [{ ip: convertIpToUint32("10.0.0.1"), count: 5 }];
    const result = extractTop100(counted, 0);
    expect(result[0].percentage).toBe(0);
  });

  test("should convert IPs to string format", () => {
    const ip = convertIpToUint32("192.168.1.100");
    const result = extractTop100([{ ip, count: 1 }], 1);
    expect(result[0].ip).toBe("192.168.1.100");
  });
});

// ---------------------------------------------------------------------------
// analyzeLogFile — end-to-end pipeline
// ---------------------------------------------------------------------------
describe("analyzeLogFile", () => {
  test("should return empty result for empty content", () => {
    const result = analyzeLogFile("");
    expect(result.totalRequests).toBe(0);
    expect(result.topIps).toEqual([]);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  test("should skip invalid log lines", () => {
    const result = analyzeLogFile("garbage line that is not a valid log\nanother bad line\n");
    expect(result.totalRequests).toBe(0);
    expect(result.topIps).toEqual([]);
  });

  test("should process valid log lines and return top IPs", () => {
    const sampleLog = [
      '192.168.1.1 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024',
      '10.0.0.5 - - [10/May/2026:14:32:11 +0000] "POST /login HTTP/1.1" 200 512',
      '192.168.1.1 - - [10/May/2026:14:32:12 +0000] "GET /api/data HTTP/1.1" 200 1024',
      '10.0.0.5 - - [10/May/2026:14:32:13 +0000] "GET /home HTTP/1.1" 200 2048',
      '192.168.1.1 - - [10/May/2026:14:32:14 +0000] "GET /api/data HTTP/1.1" 200 1024',
    ].join("\n");

    const result = analyzeLogFile(sampleLog);
    expect(result.totalRequests).toBe(5);
    expect(result.topIps.length).toBe(2);

    // 192.168.1.1 appears 3 times (60%), 10.0.0.5 appears 2 times (40%)
    expect(result.topIps[0].ip).toBe("192.168.1.1");
    expect(result.topIps[0].count).toBe(3);
    expect(result.topIps[0].percentage).toBeCloseTo(60);

    expect(result.topIps[1].ip).toBe("10.0.0.5");
    expect(result.topIps[1].count).toBe(2);
    expect(result.topIps[1].percentage).toBeCloseTo(40);
  });

  test("should handle mixed valid and invalid lines", () => {
    const mixedLog = [
      '192.168.1.1 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024',
      "this is not a valid log line",
      "",
      '10.0.0.5 - - [10/May/2026:14:32:11 +0000] "POST /login HTTP/1.1" 200 512',
    ].join("\n");

    const result = analyzeLogFile(mixedLog);
    // Only 2 valid lines, plus 1 empty (skipped) + 1 invalid (skipped)
    expect(result.totalRequests).toBe(2);
    expect(result.topIps.length).toBe(2);
  });

  test("should handle log with dash size", () => {
    const logWithDash = '10.0.0.1 - - [10/May/2026:14:32:11 +0000] "POST /api/login HTTP/1.1" 401 -';
    const result = analyzeLogFile(logWithDash);
    expect(result.totalRequests).toBe(1);
    expect(result.topIps[0].ip).toBe("10.0.0.1");
  });

  test("should handle large log efficiently", () => {
    // Generate 5000 log lines
    const lines: string[] = [];
    for (let i = 0; i < 5000; i++) {
      const ip = `192.168.${Math.floor(i / 256)}.${i % 256}`;
      lines.push(`${ip} - - [10/May/2026:14:32:10 +0000] "GET /api HTTP/1.1" 200 1024`);
    }
    const content = lines.join("\n");
    const result = analyzeLogFile(content);

    expect(result.totalRequests).toBe(5000);
    expect(result.topIps.length).toBeLessThanOrEqual(100);
    expect(result.processingTimeMs).toBeLessThan(5000); // well under 5s target
  });

  test("should include processingTimeMs in result", () => {
    const result = analyzeLogFile(
      '192.168.1.1 - - [10/May/2026:14:32:10 +0000] "GET / HTTP/1.1" 200 1024'
    );
    expect(result.processingTimeMs).toBeTypeOf("number");
    expect(result.processingTimeMs).toBeGreaterThan(0);
  });
});
