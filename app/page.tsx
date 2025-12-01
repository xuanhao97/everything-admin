import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">Everything Admin</h1>
      <div className="space-y-2">
        <p className="text-muted-foreground">Webhook endpoint: /api/webhook</p>
        <Link
          href="/admin"
          className="text-primary hover:underline inline-block"
        >
          View Timeoff List →
        </Link>
      </div>
    </main>
  );
}
