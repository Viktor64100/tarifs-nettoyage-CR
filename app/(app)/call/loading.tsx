import Skeleton from "@/components/ui/Skeleton";

export default function CallLoading() {
  return (
    <div className="px-5 pt-4 pb-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-36 mt-2" />
      </div>
    </div>
  );
}
