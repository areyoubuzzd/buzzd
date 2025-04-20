import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDollarSign, FiClock, FiStar, FiBarChart2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLocation as useWouterLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import Navigation from '@/components/layout/navigation';
import AppHeader from '@/components/layout/app-header';
import { LocationHeader } from '@/components/location/location-header';
import { useLocation } from '@/contexts/location-context';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SavingsPage() {
  const { user } = useAuth();
  const [, navigate] = useWouterLocation();
  const [activeTab, setActiveTab] = useState('savings');
  
  // Get location from context
  const { location } = useLocation();

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
    // Always enable the query, since our API now returns guest data for non-authenticated users
    enabled: true,
  });

  // Store the current page in sessionStorage for proper back navigation
  useEffect(() => {
    sessionStorage.setItem('lastVisitedPage', '/savings');
    console.log('Set lastVisitedPage to /savings in sessionStorage');
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#232946]">
      {/* App Header with User Greeting */}
      <AppHeader />
      
      {/* Location Header */}
      <LocationHeader onOpenFilters={() => console.log("Open filters")} />
      
      {/* Savings Page Heading */}
      <div className="bg-[#232946] px-4 py-6 border-b border-[#353e6b]">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Your Savings</h1>
          <p className="text-gray-300 mt-1">Track how much you've saved with Buzzd</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 bg-[#232946]">
        <div className="container mx-auto px-4 py-6">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-[#353e6b] p-4 rounded-full mb-4">
                <FiDollarSign className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Sign in to track your savings</h3>
              <p className="text-gray-300 max-w-md">
                Create an account or sign in to see your savings and activity.
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="mt-6 bg-amber-400 hover:bg-amber-500 text-[#232946]"
              >
                Sign In / Sign Up
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-amber-300 rounded-full mb-2"></div>
                <div className="h-4 w-32 bg-[#353e6b] rounded mb-2"></div>
                <div className="h-3 w-24 bg-[#353e6b] rounded"></div>
              </div>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs defaultValue="savings" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="savings">Savings</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="savings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Savings Summary</CardTitle>
                      <CardDescription>See how much you've saved with Buzzd</CardDescription>
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
                                <p className="text-sm text-gray-600">Deals Used</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {profileData?.dealsUsed || user.dealsUsed || 0}
                                </p>
                              </div>
                              <div className="p-2 bg-blue-100 rounded-full">
                                <FiStar className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Savings Stats */}
                        <div className="bg-white p-4 rounded-lg space-y-4">
                          <h3 className="text-lg font-medium text-gray-800">Savings Breakdown</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Beer Deals</span>
                                <span className="font-medium">${profileData?.beerSavings || 0}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-amber-400 h-2.5 rounded-full" 
                                  style={{ width: `${(profileData?.beerSavings || 0) / (profileData?.savings || 1) * 100}%` }}>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Wine Deals</span>
                                <span className="font-medium">${profileData?.wineSavings || 0}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" 
                                  style={{ width: `${(profileData?.wineSavings || 0) / (profileData?.savings || 1) * 100}%` }}>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cocktail Deals</span>
                                <span className="font-medium">${profileData?.cocktailSavings || 0}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" 
                                  style={{ width: `${(profileData?.cocktailSavings || 0) / (profileData?.savings || 1) * 100}%` }}>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Spirit Deals</span>
                                <span className="font-medium">${profileData?.spiritSavings || 0}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-purple-500 h-2.5 rounded-full" 
                                  style={{ width: `${(profileData?.spiritSavings || 0) / (profileData?.savings || 1) * 100}%` }}>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Activity</CardTitle>
                      <CardDescription>See your recent activity and achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Activity Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-gray-600">Bars Visited</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {profileData?.barsVisited || 0}
                                </p>
                              </div>
                              <div className="p-2 bg-purple-100 rounded-full">
                                <FiClock className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-gray-600">Achievements</p>
                                <p className="text-2xl font-bold text-orange-600">
                                  {profileData?.achievements?.length || 0}
                                </p>
                              </div>
                              <div className="p-2 bg-orange-100 rounded-full">
                                <FiStar className="h-5 w-5 text-orange-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Recent Activity */}
                        <div className="bg-white p-4 rounded-lg">
                          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
                          
                          {profileData?.activities && profileData.activities.length > 0 ? (
                            <div className="space-y-3">
                              {profileData.activities.map((activity: any, index: number) => (
                                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-gray-800">{activity.title}</p>
                                      <p className="text-sm text-gray-500">{activity.description}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500">No activity recorded yet.</p>
                              <p className="text-gray-400 text-sm mt-1">Use deals to track your activity and savings.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}