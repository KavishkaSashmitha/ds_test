"use client";

import Link from "next/link";
import {
  MapPin,
  Package,
  ArrowRight,
  Truck,
  MapPinned,
  Share2,
  RefreshCw,
  Navigation,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestHeader } from "@/components/test-header";

export default function TestDemoPage() {
  return (
    <div className="container max-w-7xl mx-auto pb-8 px-4">
      <TestHeader />

      <h1 className="text-4xl font-bold mb-2 text-center">
        Delivery Tracking System Demo
      </h1>
      <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
        Explore our real-time delivery tracking system with these interactive
        demos. Test both the driver and customer experience with our integrated
        location sharing solution.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="overflow-hidden border-2 hover:border-orange-500 transition-all">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="text-2xl">Location Tracking Demo</CardTitle>
            <CardDescription className="text-white/90">
              Test real-time driver location sharing and customer tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                  <MapPinned className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Real-Time GPS Tracking</h3>
                  <p className="text-sm text-gray-500">
                    Share and view driver location updates in real time
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                  <Navigation className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Map Visualization</h3>
                  <p className="text-sm text-gray-500">
                    View driver location on an interactive map
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                  <Share2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Shareable Tracking Links</h3>
                  <p className="text-sm text-gray-500">
                    Generate and share delivery tracking links
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Multiple Device Testing</h3>
                  <p className="text-sm text-gray-500">
                    Test both driver and customer views simultaneously
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t flex justify-end py-4">
            <Link href="/test-tracking">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Try Location Tracking Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden border-2 hover:border-orange-500 transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
            <CardTitle className="text-2xl">Order Pickup Demo</CardTitle>
            <CardDescription className="text-white/90">
              View orders ready for pickup and manage deliveries
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Order Management</h3>
                  <p className="text-sm text-gray-500">
                    Browse and accept orders ready for pickup
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Delivery Assignment</h3>
                  <p className="text-sm text-gray-500">
                    Accept orders and manage delivery status
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Delivery Addresses</h3>
                  <p className="text-sm text-gray-500">
                    View detailed delivery location information
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Real-Time Updates</h3>
                  <p className="text-sm text-gray-500">
                    Refresh and see new orders as they become available
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t flex justify-end py-4">
            <Link href="/test-orders">
              <Button className="bg-blue-500 hover:bg-blue-600">
                Try Order Pickup Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border">
        <h2 className="text-2xl font-bold mb-4">
          How to Test the Full Workflow
        </h2>
        <ol className="list-decimal list-inside space-y-3 mb-6">
          <li className="text-gray-700">
            <span className="font-medium">
              Start with the Location Tracking Demo
            </span>
            <p className="text-sm text-gray-500 ml-6 mt-1">
              Begin by opening the driver's view, activating location sharing,
              and testing different delivery statuses.
            </p>
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Generate a Tracking Link</span>
            <p className="text-sm text-gray-500 ml-6 mt-1">
              Use the "Share Tracking" button to create a shareable link that
              can be opened in another browser or device.
            </p>
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Try the Orders Ready for Pickup</span>
            <p className="text-sm text-gray-500 ml-6 mt-1">
              Browse available orders, view delivery details, and accept an
              order to manage.
            </p>
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Test Multi-Device Interaction</span>
            <p className="text-sm text-gray-500 ml-6 mt-1">
              For a complete test, use multiple devices or browser windows to
              simulate both driver and customer experiences.
            </p>
          </li>
        </ol>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/test-tracking">
            <Button variant="outline" className="w-full sm:w-auto">
              <MapPinned className="mr-2 h-4 w-4" />
              Location Tracking Demo
            </Button>
          </Link>
          <Link href="/test-orders">
            <Button variant="outline" className="w-full sm:w-auto">
              <Package className="mr-2 h-4 w-4" />
              Order Pickup Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
