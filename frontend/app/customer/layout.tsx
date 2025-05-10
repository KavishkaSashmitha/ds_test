"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { CustomerNavbar } from "@/components/customer-navbar"
import { Toaster } from "@/components/ui/toaster"

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole("customer"))) {
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
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  )
}
