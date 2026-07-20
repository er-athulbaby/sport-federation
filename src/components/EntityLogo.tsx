"use client";

import { useState } from "react";

export default function EntityLogo({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} logo`}
        onError={() => setErrored(true)}
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
