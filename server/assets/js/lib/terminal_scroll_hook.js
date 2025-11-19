// Terminal auto-scroll to bottom hook
export const TerminalScroll = {
  mounted() {
    this.handleUpdated = () => {
      this.el.scrollTop = this.el.scrollHeight;
    };
    this.handleUpdated();
  },

  updated() {
    this.handleUpdated();
  }
};
