"use client";

// Purpose: Client component wrapper for TimeoffDataTable
// - Handles client-side interactivity
// - Receives data as props from server component

import { TimeoffDataTable } from "@/components/admin/timeoff-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeoffItem } from "@/lib/schemas/timeoff";

interface TimeoffTableWrapperProps {
  data: TimeoffItem[];
  total: number;
  error?: string | null;
}

export function TimeoffTableWrapper({
  data,
  total,
  error,
}: TimeoffTableWrapperProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeoff Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeoff Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No timeoff requests found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeoff Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          Total: {total} request{total !== 1 ? "s" : ""}
        </div>
        <TimeoffDataTable data={data} />
      </CardContent>
    </Card>
  );
}
