import Skeleton from "@/components/ui/Skeleton";

export default function StatsLoading() {
  return (
    <div className="px-5 pt-5 pb-8">
      <Skeleton className="h-5 w-20 mb-4" />
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <Skeleton className="h-[74px] rounded-2xl" />
        <Skeleton className="h-[74px] rounded-2xl" />
        <Skeleton className="h-[74px] rounded-2xl" />
        <Skeleton className="h-[74px] rounded-2xl" />
      </div>
      <Skeleton className="h-[68px] w-full rounded-2xl mb-5" />
      <Skeleton className="h-[220px] w-full rounded-2xl" />
    </div>
  );
}
