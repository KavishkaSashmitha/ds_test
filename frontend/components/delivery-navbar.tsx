"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Clock, Home, Menu, Package, User } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useDelivery } from "@/contexts/delivery-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DeliveryNavbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { status, setStatus, currentOrder } = useDelivery()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/delivery/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/delivery/orders", label: "Orders", icon: <Package className="h-5 w-5" /> },
    { href: "/delivery/earnings", label: "Earnings", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/delivery/history", label: "History", icon: <Clock className="h-5 w-5" /> },
  ]

  const handleStatusChange = (checked: boolean) => {
    setStatus(checked ? "available" : "offline")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/delivery/dashboard" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-bold">FoodExpress</span>
            <span className="text-sm font-medium text-gray-500">Driver</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === link.href ? "text-orange-500" : "text-gray-600"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Online/Offline Toggle */}
          <div className="hidden items-center gap-2 md:flex">
            <Switch
              id="online-mode"
              checked={status !== "offline"}
              onCheckedChange={handleStatusChange}
              disabled={!!currentOrder}
            />
            <Label htmlFor="online-mode" className="font-medium">
              {status === "offline" ? "Offline" : status === "busy" ? "Busy" : "Online"}
            </Label>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/delivery/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/delivery/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 py-6">
                <div className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-orange-500" />
                  <span className="text-xl font-bold">FoodExpress</span>
                  <span className="text-sm font-medium text-gray-500">Driver</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="mobile-online-mode"
                    checked={status !== "offline"}
                    onCheckedChange={handleStatusChange}
                    disabled={!!currentOrder}
                  />
                  <Label htmlFor="mobile-online-mode" className="font-medium">
                    {status === "offline" ? "Offline" : status === "busy" ? "Busy" : "Online"}
                  </Label>
                </div>

                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-orange-500 ${
                        pathname === link.href ? "text-orange-500" : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <Button onClick={logout} variant="outline" className="w-full">
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
