import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-bold">FoodExpress</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <a
              href="/"
              className="text-sm font-medium transition-colors hover:text-orange-500"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-sm font-medium transition-colors hover:text-orange-500"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-medium transition-colors hover:text-orange-500"
            >
              About
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-orange-500 text-white hover:bg-orange-600">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-orange-50 to-white py-20">
          <div className="container flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="text-orange-500">Delicious Food</span>
                <br />
                Delivered Fast
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Order from your favorite restaurants and get food delivered to
                your doorstep in minutes.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register/restaurant">
                  <Button size="lg" variant="outline">
                    Register Your Restaurant
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&h=400"
                alt="Food delivery illustration"
                className="mx-auto rounded-lg object-cover shadow-lg"
                width={500}
                height={400}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Choose Your Food</h3>
                <p className="text-muted-foreground">
                  Browse through hundreds of restaurants and select your
                  favorite dishes.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-orange-500"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Place Your Order</h3>
                <p className="text-muted-foreground">
                  Add items to your cart, customize your order, and proceed to
                  checkout.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-orange-500"
                  >
                    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                    <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                    <path d="M5 18v2" />
                    <path d="M19 18v2" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  Track your order in real-time and get your food delivered to
                  your doorstep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-orange-50 py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold">About FoodExpress</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                FoodExpress is a revolutionary food delivery platform connecting
                customers with their favorite restaurants. Our mission is to
                make food delivery fast, reliable, and enjoyable for everyone.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/register/delivery">
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                    Become a Delivery Partner
                  </Button>
                </Link>
                <Link href="/register/restaurant">
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                    Partner Your Restaurant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-semibold">FoodExpress</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FoodExpress. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-orange-500"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-orange-500"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-orange-500"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
