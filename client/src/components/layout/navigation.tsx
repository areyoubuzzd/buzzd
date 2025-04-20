import { useLocation, Link } from "wouter";
import { FaBuilding } from "react-icons/fa";
import { GiBeerStein } from "react-icons/gi";
import { IoFlash } from "react-icons/io5";
import { FiBarChart2 } from "react-icons/fi";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#EAE6E1] border-t border-[#e0e0e5] shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="/">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/") ? "text-[#232946] font-bold" : "text-[#232946]"}`}>
            <IoFlash className={`h-6 w-6 ${isActive("/") ? "transform scale-110" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/") ? "font-bold" : ""}`}>Home</span>
          </div>
        </Link>
        <Link href="/restaurants">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/restaurants") ? "text-[#232946] font-bold" : "text-[#232946]"}`}>
            <FaBuilding className={`h-6 w-6 ${isActive("/restaurants") ? "transform scale-110" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/restaurants") ? "font-bold" : ""}`}>Restaurants</span>
          </div>
        </Link>
        <Link href="/beer">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/beer") ? "text-[#232946] font-bold" : "text-[#232946]"}`}>
            <GiBeerStein className={`h-6 w-6 ${isActive("/beer") ? "transform scale-110" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/beer") ? "font-bold" : ""}`}>Nearby</span>
          </div>
        </Link>
        <Link href="/savings">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/savings") ? "text-[#232946] font-bold" : "text-[#232946]"}`}>
            <FiBarChart2 className={`h-6 w-6 ${isActive("/savings") ? "transform scale-110" : ""}`} />
            <span className={`text-xs mt-1 ${isActive("/savings") ? "font-bold" : ""}`}>Savings</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
