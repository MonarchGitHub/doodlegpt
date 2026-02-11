# ✏️ ChatGPT Doodle Overlay

## Draw directly on your ChatGPT conversations — with scroll-safe, persistent doodles.

This is a lightweight Chrome extension that lets you annotate ChatGPT chats with a drawing overlay that:

- Scrolls naturally with the conversation

- Saves doodles per chat

- Restores drawings automatically

- Works without breaking ChatGPT UI

# 🚀 Features

## 🖊 Draw directly on ChatGPT

## 🔄 Scroll-safe rendering (no disappearing strokes)

## 💾 Per-conversation persistence

## 🎨 Adjustable brush color & size

## 🧠 Draw Mode / Type Mode toggle

## 🗑 Clear canvas

## 📷 Export as PNG

## 🔌 Safe injection & fallback messaging

## 🧩 Manifest V3 compatible

# 📦 How It Works

The extension injects a canvas overlay into the main ChatGPT chat container.

Key principles:

The canvas is attached inside the chat scroll container

Coordinates are stored in canvas-local space

No scroll offset math is used

Each conversation is stored using its unique /c/<id> URL

Doodles are saved to chrome.storage.local

Core logic lives in:

content_script.js

content_script

manifest.json

manifest

popup.html

popup

popup.js

popup

🛠 Installation (Developer Mode)

Clone this repository:

git clone https://github.com/YOURNAME/chatgpt-doodle-overlay.git

Open Chrome and go to:

chrome://extensions

Enable Developer Mode

Click Load Unpacked

Select the project folder

Now open:

https://chatgpt.com

Click the extension icon → Toggle Overlay.

🧠 Usage
Draw Mode

Click and drag to draw.

Adjust color and brush size in the floating toolbar.

Type Mode

Switch to “Type Mode” to interact with ChatGPT normally.

Canvas disables pointer capture so scrolling and typing works normally.

Save PNG

Exports the full scrollable canvas as an image.

Per-Chat Storage

Each conversation gets its own saved doodles automatically.

🔐 Privacy

This extension:

Does NOT send data anywhere

Does NOT track usage

Does NOT collect conversation data

Stores doodles only in chrome.storage.local

Everything stays in your browser.

📂 Project Structure
manifest.json
content_script.js
popup.html
popup.js
service_worker.js
icons/

⚙️ Permissions

From manifest.json:

storage – save doodles locally

activeTab – interact with current tab

scripting – inject content script if needed

Host: https://chatgpt.com/*

🧩 Architecture Notes

This extension solves several tricky problems:

Correct scroll anchoring

Dynamic chat container detection

SPA navigation handling

High-DPI rendering

Safe message passing between popup and content script

Defensive content script injection

The popup safely checks for content script presence before messaging to prevent runtime errors.

🛣 Roadmap Ideas

Undo / Redo

Shape tools (arrow, rectangle)

Highlight mode

SVG export

Message-anchored doodles

Sidebar indicator for annotated chats

Export conversation + doodles as PDF

Contributions welcome.

🤝 Contributing

Fork the repo

Create a feature branch

Submit a pull request

If you find bugs, open an issue with:

Browser version

ChatGPT URL

Steps to reproduce

📜 License

MIT License

You are free to use, modify, and distribute this project.

⭐ If You Like It

Star the repo and share it.
