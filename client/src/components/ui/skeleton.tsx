import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden", 
        shimmer ? "animate-none" : "animate-pulse",
        className
      )}
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]
          bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  )
}

// Enhanced shimmer skeleton with a gradient effect
function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      shimmer={true}
      className={className}
      {...props}
    />
  )
}

export { Skeleton, ShimmerSkeleton }
