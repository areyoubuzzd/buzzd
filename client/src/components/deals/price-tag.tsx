import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  className?: string;
}

export const PriceTag = ({ price, className }: PriceTagProps) => {
  const formattedPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(price);

  return (
    <div className={cn("font-bold text-xl text-white", className)}>
      {formattedPrice}
    </div>
  );
};