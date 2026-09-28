"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { prefersReducedMotion } from "@/lib/gsap";
import styles from "./RecordPlayer.module.css";

// The deck: "Vinyl player" by AlexEsfell (CC BY 4.0, public/models/vinyl_player.glb), recoloured,
// with our own record on the platter; the playing song's cover is its label. While a clip plays
// the record spins at 33⅓ rpm and the tonearm rides from the outer groove inward with the clip's
// progress; paused, the record slows to a stop and the arm swings back to its rest. three.js
// loads only here. Until the model is ready (or without WebGL) a flat record stands in.

const MODEL = "/models/vinyl_player.glb";
const SPIN = ((33 + 1 / 3) / 60) * Math.PI * 2; // rad/s
const RECORD_R = 0.66; // the record's radius in the model's units (the platter's is 0.705)
const LABEL = 0.33; // the label's radius, as a share of the record's (a real 12" record's is ~1/3)
const GROOVE_OUT = 0.6; // where the stylus sits when a clip starts...
const GROOVE_IN = 0.4; // ...and when it ends
// model parts, by node name: the tonearm swings as one around the ring under it
const ARM = ["pCylinder23", "pCylinder30", "pCylinder25", "pCube20", "pCylinder22"];
const PIVOT = "pCylinder16";
const PLATTER = "pCylinder2";
const HEADSHELL = "pCylinder30";
// the camera, relative to the record's centre (x, y, z): where it sits and what it looks at
const CAM = { fov: 30, from: [1.7, 2.35, 0], at: [0, 0, -0.02] };
const part = (name: string) => name.split("_")[0];

type Api = { setCover: (url: string) => void; kick: () => void };

