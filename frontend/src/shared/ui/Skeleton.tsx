interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`rounded-lg bg-base-800 animate-skeleton ${className}`} />;
}
