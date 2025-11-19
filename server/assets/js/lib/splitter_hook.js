// Draggable splitter for resizing panels with mouse and touch support
export const Splitter = {
  mounted() {
    const splitter = this.el;
    const container = splitter.parentElement;
    const direction = splitter.dataset.direction;
    const splitId = splitter.dataset.splitId;

    let dragging = false;
    let touchIdentifier = null;

    const getPosition = (e) => {
      const rect = container.getBoundingClientRect();
      // Handle both mouse and touch events
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) ||
                     (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) ||
                     (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY);

      if (direction === "horizontal") {
        return (clientX - rect.left) / rect.width;
      } else {
        return (clientY - rect.top) / rect.height;
      }
    };

    const onMove = (e) => {
      if (!dragging) return;
      e.preventDefault();

      // For touch events, check if it's the same touch that started the drag
      if (e.type === 'touchmove' && touchIdentifier !== null) {
        const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier);
        if (!touch) return;
      }

      const ratio = Math.min(0.8, Math.max(0.2, getPosition(e)));
      const prev = splitter.previousElementSibling;
      const next = splitter.nextElementSibling;

      if (prev && next) {
        prev.style.flex = `0 0 ${ratio * 100}%`;
        next.style.flex = `1 1 ${(1 - ratio) * 100}%`;
      }
    };

    const onEnd = (e) => {
      if (!dragging) return;

      // For touch events, check if it's the same touch that started the drag
      if (e.type === 'touchend' && touchIdentifier !== null) {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdentifier);
        if (!touch) return;
      }

      dragging = false;
      touchIdentifier = null;

      splitter.classList.remove("dragging");
      splitter.classList.remove("touch-active");
      document.body.classList.remove("dragging");

      // Remove all event listeners
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove, { passive: false });
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);

      const ratio = getPosition(e);
      this.pushEvent("resize_split", { id: splitId, ratio: ratio });
    };

    const onStart = (e) => {
      e.preventDefault();
      dragging = true;

      // For touch events, store the touch identifier
      if (e.type === 'touchstart') {
        touchIdentifier = e.touches[0].identifier;
        splitter.classList.add("touch-active");
      }

      splitter.classList.add("dragging");
      document.body.classList.add("dragging");

      // Add appropriate move and end listeners based on input type
      if (e.type === 'mousedown') {
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
      } else if (e.type === 'touchstart') {
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
        document.addEventListener("touchcancel", onEnd);
      }
    };

    // Add both mouse and touch event listeners
    splitter.addEventListener("mousedown", onStart);
    splitter.addEventListener("touchstart", onStart, { passive: false });
  }
};
