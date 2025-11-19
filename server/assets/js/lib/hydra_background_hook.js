// Hydra visual background iframe communication handler
export const HydraBackground = {
  mounted() {
    // Store reference to iframe
    this.iframe = document.getElementById("hydra-background");

    // Handle Hydra sketch updates from server
    this.handleEvent("update_hydra_sketch", (payload) => {
      if (this.iframe && this.iframe.contentWindow) {
        // Send message to iframe with new sketch code
        this.iframe.contentWindow.postMessage({
          type: "update_sketch",
          code: payload.code
        }, "*");
      }
    });

    // Optionally handle responses from iframe
    window.addEventListener("message", this.handleMessage.bind(this));
  },

  handleMessage(event) {
    // Only handle messages from our iframe
    if (event.source !== this.iframe.contentWindow) return;

    if (event.data.type === "hydra_ready") {
      console.log("Hydra iframe is ready");
      // Notify server that Hydra is ready if needed
      this.pushEvent("hydra_ready", {});
    } else if (event.data.type === "hydra_error") {
      console.error("Hydra error:", event.data.error);
      // Notify server of errors if needed
      this.pushEvent("hydra_error", {error: event.data.error});
    }
  },

  destroyed() {
    window.removeEventListener("message", this.handleMessage);
  }
};
