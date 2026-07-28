import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-3 w-28 mb-3" />
      <Skeleton className="h-8 w-40 mb-5" />

      <div className="flex gap-2.5 mb-5">
        <Skeleton className="flex-1 h-[72px] rounded-2xl" />
        <Skeleton className="flex-1 h-[72px] rounded-2xl" />
        <Skeleton className="flex-1 h-[72px] rounded-2xl" />
      </div>

      <Skeleton className="h-[70px] w-full rounded-2xl mb-5" />

      <Skeleton className="h-3 w-24 mb-2.5" />
      <Skeleton className="h-[140px] w-full rounded-2xl mb-3.5" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
