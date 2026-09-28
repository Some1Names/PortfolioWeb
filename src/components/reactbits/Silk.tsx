"use client";

/*
 * Silk — shader from React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Local changes: runs on `ogl` (a full-screen triangle) instead of three.js + React Three Fiber,
 * which keeps several hundred KB of 3D engine out of the bundle; device pixel ratio capped at
 * 1.5; pauses while off screen; a single still frame for visitors who prefer reduced motion;
 * the light-mode option removed (this site is dark only).
 */
import { useEffect, useRef, useState } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";
import { prefersReducedMotion } from "@/lib/gsap";
import styles from "./Silk.module.css";

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
}`;

const fragment = `precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  float grain = rnd / 15.0 * uNoiseIntensity;
  vec3 result = uColor * pattern - vec3(grain);
  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}`;

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
}

export default function Silk({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
  className = "",
}: SilkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver((entries) => setIsVisible(entries[0].isIntersecting), { threshold: 0 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!isVisible || !container) return;

    const still = prefersReducedMotion();
    // no WebGL (switched off, blocked, or the GPU's contexts used up): the background stays empty
    // rather than throwing, which would take the whole page down with it
    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 1.5) });
    } catch {
      return;
    }
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    container.appendChild(gl.canvas);

    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: hexToRgb(color) },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uRotation: { value: rotation },
      uNoiseIntensity: { value: noiseIntensity },
    };
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex, fragment, uniforms }) });

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (still) renderer.render({ scene: mesh });
    };

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // same clock as the original: time advances 0.1 per second
      uniforms.uTime.value += 0.1 * ((now - last) / 1000);
      last = now;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    if (still) renderer.render({ scene: mesh });
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
    };
  }, [isVisible, color, speed, scale, rotation, noiseIntensity]);

  return <div ref={containerRef} className={`${styles.container} ${className}`} aria-hidden="true" />;
}
