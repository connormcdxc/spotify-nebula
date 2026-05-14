import * as THREE from "three";

export const StarShader = {
  uniforms: {
    time: { value: 0 },
  },
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;
      
      // Soft outer edge glow
      float alpha = pow((0.5 - ll) * 2.0, 1.2);
      
      // Super bright core
      float core = pow(max(0.0, 0.5 - ll) * 2.0, 3.0);
      
      // Boost the color brightness in the center
      vec3 finalColor = vColor + (vec3(1.0) * core * 1.5);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};
