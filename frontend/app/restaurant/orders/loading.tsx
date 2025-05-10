import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      <p className="mt-4 text-lg text-gray-600">Loading orders...</p>
    </div>
  );
}
