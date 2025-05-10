"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarClock, ChefHat, ClipboardList, Home, LogOut, Settings, UtensilsCrossed } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

export function RestaurantSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const links: SidebarLink[] = [
    {
      href: "/restaurant/dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/restaurant/orders",
      label: "Orders",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: "/restaurant/menu",
      label: "Menu",
      icon: <ChefHat className="h-5 w-5" />,
    },
    {
      href: "/restaurant/availability",
      label: "Availability",
      icon: <CalendarClock className="h-5 w-5" />,
    },
    {
      href: "/restaurant/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/restaurant/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/restaurant/dashboard" className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-orange-500" />
          <span className="font-semibold">Restaurant Portal</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="flex flex-col gap-1 py-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? "secondary" : "ghost"}
                className={`w-full justify-start ${pathname === link.href ? "bg-orange-50 text-orange-700" : ""}`}
              >
                {link.icon}
                <span className="ml-2">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            {user?.name?.charAt(0).toUpperCase() || "R"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name || "Restaurant Admin"}</span>
            <span className="text-xs text-muted-foreground">{user?.email || "admin@restaurant.com"}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
