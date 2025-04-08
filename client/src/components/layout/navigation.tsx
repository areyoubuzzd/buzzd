import { useLocation, Link } from "wouter";
import { FiHome, FiSearch, FiBookmark, FiUser } from "react-icons/fi";

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
        <Link href="/search">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/search") ? "text-primary" : "text-gray-500"}`}>
            <FiSearch className="h-6 w-6" />
            <span className="text-xs mt-1">Search</span>
          </div>
        </Link>
        <Link href="/saved">
          <div className={`flex flex-col items-center justify-center cursor-pointer ${isActive("/saved") ? "text-primary" : "text-gray-500"}`}>
            <FiBookmark className="h-6 w-6" />
            <span className="text-xs mt-1">Saved</span>
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
