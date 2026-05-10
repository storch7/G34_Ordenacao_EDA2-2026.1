import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createAnalyzeRoute } from "./analyze";

// Sample valid log content following Apache/Nginx Combined Log Format
const VALID_LOG_CONTENT = `192.168.1.100 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024
192.168.1.100 - - [10/May/2026:14:32:11 +0000] "POST /api/submit HTTP/1.1" 201 512
10.0.0.5 - - [10/May/2026:14:32:12 +0000] "GET /health HTTP/1.1" 200 64
192.168.1.200 - - [10/May/2026:14:32:13 +0000] "GET /dashboard HTTP/1.1" 200 2048
10.0.0.5 - - [10/May/2026:14:32:14 +0000] "DELETE /api/item/1 HTTP/1.1" 204 0`;

// Helper to build a test app
function buildTestApp() {
  return new Elysia()
    .use(
      cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      })
    )
    .use(createAnalyzeRoute());
}

// Helper to create a multipart FormData request
function makeMultipartRequest(
  fileName: string,
  content: string,
  fieldName = "file"
): Request {
  const formData = new FormData();
  formData.append(fieldName, new File([content], fileName));
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/analyze", () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeAll(() => {
    app = buildTestApp();
  });

  // ---------------------------------------------------------------------------
  // 200 — Success cases
  // ---------------------------------------------------------------------------
  describe("200 — valid file upload", () => {
    test("accepts a .log file and returns AnalysisResult structure", async () => {
      const req = makeMultipartRequest("server.log", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(200);

      const body = await res.json() as {
        totalRequests: number;
        processingTimeMs: number;
        topIps: Array<{ ip: string; count: number; percentage: number }>;
      };

      expect(typeof body.totalRequests).toBe("number");
      expect(typeof body.processingTimeMs).toBe("number");
      expect(Array.isArray(body.topIps)).toBe(true);
    });

    test("accepts a .txt file and returns correct totalRequests", async () => {
      const req = makeMultipartRequest("access.txt", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(200);

      const body = await res.json() as { totalRequests: number; topIps: Array<{ ip: string; count: number; percentage: number }> };
      // VALID_LOG_CONTENT has 5 valid log lines
      expect(body.totalRequests).toBe(5);
      expect(body.topIps.length).toBeGreaterThan(0);
    });

    test("topIps have correct structure (ip string, count, percentage)", async () => {
      const req = makeMultipartRequest("server.log", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(200);

      const body = await res.json() as { topIps: Array<{ ip: string; count: number; percentage: number }> };
      const topIp = body.topIps[0];

      expect(typeof topIp.ip).toBe("string");
      expect(typeof topIp.count).toBe("number");
      expect(typeof topIp.percentage).toBe("number");
      // IP must be dotted decimal notation
      expect(topIp.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    test("most frequent IP appears first in topIps", async () => {
      // 192.168.1.100 appears 3x, all other IPs appear less
      const dominantIpLog = `192.168.1.100 - - [10/May/2026:14:32:10 +0000] "GET /api/data HTTP/1.1" 200 1024
192.168.1.100 - - [10/May/2026:14:32:11 +0000] "POST /api/submit HTTP/1.1" 201 512
192.168.1.100 - - [10/May/2026:14:32:12 +0000] "GET /dashboard HTTP/1.1" 200 2048
10.0.0.5 - - [10/May/2026:14:32:13 +0000] "GET /health HTTP/1.1" 200 64
192.168.1.200 - - [10/May/2026:14:32:14 +0000] "DELETE /api/item/1 HTTP/1.1" 204 0`;

      const req = makeMultipartRequest("server.log", dominantIpLog);
      const res = await app.handle(req);

      expect(res.status).toBe(200);

      const body = await res.json() as { topIps: Array<{ ip: string; count: number; percentage: number }> };
      // 192.168.1.100 appears 3 times — should be at top
      expect(body.topIps[0].ip).toBe("192.168.1.100");
      expect(body.topIps[0].count).toBe(3);
    });

    test("percentages sum to approximately 100 when single unique IP", async () => {
      const singleIpLog = `192.168.1.1 - - [10/May/2026:14:32:10 +0000] "GET / HTTP/1.1" 200 100
192.168.1.1 - - [10/May/2026:14:32:11 +0000] "GET / HTTP/1.1" 200 100`;
      const req = makeMultipartRequest("single.log", singleIpLog);
      const res = await app.handle(req);

      expect(res.status).toBe(200);

      const body = await res.json() as { topIps: Array<{ ip: string; percentage: number }> };
      expect(body.topIps[0].percentage).toBeCloseTo(100, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 400 — Error cases
  // ---------------------------------------------------------------------------
  describe("400 — no file uploaded", () => {
    test("returns 400 when no file field in form data", async () => {
      const formData = new FormData();
      formData.append("other", "value");
      const req = new Request("http://localhost/api/analyze", {
        method: "POST",
        body: formData,
      });

      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("No file uploaded");
    });

    test("returns 400 when request has no body at all", async () => {
      const req = new Request("http://localhost/api/analyze", {
        method: "POST",
      });

      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(typeof body.error).toBe("string");
    });
  });

  describe("400 — empty file", () => {
    test("returns 400 with error message for empty file", async () => {
      const req = makeMultipartRequest("empty.log", "");
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Uploaded file is empty");
    });

    test("returns 400 for whitespace-only file content", async () => {
      const req = makeMultipartRequest("whitespace.log", "   \n\t\n   ");
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Uploaded file is empty");
    });
  });

  describe("400 — invalid file type", () => {
    test("returns 400 for .jpg file", async () => {
      const req = makeMultipartRequest("photo.jpg", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Invalid file type. Only .txt and .log files are accepted");
    });

    test("returns 400 for .csv file", async () => {
      const req = makeMultipartRequest("data.csv", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Invalid file type. Only .txt and .log files are accepted");
    });

    test("returns 400 for .json file", async () => {
      const req = makeMultipartRequest("data.json", "{}");
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Invalid file type. Only .txt and .log files are accepted");
    });

    test("returns 400 for file with no extension", async () => {
      const req = makeMultipartRequest("logfile", VALID_LOG_CONTENT);
      const res = await app.handle(req);

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Invalid file type. Only .txt and .log files are accepted");
    });
  });

  // ---------------------------------------------------------------------------
  // CORS headers
  // ---------------------------------------------------------------------------
  describe("CORS headers", () => {
    test("OPTIONS preflight returns CORS headers", async () => {
      const req = new Request("http://localhost/api/analyze", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5173",
          "Access-Control-Request-Method": "POST",
        },
      });

      const res = await app.handle(req);
      // CORS plugin handles preflight — status 204 or 200
      expect([200, 204]).toContain(res.status);
    });

    test("POST response includes Access-Control-Allow-Origin header for allowed origin", async () => {
      const req = makeMultipartRequest("server.log", VALID_LOG_CONTENT);
      // Set origin header
      const reqWithOrigin = new Request(req, {
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          Origin: "http://localhost:5173",
        },
      });

      const res = await app.handle(reqWithOrigin);

      expect(res.status).toBe(200);
      // CORS plugin should add the allow-origin header
      const allowOrigin = res.headers.get("access-control-allow-origin");
      expect(allowOrigin).toBe("http://localhost:5173");
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe("edge cases", () => {
    test("handles log file with some invalid lines gracefully", async () => {
      const mixedContent = `192.168.1.100 - - [10/May/2026:14:32:10 +0000] "GET / HTTP/1.1" 200 1024
this is not a valid log line
another invalid line
10.0.0.5 - - [10/May/2026:14:32:14 +0000] "GET /health HTTP/1.1" 200 64`;

      const req = makeMultipartRequest("mixed.log", mixedContent);
      const res = await app.handle(req);

      expect(res.status).toBe(200);
      const body = await res.json() as { totalRequests: number };
      // Only 2 valid lines should be counted
      expect(body.totalRequests).toBe(2);
    });

    test("handles single-line log file", async () => {
      const singleLine = `192.168.1.1 - - [10/May/2026:14:32:10 +0000] "GET / HTTP/1.1" 200 100`;
      const req = makeMultipartRequest("single.log", singleLine);
      const res = await app.handle(req);

      expect(res.status).toBe(200);
      const body = await res.json() as { totalRequests: number };
      expect(body.totalRequests).toBe(1);
    });
  });
});
