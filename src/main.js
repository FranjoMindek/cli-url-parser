import fs from "fs";
import URLCrawler from "./URLCrawler.js";
import URLParser from "./URLParser.js";

const userArgs = process.argv.slice(2);

if (userArgs.length === 0) {
  // console.info("Listening for stdin.");
  processStream(process.stdin);
} else if (userArgs.length === 1) {
  const filePath = userArgs[0];
  // console.info(`Reading from ${filePath}.`);
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  processStream(fileStream);
} else {
  console.error(
    "Error: Too many arguments. Provide only one file path or none for stdin."
  );
  process.exit(1);
}

/**
 * @param {NodeJS.ReadStream} stream
 */
function processStream(stream) {
  const visitedUrls = new Map();

  const crawler = new URLCrawler((data) =>
    console.log(JSON.stringify(data, null, 2))
  );

  const parser = new URLParser(async (url) => {
    if (visitedUrls.has(url)) {
      return;
    }

    visitedUrls.set(url);
    await crawler.enqueue(url);
  });

  stream.on("data", (data) => {
    parser.processChunk(data);
  });

  // stream.on("end", () => {
  //   console.info("Stream ended.");
  // });

  stream.on("error", (err) => {
    console.error(`Error reading stream with message: ${err.message}`);
    process.exit(1);
  });
}
