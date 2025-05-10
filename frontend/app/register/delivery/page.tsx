"use client";

import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeliveryRegistrationForm } from "@/components/delivery-registration-form";

export default function DeliveryRegisterPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-10">
      <Link
        href="/register"
        className="mb-8 flex items-center gap-2 self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Register
      </Link>

      <div className="flex w-full flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-orange-500" />
          <span className="text-2xl font-bold">FoodExpress</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">
              Become a Delivery Partner
            </CardTitle>
            <CardDescription>
              Join our platform and start delivering food today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryRegistrationForm />

            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-500 hover:underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
