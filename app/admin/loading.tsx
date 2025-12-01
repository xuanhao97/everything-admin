// Purpose: Loading state for admin dashboard
// - Shows fullscreen loading spinner while admin page is loading
// - Automatically used by Next.js App Router during route transitions

import { LoadingFullscreen } from "@/components/ui/loading-spinner";

export default function AdminLoading() {
  return <LoadingFullscreen variant="spinner" size="lg" showText={true} />;
}
