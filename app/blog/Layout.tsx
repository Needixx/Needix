// app/blog/layout.tsx
import type { ReactNode } from "react";
export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-white text-zinc-900">{children}</div>;
}