export default function Turntable({ cover, playing, progress }: { cover: string; playing: boolean; progress: number }) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const want = useRef({ playing, progress });
  const coverNow = useRef(cover);
  const api = useRef<Api | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    want.current = { playing, progress };
    api.current?.kick();
  }, [playing, progress]);
  useEffect(() => {
    coverNow.current = cover;
    api.current?.setCover(cover);
  }, [cover]);

  useEffect(() => {
    const el = box.current;
    const mount = host.current;
    if (!el || !mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const T = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (disposed) return;

        const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        const gltf = await new GLTFLoader().loadAsync(MODEL);
        if (disposed) {
          renderer.dispose();
          return;
        }

        const scene = new T.Scene();
        const pmrem = new T.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        scene.environmentIntensity = 0.3;

        // ---- the deck, in our palette ----
        const std = (color: string, metalness: number, roughness: number) =>
          new T.MeshStandardMaterial({ color, metalness, roughness });
        const base = std("#08070b", 0.2, 0.55);
        const dark = std("#050407", 0.3, 0.55);
        const metal = std("#8f88a8", 1, 0.32);
        // the tonearm a touch lighter and satin, so it still reads against the dark record
        const armMetal = std("#a49cc0", 0.75, 0.3);
        const paint: Record<string, THREE.Material> = {
          pCube17: base,
          pCylinder2: std("#060509", 0.5, 0.4),
          pCylinder16: std("#15101f", 0.4, 0.45),
          pCylinder30: std("#ff6ad5", 0.3, 0.4),
          pCylinder21: dark,
          ...Object.fromEntries(
            ["pCylinder3", "pCylinder20", "pCylinder15", "pCube6"].map((p) => [p, metal]),
          ),
          ...Object.fromEntries(["pCylinder23", "pCylinder25", "pCube20", "pCylinder22"].map((p) => [p, armMetal])),
        };
        const meshes: Record<string, THREE.Mesh> = {};
        const old = new Set<THREE.Material>();
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => old.add(x));
          m.material = paint[part(m.name)] ?? dark;
          meshes[part(m.name)] = m;
        });
        old.forEach((x) => x.dispose());
        scene.add(gltf.scene);
        gltf.scene.updateMatrixWorld(true);

        const box3 = (o: THREE.Object3D) => new T.Box3().setFromObject(o);
        const platter = box3(meshes[PLATTER]);
        const centre = platter.getCenter(new T.Vector3());
        const pivot = box3(meshes[PIVOT]).getCenter(new T.Vector3());

        // the tonearm: its parts, re-parented (keeping their place) onto a group at the pivot
        const arm = new T.Group();
        arm.position.set(pivot.x, 0, pivot.z);
        scene.add(arm);
        arm.updateMatrixWorld(true);
        ARM.forEach((p) => meshes[p] && arm.attach(meshes[p]));
        const tip = arm.worldToLocal(box3(meshes[HEADSHELL]).getCenter(new T.Vector3()));
        // the smallest swing that puts the headshell at radius r from the record's centre
        const swingTo = (r: number) => {
          for (let k = 0; k < 900; k++) {
            for (const sign of [1, -1]) {
              const a = sign * k * 0.002;
              const x = pivot.x + tip.x * Math.cos(a) + tip.z * Math.sin(a);
              const z = pivot.z - tip.x * Math.sin(a) + tip.z * Math.cos(a);
              if (Math.abs(Math.hypot(x - centre.x, z - centre.z) - r) < 0.004) return a;
            }
          }
          return 0;
        };
        const armOut = swingTo(GROOVE_OUT);
        const armIn = swingTo(GROOVE_IN);

        // ---- our record: grooves and the cover label on a canvas; the gloss follows the grooves ----
        const S = 1024;
        const R = S / 2;
        const grooves = document.createElement("canvas");
        grooves.width = grooves.height = S;
        const g = grooves.getContext("2d")!;
        g.fillStyle = "#0a090d";
        g.fillRect(0, 0, S, S);
        let seed = 7;
        const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
        for (let r = R - 10; r > R * LABEL + 26; r -= 1.25) {
          g.beginPath();
          g.arc(R, R, r, 0, Math.PI * 2);
          g.strokeStyle = `rgba(214, 208, 232, ${0.02 + rand() * 0.035})`;
          g.lineWidth = 0.7;
          g.stroke();
        }
        // the smooth gaps between songs
        for (const f of [0.84, 0.7, 0.58]) {
          g.beginPath();
          g.arc(R, R, R * f, 0, Math.PI * 2);
          g.strokeStyle = "rgba(0, 0, 0, 0.7)";
          g.lineWidth = 5;
          g.stroke();
        }
        const face = document.createElement("canvas");
        face.width = face.height = S;
        const f = face.getContext("2d")!;
        const faceTex = new T.CanvasTexture(face);
        faceTex.colorSpace = T.SRGBColorSpace;
        faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const drawFace = (img?: HTMLImageElement) => {
          f.drawImage(grooves, 0, 0);
          const lr = R * LABEL;
          f.save();
          f.beginPath();
          f.arc(R, R, lr, 0, Math.PI * 2);
          f.clip();
          f.fillStyle = "#2a2144";
          f.fillRect(R - lr, R - lr, lr * 2, lr * 2);
          if (img) f.drawImage(img, R - lr, R - lr, lr * 2, lr * 2);
          f.restore();
          f.beginPath();
          f.arc(R, R, lr, 0, Math.PI * 2);
          f.strokeStyle = "#1a1624";
          f.lineWidth = 3;
          f.stroke();
          f.beginPath();
          f.arc(R, R, 9, 0, Math.PI * 2);
          f.fillStyle = "#050407";
          f.fill();
          faceTex.needsUpdate = true;
        };
        drawFace();

        // anisotropy direction: along the grooves (around the centre), none on the label
        const D = 256;
        const dir = document.createElement("canvas");
        dir.width = dir.height = D;
        const d = dir.getContext("2d")!;
        const px = d.createImageData(D, D);
        for (let y = 0; y < D; y++) {
          for (let x = 0; x < D; x++) {
            const dx = x + 0.5 - D / 2;
            const dy = y + 0.5 - D / 2;
            const len = Math.hypot(dx, dy) || 1;
            const i = (y * D + x) * 4;
            px.data[i] = (-dy / len) * 127.5 + 127.5;
            px.data[i + 1] = (dx / len) * 127.5 + 127.5;
            px.data[i + 2] = len > (D / 2) * (LABEL + 0.02) ? 255 : 0;
            px.data[i + 3] = 255;
          }
        }
        d.putImageData(px, 0, 0);
        const dirTex = new T.CanvasTexture(dir);
        dirTex.colorSpace = T.NoColorSpace;

        const edge = std("#050407", 0.3, 0.35);
        const top = new T.MeshPhysicalMaterial({
          map: faceTex,
          roughness: 0.3,
          metalness: 0.15,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          anisotropy: 0.85,
          anisotropyMap: dirTex,
        });
        const record = new T.Mesh(new T.CylinderGeometry(RECORD_R, RECORD_R, 0.012, 160), [edge, top, edge]);
        record.position.set(centre.x, platter.max.y + 0.006, centre.z);
        scene.add(record);
        // the model's arm is set for a bare platter, so on the record it would sink into the vinyl:
        // it lifts by this much as it swings over (like a cue lever) and settles back at rest
        const lift = Math.max(0, platter.max.y + 0.012 - box3(meshes[HEADSHELL]).min.y + 0.004);

        let coverToken = 0;
        const setCover = (url: string) => {
          const token = ++coverToken;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            if (token !== coverToken || disposed) return;
            drawFace(img);
            kick();
          };
          img.src = url;
        };

        // ---- light and camera: a close-up on the record, the tonearm's tip in from the top right ----
        const key = new T.DirectionalLight("#f0e0ff", 1.6);
        key.position.set(centre.x + 1.5, 4, centre.z + 2);
        scene.add(key);
        const rim = new T.PointLight("#9a6bff", 2.5, 5);
        rim.position.set(centre.x - 1.4, 0.9, centre.z + 1.2);
        scene.add(rim);
        const camera = new T.PerspectiveCamera(CAM.fov, 1, 0.05, 50);
        camera.position.set(centre.x + CAM.from[0], CAM.from[1], centre.z + CAM.from[2]);
        camera.lookAt(centre.x + CAM.at[0], CAM.at[1], centre.z + CAM.at[2]);
        // dev only: lets the framing be tuned from the browser console
        if (process.env.NODE_ENV !== "production") Object.assign(el, { __deck: { T, camera, centre, key, rim, scene, kick: () => kick() } });

        // ---- the loop: runs while the record turns or the arm moves, then rests ----
        let speed = 0;
        let angle = 0;
        let raf = 0;
        let last = 0;
        let visible = true;
        const frame = (t: number) => {
          raf = 0;
          const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
          last = t;
          const reduce = prefersReducedMotion();
          const w = want.current;
          const goalSpeed = w.playing && !reduce ? SPIN : 0;
          const p = Math.min(Math.max(w.progress, 0), 1);
          const goalAngle = w.playing ? armOut + (armIn - armOut) * p : 0;
          speed += (goalSpeed - speed) * Math.min(1, dt * 2.5);
          if (Math.abs(goalSpeed - speed) < 0.01) speed = goalSpeed;
          record.rotation.y -= speed * dt; // clockwise, seen from above
          angle = reduce ? goalAngle : angle + (goalAngle - angle) * Math.min(1, dt * 3.5);
          if (Math.abs(goalAngle - angle) < 0.0005) angle = goalAngle;
          arm.rotation.y = angle;
          arm.position.y = armOut ? lift * Math.min(1, Math.abs(angle / armOut)) : 0;
          renderer.render(scene, camera);
          el.dataset.spin = speed > 0 ? "on" : "off";
          el.dataset.arm = angle.toFixed(3);
          if (visible && (speed !== 0 || angle !== goalAngle)) raf = requestAnimationFrame(frame);
          else last = 0;
        };
        const kick = () => {
          if (!raf && visible) raf = requestAnimationFrame(frame);
        };

        // the record's centre sits exactly at --record-x (a share of the width, set in CSS, which
        // also centres the now-playing block there): the view is slid sideways with the camera's
        // film offset, a pure shift, so the perspective doesn't change
        const recordTop = new T.Vector3(centre.x, platter.max.y + 0.012, centre.z);
        const fit = () => {
          const { width, height } = mount.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.filmOffset = 0;
          camera.updateProjectionMatrix();
          const x = parseFloat(getComputedStyle(el).getPropertyValue("--record-x")) || 0.5;
          const at = recordTop.clone().project(camera).x; // where it falls unshifted, -1..1
          const tan = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
          camera.filmOffset = ((at + 1 - 2 * x) / 2) * camera.getFilmWidth() * 2 * tan * camera.aspect;
          camera.updateProjectionMatrix();
          kick();
        };
        renderer.domElement.className = styles.canvas;
        mount.appendChild(renderer.domElement);
        const ro = new ResizeObserver(fit);
        ro.observe(mount);
        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) kick();
        });
        io.observe(el);
        fit();

        api.current = { setCover, kick };
        setCover(coverNow.current);
        setReady(true);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          api.current = null;
          scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            m.geometry.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
          });
          [faceTex, dirTex, env].forEach((t) => t.dispose());
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        // no WebGL, or the model didn't load: the flat record stays
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // built once; the cover and play state reach the scene through the refs and `api`
  }, []);

  return (
    <div ref={box} className={styles.stage} data-ready={ready ? "" : undefined} aria-hidden="true">
      {!ready && (
        <div className={`${styles.flat} ${playing ? styles.flatSpin : ""}`}>
          <span className={styles.flatLabel} style={{ backgroundImage: `url(${cover})` }} />
        </div>
      )}
      <div ref={host} className={styles.host} />
    </div>
  );
}
