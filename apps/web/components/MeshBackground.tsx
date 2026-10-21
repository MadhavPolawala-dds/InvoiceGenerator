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
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none print:hidden"
    >
      {/* Cool luminous base layer */}
      <div className="absolute inset-0 bg-[#f8fafc]" />

      {/* Blob 1: Luminous Electric Azure / Indigo */}
      <div
        className="absolute -top-[10%] -left-[5%] w-[50vw] h-[50vw] max-w-[750px] max-h-[750px] 
                   rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-transparent 
                   blur-[120px] animate-drift-1 transform-gpu"
      />

      {/* Blob 2: Vibrant Cyan / Emerald Frost */}
      <div
        className="absolute top-[25%] -right-[10%] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] 
                   rounded-full bg-gradient-to-bl from-cyan-300/20 via-teal-300/15 to-transparent 
                   blur-[130px] animate-drift-2 transform-gpu"
      />

      {/* Blob 3: Warm Apricot / Rose Light */}
      <div
        className="absolute -bottom-[15%] left-[25%] w-[55vw] h-[45vw] max-w-[800px] max-h-[650px] 
                   rounded-full bg-gradient-to-tr from-amber-200/20 via-rose-200/15 to-transparent 
                   blur-[140px] animate-drift-3 transform-gpu"
      />

      {/* Top ambient light bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(59,130,246,0.12),_transparent_70%)]" />
    </div>
  );
}
