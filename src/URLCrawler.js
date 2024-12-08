// Taken from: https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
const EMAIL_REGEXP =
  // eslint-disable-next-line no-control-regex
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

const TITLE_TAG_START = "<title>";
const TITLE_RAG_END = "</title>";

/**
 * Callback function to handle processed results.
 * @callback URLCallback
 * @param {Object} result - The processed result.
 * @param {string} result.url - The URL processed.
 * @param {string} [result.title] - The title of the page, if available.
 * @param {string} [result.email] - The email found on the page, if available.
 * @returns {void} - No return value.
 */

export default class URLCrawler {
  #visitedUrls;
  #callback;
  #requestQueue;
  #isProcessing;

  /**
   * Creates an instance of the URLCrawler class.
   * @param {URLCallback} callback - A callback function that will be called when a URL is processed.
   */
  constructor(callback) {
    this.#visitedUrls = new Set();
    this.#callback = callback;
    this.#requestQueue = [];
    this.#isProcessing = false;
  }

  /**
   * Adds a URL to the processing queue if it hasn’t already been visited.
   * @param {string} url - The URL to be processed.
   */
  async enqueue(url) {
    if (!this.#visitedUrls.has(url)) {
      this.#visitedUrls.add(url);
      this.#requestQueue.push({ url, retries: 0 });

      // immediately process if no queue
      if (!this.#isProcessing) {
        await this.#processQueue();
      }
    }
  }

  /**
   * Processes the queued URLs with a maximum of one request per second.
   * Retries failed requests once after a 1-minute delay.
   */
  async #processQueue() {
    if (this.#isProcessing) return;

    this.#isProcessing = true;

    while (this.#requestQueue.length > 0) {
      const { url, retries } = this.#requestQueue.shift();

      try {
        await this.#processURL(url);
      } catch (error) {
        if (retries < 1) {
          console.error(
            `Failed to process URL "${url}" with message: ${error.message}`
          );
          // console.info(`Retrying ${url} in 1 minute...`);
          setTimeout(() => {
            this.#requestQueue.push({ url, retries: retries + 1 });
            if (!this.#isProcessing) this.#processQueue();
          }, 60000); // retry after 1 minute
        } else {
          console.error(
            `Failed to process URL "${url}" after "${retries}" retries with message: ${error.message}`
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }

    this.#isProcessing = false;
  }

  /**
   * Fetches the content of a URL, extracts the title and email (if available),
   * and invokes the callback with the processed information.
   * @param {string} urlString - The URL to be processed.
   */
  async #processURL(urlString) {
    let url;
    try {
      url = new URL(
        urlString.startsWith("http") ? urlString : `https://${urlString}`
      );
    } catch {
      console.error(`Failed to parse the URL "${urlString}"`);
      return;
    }

    try {
      const response = await fetch(url); // headers

      if (!response.ok) {
        console.error(
          `Failed to fetch the URL "${urlString}" with status: ${response.status}`
        );
        return;
      }

      const body = await response.text(); // body

      let title = null;
      let email = null;

      // title
      const titleStart = body.indexOf(TITLE_TAG_START);
      if (titleStart !== -1) {
        const titleEnd = body.indexOf(TITLE_RAG_END, titleStart + 1);
        if (titleEnd !== -1) {
          title = body.slice(titleStart + TITLE_TAG_START.length, titleEnd);
        }
      }

      // email
      const emailMatch = body.match(EMAIL_REGEXP);
      if (emailMatch) {
        email = emailMatch.at(0);
      }

      const callbackObject = { url: urlString };
      if (title) callbackObject.title = title;
      if (email) callbackObject.email = email;

      this.#callback(callbackObject);
    } catch (error) {
      console.error(
        `Failed to fetch the URL "${urlString}" with message: ${error.message}`
      );
    }
  }
}
