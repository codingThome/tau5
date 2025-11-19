// WebGL shader rendering hook for panel backgrounds
export const ShaderCanvas = {
  mounted() {
    this.initShader();
  },

  updated() {
    // Re-init if shader isn't running
    if (!this.animationFrame) {
      this.initShader();
    }
  },

  initShader() {
    const vertexId = this.el.dataset.vertexShaderId;
    const fragmentId = this.el.dataset.fragmentShaderId;

    const vertexSource = document.getElementById(vertexId)?.textContent;
    const fragmentSource = document.getElementById(fragmentId)?.textContent;

    if (!vertexSource || !fragmentSource) {
      console.error('Shader sources not found for', this.el.id);
      return;
    }

    this.initWebGL(vertexSource, fragmentSource);
  },

  initWebGL(vertexSource, fragmentSource) {
    const canvas = this.el;

    // Stop any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Try to get WebGL context with performance-conscious settings
    const gl = canvas.getContext('webgl', {
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power'
    }) || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('WebGL not supported, using fallback for panel', canvas.id);
      this.showFallback();
      return;
    }

    // Compile shaders
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return;

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Failed to link program');
      return;
    }

    // Set up geometry
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Start render loop
    this.gl = gl;
    this.program = program;
    this.startTime = Date.now();

    // Cache uniform locations
    this.timeLocation = gl.getUniformLocation(program, 'time');
    this.resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // Framerate limiting (60 FPS)
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.lastFrameTime = 0;

    this.render();
  },

  compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  },

  render(currentTime) {
    // Request next frame immediately
    this.animationFrame = requestAnimationFrame((time) => this.render(time));

    if (!this.gl || !this.program) return;

    const canvas = this.el;
    const gl = this.gl;

    // Check if panel is visible (for performance)
    const isVisible = canvas.offsetParent !== null &&
                     canvas.style.visibility !== 'hidden';

    if (!isVisible) {
      // Skip rendering but keep the loop going
      return;
    }

    // Framerate limiting - only render if enough time has passed
    currentTime = currentTime || 0;
    const elapsed = currentTime - this.lastFrameTime;

    // Only render if enough time has passed (60 FPS = ~16.67ms per frame)
    if (elapsed < this.frameInterval) {
      return;
    }

    // Adjust for any time drift to maintain smooth framerate
    this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

    // Check for context loss
    if (gl.isContextLost()) {
      console.warn('WebGL context lost for', canvas.id);
      this.showFallback();
      return;
    }

    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Set uniforms (using cached locations)
    const time = (Date.now() - this.startTime) / 1000.0;

    if (this.timeLocation) gl.uniform1f(this.timeLocation, time);
    if (this.resolutionLocation) gl.uniform2f(this.resolutionLocation, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },

  showFallback() {
    // Replace canvas with a fallback div
    const panelIndex = this.el.dataset.panelIndex || '?';
    const fallback = document.createElement('div');
    fallback.className = 'shader-fallback';
    fallback.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 24px;
      font-weight: bold;
    `;
    fallback.textContent = `Panel ${panelIndex}`;
    this.el.parentNode.replaceChild(fallback, this.el);
  },

  destroyed() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Clean up WebGL resources
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }
};
