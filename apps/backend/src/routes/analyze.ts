import { Elysia } from "elysia";
import { analyzeLogFile } from "@radixwatch/core";

export function createAnalyzeRoute() {
  return new Elysia({ prefix: "/api" }).post(
    "/analyze",
    async ({ request, set }) => {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        set.status = 400;
        return { error: "No file uploaded" };
      }

      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        set.status = 400;
        return { error: "No file uploaded" };
      }


      if (file.size === 0) {
        set.status = 400;
        return { error: "Uploaded file is empty" };
      }

      const fileName = file.name ?? "";
      if (!fileName.endsWith(".txt") && !fileName.endsWith(".log")) {
        set.status = 400;
        return { error: "Invalid file type. Only .txt and .log files are accepted" };
      }

      const content = await file.text();

      if (!content || content.trim().length === 0) {
        set.status = 400;
        return { error: "Uploaded file is empty" };
      }

      const result = analyzeLogFile(content);

      return result;
    }
  );
}
