import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export default function NewWhatsAppContact() {
  const handleWhatsAppClick = () => {
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20or%20deal%20to%20be%20added%20to%20the%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  return (
    <div 
      className="fixed bottom-20 left-0 right-0 z-40 bg-white py-3 border-t border-gray-200" 
      style={{ marginBottom: "0px" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Missing a bar or deal?
          </span>
          <button
            onClick={handleWhatsAppClick}
            className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg px-3 py-1 flex items-center"
          >
            <FaWhatsapp className="h-4 w-4 mr-1" />
            <span className="text-sm">Suggest</span>
          </button>
        </div>
      </div>
    </div>
  );
}