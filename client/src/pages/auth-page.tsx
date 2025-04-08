import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth, userLoginSchema, userRegisterSchema } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { FiUser, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import { z } from "zod";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
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
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof userRegisterSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  if (user) {
    return <div>Redirecting...</div>;
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
                      Join HappyHourHunt to discover the best deals around you
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
          <div className="w-full md:w-1/2 mt-8 md:mt-0 md:pl-6 flex items-center">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg w-full">
              <div className="mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Find Happy Hour Deals Near You</h2>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 bg-primary/20 p-1 rounded-full">
                    <FiAlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p>Discover the best happy hour deals within walking distance</p>
                </div>
                <div className="flex items-start">
                  <div className="mt-1 mr-3 bg-primary/20 p-1 rounded-full">
                    <FiAlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p>Save money with exclusive deals on food and drinks</p>
                </div>
                <div className="flex items-start">
                  <div className="mt-1 mr-3 bg-primary/20 p-1 rounded-full">
                    <FiAlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p>Track your savings and get personalized recommendations</p>
                </div>
                <div className="flex items-start">
                  <div className="mt-1 mr-3 bg-primary/20 p-1 rounded-full">
                    <FiAlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p>Premium members get unlimited access to all deals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
