import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FiUser, FiLogOut, FiFile, FiShield, FiMail } from "react-icons/fi";
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
import logoBlack from "@/assets/logo_black.png";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#EAE6E1] shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[4.5rem]"> {/* Increased height by 10px */}
          <div className="flex items-center pl-[-12px]">
            <Link href="/">
              <div className="flex items-center cursor-pointer" style={{ marginLeft: "-12px" }}>
                <img 
                  src={logoBlack} 
                  alt="Buzzd Logo" 
                  className="h-[4rem]" /* Increased logo size by 33% from 12 (3rem) to 4rem */
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center text-[#232946]"
                  >
                    <span className="text-sm mr-1">
                      Hi {user.displayName || user.username || 'User'}
                    </span>
                    {user.photoUrl ? (
                      <img 
                        src={user.photoUrl} 
                        alt={user.displayName || user.username || 'User'} 
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <FiUser className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/savings")}>
                    <FiUser className="mr-2 h-4 w-4" />
                    <span>My Savings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/terms")}>
                    <FiFile className="mr-2 h-4 w-4" />
                    <span>Terms and Conditions</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/privacy")}>
                    <FiShield className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/contact")}>
                    <FiMail className="mr-2 h-4 w-4" />
                    <span>Contact Us</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <FiLogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center text-[#232946]"
                  >
                    <span className="text-sm mr-1">Hi Guest</span>
                    <FiUser className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Guest Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/auth")}>
                    <FiUser className="mr-2 h-4 w-4" />
                    <span>Sign In / Sign Up</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/terms")}>
                    <FiFile className="mr-2 h-4 w-4" />
                    <span>Terms and Conditions</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/privacy")}>
                    <FiShield className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/contact")}>
                    <FiMail className="mr-2 h-4 w-4" />
                    <span>Contact Us</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
