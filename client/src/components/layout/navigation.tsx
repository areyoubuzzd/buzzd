import { useLocation, Link } from "wouter";
import { FiUser } from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import { GiBeerStein } from "react-icons/gi";
import { IoWineSharp, IoFlash } from "react-icons/io5";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#232946] border-t border-[#3a4174] shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="/">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/") ? "text-[#2EC4B6]" : "text-[#F4F4F9]"}`}>
            <IoFlash className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        <Link href="/restaurants">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/restaurants") ? "text-[#2EC4B6]" : "text-[#F4F4F9]"}`}>
            <FaBuilding className="h-6 w-6" />
            <span className="text-xs mt-1">Restaurants</span>
          </div>
        </Link>
        <Link href="/beer">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/beer") ? "text-[#2EC4B6]" : "text-[#F4F4F9]"}`}>
            <GiBeerStein className="h-6 w-6" />
            <span className="text-xs mt-1">Beer</span>
          </div>
        </Link>
        <Link href="/wine-spirits">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/wine-spirits") ? "text-[#2EC4B6]" : "text-[#F4F4F9]"}`}>
            <IoWineSharp className="h-6 w-6" />
            <span className="text-xs mt-1">Wine / Spirits</span>
          </div>
        </Link>
        <Link href="/profile">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/profile") ? "text-[#2EC4B6]" : "text-[#F4F4F9]"}`}>
            <FiUser className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
