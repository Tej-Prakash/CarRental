import { Loader2 } from 'lucide-react';

export default function Loading() {
  // This UI will be shown during page navigations
  // while the content of the new route segment is loading.
  return (
    <div className="flex flex-1 justify-center items-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
