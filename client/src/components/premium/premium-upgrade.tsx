import { useAuth } from "@/hooks/use-auth";
import { FiLock } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface PremiumUpgradeProps {
  totalDeals: number;
  visibleDeals: number;
}

export default function PremiumUpgrade({ totalDeals, visibleDeals }: PremiumUpgradeProps) {
  const { user, upgradeSubscriptionMutation } = useAuth();
  
  const handleUpgradeClick = () => {
    if (upgradeSubscriptionMutation.isPending) return;
    
    upgradeSubscriptionMutation.mutate(undefined, {
      onSuccess: () => {
        // Refresh the current page to show premium content
        window.location.reload();
      }
    });
  };

  const lockedDealsCount = Math.max(0, totalDeals - visibleDeals);

  return (
    <div className="flex flex-col items-center text-center">
      <FiLock className="h-12 w-12 text-primary" />
      <h3 className="font-semibold text-lg mt-3">
        Unlock {lockedDealsCount} More Happy Hour Deals
      </h3>
      <p className="text-gray-600 mt-1 max-w-md">
        Upgrade to Premium to see all available deals in your area and save up to $150 each month!
      </p>
      <Button
        onClick={handleUpgradeClick}
        disabled={upgradeSubscriptionMutation.isPending}
        className="mt-4 bg-primary hover:bg-[#e05156] text-white font-medium px-6 py-2"
      >
        {upgradeSubscriptionMutation.isPending ? "Upgrading..." : "Upgrade to Premium"}
      </Button>
    </div>
  );
}
