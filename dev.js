#!/usr/bin/env node
/**
 * Starts the backend (nodemon, port from .env.development) and the frontend
 * (react-scripts dev server) together, for development only.
 *   npm run dev        (from the project root)
 * Ctrl+C stops both. Output lines are prefixed [backend] / [frontend].
 */
const { spawn } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

const apps = [
  { name: "backend", cwd: path.join(__dirname, "Backend"), args: ["start"], color: "\x1b[36m" },
  { name: "frontend", cwd: path.join(__dirname, "frontend"), args: ["start"], color: "\x1b[35m" },
];

const children = [];
let stopping = false;

function prefixLines(name, color, stream, out) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) out.write(`${color}[${name}]\x1b[0m ${line}\n`);
  });
  stream.on("end", () => buffer && out.write(`${color}[${name}]\x1b[0m ${buffer}\n`));
}

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    // npm on Windows runs the app in a child shell, so kill the whole tree
    if (isWin) spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else child.kill("SIGINT");
  }
  setTimeout(() => process.exit(code), 1500);
}

for (const app of apps) {
  const child = spawn(npm, app.args, {
    cwd: app.cwd,
    shell: isWin, // .cmd files need a shell on Windows
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  prefixLines(app.name, app.color, child.stdout, process.stdout);
  prefixLines(app.name, app.color, child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (stopping) return;
    process.stdout.write(`${app.color}[${app.name}]\x1b[0m stopped (exit code ${code}). Stopping the other app.\n`);
    stopAll(code || 0);
  });
  children.push(child);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
