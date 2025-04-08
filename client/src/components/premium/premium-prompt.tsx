import { useAuth } from "@/hooks/use-auth";
import { FiStar } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface PremiumPromptProps {
  viewedDeals: number;
  maxDeals: number;
}

export default function PremiumPrompt({ viewedDeals, maxDeals }: PremiumPromptProps) {
  const { upgradeSubscriptionMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleUpgradeClick = () => {
    if (upgradeSubscriptionMutation.isPending) return;
    
    upgradeSubscriptionMutation.mutate(undefined, {
      onSuccess: () => {
        // Refresh the current page to show premium content
        window.location.reload();
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-[#00A699] to-[#FF5A5F] text-white px-4 py-3 rounded-md mb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FiStar className="h-6 w-6" />
          <span className="ml-2 font-medium">
            Free tier: <span className="font-bold">{viewedDeals}/{maxDeals}</span> deals viewed today
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-primary font-medium px-3 py-1 h-auto"
          onClick={handleUpgradeClick}
          disabled={upgradeSubscriptionMutation.isPending}
        >
          {upgradeSubscriptionMutation.isPending ? "Upgrading..." : "Upgrade"}
        </Button>
      </div>
    </div>
  );
}
