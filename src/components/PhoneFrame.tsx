import type { ReactNode } from "react";

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 py-6">
      <div className="relative w-[390px] h-[844px] max-h-[95vh] max-w-[95vw] bg-black rounded-[44px] shadow-2xl border-[8px] border-neutral-800 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50" />
        <div className="w-full h-full overflow-hidden relative">{children}</div>
      </div>
    </div>
  );
}
