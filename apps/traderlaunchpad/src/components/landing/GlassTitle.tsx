import React from "react";
import { cn } from "@acme/ui";

/**
 * SVG “glass text” effect inspired by:
 * https://css-tricks.com/making-a-realistic-glass-effect-with-svg/
 *
 * Notes:
 * - This is a self-contained effect (it doesn't sample the real page backdrop).
 * - It still reads as frosted glass via distortion + bevel/specular edges.
 */
export const GlassTitle = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const id = React.useId().replace(/:/g, "");
  const maskId = `glassMask_${id}`;
  const distortionId = `glassDistortion_${id}`;
  const bevelId = `glassBevel_${id}`;

  // Give the glyphs + filters extra breathing room so we don't clip left/right edges.
  // (Filters + thick letterforms often extend beyond their nominal text bounds.)
  const W = 1400;
  const H = 260;

  return (
    <svg
      className={cn("inline-block align-baseline", className)}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={text}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Mask the “frosted fill” to the text shape */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width={W} height={H} fill="black" />
          <text
            x="50%"
            y="60%"
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 170,
              letterSpacing: "-0.02em",
            }}
            fill="white"
          >
            {text}
          </text>
        </mask>

        {/* Subtle “wobble” distortion for the frosted fill */}
        <filter
          id={distortionId}
          x="-30%"
          y="-60%"
          width="160%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.012"
            numOctaves="2"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Bevel/edge treatment for the visible text, based on CSS-Tricks recipe */}
        <filter
          id={bevelId}
          x="-45%"
          y="-80%"
          width="190%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          {/* dark edge */}
          <feMorphology
            operator="dilate"
            radius="3"
            in="SourceAlpha"
            result="dark_edge_01"
          />
          <feOffset dx="3" dy="3" in="dark_edge_01" result="dark_edge_03" />
          <feFlood floodColor="rgba(0,0,0,0.45)" result="dark_edge_04" />
          <feComposite
            in="dark_edge_04"
            in2="dark_edge_03"
            operator="in"
            result="dark_edge"
          />

          {/* light edge */}
          <feMorphology
            operator="dilate"
            radius="2"
            in="SourceAlpha"
            result="light_edge_01"
          />
          <feOffset dx="-2" dy="-2" in="light_edge_01" result="light_edge_03" />
          <feFlood floodColor="rgba(255,255,255,0.40)" result="light_edge_04" />
          <feComposite
            in="light_edge_04"
            in2="light_edge_03"
            operator="in"
            result="light_edge"
          />

          {/* edges together */}
          <feMerge result="edges">
            <feMergeNode in="dark_edge" />
            <feMergeNode in="light_edge" />
          </feMerge>
          <feComposite
            in="edges"
            in2="SourceGraphic"
            operator="out"
            result="edges_complete"
          />

          {/* bevel specular */}
          <feGaussianBlur stdDeviation="4" result="bevel_blur" />
          <feSpecularLighting
            result="bevel_lighting"
            in="bevel_blur"
            specularConstant="1.5"
            specularExponent="18"
            lightingColor="rgba(255,255,255,0.25)"
          >
            <feDistantLight azimuth="225" elevation="40" />
          </feSpecularLighting>
          <feComposite
            in="bevel_lighting"
            in2="SourceGraphic"
            operator="in"
            result="bevel_complete"
          />

          <feMerge result="complete">
            <feMergeNode in="edges_complete" />
            <feMergeNode in="bevel_complete" />
          </feMerge>
        </filter>
      </defs>

      {/* Frosted “fill” clipped to the letters */}
      <g mask={`url(#${maskId})`}>
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          filter={`url(#${distortionId})`}
          fill="rgba(255,255,255,0.10)"
        />
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          filter={`url(#${distortionId})`}
          fill="url(#glassGradient)"
          opacity="0.65"
        />
      </g>

      {/* Define the gradient after usage (works in SVG) */}
      <defs>
        <linearGradient id="glassGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(249,115,22,0.06)" />
        </linearGradient>
      </defs>

      {/* Visible text layer (very low opacity) + bevel edges */}
      <text
        x="50%"
        y="60%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{
          fontFamily: "inherit",
          fontWeight: 800,
          fontSize: 170,
          letterSpacing: "-0.02em",
        }}
        fill="rgba(255,255,255,0.18)"
        filter={`url(#${bevelId})`}
      >
        {text}
      </text>
    </svg>
  );
};

