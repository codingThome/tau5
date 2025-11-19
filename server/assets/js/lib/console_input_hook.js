// Console input hook with Emacs-style keyboard shortcuts
export const ConsoleInput = {
  mounted() {
    this.el.focus();

    if (this.el.tagName === 'TEXTAREA') {
      const len = this.el.value.length;
      this.el.setSelectionRange(len, len);
    }

    this.handleEvent("update_input_value", ({value}) => {
      this.el.value = value;
      this.el.focus();
    });

    this.handleEvent("focus_input", () => {
      setTimeout(() => {
        this.el.focus();
        if (this.el.tagName === 'TEXTAREA') {
          const len = this.el.value.length;
          this.el.setSelectionRange(len, len);
        }
      }, 0);
    });

    this.killRing = "";

    this.handleKeydown = (e) => {
      if (e.key === 'Enter') {
        if (e.altKey) {
          e.preventDefault();
          this.pushEvent("handle_keydown", {key: "force_execute"});
          return;
        }

        if (this.el.tagName === 'INPUT') {
          return;
        }

        if (!e.shiftKey) {
          e.preventDefault();
          const start = this.el.selectionStart;
          const end = this.el.selectionEnd;
          const value = this.el.value;

          this.el.value = value.slice(0, start) + '\n' + value.slice(end);
          const newPos = start + 1;
          this.el.setSelectionRange(newPos, newPos);

          this.el.dispatchEvent(new Event('input', { bubbles: true }));

          setTimeout(() => this.el.form.requestSubmit(), 0);

          return;
        }
      }

      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        this.pushEvent("handle_keydown", {key: "insert_newline"});
        return;
      }

      if (!e.ctrlKey && !e.altKey) return;

      const {value, selectionStart: pos, selectionEnd: end} = this.el;

      const handlers = {
        ctrl: {
          p: () => this.pushEvent("handle_keydown", {key: "ArrowUp"}),
          n: () => this.pushEvent("handle_keydown", {key: "ArrowDown"}),
          f: () => this.setCursor(Math.min(pos + 1, value.length)),
          b: () => this.setCursor(Math.max(pos - 1, 0)),
          a: () => this.setCursor(0),
          e: () => this.setCursor(value.length),
          k: () => {
            this.killRing = value.slice(pos);
            this.updateInput(value.slice(0, pos), pos);
          },
          y: () => {
            if (!this.killRing) return;
            this.updateInput(
              value.slice(0, pos) + this.killRing + value.slice(end),
              pos + this.killRing.length
            );
          },
          g: () => {
            this.pushEvent("handle_keydown", {key: "cancel_multiline"});
            this.updateInput("", 0);
          },
          d: () => {
            if (pos < value.length) {
              this.updateInput(value.slice(0, pos) + value.slice(pos + 1), pos);
            }
          },
          h: () => {
            if (pos > 0) {
              this.updateInput(value.slice(0, pos - 1) + value.slice(end), pos - 1);
            }
          }
        },
        alt: {
          f: () => {
            let i = pos;
            while (i < value.length && /\w/.test(value[i])) i++;
            while (i < value.length && /\s/.test(value[i])) i++;
            this.setCursor(i);
          },
          b: () => {
            let i = pos;
            while (i > 0 && /\s/.test(value[i - 1])) i--;
            while (i > 0 && /\w/.test(value[i - 1])) i--;
            this.setCursor(i);
          },
          a: () => this.el.setSelectionRange(0, value.length)
        }
      };

      const keyMap = e.ctrlKey ? handlers.ctrl : handlers.alt;
      const handler = keyMap[e.key];

      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    this.setCursor = (pos) => {
      this.el.setSelectionRange(pos, pos);
    };

    this.updateInput = (value, cursor) => {
      this.el.value = value;
      this.setCursor(cursor);
      this.el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    this.el.addEventListener("keydown", this.handleKeydown);
  },

  destroyed() {
    this.el.removeEventListener("keydown", this.handleKeydown);
  }
};
