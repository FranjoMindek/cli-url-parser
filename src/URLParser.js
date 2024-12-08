// Taken from https://regexr.com/39nr7 and modified
// But it's fine for a "project like this"
const URL_REGEXP =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&//=]*)?/gi;

/**
 * @callback URLCallback
 * @param {string} URL - The detected URL.
 * @returns {void} - No return value.
 */

export default class URLParser {
  #callback;
  #bracketLevel;
  #url;
  #escaping;
  #betweenBracketBuffer;

  /**
   * Creates an instance of the URLParser class.
   * @param {URLCallback} callback - A callback function that will be called when a URL is found.
   */
  constructor(callback) {
    this.#callback = callback;
    this.#bracketLevel = 0;
    this.#url = null;
    this.#escaping = false;
    this.#betweenBracketBuffer = "";
  }

  /**
   * Processes a chunk of text from a stream.
   * If it detects any URLs, it calls the callback with the URL.
   *
   * @param {string | Buffer} chunk - The chunk of text to process.
   */
  processChunk(chunk) {
    const chunkString = chunk.toString();
    console.assert(
      typeof chunkString === "string",
      `processChunk expected string but got ${typeof chunkString} instead`
    );
    // console.debug("Processing chunk");

    for (let i = 0; i < chunkString.length; i++) {
      const char = chunkString[i];

      // escaping logic
      if (this.#escaping) {
        if (char === "[" || char === "]") {
          this.#betweenBracketBuffer += char;
        } else {
          this.#betweenBracketBuffer += `\\${char}`;
        }
        this.#escaping = false;
        continue;
      }
      if (char === "\\") {
        this.#escaping = true;
        continue;
      }

      // bracket logic
      if (char === "[") {
        this.#emptyBuffer();
        this.#bracketLevel++;
      } else if (char === "]" && this.#bracketLevel > 0) {
        this.#emptyBuffer();

        this.#bracketLevel--;
        if (this.#bracketLevel === 0) {
          if (this.#url) {
            this.#callback(this.#url);
          }
          this.#url = null;
        }
      }
      // Collect characters inside the brackets
      else if (this.#bracketLevel > 0) {
        this.#betweenBracketBuffer += char;
      }
    }
  }

  /**
   * Matches the buffer against URL pattern and calls the callback with the last URL found.
   * Resets the buffer after processing.
   */
  #emptyBuffer() {
    console.assert(
      this.#betweenBracketBuffer != null,
      "betweenBracketBuffer is null or undefined"
    );

    if (this.#betweenBracketBuffer.length === 0) return;

    const matches = [...this.#betweenBracketBuffer.matchAll(URL_REGEXP)];

    if (matches.length > 0) {
      const lastUrl = matches.at(-1).at(0);

      if (lastUrl) {
        this.#url = lastUrl;
      }
    }

    // reset the buffer after processing
    this.#betweenBracketBuffer = "";
  }
}
