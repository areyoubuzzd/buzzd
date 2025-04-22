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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import logoBlack from "@assets/Logo_black.png";
import {
  signInWithGoogleRedirect,
  handleGoogleRedirectResult,
} from "@/lib/firebase-auth";

export default function AuthPage() {
  const { toast } = useToast();
  const {
    user,
    loginMutation,
    registerMutation,
    googleLoginMutation,
    appleLoginMutation,
  } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    handleGoogleRedirectResult()
      .then((user) => {
        if (user) {
          googleLoginMutation.mutate(user);
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
      });
  }, [googleLoginMutation]);

  const loginForm = useForm<z.infer<typeof userLoginSchema>>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

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
        setTimeout(() => navigate("/"), 300);
      },
      onError: (error) => {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof userRegisterSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: (data) => {
        toast({
          title: "Registration successful!",
          description: `Welcome, ${data.displayName || data.username || data.email}!`,
        });
        setTimeout(() => navigate("/"), 300);
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleGoogleSignIn = () => {
    try {
      signInWithGoogleRedirect();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to initiate Google sign-in",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-md p-6">
          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FcGoogle className="h-5 w-5" /> Sign in with Google
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                          <Input type="password" {...field} />
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
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
