import { LogEntry, convertIpToUint32 } from "@radixwatch/core";
import { COMMON_LOG_REGEX } from "./regex.js";

/**
 * Parses a standard Nginx/Apache log line into a strongly typed LogEntry.
 * Fast path implementation returning null if invalid.
 * 
 * @param line The raw log line string
 * @returns LogEntry object or null if parsing fails
 */
export function parseLogLine(line: string): LogEntry | null {
  const match = COMMON_LOG_REGEX.exec(line);
  if (!match) return null;

  // match[1]: IP
  // match[2]: Timestamp "10/May/2026:14:32:10 +0000"
  // match[3]: Method
  // match[4]: Endpoint
  // match[5]: Status code
  // match[6]: Size

  const ipStr = match[1];
  const ipUint32 = convertIpToUint32(ipStr);

  // Convert "10/May/2026:14:32:10 +0000" -> "10/May/2026 14:32:10 +0000" for Date.parse
  const timeStr = match[2].replace(':', ' ');
  const timestampMs = Date.parse(timeStr);
  const timestamp = Math.floor(timestampMs / 1000); // Unix timestamp in seconds

  const status = parseInt(match[5], 10);
  const size = match[6] === "-" ? 0 : parseInt(match[6], 10);

  return {
    ip: ipUint32,
    timestamp: timestamp,
    method: match[3],
    endpoint: match[4],
    status: status,
    size: size
  };
}
