import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertIpToUint32 } from "@radixwatch/core";
import { createAnalyzeRoute } from "./routes/analyze";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    })
  )
  .use(createAnalyzeRoute())
  .get("/", () => "RadixWatch API is running!")
  .get("/test", () => {
    const ip = "192.168.1.100";
    const uint32 = convertIpToUint32(ip);
    return {
      message: "Testing shared core package",
      ip,
      uint32,
    };
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
