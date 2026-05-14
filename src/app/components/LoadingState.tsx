import { Activity } from "lucide-react";

export function FullScreenLoader({ title = "Loading", subtitle = "Preparing your workspace." }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-6">
      <div className="w-full max-w-sm rounded-[28px] bg-white px-8 py-7 text-center shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[22px] bg-[#34C759]/12 text-[#1E7A37]">
          <Activity className="size-7 animate-pulse" strokeWidth={2.5} />
        </div>
        <p className="text-[18px] font-bold tracking-tight text-[#101828]">{title}</p>
        <p className="mt-2 text-[14px] text-[#667085]">{subtitle}</p>
      </div>
    </div>
  );
}

export function SectionLoader({ title = "Loading section" }: { title?: string }) {
  return (
    <div className="px-6 pt-16 pb-[120px]">
      <div className="animate-pulse">
        <div className="mb-4 h-9 w-40 rounded-full bg-black/8" />
        <div className="mb-10 h-5 w-56 rounded-full bg-black/6" />
        <div className="mb-6 rounded-[32px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-black/[0.04]">
          <div className="mb-4 h-6 w-36 rounded-full bg-black/8" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-black/6" />
            <div className="h-4 w-5/6 rounded-full bg-black/6" />
            <div className="h-4 w-2/3 rounded-full bg-black/6" />
          </div>
        </div>
        <p className="text-center text-[14px] font-medium text-black/40">{title}</p>
      </div>
    </div>
  );
}

export function ModalLoader({ title = "Loading assistant" }: { title?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10" />
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#34C759]/12 text-[#1E7A37]">
            <Activity className="size-5 animate-pulse" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[18px] font-bold tracking-tight text-[#101828]">{title}</p>
            <p className="text-[13px] text-[#667085]">Just a moment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
