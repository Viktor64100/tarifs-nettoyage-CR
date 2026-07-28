import Skeleton from "@/components/ui/Skeleton";

export default function ProspectDetailLoading() {
  return (
    <div className="px-5 pt-5 pb-8">
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-[54px] w-full rounded-2xl my-4" />
      <Skeleton className="h-[62px] w-full rounded-2xl mb-4" />
      <Skeleton className="h-11 w-full rounded-2xl mb-2.5" />
      <Skeleton className="h-9 w-full rounded-2xl mb-6" />
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-14 w-full rounded-xl mb-3" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}
