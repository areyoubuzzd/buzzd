import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, userLoginSchema, userRegisterSchema } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import logoBlack from "@assets/Logo_black.png";
import { signInWithGoogle, signInWithApple, checkFirebaseConfig, getAuthRedirectResult } from "@/lib/firebase-auth";

export default function AuthPage() {
  const { toast } = useToast();
  const { 
    user, 
    loginMutation, 
    registerMutation, 
    googleLoginMutation, 
    appleLoginMutation
  } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // If user is already logged in, redirect to home page
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof userLoginSchema>>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof userRegisterSchema>>({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof userLoginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        toast({
          title: "Login successful!",
          description: `Welcome, ${data.displayName || data.username || data.email}!`,
        });
        
        // Add slight delay before redirect to ensure state is updated
        setTimeout(() => {
          navigate("/");
        }, 300);
      },
      onError: (error) => {
        console.error("Login failed:", error);
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof userRegisterSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: (data) => {
        toast({
          title: "Registration successful!",
          description: `Welcome, ${data.displayName || data.username || data.email}!`,
        });
        
        // Add slight delay before redirect to ensure state is updated
        setTimeout(() => {
          navigate("/");
        }, 300);
      },
      onError: (error) => {
        console.error("Registration failed:", error);
        toast({
          title: "Registration failed",
          description: error.message || "Please check your information and try again",
          variant: "destructive",
        });
      }
    });
  };
  
  // Firebase configuration and redirect handling
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  useEffect(() => {
    // Check if Firebase is configured and log the result
    const configStatus = checkFirebaseConfig();
    console.log("Firebase configuration status:", configStatus);
    setFirebaseReady(configStatus.isComplete);
    
    // Check for redirect result on page load
    const checkRedirectResult = async () => {
      try {
        const result = await getAuthRedirectResult();
        if (result && result.user) {
          console.log("User signed in after redirect:", result.user.uid);
          // Get the ID token
          const idToken = await result.user.getIdToken();
          const provider = result.providerId || "unknown";
          
          if (provider.includes("google")) {
            googleLoginMutation.mutate({ 
              authProvider: "google",
              idToken,
              email: result.user.email || undefined,
              displayName: result.user.displayName || undefined,
              photoUrl: result.user.photoURL || undefined,
              authProviderId: result.user.uid
            });
          } else if (provider.includes("apple")) {
            appleLoginMutation.mutate({ 
              authProvider: "apple",
              idToken,
              email: result.user.email || undefined,
              displayName: result.user.displayName || undefined,
              authProviderId: result.user.uid
            });
          }
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
      }
    };
    
    if (configStatus.isComplete) {
      checkRedirectResult();
    }
  }, [googleLoginMutation, appleLoginMutation]);

  // Handle sign-in with Google
  const handleGoogleSignIn = async () => {
    if (!firebaseReady) {
      console.error("Firebase is not properly configured");
      toast({
        title: "Configuration Error",
        description: "Authentication service is not properly configured",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Starting Google sign-in process...");
      const result = await signInWithGoogle();
      console.log("Google sign-in successful:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
      if (result.user) {
        // Get the ID token
        const idToken = await result.user.getIdToken();
        
        // Send to backend with all necessary user information
        googleLoginMutation.mutate({ 
          authProvider: "google",
          idToken,
          email: result.user.email || undefined,
          displayName: result.user.displayName || undefined,
          photoUrl: result.user.photoURL || undefined,
          authProviderId: result.user.uid
        }, {
          onSuccess: (data) => {
            console.log("Backend authentication successful:", data);
            toast({
              title: "Success!",
              description: `Welcome, ${data.displayName || data.email}!`,
              variant: "default",
            });
            
            // Add slight delay before redirect to ensure state is updated
            setTimeout(() => {
              navigate("/");
            }, 500);
          },
          onError: (error) => {
            console.error("Backend authentication failed:", error);
            toast({
              title: "Authentication Failed",
              description: error.message || "Could not complete login process",
              variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      let errorMessage = "Failed to sign in with Google";
      if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for authentication. Please check Firebase configuration.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Handle sign-in with Apple
  const handleAppleSignIn = async () => {
    if (!firebaseReady) {
      console.error("Firebase is not properly configured");
      toast({
        title: "Configuration Error",
        description: "Authentication service is not properly configured",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Starting Apple sign-in process...");
      const result = await signInWithApple();
      console.log("Apple sign-in successful:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
      if (result.user) {
        // Get the ID token
        const idToken = await result.user.getIdToken();
        
        // Send to backend with all necessary user information
        appleLoginMutation.mutate({ 
          authProvider: "apple",
          idToken,
          email: result.user.email || undefined,
          displayName: result.user.displayName || undefined,
          authProviderId: result.user.uid
        }, {
          onSuccess: (data) => {
            console.log("Backend authentication successful:", data);
            toast({
              title: "Success!",
              description: `Welcome, ${data.displayName || data.email}!`,
              variant: "default",
            });
            
            // Add slight delay before redirect to ensure state is updated
            setTimeout(() => {
              navigate("/");
            }, 500);
          },
          onError: (error) => {
            console.error("Backend authentication failed:", error);
            toast({
              title: "Authentication Failed",
              description: error.message || "Could not complete login process",
              variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      
      let errorMessage = "Failed to sign in with Apple";
      if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for authentication. Please check Firebase configuration.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Redirect to home page if the user is already logged in
  if (user) {
    setTimeout(() => {
      navigate("/");
    }, 100); // Small delay to ensure state is updated
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Login successful!</h2>
        <p>Redirecting you to the home page...</p>
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-1">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center md:items-stretch">
          {/* Form Section */}
          <div className="w-full md:w-1/2 md:pr-6">
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to access your happy hour deals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username or Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input placeholder="Enter your username or email" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input type="password" placeholder="Enter your password" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="flex items-center justify-center gap-2" 
                          onClick={handleGoogleSignIn}
                          disabled={googleLoginMutation.isPending}
                        >
                          <FcGoogle className="h-5 w-5" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-semibold">Google</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="flex items-center justify-center gap-2"
                          onClick={handleAppleSignIn}
                          disabled={appleLoginMutation.isPending}
                        >
                          <SiApple className="h-5 w-5" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-semibold">Apple</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-gray-500">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 text-primary" 
                        onClick={() => setActiveTab("register")}
                      >
                        Register now
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>
                      Join Buzzd to discover the best deals around you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input placeholder="Choose a username" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input type="email" placeholder="Enter your email" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input type="password" placeholder="Create a password" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <Input type="password" placeholder="Confirm your password" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="flex items-center justify-center gap-2" 
                          onClick={handleGoogleSignIn}
                          disabled={googleLoginMutation.isPending}
                        >
                          <FcGoogle className="h-5 w-5" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-semibold">Google</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          type="button" 
                          className="flex items-center justify-center gap-2"
                          onClick={handleAppleSignIn}
                          disabled={appleLoginMutation.isPending}
                        >
                          <SiApple className="h-5 w-5" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-semibold">Apple</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-gray-500">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 text-primary" 
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Hero Section */}
          <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center text-center p-6 mt-8 md:mt-0">
            <div className="mb-6">
              <img 
                src={logoBlack} 
                alt="Buzzd Logo" 
                className="h-16 mx-auto"
              />
            </div>
            <h2 className="text-3xl font-bold mb-2">Discover the Best Happy Hour Deals</h2>
            <div className="border-t border-b border-gray-200 w-24 mx-auto my-4" />
            <p className="text-gray-600 mb-8 max-w-md">
              Find and enjoy the best drink deals around Singapore. Never miss a happy hour again with Buzzd!
            </p>
            
            <div className="space-y-4 text-left w-full max-w-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Locate Deals</h3>
                  <p className="text-sm text-gray-600">Find nearby happy hour deals based on your location.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Explore Options</h3>
                  <p className="text-sm text-gray-600">Browse deals by drink type, price range, or popularity.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Enjoy Savings</h3>
                  <p className="text-sm text-gray-600">Take advantage of the best happy hour deals in town!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}