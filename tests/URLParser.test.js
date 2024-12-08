import { describe, expect, it, vi } from "vitest";
import URLParser from "/src/URLParser";

describe("URLParser Tests", () => {
  it("should call the callback with valid URL", () => {
    const mockCallback = vi.fn();
    const parser = new URLParser(mockCallback);

    // Simulate input chunk that contains a URL
    parser.processChunk("[https://example.com]");

    // Check that the mock callback was called with the correct URL
    expect(mockCallback).toHaveBeenCalledWith("https://example.com");
  });

  it("should handle escaped brackets correctly", () => {
    const mockCallback = vi.fn();
    const parser = new URLParser(mockCallback);

    // Simulate input with escaped brackets
    parser.processChunk("[ blob \\] https://example.com]");
    parser.processChunk("[ blob https://example.com \\]");
    expect(mockCallback).toHaveBeenCalledWith("https://example.com");
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should handle nested brackets", () => {
    const mockCallback = vi.fn();
    const parser = new URLParser(mockCallback);

    parser.processChunk(
      "[https://example.com [https://example2.com] https://example3.com]"
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith("https://example3.com");
  });
});
