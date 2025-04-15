import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppContact() {
  const handleWhatsAppClick = () => {
    // WhatsApp business number with pre-filled message
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20to%20be%20added%20to%20the%20Happy%20Hour%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  return (
    <section className="bg-white border-t border-gray-200" style={{ marginBottom: '70px' }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-gray-700 text-sm">
            Your favorite restaurant is not here?
          </p>
          
          <button
            onClick={handleWhatsAppClick}
            className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg py-1.5 px-3 flex items-center transition-colors duration-200 shadow-sm"
          >
            <FaWhatsapp className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Suggest a bar/deal</span>
          </button>
        </div>
      </div>
    </section>
  );
}