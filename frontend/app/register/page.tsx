import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

import { CustomerRegistrationForm } from "@/components/customer-registration-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 self-start">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex w-full flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-orange-500" />
          <span className="text-2xl font-bold">FoodExpress</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Sign up as a customer to order delicious food
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerRegistrationForm />

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or register as
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/register/restaurant">
                  <Button variant="outline" className="w-full">
                    Restaurant
                  </Button>
                </Link>
                <Link href="/register/delivery">
                  <Button variant="outline" className="w-full">
                    Delivery Partner
                  </Button>
                </Link>
              </div>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 hover:underline">
                  Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
