"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Gracefully replaces a broken <img> with a styled placeholder. Server
// components may not attach onError handlers to <img> in Next 16 / React 19,
// so this client component owns that behaviour.
export function SafeImage({
  src,
  alt,
  className,
  fallbackLabel,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className: string;
  fallbackLabel?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center", className)}>
        {fallbackLabel ? (
          <span className="text-sm text-slate-400">{fallbackLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}