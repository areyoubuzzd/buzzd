import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FiUser, FiCreditCard, FiStar, FiDollarSign, FiClock, FiLock } from "react-icons/fi";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logoutMutation, upgradeSubscriptionMutation } = useAuth();

  // Fetch user profile data including savings
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }
      return response.json();
    },
  });

  // Fetch user's deal view history
  const { data: dealViews, isLoading: isLoadingViews } = useQuery({
    queryKey: ["/api/user/deal-views"],
    queryFn: async () => {
      const response = await fetch("/api/user/deal-views");
      if (!response.ok) {
        throw new Error("Failed to fetch deal views");
      }
      return response.json();
    },
    enabled: false, // This API endpoint is not implemented yet
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleUpgrade = () => {
    upgradeSubscriptionMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">You need to log in first</h2>
            <p className="mt-2 text-gray-600">Please log in to view your profile</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiUser className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="text-center mt-2">
                  <CardTitle>{user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                    <span className="text-gray-600">Subscription</span>
                    <span className={`font-medium ${user.subscriptionTier === 'premium' ? 'text-secondary' : ''}`}>
                      {user.subscriptionTier === 'premium' ? 'Premium' : 'Free Tier'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                    <span className="text-gray-600">Deals viewed</span>
                    <span className="font-medium">{user.dealsViewed || 0}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                    <span className="text-gray-600">Total saved</span>
                    <span className="font-medium text-green-600">
                      ${profileData?.savings ? profileData.savings.toFixed(2) : (user.totalSaved || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                {user.subscriptionTier !== 'premium' && (
                  <Button 
                    className="w-full bg-secondary hover:bg-secondary/90"
                    onClick={handleUpgrade}
                    disabled={upgradeSubscriptionMutation.isPending}
                  >
                    <FiStar className="mr-2 h-4 w-4" />
                    {upgradeSubscriptionMutation.isPending ? "Upgrading..." : "Upgrade to Premium"}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="savings">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="savings">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Savings Summary</CardTitle>
                    <CardDescription>See how much you've saved with HappyHourHunt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Savings Overview */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-600">Total Saved</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${profileData?.savings ? profileData.savings.toFixed(2) : (user.totalSaved || 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-full">
                              <FiDollarSign className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-600">Deals Visited</p>
                              <p className="text-2xl font-bold text-blue-600">{user.dealsViewed || 0}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-full">
                              <FiClock className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Premium Benefits */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Premium Benefits</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className={`p-1 rounded-full ${user.subscriptionTier === 'premium' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <FiLock className={`h-4 w-4 ${user.subscriptionTier === 'premium' ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-3">
                              <p className={`font-medium ${user.subscriptionTier === 'premium' ? 'text-black' : 'text-gray-500'}`}>
                                Unlimited Deal Access
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.subscriptionTier === 'premium' 
                                  ? 'You have unlimited access to all deals' 
                                  : 'Upgrade to see unlimited deals (currently limited to 3/day)'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className={`p-1 rounded-full ${user.subscriptionTier === 'premium' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <FiLock className={`h-4 w-4 ${user.subscriptionTier === 'premium' ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-3">
                              <p className={`font-medium ${user.subscriptionTier === 'premium' ? 'text-black' : 'text-gray-500'}`}>
                                Deal Notifications
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.subscriptionTier === 'premium' 
                                  ? 'You receive notifications about new deals' 
                                  : 'Upgrade to get notified about new deals in your area'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className={`p-1 rounded-full ${user.subscriptionTier === 'premium' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <FiLock className={`h-4 w-4 ${user.subscriptionTier === 'premium' ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-3">
                              <p className={`font-medium ${user.subscriptionTier === 'premium' ? 'text-black' : 'text-gray-500'}`}>
                                Detailed Savings Analysis
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.subscriptionTier === 'premium' 
                                  ? 'You have access to detailed savings reports' 
                                  : 'Upgrade to see detailed analysis of your savings'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {user.subscriptionTier !== 'premium' && (
                        <Button 
                          className="w-full bg-secondary hover:bg-secondary/90"
                          onClick={handleUpgrade}
                          disabled={upgradeSubscriptionMutation.isPending}
                        >
                          <FiStar className="mr-2 h-4 w-4" />
                          {upgradeSubscriptionMutation.isPending ? "Upgrading..." : "Upgrade to Premium"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent interactions with happy hour deals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingViews ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : dealViews && dealViews.length > 0 ? (
                      <div className="space-y-4">
                        {/* This would map through actual deal views if the API endpoint was implemented */}
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="font-medium">You viewed "Happy Hour Special" at Local Pub</p>
                          <p className="text-sm text-gray-500">Yesterday at 5:30 PM</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="font-medium">You saved "2-for-1 Cocktails" at Mixology Bar</p>
                          <p className="text-sm text-gray-500">3 days ago</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>You haven't viewed any deals yet.</p>
                        <p className="mt-2">Start exploring deals to track your activity!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
