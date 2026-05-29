import { Sidebar } from "@/components/sidebar";
import { BottomTab } from "@/components/bottom-tab";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DemoBanner } from "@/components/demo-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh">
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main
          id="main-scroll"
          className="flex-1 overflow-auto p-4 lg:p-6"
          style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}
        >
          <ScrollToTop selector="#main-scroll" />
          {children}
        </main>
        <BottomTab />
      </div>
    </div>
  );
}
