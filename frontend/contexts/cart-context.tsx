"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export interface CartItem {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  price: number
  quantity: number
  image?: string
  options?: { name: string; value: string }[]
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getRestaurantId: () => string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart))
      } catch (error) {
        console.error("Failed to parse stored cart:", error)
        localStorage.removeItem("cart")
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))
  }, [cartItems])

  // Get the restaurant ID of items in the cart
  const getRestaurantId = () => {
    if (cartItems.length === 0) return null
    return cartItems[0].restaurantId
  }

  // Add item to cart
  const addToCart = (item: CartItem) => {
    // Check if we're adding from a different restaurant
    const currentRestaurantId = getRestaurantId()
    if (currentRestaurantId && currentRestaurantId !== item.restaurantId) {
      if (!window.confirm("Adding items from a different restaurant will clear your current cart. Continue?")) {
        return
      }
      setCartItems([{ ...item, quantity: item.quantity || 1 }])
      return
    }

    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id)

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += item.quantity || 1
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, { ...item, quantity: item.quantity || 1 }]
      }
    })
  }

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
  }

  // Calculate cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getRestaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
