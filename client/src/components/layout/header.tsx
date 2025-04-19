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
import logoBlack from "@/assets/logo_black.png";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFC300] shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[4.5rem]"> {/* Increased height by 10px */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src={logoBlack} 
                  alt="Buzzd Logo" 
                  className="h-[4rem]" /* Increased logo size by 33% from 12 (3rem) to 4rem */
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            {/* For demo purposes, use a guest user */}
            <Button 
              variant="ghost" 
              className="flex items-center text-[#F4F4F9]"
              style={{ 
                border: '1px solid rgba(244, 244, 249, 0.3)'
              }}
            >
              <span className="text-sm mr-1">Hi Guest</span>
              <FiUser className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
