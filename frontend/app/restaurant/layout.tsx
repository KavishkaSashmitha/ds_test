"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { RestaurantSidebar } from "@/components/restaurant-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole("restaurant"))) {
      router.push("/login")
    }
  }, [isAuthenticated, hasRole, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <RestaurantSidebar />
      <div className="flex-1 overflow-auto">
        <main className="h-full">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
