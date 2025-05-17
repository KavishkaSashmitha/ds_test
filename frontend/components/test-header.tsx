"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Map, Truck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TestHeader() {
  const pathname = usePathname();

  return (
    <div className="border-b mb-8">
      <div className="container mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-orange-500" />
          <h1 className="text-xl font-bold">Delivery System Test Suite</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "outline"}
              size="sm"
              className="flex gap-1 items-center"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/test-orders">
            <Button
              variant={pathname === "/test-orders" ? "default" : "outline"}
              size="sm"
              className="flex gap-1 items-center"
            >
              <Package className="h-4 w-4" />
              <span>Orders Pickup</span>
            </Button>
          </Link>
          <Link href="/test-tracking">
            <Button
              variant={pathname === "/test-tracking" ? "default" : "outline"}
              size="sm"
              className="flex gap-1 items-center"
            >
              <Map className="h-4 w-4" />
              <span>Location Tracking</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
