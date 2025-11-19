// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html";

// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "../vendor/topbar";

// Import custom modules
import { initSuperSonic } from "./lib/supersonic_tau5.js";
import { playAmen } from "./lib/supersonic_demo.js";

// Import LiveView hooks
import { MonacoEditor } from "./lib/monaco_hook.js";
import { LuaShell } from "./lib/lua_shell_hook.js";
import { Tau5ShaderCanvas } from "./lib/tau5_shader_canvas_hook.js";
import { ShaderCanvas } from "./lib/shader_canvas_hook.js";
import { Splitter } from "./lib/splitter_hook.js";
import { TerminalScroll } from "./lib/terminal_scroll_hook.js";
import { ConsoleInput } from "./lib/console_input_hook.js";
import { HydraBackground } from "./lib/hydra_background_hook.js";

// Set up direct event handlers after DOM loads
document.addEventListener("DOMContentLoaded", async () => {
  const sonic = await initSuperSonic();

  // Direct button click handler - no LiveView roundtrip
  document.addEventListener("click", async (e) => {
    if (e.target.closest('[data-supersonic-action="play-amen"]')) {
      e.preventDefault();
      await playAmen(sonic);
    }
  });
});

// Assemble LiveView hooks
let Hooks = {
  MonacoEditor,
  LuaShell,
  Tau5ShaderCanvas,
  ShaderCanvas,
  Splitter,
  TerminalScroll,
  ConsoleInput,
  HydraBackground
};

// Get CSRF token for LiveView
let csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute("content");

// Initialize LiveSocket
let liveSocket = new LiveSocket("/live", Socket, {
  hooks: Hooks,
  longPollFallbackMs: 2500,
  params: { _csrf_token: csrfToken },
});

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", (_info) => topbar.show(300));
window.addEventListener("phx:page-loading-stop", (_info) => topbar.hide());

// Connect if there are any LiveViews on the page
liveSocket.connect();

// Expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket;
