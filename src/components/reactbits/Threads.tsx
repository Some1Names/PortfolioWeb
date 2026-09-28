"use client";

/*
 * Threads — shader from React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Local changes: a CSS module; the colour as a hex string; the amplitude eases towards its
 * prop instead of jumping (so the page can swell the threads, e.g. while music plays); device
 * pixel ratio capped at 1.5; pauses while off screen or in a hidden tab; a single still frame
 * for visitors who prefer reduced motion; no mouse interaction (it sits behind other content).
 */
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { prefersReducedMotion } from "@/lib/gsap";
import styles from "./Threads.module.css";

const hexToRgb = (hex: string): [number, number, number] => {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

interface ThreadsProps {
  color?: string;
  amplitude?: number;
  distance?: number;
  className?: string;
}

// the render resolution is capped: the shader is heavy per pixel and the effect is soft
const MAX_RENDER_DIM = 1920;

export default function Threads({ color = "#ffffff", amplitude = 1, distance = 0, className = "" }: ThreadsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const target = useRef({ color, amplitude, distance });

  useEffect(() => {
    target.current = { color, amplitude, distance };
  }, [color, amplitude, distance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const still = prefersReducedMotion();
    const renderer = new Renderer({ alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    let amp = target.current.amplitude;
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
      uColor: { value: new Color(...hexToRgb(target.current.color)) },
      uAmplitude: { value: amp },
      uDistance: { value: target.current.distance },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
    };
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex, fragment, uniforms }) });

    const render = () => renderer.render({ scene: mesh });
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const base = Math.min(window.devicePixelRatio || 1, 1.5);
      const longest = Math.max(clientWidth, clientHeight) * base;
      renderer.dpr = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      renderer.setSize(clientWidth, clientHeight);
      uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
      if (still) render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(container);

    let frame = 0;
    const update = (t: number) => {
      frame = requestAnimationFrame(update);
      if (!visible || document.hidden) return;
      const w = target.current;
      amp += (w.amplitude - amp) * 0.03;
      uniforms.uAmplitude.value = amp;
      uniforms.uDistance.value = w.distance;
      uniforms.uColor.value.set(...hexToRgb(w.color));
      uniforms.iTime.value = t * 0.001;
      render();
    };
    resize();
    if (still) render();
    else frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className={`${styles.container} ${className}`} aria-hidden="true" />;
}
