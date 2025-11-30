"use client";

// Purpose: Data table component for timeoff list
// - Features sorting, filtering, pagination
// - Uses TanStack Table for state management
// - Supports column visibility toggle

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TimeoffItem } from "@/lib/schemas/timeoff";

// Purpose: Format Unix timestamp (string or number) for display
function formatDate(dateValue?: string | number | null): string {
  if (!dateValue) return "N/A";
  try {
    // Parse Unix timestamp (can be string or number)
    const timestamp =
      typeof dateValue === "string" ? parseInt(dateValue, 10) : dateValue;
    if (isNaN(timestamp)) return "N/A";

    // Convert to Date object (Unix timestamp is in seconds, Date expects milliseconds)
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

// Purpose: Format content/reason by removing HTML entities and truncating
function formatContent(content?: string | null): string {
  if (!content) return "N/A";
  try {
    // Decode HTML entities
    const decoded = content
      .replace(/&#58;/g, ":")
      .replace(/&middot;/g, "·")
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]*>/g, ""); // Remove HTML tags
    // Truncate to reasonable length
    return decoded.length > 100 ? decoded.substring(0, 100) + "..." : decoded;
  } catch {
    return content;
  }
}

// Purpose: Get status label and variant
function getStatusInfo(status?: string | null) {
  if (!status) return { label: "Unknown", variant: "outline" as const };

  switch (status) {
    case "0":
      return { label: "Pending", variant: "secondary" as const };
    case "10":
      return { label: "Approved", variant: "default" as const };
    default:
      return { label: status, variant: "outline" as const };
  }
}

// Purpose: Get metatype label
function getMetatypeLabel(metatype?: string | null): string {
  if (!metatype) return "N/A";
  switch (metatype) {
    case "annual":
      return "Annual Leave";
    case "unpaid":
      return "Unpaid Leave";
    case "other":
      return "Other";
    default:
      return metatype;
  }
}

// Purpose: Get metatype badge variant and styling
function getMetatypeBadgeProps(metatype?: string | null) {
  if (!metatype) {
    return { variant: "outline" as const, className: "" };
  }
  switch (metatype) {
    case "annual":
      return {
        variant: "default" as const,
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      };
    case "unpaid":
      return {
        variant: "secondary" as const,
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      };
    case "other":
      return {
        variant: "outline" as const,
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      };
    default:
      return { variant: "outline" as const, className: "" };
  }
}

export const columns: ColumnDef<TimeoffItem>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by ID ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("id") || "N/A"}</div>
    ),
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const timeoff = row.original;
      // Find owner with matching username to get correct avatar
      const userOwner = timeoff.owners?.find(
        (owner) => owner.username === timeoff.username
      );
      return (
        <div className="flex items-center gap-2">
          {userOwner?.gavatar && (
            <Avatar
              src={userOwner.gavatar}
              alt={timeoff.username || "User"}
              size="sm"
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{timeoff.username || "N/A"}</span>
            <span className="text-xs text-muted-foreground">
              {timeoff.user_id || ""}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string | null | undefined;
      return (
        <div
          className="max-w-xs truncate font-medium"
          title={name || undefined}
        >
          {name || "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null | undefined;
      const { label, variant } = getStatusInfo(status);
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: "metatype",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const metatype = row.getValue("metatype") as string | null | undefined;
      const badgeProps = getMetatypeBadgeProps(metatype);
      return (
        <Badge
          variant={badgeProps.variant}
          className={`whitespace-nowrap ${badgeProps.className}`}
        >
          {getMetatypeLabel(metatype)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDate(row.getValue("start_date")),
  },
  {
    accessorKey: "end_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          End Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDate(row.getValue("end_date")),
  },
  {
    accessorKey: "content",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reason
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const content = row.getValue("content") as string | null | undefined;
      const formattedContent = formatContent(content);
      return (
        <div
          className="max-w-md text-sm leading-relaxed"
          title={content || undefined}
        >
          <div className="line-clamp-2 wrap-break-word whitespace-pre-wrap">
            {formattedContent}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const timeoff = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label="Open actions menu"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(String(timeoff.id || ""))
              }
            >
              Copy timeoff ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit timeoff</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface TimeoffDataTableProps {
  data: TimeoffItem[];
}

export function TimeoffDataTable({ data }: TimeoffDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by status..."
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("status")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
          aria-label="Filter timeoff by status"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto"
              aria-label="Toggle column visibility"
            >
              Columns{" "}
              <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
