# ChatGPT Doodle Overlay

![ChatGPT Doodle Demo](/demo.gif)

Draw directly on your ChatGPT conversations with a lightweight, scroll-safe overlay that saves per chat.

**Highlights**

- Draw on top of messages and keep doodles aligned while you scroll.
- Save doodles per conversation and restore them automatically.
- Toggle between drawing and typing so you can chat normally.
- Export doodles as a PNG image.

## Features

- Scroll-safe rendering
- Per-conversation persistence
- Adjustable brush color and size
- Draw Mode / Type Mode toggle
- Clear canvas
- Export as PNG
- Manifest V3 compatible

## Installation (Non‑Technical, Step‑by‑Step)

These steps work in Chrome, Edge, and other Chromium-based browsers.

1. Download the extension as a ZIP.
   - If you got this from GitHub: click the green `Code` button, then `Download ZIP`.
2. Unzip the file.
   - Windows: right-click the ZIP and choose `Extract All...`.
   - macOS: double-click the ZIP to extract.
3. Open your browser’s extensions page.
   - Chrome: type `chrome://extensions` in the address bar and press Enter.
   - Edge: type `edge://extensions` in the address bar and press Enter.
4. Turn on `Developer mode` (top-right toggle).
5. Click `Load unpacked`.
6. Select the unzipped folder (the one that contains `manifest.json`).
7. Open `https://chatgpt.com` and click the extension icon.
8. Press `Toggle` to enable the overlay.

If you don’t see the overlay, reload the ChatGPT tab and try again.

## Usage

**Draw Mode**

- Click and drag to draw.
- Adjust color and brush size in the floating toolbar.

**Type Mode**

- Tap `Type Mode` to pause drawing so you can type and interact with ChatGPT.
- Tap again to resume drawing.

## How It Works

The extension injects a canvas overlay into the main ChatGPT chat container.

Key principles:

- The canvas is attached inside the chat scroll container.
- Coordinates are stored in canvas-local space.
- Each conversation is stored by its `/c/<id>` URL.
- Doodles are saved to `chrome.storage.local`.

## Project Structure

- `manifest.json`
- `content_script.js`
- `popup.html`
- `popup.js`
- `service_worker.js`
- `icons/`

## Permissions

From `manifest.json`:

- `storage` — save doodles locally
- `activeTab` — interact with current tab
- `scripting` — inject content script if needed
- Host permission: `https://chatgpt.com/*`

## Privacy

This extension:

- Does not send data anywhere
- Does not track usage
- Stores doodles only in `chrome.storage.local`

Everything stays in your browser.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

If you find bugs, include:

- Browser version
- ChatGPT URL
- Steps to reproduce

## License

MIT License
