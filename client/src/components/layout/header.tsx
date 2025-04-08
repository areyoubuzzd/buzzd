import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FiUser, FiLogOut } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import logoLight from "@/assets/logo.png";
import logoDark from "@/assets/logo_dark.png";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f8f7f5] shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src={logoLight} 
                  alt="Buzzd Logo" 
                  className="h-12"
                />
              </div>
            </Link>
            <div className="ml-6 flex items-center space-x-4">
              <Link href="/modern-deals">
                <div className="text-sm font-medium cursor-pointer px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  New Card Design
                </div>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center"
                    style={{ 
                      color: '#191632', 
                      border: '1px solid #19163230'
                    }}
                  >
                    <span className="text-sm mr-1">Account</span>
                    <FiUser className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  style={{ 
                    backgroundColor: 'black',
                    border: '1px solid #ff36b3',
                    boxShadow: '0 0 10px #ff36b3'
                  }}
                >
                  <DropdownMenuLabel>
                    <div className="text-sm" style={{ color: 'white' }}>
                      Signed in as <span style={{ color: '#ff36b3', fontWeight: 'bold' }}>{user.username}</span>
                    </div>
                    <div className="text-xs" style={{ color: '#ff36b380' }}>
                      {user.subscriptionTier === "premium" ? "Premium" : "Free"} Account
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator style={{ backgroundColor: '#ff36b330' }} />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <div className="w-full cursor-pointer" style={{ color: 'white' }}>Profile</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/saved">
                      <div className="w-full cursor-pointer" style={{ color: 'white' }}>Saved Deals</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: '#ff36b330' }} />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    style={{ color: '#ff5555' }}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="flex items-center"
                style={{ 
                  color: '#191632', 
                  border: '1px solid #19163230'
                }}
              >
                <span className="text-sm mr-1">Sign In</span>
                <FiUser className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
