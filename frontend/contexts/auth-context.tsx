"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, restaurantApi, deliveryApi, User, UserRole } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    additionalData?: Record<string, any>
  ) => Promise<void>;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  checkProfileCompletion: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check for existing user session on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Validate token with backend
          try {
            await authApi.getCurrentUser();

            // Check if user needs to complete profile setup
            if (
              parsedUser.role === "restaurant" ||
              parsedUser.role === "delivery"
            ) {
              const isComplete = await checkProfileCompletion();
              if (!isComplete) {
                redirectToSetupPage(parsedUser.role);
              }
            }
          } catch (error) {
            // If token is invalid, clear user data
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth status check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Authentication status
  const isAuthenticated = !!user;

  // Role check function
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  // Function to check if user profile is complete
  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      if (user.role === "restaurant") {
        // Check if restaurant profile exists
        const response = await restaurantApi.getRestaurantByOwnerId("me");
        return !!response.data.restaurant;
      } else if (user.role === "delivery") {
        // Check if delivery personnel profile exists
        const response = await deliveryApi.getDeliveryPersonnelProfile();
        return (
          !!response.data && !!response.data.vehicleType // Using vehicleInfo as per the DeliveryPersonnel type
        );
      }
      return true; // For other roles, consider profile complete
    } catch (error) {
      console.error("Profile completion check failed:", error);
      return false;
    }
  };

  // Helper function to redirect user to setup page based on role
  const redirectToSetupPage = (role: UserRole): void => {
    if (role === "restaurant") {
      router.push("/restaurant/setup");
    } else if (role === "delivery") {
      router.push("/delivery/setup");
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = "customer",
    additionalData: Record<string, any> = {}
  ): Promise<void> => {
    setIsLoading(true);
    try {
      // Prepare registration data
      const userData = {
        name,
        email,
        password,
        role,
        ...additionalData,
      };

      // Send registration request
      const response = await authApi.register(userData);
      const { token, user } = response.data;

      // Save user data and token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      });

      // For restaurant and delivery roles, redirect to setup page
      if (role === "restaurant" || role === "delivery") {
        redirectToSetupPage(role);
      } else {
        // For other roles, use regular redirection
        redirectBasedOnRole(role);
      }
    } catch (error: any) {
      console.error("Registration failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again later.";

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      // Create the credentials object
      const credentials = { email, password, role };

      // Send login request with explicit content type header
      const response = await authApi.login(credentials);
      const { token, user } = response.data;

      // Save user data and token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });

      // Check if user needs to complete profile setup
      if (
        (user.role === "restaurant" || user.role === "delivery") &&
        !(await checkProfileCompletion())
      ) {
        redirectToSetupPage(user.role);
      } else {
        // Otherwise, use regular redirection
        redirectBasedOnRole(user.role);
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: UserRole): void => {
    if (role === "restaurant") {
      router.push("/restaurant/dashboard");
    } else if (role === "customer") {
      router.push("/customer/dashboard");
    } else if (role === "delivery") {
      router.push("/delivery/dashboard");
    } else if (role === "admin") {
      router.push("/admin/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        isLoading,
        isAuthenticated,
        hasRole,
        checkProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export the UserRole type for use in other components
export { type UserRole };
