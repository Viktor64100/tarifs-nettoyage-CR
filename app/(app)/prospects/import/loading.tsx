import Skeleton from "@/components/ui/Skeleton";

export default function ImportLoading() {
  return (
    <div className="px-5 pt-5 pb-10">
      <Skeleton className="h-5 w-24 mb-3" />
      <Skeleton className="h-8 w-56 mb-1.5" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-11 w-full rounded-xl mb-3" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
