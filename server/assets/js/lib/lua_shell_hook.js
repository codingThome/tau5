// Lua shell console with command history and resizable interface
export const LuaShell = {
  mounted() {
    this.setupResize();
    this.setupHistory();

    this.handleEvent("focus_input", () => {
      const input = document.getElementById("lua-shell-input");
      if (input) {
        input.focus();
      }
    });

    // Scroll to bottom when new output is added
    this.handleEvent("scroll_to_bottom", () => {
      const output = document.getElementById("shell-output");
      if (output) {
        output.scrollTop = output.scrollHeight;
      }
    });

    // Clear input after command execution
    this.handleEvent("clear_input", () => {
      const input = document.getElementById("lua-shell-input");
      if (input) {
        input.value = "";
      }
    });

    // Handle console toggle
    this.handleEvent("toggle_console", ({visible}) => {
      if (visible) {
        setTimeout(() => {
          const input = document.getElementById("lua-shell-input");
          if (input) input.focus();
        }, 100);
      }
    });
  },

  setupHistory() {
    const MAX_HISTORY = 100;
    const STORAGE_KEY = 'tau5-lua-history';

    this.history = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
        if (!Array.isArray(this.history)) {
          this.history = [];
        } else {
          this.history = this.history.slice(0, MAX_HISTORY);
        }
      }
    } catch (e) {
      console.warn('Failed to load command history:', e);
      this.history = [];
    }

    this.historyIndex = -1;
    this.tempInput = "";

    const input = document.getElementById("lua-shell-input");
    if (!input) return;

    this.historyKeydownHandler = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
          this.addToHistory(command);
        }
      }
    };

    this.historyInputHandler = () => {
      if (this.historyIndex === -1) {
        this.tempInput = input.value;
      }
    };

    input.addEventListener('keydown', this.historyKeydownHandler);
    input.addEventListener('input', this.historyInputHandler);
  },

  navigateHistory(direction) {
    const input = document.getElementById("lua-shell-input");
    if (!input || this.history.length === 0) return;

    if (this.historyIndex === -1 && direction > 0) {
      this.tempInput = input.value;
    }

    const newIndex = this.historyIndex + direction;

    if (newIndex < -1) return;
    if (newIndex >= this.history.length) return;

    this.historyIndex = newIndex;

    if (this.historyIndex === -1) {
      input.value = this.tempInput;
    } else {
      input.value = this.history[this.historyIndex];
    }

    input.setSelectionRange(input.value.length, input.value.length);
  },

  addToHistory(command) {
    if (this.history.length > 0 && this.history[0] === command) {
      this.historyIndex = -1;
      return;
    }

    this.history.unshift(command);

    const MAX_HISTORY = 100;
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    try {
      localStorage.setItem('tau5-lua-history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save command history:', e);
    }

    this.historyIndex = -1;
    this.tempInput = "";
  },

  setupResize() {
    const container = this.el;
    const handle = document.getElementById("shell-resize-handle");
    if (!handle) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const startResize = (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = container.offsetHeight;

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';

      // Add overlay to prevent iframe interference
      const overlay = document.createElement('div');
      overlay.id = 'resize-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.zIndex = '9998';
      overlay.style.cursor = 'ns-resize';
      document.body.appendChild(overlay);
    };

    const doResize = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const newHeight = Math.min(
        Math.max(startHeight + deltaY, 150), // Min height 150px
        window.innerHeight * 0.8 // Max 80% of viewport
      );

      container.style.height = newHeight + 'px';

      // Store the height for persistence (optional)
      localStorage.setItem('tau5-console-height', newHeight);
    };

    const stopResize = () => {
      if (!isResizing) return;

      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Remove overlay
      const overlay = document.getElementById('resize-overlay');
      if (overlay) overlay.remove();
    };

    // Attach event listeners
    handle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);

    // Load saved height
    const savedHeight = localStorage.getItem('tau5-console-height');
    if (savedHeight) {
      container.style.height = savedHeight + 'px';
    }

    // Store cleanup function for unmount
    this.resizeCleanup = () => {
      handle.removeEventListener('mousedown', startResize);
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
    };
  },

  destroyed() {
    // Clean up resize handlers
    if (this.resizeCleanup) {
      this.resizeCleanup();
    }

    // Clean up history event listeners
    const input = document.getElementById("lua-shell-input");
    if (input && this.historyKeydownHandler) {
      input.removeEventListener('keydown', this.historyKeydownHandler);
      input.removeEventListener('input', this.historyInputHandler);
    }
  }
};
