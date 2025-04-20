import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertLocalUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Create a more strict user schema for frontend validation
const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// For traditional username/password registration
const userRegisterSchema = insertLocalUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// For Google authentication
const googleAuthSchema = z.object({
  idToken: z.string(),
  authProvider: z.literal('google'),
  email: z.string().email().optional(),
  displayName: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  authProviderId: z.string().optional(),
});

// For Apple authentication
const appleAuthSchema = z.object({
  idToken: z.string(),
  authProvider: z.literal('apple'),
  email: z.string().email().optional(),
  displayName: z.string().optional().nullable(),
  authProviderId: z.string().optional(),
});

// For phone authentication
const phoneAuthSchema = z.object({
  phoneNumber: z.string().min(8, "Valid phone number required"),
  verificationCode: z.string().min(4, "Verification code required"),
  authProvider: z.literal('phone'),
});

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  
  // Traditional login/registration
  loginMutation: UseMutationResult<User, Error, z.infer<typeof userLoginSchema>>;
  registerMutation: UseMutationResult<User, Error, z.infer<typeof userRegisterSchema>>;
  
  // Social logins
  googleLoginMutation: UseMutationResult<User, Error, z.infer<typeof googleAuthSchema>>;
  appleLoginMutation: UseMutationResult<User, Error, z.infer<typeof appleAuthSchema>>;
  
  // Phone authentication
  requestPhoneCodeMutation: UseMutationResult<{ success: boolean }, Error, { phoneNumber: string }>;
  verifyPhoneCodeMutation: UseMutationResult<User, Error, z.infer<typeof phoneAuthSchema>>;
  
  // General methods
  logoutMutation: UseMutationResult<void, Error, void>;
  upgradeSubscriptionMutation: UseMutationResult<User, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof userLoginSchema>) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof userRegisterSchema>) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = credentials;
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to HappyHourHunt, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Google authentication
  const googleLoginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof googleAuthSchema>) => {
      console.log("Sending Google login data to server:", { ...data, idToken: "REDACTED" });
      const res = await apiRequest("POST", "/api/auth/google", data);
      const userData = await res.json();
      console.log("Server response for Google login:", userData);
      return userData;
    },
    onSuccess: (user: User) => {
      console.log("Google login successful, updating user data:", user);
      // Force update the query cache with the latest user data
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Google login successful",
        description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
      });
      
      // Give a moment for state to update before redirecting
      setTimeout(() => {
        console.log("Redirecting after Google login");
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Google login failed:", error);
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apple authentication
  const appleLoginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appleAuthSchema>) => {
      console.log("Sending Apple login data to server:", { ...data, idToken: "REDACTED" });
      const res = await apiRequest("POST", "/api/auth/apple", data);
      const userData = await res.json();
      console.log("Server response for Apple login:", userData);
      return userData;
    },
    onSuccess: (user: User) => {
      console.log("Apple login successful, updating user data:", user);
      // Force update the query cache with the latest user data
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Apple login successful",
        description: `Welcome${user.displayName ? ', ' + user.displayName : ''}!`,
      });
      
      // Give a moment for state to update before redirecting
      setTimeout(() => {
        console.log("Redirecting after Apple login");
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Apple login failed:", error);
      toast({
        title: "Apple login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Phone authentication - request verification code
  const requestPhoneCodeMutation = useMutation({
    mutationFn: async ({ phoneNumber }: { phoneNumber: string }) => {
      const res = await apiRequest("POST", "/api/auth/phone/request-code", { phoneNumber });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Phone authentication - verify code
  const verifyPhoneCodeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof phoneAuthSchema>) => {
      const res = await apiRequest("POST", "/api/auth/phone/verify", data);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Phone verification successful",
        description: "You're now logged in!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Phone verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Subscription upgrade
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/subscription", { tier: "premium" });
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Subscription upgraded",
        description: "You now have access to premium features!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        // Traditional login
        loginMutation,
        registerMutation,
        // Social logins
        googleLoginMutation,
        appleLoginMutation,
        // Phone authentication
        requestPhoneCodeMutation,
        verifyPhoneCodeMutation,
        // General methods
        logoutMutation,
        upgradeSubscriptionMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Validation schemas for external use
export { 
  userLoginSchema, 
  userRegisterSchema,
  googleAuthSchema,
  appleAuthSchema,
  phoneAuthSchema
};
