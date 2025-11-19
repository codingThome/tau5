// Tau5 shader canvas wrapper hook
import { Tau5Shader } from "./tau5_shader.js";

export const Tau5ShaderCanvas = {
  mounted() {
    this.shader = new Tau5Shader(this.el);
    this.shader.init().then((success) => {
      if (success) {
        this.shader.start();
      }
    });
  },

  destroyed() {
    if (this.shader) {
      this.shader.destroy();
    }
  }
};
