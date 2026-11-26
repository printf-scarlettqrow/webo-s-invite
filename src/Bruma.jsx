import { useEffect, useRef } from 'react';

// Humo de escenario: denso y claro arriba, se deshace hacia abajo, con grano de película marcado.
const FRAG = `
precision highp float;
uniform vec2 r;
uniform float t;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float bajada = 1.0 - uv.y;                         // 0 arriba, 1 abajo
  vec2 p = vec2(uv.x * r.x / r.y, bajada) * 2.4;

  // Humo que se mueve lento, deformado por sí mismo
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(5.2, -t * 0.04)));
  float humo = fbm(p + 1.6 * q + vec2(t * 0.025, 0.0));

  // Borde irregular: el humo cae hasta ~60% de la altura
  float borde = smoothstep(0.66, 0.08, bajada + (humo - 0.5) * 0.55);
  float luz = clamp(borde * (0.55 + humo * 0.75), 0.0, 1.0);

  vec3 fondo = vec3(0.027, 0.016, 0.047);
  vec3 lila  = vec3(0.62, 0.48, 0.92);
  vec3 blanco = vec3(0.96, 0.94, 0.99);
  vec3 col = mix(fondo, mix(lila, blanco, smoothstep(0.35, 0.95, luz)), luz);

  // Grano de película: fuerte, cambia en cada cuadro y se nota más sobre el humo claro
  float g = hash(gl_FragCoord.xy + floor(t * 24.0) * 17.31) - 0.5;
  col += g * (0.12 + 0.14 * luz);
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

export default function Bruma() {
  const ref = useRef(null);

  useEffect(() => {
    const lienzo = ref.current;
    const gl = lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return; // sin WebGL queda el fondo negro del hero

    const shader = (tipo, src) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');

    const medir = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      lienzo.width = Math.round(lienzo.clientWidth * dpr);
      lienzo.height = Math.round(lienzo.clientHeight * dpr);
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      gl.uniform2f(uR, lienzo.width, lienzo.height);
    };
    const pintar = (ms) => {
      gl.uniform1f(uT, ms / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    medir();
    pintar(8000);
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let visible = true, id = 0, ultimo = 0;
    const bucle = (ms) => {
      id = requestAnimationFrame(bucle);
      if (!visible || ms - ultimo < 33) return; // ~30 fps basta para humo
      ultimo = ms;
      pintar(ms + 8000);
    };
    if (!quieto) id = requestAnimationFrame(bucle);

    const ojo = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    ojo.observe(lienzo);
    const alCambiar = () => { medir(); pintar(performance.now() + 8000); };
    addEventListener('resize', alCambiar);

    return () => {
      cancelAnimationFrame(id);
      ojo.disconnect();
      removeEventListener('resize', alCambiar);
    };
  }, []);

  return <canvas className="estatica" ref={ref} aria-hidden="true" />;
}
