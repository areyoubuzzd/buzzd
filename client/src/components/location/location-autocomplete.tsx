import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, MapPin, X } from "lucide-react";
import { useDebounce } from "../../hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useClickOutside } from "../../hooks/use-click-outside";

// Debug log on component mount
useEffect(() => {
  console.log("📍 LocationAutocomplete mounted");
}, []);

type SingaporeLocation = {
  id: number;
  name: string;
  postalCode?: string;
  area?: string;
  latitude: number;
  longitude: number;
  alternateNames?: string;
  isPopular: boolean;
};

interface LocationAutocompleteProps {
  onLocationSelect: (location: SingaporeLocation) => void;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function LocationAutocomplete({
  onLocationSelect,
  className,
  placeholder = "Search for a location...",
  defaultValue = "",
}: LocationAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("📍 LocationAutocomplete mounted");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useClickOutside(containerRef, () => setIsOpen(false));

  const { data: locationsData = { locations: [] }, isLoading } = useQuery({
    queryKey: ["locations", debouncedSearchTerm],
    queryFn: async () => {
      try {
        const logPrefix = `[fetch] q="${debouncedSearchTerm}" →`;

        if (!debouncedSearchTerm) {
          const response = await fetch("/api/locations/all");
          if (!response.ok) {
            const fallback = await fetch("/api/locations/popular");
            if (!fallback.ok)
              throw new Error("Both all & popular fetch failed");
            const data = await fallback.json();
            console.log(logPrefix, "fallback /popular →", data);
            return {
              locations: Array.isArray(data) ? data : (data?.locations ?? []),
            };
          }
          const data = await response.json();
          console.log(logPrefix, "→", data);
          return {
            locations: Array.isArray(data) ? data : (data?.locations ?? []),
          };
        } else {
          const response = await fetch(
            `/api/locations/search?q=${encodeURIComponent(debouncedSearchTerm)}`,
          );
          if (!response.ok) throw new Error("Search fetch failed");
          const data = await response.json();
          console.log(logPrefix, "→", data);
          return {
            locations: Array.isArray(data) ? data : (data?.locations ?? []),
          };
        }
      } catch (err) {
        console.error("❌ Error fetching locations:", err);
        return { locations: [] };
      }
    },
    enabled: true,
  });

  const locations = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    const list = locationsData.locations || [];
    if (!term) return list;
    return list.filter(
      (loc) =>
        loc.name.toLowerCase().includes(term) ||
        loc.alternateNames?.toLowerCase().includes(term),
    );
  }, [locationsData, debouncedSearchTerm]);

  const handleLocationClick = (location: SingaporeLocation) => {
    console.log("✅ Selected location:", location);
    setSearchTerm(location.name);
    onLocationSelect(location);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
          autoFocus
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found
            </div>
          ) : (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer bg-gray-50 font-medium text-[#191632] border-b border-gray-200"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) =>
                      handleLocationClick({
                        id: -1,
                        name: "My Location",
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        isPopular: true,
                      }),
                    (err) =>
                      handleLocationClick({
                        id: 0,
                        name: "My Location",
                        latitude: 1.3521,
                        longitude: 103.8198,
                        isPopular: true,
                      }),
                  );
                }}
              >
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                  <span>My Location</span>
                </div>
              </div>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleLocationClick(loc)}
                >
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="text-sm font-medium text-gray-900">
                      {loc.name}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
