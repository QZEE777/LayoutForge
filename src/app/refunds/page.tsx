import Link from "next/link";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-4">Refund Policy</h1>
        <p className="text-soft-muted">
          How refunds work for paid tools and bundles. Content coming soon.
        </p>
      </div>
    </div>
  );
}
