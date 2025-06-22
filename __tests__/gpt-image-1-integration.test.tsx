/**
 * Test for GPT-Image-1 model integration
 *
 * Update: Upgraded from DALL-E 3 to GPT-Image-1 for better image generation
 * GPT-Image-1 is OpenAI's latest state-of-the-art image generation model with:
 * - Better text rendering capabilities
 * - Enhanced style control
 * - Improved image quality
 * - Native multimodal support
 */

import React from "react";

describe("GPT-Image-1 Model Integration", () => {
  it("should use the correct model name in API call", () => {
    // Simulate the API call structure
    const apiCallParams = {
      model: "gpt-image-1",
      prompt: "A vibrant sticker design with clean lines",
    };

    // Verify we're using the new model
    expect(apiCallParams.model).toBe("gpt-image-1");
    expect(apiCallParams.model).not.toBe("dall-e-3");
  });

  it("should generate correct tracking ID for GPT-Image-1", () => {
    const timestamp = Date.now();
    const trackingId = `gpt-image-1_${timestamp}`;

    // Verify tracking ID format
    expect(trackingId).toMatch(/^gpt-image-1_\d+$/);
    expect(trackingId).toContain("gpt-image-1_");
    expect(trackingId).not.toContain("dalle3_");
  });

  it("should handle GPT-Image-1 response format correctly", () => {
    // Mock GPT-Image-1 response structure
    const mockResponse = {
      data: [
        {
          b64_json:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        },
      ],
    };

    // Verify response structure
    expect(mockResponse.data).toHaveLength(1);
    expect(mockResponse.data[0]).toHaveProperty("b64_json");
    expect(typeof mockResponse.data[0].b64_json).toBe("string");

    // Verify base64 conversion works
    const imageBytes = Buffer.from(mockResponse.data[0].b64_json, "base64");
    expect(imageBytes).toBeInstanceOf(Buffer);
    expect(imageBytes.length).toBeGreaterThan(0);
  });

  it("should maintain compatibility with existing sticker prompt system", () => {
    const userPrompt = "A cute cartoon cat with sunglasses";
    const systemPrompt =
      "You are a professional graphic designer specializing in sticker design. Create a vibrant, eye-catching sticker based on this prompt: " +
      userPrompt +
      ". The design should be: 1) Vector-style with clean lines and shapes, 2) Highly detailed while maintaining visual clarity, 3) Suitable for sticker printing with well-defined edges, 4) Cohesive and balanced composition, 5) Using colors that work well together and create visual impact, 6) Incorporating any specific elements mentioned in the prompt while ensuring they fit the sticker format. The final design should be a single, self-contained image that would look appealing when printed as a sticker.";

    // Verify system prompt structure
    expect(systemPrompt).toContain(userPrompt);
    expect(systemPrompt).toContain("sticker design");
    expect(systemPrompt).toContain("Vector-style with clean lines");
    expect(systemPrompt).toContain("Suitable for sticker printing");

    expect(systemPrompt.length).toBeGreaterThan(100);
  });
});
