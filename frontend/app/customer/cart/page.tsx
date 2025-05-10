"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const subtotal = getCartTotal()
  const deliveryFee = subtotal > 0 ? 3.99 : 0
  const tax = subtotal * 0.08
  const total = subtotal + deliveryFee + tax

  const handleApplyPromo = () => {
    setIsApplyingPromo(true)
    // Simulate API call
    setTimeout(() => {
      setIsApplyingPromo(false)
      alert("Promo code is invalid or expired")
      setPromoCode("")
    }, 1000)
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6 rounded-full bg-orange-100 p-6">
          <ShoppingCart className="h-12 w-12 text-orange-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Your cart is empty</h1>
        <p className="mb-6 text-center text-gray-600">Looks like you haven't added any items to your cart yet.</p>
        <Link href="/customer/dashboard">
          <Button className="bg-orange-500 hover:bg-orange-600">Browse Restaurants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/customer/dashboard" className="mb-4 flex items-center text-gray-600 hover:text-orange-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="text-2xl font-bold">Your Cart</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items ({cartItems.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-700">
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={item.image || "/placeholder.svg?height=64&width=64"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.options && item.options.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.options.map((option, index) => (
                          <span key={index}>
                            {option.name}: {option.value}
                            {index < item.options!.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-medium">${item.price.toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                  <Button variant="outline" onClick={handleApplyPromo} disabled={!promoCode || isApplyingPromo}>
                    {isApplyingPromo ? "Applying..." : "Apply"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/customer/checkout" className="w-full">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">Proceed to Checkout</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
