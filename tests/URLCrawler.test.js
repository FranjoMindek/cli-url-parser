import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import URLCrawler from "/src/URLCrawler"; // Adjust path as needed

// mocking the global fetch function before each test
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("URLCrawler Tests", () => {
  it("should call the callback with title and email when URL is fetched successfully", async () => {
    const mockCallback = vi.fn();
    const crawler = new URLCrawler(mockCallback);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        "<title>Test Title</title><p>Contact: test@example.com</p>",
    });

    await crawler.enqueue("https://example1.com");

    expect(mockCallback).toHaveBeenCalledWith({
      url: "https://example1.com",
      title: "Test Title",
      email: "test@example.com",
    });
  });

  it("should handle fetch failure and retry", async () => {
    const mockCallback = vi.fn();
    const crawler = new URLCrawler(mockCallback, 0);

    // failure then success
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<title>Test Page</title>",
      });

    await crawler.enqueue("https://example2.com");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith({
      url: "https://example2.com",
      title: "Test Page",
    });
  });

  it("should handle invalid URL format", async () => {
    const mockCallback = vi.fn();
    const crawler = new URLCrawler(mockCallback);

    await crawler.enqueue("invalid-url");

    expect(mockCallback).not.toHaveBeenCalled();
  });
});
