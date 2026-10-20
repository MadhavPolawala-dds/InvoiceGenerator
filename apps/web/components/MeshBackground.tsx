'use client';

import React from 'react';

/**
 * Animated mesh-gradient background
 * 3 to 4 soft, slow-drifting blurred blobs over a very light cool-grey base (#f4f6fa).
 * Features reduced-motion overrides via CSS.
 */
export function MeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none"
    >
      {/* Cool base layer */}
      <div className="absolute inset-0 bg-[#f4f6fa]" />

      {/* Blob 1: Soft Indigo / Blue */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] 
                   rounded-full bg-gradient-to-br from-blue-400/25 to-indigo-500/20 
                   blur-[100px] animate-drift-1 transform-gpu"
      />

      {/* Blob 2: Vibrant Teal / Cyan */}
      <div
        className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] 
                   rounded-full bg-gradient-to-bl from-teal-300/25 to-cyan-500/20 
                   blur-[110px] animate-drift-2 transform-gpu"
      />

      {/* Blob 3: Warm Peach / Amber accent */}
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] max-w-[900px] max-h-[750px] 
                   rounded-full bg-gradient-to-tr from-amber-200/25 to-rose-300/20 
                   blur-[120px] animate-drift-3 transform-gpu"
      />

      {/* Subtle fine noise overlay to soften banding and give organic depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_50%,_rgba(244,246,250,0.4)_100%)]" />
    </div>
  );
}
