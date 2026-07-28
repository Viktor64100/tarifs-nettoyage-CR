import Skeleton from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-7 w-32 mb-4" />
      <div className="flex flex-col gap-2.5 mb-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-[190px] w-full rounded-2xl mb-4" />
      <Skeleton className="h-14 w-full rounded-2xl mb-2.5" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
