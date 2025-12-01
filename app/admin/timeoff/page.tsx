// Purpose: Timeoff page for viewing timeoff list (Server Component)
// - Fetches timeoff data on the server
// - Passes data to client component for interactive table
// - Handles errors at server level

import { Suspense } from "react";

// Force dynamic rendering - this page requires authentication and session data
export const dynamic = "force-dynamic";

import { TimeoffTableWrapper } from "@/components/admin/timeoff-table-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getTimeoffList } from "@/lib/services/timeoff";

// Purpose: Loading fallback component
function TimeoffTableLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeoff Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// Purpose: Server component that fetches timeoff data
async function TimeoffTableContent() {
  const result = await getTimeoffList();

  if (!result.success) {
    return (
      <TimeoffTableWrapper
        data={[]}
        total={0}
        error={result.error || "Failed to fetch timeoff list"}
      />
    );
  }

  // Extract timeoffs array from response (Base API returns timeoffs at top level)
  const timeoffList = result.data?.timeoffs || [];
  const total = timeoffList.length;

  return <TimeoffTableWrapper data={timeoffList} total={total} />;
}

export default function TimeoffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timeoff Requests</h1>
        <p className="text-muted-foreground">
          View and manage employee timeoff requests
        </p>
      </div>
      <Suspense fallback={<TimeoffTableLoading />}>
        <TimeoffTableContent />
      </Suspense>
    </div>
  );
}
