import { describe, expect, test } from "bun:test";
import { parseLogLine } from "./index.js";
import { convertIpToUint32 } from "@radixwatch/core";

describe("Log Parser", () => {
  test("should parse a valid Common Log Format line correctly", () => {
    const rawLine = '192.168.1.100 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024';
    
    const result = parseLogLine(rawLine);
    
    expect(result).not.toBeNull();
    
    if (result) {
      expect(result.ip).toBe(convertIpToUint32("192.168.1.100"));
      expect(result.method).toBe("GET");
      expect(result.endpoint).toBe("/api/data");
      expect(result.status).toBe(200);
      expect(result.size).toBe(1024);
      
      // Timestamp should be valid Unix Timestamp in seconds
      expect(result.timestamp).toBeGreaterThan(0);
    }
  });

  test("should handle size as a dash (-)", () => {
    const rawLine = '10.0.0.1 - - [10/May/2026:14:32:11 +0000] "POST /api/login HTTP/1.1" 401 -';
    
    const result = parseLogLine(rawLine);
    
    expect(result).not.toBeNull();
    expect(result?.size).toBe(0);
    expect(result?.status).toBe(401);
  });

  test("should return null for invalid log lines", () => {
    const rawLine = 'invalid log line format here';
    const result = parseLogLine(rawLine);
    
    expect(result).toBeNull();
  });
});
