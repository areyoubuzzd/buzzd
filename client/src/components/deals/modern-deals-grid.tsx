import { ModernDealCard } from "@/components/deals/modern-deal-card";
import { DealCardProps } from "@/components/deals/modern-deal-card";

interface ModernDealsGridProps {
  deals: DealCardProps[];
  onDealClick?: (dealId: number) => void;
}

export function ModernDealsGrid({ deals, onDealClick }: ModernDealsGridProps) {
  if (!deals || deals.length === 0) {
    return <div className="text-center py-8 text-gray-500">No deals available at the moment</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {deals.map((deal) => (
        <ModernDealCard
          key={deal.id}
          {...deal}
          onClick={() => onDealClick && onDealClick(deal.id)}
        />
      ))}
    </div>
  );
}