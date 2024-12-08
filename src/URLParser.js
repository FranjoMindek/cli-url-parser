// Taken from https://stackoverflow.com/a/3809435, modified to match a single value
// But it's fine for a "project like this"
const URL_REGEXP =
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}[-a-zA-Z0-9()@:%_\+.~#?&//=]*/g;

/**
 * @callback URLCallback
 * @param {string} URL - The detected URL.
 * @returns {void} - No return value.
 */

export default class URLParser {
  /**
   * Creates an instance of the URLParser class.
   * @param {URLCallback} callback - A callback function that will be called when a URL is found.
   */
  constructor(callback) {
    this.callback = callback;
    this.bracketLevel = 0;
    this.lastConfirmedUrl = null;
    this.urls = new Map();
    this.escaping = false;
    this.betweenBracketBuffer = "";
  }

  /**
   * Processes a chunk of text from a stream.
   * If it detects any URLs, it calls the callback with the URL.
   *
   * @param {string} chunk - The chunk of text to process.
   */
  processChunk(chunk) {
    console.assert(
      typeof chunk === "string",
      "processChunk expected string but got " + typeof chunk + " instead"
    );
    console.debug("Processing chunk");

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];

      // Escaping logic
      if (this.escaping) {
        if (char === "[" || char === "]") {
          this.betweenBracketBuffer += char;
        } else {
          this.betweenBracketBuffer += "\\" + char;
        }
        this.escaping = false;
        continue;
      }
      if (char === "\\") {
        this.escaping = true;
        continue;
      }

      // Bracket logic
      if (char === "[") {
        this.emptyBuffer();
        this.bracketLevel++;
      } else if (char === "]" && this.bracketLevel > 0) {
        this.emptyBuffer();

        if (this.urls.has(this.bracketLevel)) {
          this.lastConfirmedUrl = this.urls.get(this.bracketLevel);
          this.urls.delete(this.bracketLevel);
        }

        this.bracketLevel--;
        if (this.bracketLevel === 0) {
          if (this.lastConfirmedUrl) {
            this.callback(this.lastConfirmedUrl);
          }
          this.lastConfirmedUrl = null;
        }
      }
      // Collect characters inside the brackets
      else if (this.bracketLevel > 0) {
        this.betweenBracketBuffer += char;
      }
    }
  }

  /**
   * Matches the buffer against URL pattern and calls the callback with the last URL found.
   * Resets the buffer after processing.
   */
  emptyBuffer() {
    console.assert(
      this.betweenBracketBuffer != null,
      "betweenBracketBuffer is null or undefined"
    );

    if (this.betweenBracketBuffer.length === 0) return;

    const matches = [...this.betweenBracketBuffer.matchAll(URL_REGEXP)];

    if (matches.length > 0) {
      const lastUrl = matches.at(-1).at(0);

      if (lastUrl) {
        this.urls.set(this.bracketLevel, lastUrl);
      }
    }

    // Reset the buffer after processing
    this.betweenBracketBuffer = "";
  }
}
