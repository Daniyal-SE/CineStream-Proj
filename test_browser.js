const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting browser...");
  const paths = [
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || '', "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env.LOCALAPPDATA || '', "Microsoft\\Edge\\Application\\msedge.exe")
  ];

  let browserPath = null;
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      browserPath = p;
      break;
    }
  }

  if (!browserPath) {
    console.error("Could not find Edge or Chrome in standard locations.");
    console.error("Checked paths:", paths);
    process.exit(1);
  }

  console.log("Found browser at:", browserPath);

  const browserProcess = spawn(browserPath, [
    "--headless",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox"
  ]);

  browserProcess.on('error', (err) => {
    console.error("Failed to start browser process:", err);
  });

  // wait for debugging port to be ready
  await new Promise(resolve => setTimeout(resolve, 2500));

  try {
    const listRes = await fetch("http://127.0.0.1:9222/json/list");
    const list = await listRes.json();
    console.log("Pages found:", list);
    const page = list.find(p => p.type === 'page');
    if (!page) {
      throw new Error("No page target found");
    }
    const wsUrl = page.webSocketDebuggerUrl;
    console.log("Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected. Enabling Console and Runtime...");
      ws.send(JSON.stringify({ id: 1, method: "Console.enable" }));
      ws.send(JSON.stringify({ id: 2, method: "Runtime.enable" }));
      ws.send(JSON.stringify({ id: 3, method: "Page.enable" }));
      // Navigate
      ws.send(JSON.stringify({
        id: 4,
        method: "Page.navigate",
        params: { url: "http://localhost:5173/" }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Console.messageAdded") {
        console.log("[Console]", msg.params.message.level, msg.params.message.text);
      } else if (msg.method === "Runtime.exceptionThrown") {
        console.error("[Exception]", JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
    };

    ws.onerror = (err) => {
      console.error("WS Error:", err);
    };

    // wait 6 seconds to capture errors
    await new Promise(resolve => setTimeout(resolve, 6000));

  } catch (err) {
    console.error("Error occurred during browser test:", err);
  } finally {
    console.log("Killing browser...");
    browserProcess.kill();
  }
}

main();
