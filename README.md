# Flashpath Chrome Extension

Flashpath is a Chrome extension that allows you to create interactive learning paths across different websites. You can capture your journey through web pages, record interactions, and take notes along the way. Whether you're teaching others how to use a GitHub pull request or guiding them through complex tech topics, Flashpath enables you to save and share your experiences.

## Key Features

- **Create Paths**: Capture a series of web pages you visit to create a learning path.
- **Time Logging**: Automatically logs time spent on each page.
- **Bookmark Detection**: Detects whether a page has been bookmarked.
- **Interaction Tracking Video Capture**: Optionally Track interactions like scrolling, text highlights, and page visits.
- **Notes**: Add notes to any page on your path for future reference or sharing.

## Installation

### Download the Extension

Download the latest build of the Flashpath extension from the link below:

[Download Flashpath (flashpath.zip)](./download/flashpath.zip)

### Install the Extension on Chrome

1. Download the extension ZIP file from the link above.
2. Extract the `.zip` file to a folder on your computer.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the folder where you extracted the extension.
6. The Flashpath extension will now be added to Chrome!

### Install the Extension on Firefox

To install on Firefox, follow similar steps and use the Firefox-specific build commands below.

## Development

Flashpath uses `wxt` to manage development and building for both Chrome and Firefox.

### Available Commands

```bash
"dev": "wxt",
"dev:firefox": "wxt -b firefox",
"build": "wxt build",
"build:firefox": "wxt build -b firefox",
"zip": "wxt zip",
"zip:firefox": "wxt zip -b firefox",
```
