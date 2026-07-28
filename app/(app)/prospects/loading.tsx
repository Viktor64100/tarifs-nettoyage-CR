import Skeleton from "@/components/ui/Skeleton";

export default function ProspectsLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-xl mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[62px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
