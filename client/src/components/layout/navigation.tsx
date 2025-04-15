import { useLocation, Link } from "wouter";
import { FiHome, FiUser, FiGift } from "react-icons/fi";
import { GiBeerBottle, GiWineBottle } from "react-icons/gi";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center h-16">
        <Link href="/">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/") ? "text-primary" : "text-gray-500"}`}>
            <FiHome className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        <Link href="/beer">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/beer") ? "text-primary" : "text-gray-500"}`}>
            <GiBeerBottle className="h-6 w-6" />
            <span className="text-xs mt-1">Beer</span>
          </div>
        </Link>
        <Link href="/wine-spirits">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/wine-spirits") ? "text-primary" : "text-gray-500"}`}>
            <GiWineBottle className="h-6 w-6" />
            <span className="text-xs mt-1">Wine / Spirits</span>
          </div>
        </Link>
        <Link href="/offers">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/offers") ? "text-primary" : "text-gray-500"}`}>
            <FiGift className="h-6 w-6" />
            <span className="text-xs mt-1">Offers</span>
          </div>
        </Link>
        <Link href="/profile">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
            <FiUser className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
