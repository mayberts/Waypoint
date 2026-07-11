import { Sidebar } from "@/components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-hidden flex">{children}</main>
    </div>
  );
}
