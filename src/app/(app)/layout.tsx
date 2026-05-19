import { Sidebar } from "@/components/sidebar";
import { BottomTab } from "@/components/bottom-tab";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
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
  );
}
