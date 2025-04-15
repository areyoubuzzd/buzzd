import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppContact() {
  const handleWhatsAppClick = () => {
    // WhatsApp business number with pre-filled message
    const whatsappUrl = "https://wa.me/6587654321?text=Hello%2C%20I'd%20like%20to%20suggest%20a%20restaurant%20to%20be%20added%20to%20the%20Happy%20Hour%20app.";
    window.open(whatsappUrl, "_blank");
  };
  
  return (
    <section className="bg-white shadow-md border-t border-gray-200 pb-20 mt-4">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h2 className="font-semibold text-lg">Your favorite restaurant is not here?</h2>
            <p className="text-gray-600 text-sm mt-1">
              Let us know and we'll add it to the app
            </p>
          </div>
          <button
            onClick={handleWhatsAppClick}
            className="bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg py-2 px-6 flex items-center transition-colors duration-200 shadow-sm"
          >
            <FaWhatsapp className="h-5 w-5 mr-2" />
            <span className="font-medium">Let's fix that!</span>
          </button>
        </div>
      </div>
    </section>
  );
}