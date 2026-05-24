import { redirect } from "next/navigation";
import { verifyToken, clearAuthCookie } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DesktopNav, MobileNavSheet, BottomNav } from "@/components/nav-links";
import SessionTimeout from "@/components/session-timeout";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await verifyToken();
  if (!payload) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (!sessionStorage.getItem("session-active")) {
              document.cookie = "auth-token=; path=/; max-age=0";
              window.location.replace("/login");
            }
          `,
        }}
      />
      <SessionTimeout />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex items-center h-14 px-4 border-b">
          <Link href="/dashboard" className="font-semibold text-sm">
            案件管理
          </Link>
        </div>
        <DesktopNav />
        <Separator />
        <div className="p-2">
          <form
            action={async () => {
              "use server";
              await clearAuthCookie();
              redirect("/login");
            }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              type="submit"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-16 md:pb-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b bg-background">
          <Link href="/dashboard" className="font-semibold text-sm">
            案件管理
          </Link>
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-56">
              <MobileNavSheet />
            </SheetContent>
          </Sheet>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
