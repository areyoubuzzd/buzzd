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

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-black shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <h1 
                  className="font-bold text-2xl"
                  style={{ 
                    color: '#ff36b3',
                    textShadow: '0 0 10px #ff36b3, 0 0 20px #ff36b3'
                  }}
                >
                  HappyHourHunt
                </h1>
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center"
                    style={{ 
                      color: '#ff36b3', 
                      textShadow: '0 0 5px #ff36b3',
                      border: '1px solid #ff36b330'
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
                  color: '#ff36b3', 
                  textShadow: '0 0 5px #ff36b3',
                  border: '1px solid #ff36b330'
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
