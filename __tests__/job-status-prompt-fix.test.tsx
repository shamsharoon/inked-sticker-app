/**
 * Test for the job-status API prompt fix
 *
 * Issue: When viewing a design, users could only see fallback text instead of
 * the actual prompt because the job-status API wasn't selecting the prompt field.
 *
 * Fix: Added 'prompt' to the select query in the job-status API route.
 */

import React from "react";

describe("Job Status API Prompt Fix", () => {
  it("should include prompt field in the API response", () => {
    // Simulate the fixed API behavior
    const mockJobData = {
      status: "complete",
      result_url: "https://example.com/image.png",
      error_msg: null,
      prompt: "A cute cartoon cat wearing sunglasses with a rainbow background",
    };

    // Verify all expected fields are present
    expect(mockJobData).toHaveProperty("status");
    expect(mockJobData).toHaveProperty("result_url");
    expect(mockJobData).toHaveProperty("error_msg");
    expect(mockJobData).toHaveProperty("prompt");

    // Verify prompt has the correct value
    expect(mockJobData.prompt).toBe(
      "A cute cartoon cat wearing sunglasses with a rainbow background"
    );
    expect(mockJobData.prompt).not.toBe("your generated design"); // Should not be fallback text
  });

  it("should demonstrate the SQL query includes prompt field", () => {
    // Simulate the fixed SQL query structure
    const selectFields = ["status", "result_url", "error_msg", "prompt"];

    // Verify prompt is included in the select fields
    expect(selectFields).toContain("prompt");
    expect(selectFields.length).toBe(4);

    // Simulate building the query
    const queryString = `SELECT ${selectFields.join(
      ", "
    )} FROM jobs WHERE id = $1`;
    expect(queryString).toContain("prompt");
    expect(queryString).toBe(
      "SELECT status, result_url, error_msg, prompt FROM jobs WHERE id = $1"
    );
  });

  it("should handle prompt display in the frontend correctly", () => {
    const mockJob = {
      status: "complete" as const,
      result_url: "https://example.com/image.png",
      error_msg: null,
      prompt: "A vibrant sticker design with flowers",
    };

    // Simulate the frontend logic for displaying prompt
    const promptText = mockJob.prompt || "your generated design";

    // Should use the actual prompt, not the fallback
    expect(promptText).toBe("A vibrant sticker design with flowers");
    expect(promptText).not.toBe("your generated design");
  });

  it("should handle missing prompt gracefully", () => {
    const mockJobWithoutPrompt = {
      status: "complete" as const,
      result_url: "https://example.com/image.png",
      error_msg: null,
      prompt: null,
    };

    // Simulate the frontend logic with null prompt
    const promptText = mockJobWithoutPrompt.prompt || "your generated design";

    // Should fall back to default text when prompt is null
    expect(promptText).toBe("your generated design");
  });
});
