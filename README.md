# CLI URL Parser

A simple CLI tool to parse URLs from either standard input (stdin) or a file.
This tool extracts URLs, validates them, and tries to retrieve the page title and email address found within the URL's content.

## Requirements

This project requires Node.js to run. It was developed using node v22, so that version is recommended.

## Installation

No installation is required for the project as it is written in javascript.
Optionally, to install dev dependecies (eslint) you can run the following command:

```bash
npm install
```

## Usage

You can run the application in two ways:

### 1. Run the script with stdin

To start the parser and listen for URLs from stdin (standard input), use the following command:

```bash
npm run start
```

Once the script is running, you can type or pipe URLs into the terminal. The parser will process them as they are entered. For example, you can pipe input from another program or file:

```bash
echo "[https://example.com]" | npm run start
```

### 2. Provide a file with URLs

Alternatively, you can provide a file containing a list of URLs to be processed. To run the script with a file, use the following command:

```bash
npm run start -- ./public/test.txt
```

Where `./public/test.txt` is the path to the file containing URLs.

## Possible improvements

The project could still be improved with further improvements:

- Currently, the program doesn't wait for the fetch retry promises to resolve, stopping the whole process once the stream ends
- The queue implemnetation around requests could be improved to make it easier to wait on queue
- Currently a part of stream is proccessed twice when reading for URLS (once to move to buffer, and once to find URLs), this could be improved, but with too much effort for it to be worth to me

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
