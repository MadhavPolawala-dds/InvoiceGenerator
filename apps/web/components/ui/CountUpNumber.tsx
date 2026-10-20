'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency } from '@invoice/invoice-core';

export interface CountUpNumberProps {
  valueCents: number;
  durationMs?: number;
  className?: string;
  prefix?: string;
}

export function CountUpNumber({
  valueCents,
  durationMs = 300,
  className = '',
  prefix = '',
}: CountUpNumberProps) {
  const [displayCents, setDisplayCents] = useState(valueCents);
  const prevValueRef = React.useRef(valueCents);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || durationMs <= 0) {
      setDisplayCents(valueCents);
      prevValueRef.current = valueCents;
      return;
    }

    const startValue = prevValueRef.current;
    const diff = valueCents - startValue;
    if (diff === 0) return;

    const startTime = performance.now();
    let animationFrameId: number;

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easedProgress);

      setDisplayCents(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        setDisplayCents(valueCents);
        prevValueRef.current = valueCents;
      }
    };

    animationFrameId = requestAnimationFrame(updateNumber);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [valueCents, durationMs]);

  return (
    <span className={`tabular-nums select-none ${className}`} aria-label={formatCurrency(valueCents)}>
      {prefix}
      {formatCurrency(displayCents)}
    </span>
  );
}
