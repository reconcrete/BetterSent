import type { FC } from "react";

import { cn } from "~/shared/lib";

type EReaderGraphicProps = {
  className?: string;
};

export const EReaderGraphic: FC<EReaderGraphicProps> = ({ className }) => {
  return (
    <div className={cn("relative w-[502px] h-[554px]", className)}>
      {/* Ambient glow */}
      <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/3 size-[400px] rounded-full bg-[rgba(244,216,172,0.7)] dark:bg-[rgba(255,242,124,0.04)] blur-[80px] opacity-60 dark:opacity-100" />

      <svg
        viewBox="0 0 502 554"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
      >
        <style>{`
          @keyframes float-gentle-1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(0, -8px); }
          }
          @keyframes float-gentle-2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(0, -10px); }
          }
          @keyframes float-gentle-3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(0, -6px); }
          }
          @keyframes dash-flow {
            to { stroke-dashoffset: -20; }
          }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          @keyframes pulse-check {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .float-1 { animation: float-gentle-1 6s ease-in-out infinite; }
          .float-2 { animation: float-gentle-2 7s ease-in-out infinite; }
          .float-3 { animation: float-gentle-3 5s ease-in-out infinite; }
          .dash-anim { animation: dash-flow 2s linear infinite; }
          .pulse { animation: pulse-subtle 3s ease-in-out infinite; }
          .pulse-check { animation: pulse-check 4s ease-in-out infinite; transform-origin: center; }
        `}</style>

        {/* === DASHED CONNECTION LINES === */}
        {/* Left document to tablet */}
        <path
          d="M 175 220 C 195 260, 210 280, 230 310"
          className="stroke-foreground/20 dark:stroke-white/15 dash-anim"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          fill="none"
        />
        {/* Connection dot - left */}
        <circle cx="175" cy="220" r="3" className="fill-foreground/25 dark:fill-[#8b8b3e]/60" />
        <circle cx="230" cy="310" r="3" className="fill-foreground/25 dark:fill-[#8b8b3e]/60" />

        {/* Right document to tablet */}
        <path
          d="M 370 195 C 360 240, 340 270, 320 305"
          className="stroke-foreground/20 dark:stroke-white/15 dash-anim"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          fill="none"
          style={{ animationDelay: "-1s" }}
        />
        {/* Connection dot - right */}
        <circle cx="370" cy="195" r="3" className="fill-foreground/25 dark:fill-[#8b8b3e]/60" />
        <circle cx="320" cy="305" r="3" className="fill-foreground/25 dark:fill-[#8b8b3e]/60" />

        {/* Book to tablet */}
        <path
          d="M 195 365 C 210 350, 230 340, 245 335"
          className="stroke-foreground/20 dark:stroke-white/15 dash-anim"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          fill="none"
          style={{ animationDelay: "-0.5s" }}
        />
        <circle cx="195" cy="365" r="3" className="fill-foreground/25 dark:fill-[#8b8b3e]/60" />

        {/* === TABLET (center) === */}
        <g>
          {/* Tablet outer frame */}
          <rect
            x="210" y="280" width="200" height="260" rx="16"
            className="fill-[#e8e8e5] dark:fill-[#2a2d2f] stroke-[#d0d0cc] dark:stroke-[#3a3d3f]"
            strokeWidth="2"
          />
          {/* Tablet screen */}
          <rect
            x="228" y="300" width="164" height="210" rx="4"
            className="fill-[#ddddd8] dark:fill-[#232628]"
          />
          {/* Text lines on screen */}
          <rect x="245" y="320" width="130" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="332" width="95" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="344" width="115" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="356" width="80" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="368" width="130" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="380" width="105" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="392" width="60" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="410" width="130" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="422" width="90" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="434" width="115" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="446" width="70" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="458" width="100" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="470" width="130" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />
          <rect x="245" y="482" width="85" height="2.5" rx="1" className="fill-foreground/10 dark:fill-white/10" />

          {/* Home button */}
          <circle cx="310" cy="525" r="6" className="stroke-foreground/15 dark:stroke-white/15 fill-none" strokeWidth="1.5" />
        </g>

        {/* === DOCUMENT LEFT (top-left, tilted ~8deg) === */}
        <g className="float-1" style={{ transformOrigin: "120px 160px" }}>
          <g transform="rotate(8, 120, 160)">
            {/* Page shadow */}
            <rect x="68" y="102" width="95" height="120" rx="6" className="fill-foreground/5 dark:fill-white/5" />
            {/* Page */}
            <rect
              x="65" y="99" width="95" height="120" rx="6"
              className="fill-[#e8e5dd] dark:fill-[#3a3d3f] stroke-[#d4d0c8] dark:stroke-[#4a4d4f]"
              strokeWidth="1"
            />
            {/* Yellow highlight bar */}
            <rect x="78" y="115" width="42" height="5" rx="2" className="fill-[#d4a843] dark:fill-[#8b8b3e]" />
            {/* Text lines */}
            <rect x="78" y="128" width="68" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="78" y="136" width="55" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="78" y="144" width="62" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="78" y="152" width="48" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="78" y="160" width="68" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="78" y="168" width="40" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            {/* Smiley icon */}
            <circle cx="85" cy="195" r="8" className="stroke-foreground/20 dark:stroke-white/20 fill-none" strokeWidth="1" />
            <circle cx="82" cy="193" r="1" className="fill-foreground/20 dark:fill-white/20" />
            <circle cx="88" cy="193" r="1" className="fill-foreground/20 dark:fill-white/20" />
            <path d="M 82 197 Q 85 200 88 197" className="stroke-foreground/20 dark:stroke-white/20 fill-none" strokeWidth="0.8" />
          </g>
        </g>

        {/* === DOCUMENT RIGHT (top-right, tilted ~-12deg) === */}
        <g className="float-2" style={{ transformOrigin: "410px 140px" }}>
          <g transform="rotate(-12, 410, 140)">
            {/* Page shadow */}
            <rect x="358" y="72" width="95" height="120" rx="6" className="fill-foreground/5 dark:fill-white/5" />
            {/* Page */}
            <rect
              x="355" y="69" width="95" height="120" rx="6"
              className="fill-[#e8e5dd] dark:fill-[#3a3d3f] stroke-[#d4d0c8] dark:stroke-[#4a4d4f]"
              strokeWidth="1"
            />
            {/* Yellow highlight bar */}
            <rect x="368" y="85" width="42" height="5" rx="2" className="fill-[#d4a843] dark:fill-[#8b8b3e]" />
            {/* Text lines */}
            <rect x="368" y="98" width="68" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="368" y="106" width="55" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="368" y="114" width="62" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="368" y="122" width="48" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="368" y="130" width="68" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />
            <rect x="368" y="138" width="40" height="2" rx="1" className="fill-foreground/15 dark:fill-white/15" />

            {/* PDF badge */}
            <rect x="417" y="147" width="30" height="16" rx="3" fill="#ef4444" />
            <text x="432" y="159" textAnchor="middle" className="fill-white text-[8px] font-bold" style={{ fontFamily: "sans-serif" }}>
              PDF
            </text>
          </g>
        </g>

        {/* === BOOK (bottom-left) === */}
        <g className="float-3" style={{ transformOrigin: "145px 400px" }}>
          <g transform="rotate(-6, 145, 400)">
            {/* Book spine */}
            <rect x="118" y="378" width="8" height="68" rx="2" className="fill-[#b8a84e] dark:fill-[#6b6b3e]" />
            {/* Book cover */}
            <rect x="126" y="378" width="55" height="68" rx="3" className="fill-[#d4c85c] dark:fill-[#7a7a42]" />
            {/* Book cover detail */}
            <rect x="134" y="410" width="22" height="22" rx="2" className="fill-[#b8a84e] dark:fill-[#5c5c32]" />
            {/* Book cover line */}
            <rect x="134" y="392" width="38" height="4" rx="1" className="fill-[#e8dc6e] dark:fill-[#8b8b3e]" />
          </g>
        </g>

        {/* === SEND ICON (top center) === */}
        <g className="pulse" style={{ transformOrigin: "310px 155px" }}>
          {/* Circle background */}
          <circle cx="310" cy="155" r="22" className="fill-[#e8dc9e] dark:fill-[#3a3a28] stroke-[#c8b848] dark:stroke-[#6b6b3e]" strokeWidth="1.5" />
          {/* Paper plane */}
          <path
            d="M 303 162 L 318 155 L 303 148 L 305 155 Z"
            className="fill-[#8b7828] dark:fill-[#b8a848]"
          />
          <path
            d="M 305 155 L 318 155"
            className="stroke-[#8b7828] dark:stroke-[#b8a848]"
            strokeWidth="1"
          />
        </g>

        {/* === WIFI ICON (right side) === */}
        <g className="pulse" style={{ transformOrigin: "440px 380px", animationDelay: "1.5s" }}>
          {/* WiFi arcs */}
          <path d="M 425 388 C 425 375, 455 375, 455 388" className="stroke-foreground/30 dark:stroke-white/25 fill-none" strokeWidth="2" strokeLinecap="round" />
          <path d="M 430 385 C 430 378, 450 378, 450 385" className="stroke-foreground/30 dark:stroke-white/25 fill-none" strokeWidth="2" strokeLinecap="round" />
          <path d="M 435 382 C 435 379, 445 379, 445 382" className="stroke-foreground/30 dark:stroke-white/25 fill-none" strokeWidth="2" strokeLinecap="round" />
          {/* WiFi dot */}
          <circle cx="440" cy="388" r="2" className="fill-foreground/30 dark:fill-white/25" />
        </g>

        {/* === GREEN CHECKMARK === */}
        <g className="pulse-check" style={{ transformOrigin: "420px 465px" }}>
          <circle cx="420" cy="465" r="18" fill="#22c55e" />
          <path
            d="M 410 465 L 416 471 L 430 457"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* === DECORATIVE DOTS === */}
        <circle cx="209" cy="475" r="5" className="fill-[#c8b848]/50 dark:fill-[#8b8b3e]/50" />
        <circle cx="100" cy="440" r="3.5" className="fill-foreground/10 dark:fill-white/10" />
        <circle cx="465" cy="270" r="4" className="fill-foreground/10 dark:fill-white/10" />
        <circle cx="175" cy="290" r="2.5" className="fill-foreground/10 dark:fill-white/10" />
        <circle cx="440" cy="510" r="3" className="fill-[#c8b848]/40 dark:fill-[#8b8b3e]/40" />
        <circle cx="375" cy="505" r="2" className="fill-foreground/10 dark:fill-white/10" />
        <circle cx="125" cy="340" r="2" className="fill-foreground/10 dark:fill-white/10" />
        <circle cx="480" cy="440" r="3.5" className="fill-[#c8b848]/30 dark:fill-[#8b8b3e]/30" />
      </svg>
    </div>
  );
};
