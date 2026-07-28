import Skeleton from "@/components/ui/Skeleton";

export default function BillingLoading() {
  return (
    <div className="px-5 pt-7 pb-8">
      <Skeleton className="h-7 w-32 mb-4" />
      <Skeleton className="h-[100px] w-full rounded-2xl mb-4" />
      <Skeleton className="h-14 w-full rounded-2xl mb-2.5" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
