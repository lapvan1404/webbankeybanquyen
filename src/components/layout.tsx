import type { ReactNode } from "react";
import { AnnouncementBar, SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function Layout({
  children,
  hideHeaderFooter = false,
}: {
  children: ReactNode;
  hideHeaderFooter?: boolean;
}) {
  if (hideHeaderFooter) {
    return (
      <div className="min-h-dvh bg-zinc-50 text-ink font-sans flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface text-ink font-sans flex flex-col">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
