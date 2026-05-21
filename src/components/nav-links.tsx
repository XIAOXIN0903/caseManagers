"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Calculator,
  Search,
  Settings,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "首页", icon: LayoutDashboard },
  { href: "/cases", label: "案件", icon: Briefcase },
  { href: "/calendar", label: "日历", icon: Calendar },
  { href: "/calculator", label: "计算器", icon: Calculator },
  { href: "/search", label: "搜索", icon: Search },
  { href: "/settings", label: "设置", icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(href)
}

export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-2 py-3 space-y-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNavSheet() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <nav className="flex flex-col gap-1 mt-6">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
              active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
      <Separator className="my-2" />
      <form action={handleLogout}>
        <Button variant="ghost" className="w-full justify-start text-sm" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </form>
    </nav>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-14 border-t bg-background pb-safe">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
              active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
