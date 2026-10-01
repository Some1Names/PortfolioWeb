"use client";

/*
 * GlassSurface — from React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Local changes: TypeScript; a CSS module instead of a global stylesheet, dark only (this site has
 * no light mode); width and height default to filling the parent; the SVG-filter support check is
 * read with useSyncExternalStore (the server and the first client render use the frosted fallback);
 * the displacement map is rebuilt in one effect that also watches the size; filter ids are made
 * from useId with only id-safe characters.
 */
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import styles from "./GlassSurface.module.css";

type Props = {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  mixBlendMode?: string;
  className?: string;
  style?: React.CSSProperties;
};

// Chromium can filter a backdrop through an SVG filter; Safari and Firefox get the frosted fallback
const supportsSvgBackdrop = () => {
  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  if (isWebkit || isFirefox) return false;
  const div = document.createElement("div");
  div.style.backdropFilter = "url(#glass-probe)";
  return div.style.backdropFilter !== "";
};
const noSubscribe = () => () => {};

export default function GlassSurface({
  children,
  width = "100%",
  height = "100%",
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  style = {},
}: Props) {
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const svgSupported = useSyncExternalStore(noSubscribe, supportsSvgBackdrop, () => false);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    // the displacement map: red across, blue down, a blurred bright middle (the flat glass), at the
    // surface's real size
    const updateDisplacementMap = () => {
      const rect = container.getBoundingClientRect();
      const actualWidth = rect.width || 400;
      const actualHeight = rect.height || 200;
      const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);
      const svgContent = `
        <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
          <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
        </svg>
      `;
      feImageRef.current?.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(svgContent)}`);
    };
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      if (!ref.current) return;
      ref.current.setAttribute("scale", (distortionScale + offset).toString());
      ref.current.setAttribute("xChannelSelector", xChannel);
      ref.current.setAttribute("yChannelSelector", yChannel);
    });
    gaussianBlurRef.current?.setAttribute("stdDeviation", displace.toString());

    let timer = 0;
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(updateDisplacementMap, 0);
    });
    resizeObserver.observe(container);
    return () => {
      window.clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    redGradId,
    blueGradId,
  ]);

  const containerStyle = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    "--glass-frost": backgroundOpacity,
    "--glass-saturation": saturation,
    "--filter-id": `url(#${filterId})`,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`${styles.glass} ${svgSupported ? styles.svg : styles.fallback} ${className}`}
      style={containerStyle}
      data-part="glass"
    >
      <svg className={styles.filter} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
