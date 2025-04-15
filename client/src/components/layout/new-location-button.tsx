import React from 'react';
import { FiMapPin, FiEdit2 } from 'react-icons/fi';

interface NewLocationButtonProps {
  location: string;
  onClick: () => void;
  totalDeals: number;
}

export default function NewLocationButton({ location, onClick, totalDeals }: NewLocationButtonProps) {
  return (
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-gray-600">
              <FiMapPin className="mr-1 h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="text-sm font-medium">
              {totalDeals} deals found
            </div>
          </div>
          
          <button 
            onClick={onClick}
            className="text-center text-sm text-blue-600 py-2 px-4 bg-blue-50 rounded-md border border-blue-100 hover:bg-blue-100 flex items-center justify-center w-full"
          >
            <span className="mr-2">Change location</span>
            <FiEdit2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}