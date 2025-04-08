import { useState, useEffect } from "react";
import { FiMap, FiMaximize } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import type { DealWithEstablishment } from "@shared/schema";

interface MapPreviewProps {
  deals: DealWithEstablishment[];
  userLocation: { lat: number; lng: number } | null;
  radiusKm: number;
  onExpandClick: () => void;
}

export default function MapPreview({ deals, userLocation, radiusKm, onExpandClick }: MapPreviewProps) {
  const [totalDeals, setTotalDeals] = useState<number>(0);

  useEffect(() => {
    if (deals) {
      setTotalDeals(deals.length);
    }
  }, [deals]);

  // This component doesn't actually render a real map for now
  // In a real application, we would integrate with react-map-gl or Google Maps
  
  return (
    <div className="relative h-48 bg-gray-200 shadow-inner">
      <div className="absolute inset-0">
        {/* Map container - would be replaced with actual map implementation */}
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Map view would render here</span>
        </div>
        <div className="absolute inset-0 bg-dark opacity-20"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center">
          <FiMap className="h-5 w-5 text-primary mr-2" />
          <span className="text-dark font-medium">{totalDeals} deals within {radiusKm}km</span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2"
        onClick={onExpandClick}
      >
        <FiMaximize className="h-5 w-5 text-dark" />
      </Button>
    </div>
  );
}
