import { Sidebar } from "@/components/sidebar";
import { BottomTab } from "@/components/bottom-tab";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main
        className="flex-1 overflow-auto p-4 lg:p-6"
        // Add bottom padding on mobile so content isn't hidden behind BottomTab
        style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <BottomTab />
    </div>
  );
}
