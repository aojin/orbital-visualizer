export function logShaderErrors() {
  const gl = renderer.getContext();
  const programs = renderer.info.programs;
  programs.forEach((program) => {
    const { cacheKey, usedTimes, vertexShader, fragmentShader } = program;
    console.log(`Program CacheKey: ${cacheKey}`);
    console.log(`Used Times: ${usedTimes}`);
    if (vertexShader) {
      const status = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
      const source = gl.getShaderSource(vertexShader);
      console.log("Vertex Shader Compile Status:", status);
      console.log("Vertex Shader Source:", source);
    }
    if (fragmentShader) {
      const status = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
      const source = gl.getShaderSource(fragmentShader);
      console.log("Fragment Shader Compile Status:", status);
      console.log("Fragment Shader Source:", source);
    }
    const linkStatus = gl.getProgramParameter(program.program, gl.LINK_STATUS);
    console.log("Program Link Status:", linkStatus);
    if (!linkStatus) {
      const infoLog = gl.getProgramInfoLog(program.program);
      console.error("Program Info Log:", infoLog);
    }
  });
}
