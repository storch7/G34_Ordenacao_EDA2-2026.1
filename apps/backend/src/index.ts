import { Elysia } from "elysia";
import { convertIpToUint32 } from "@radixwatch/core";

const app = new Elysia()
  .get("/", () => "RadixWatch API is running!")
  .get("/test", () => {
    const ip = "192.168.1.100";
    const uint32 = convertIpToUint32(ip);
    return {
      message: "Testing shared core package",
      ip,
      uint32
    };
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
