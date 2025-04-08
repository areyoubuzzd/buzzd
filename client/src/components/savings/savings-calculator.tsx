import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FiDollarSign } from "react-icons/fi";

export default function SavingsCalculator() {
  const { user } = useAuth();

  const { data: savingsData, isLoading } = useQuery({
    queryKey: ["/api/user/savings"],
    queryFn: async () => {
      const res = await fetch("/api/user/savings");
      if (!res.ok) throw new Error("Failed to fetch savings data");
      return res.json();
    },
    enabled: !!user,
  });

  // If user is not logged in or data is loading, show estimated savings
  const userSavings = savingsData?.savings ?? 0;
  
  return (
    <section className="bg-white shadow-md border-t border-gray-200">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="font-semibold text-lg">Your Happy Hour Savings</h2>
            <p className="text-gray-600 text-sm mt-1">
              {user ? "Based on your visits this month" : "Create an account to track your savings"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 w-full sm:w-auto">
            <div className="flex items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-secondary rounded-full text-white">
                <FiDollarSign className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <div className="text-gray-600 text-sm">
                  {isLoading ? "Calculating..." : user ? "You've saved" : "Potential savings"}
                </div>
                <div className="text-2xl font-bold text-dark">
                  ${isLoading ? "--" : userSavings.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">Premium users save avg. $150/mo</div>
          </div>
        </div>
      </div>
    </section>
  );
}
