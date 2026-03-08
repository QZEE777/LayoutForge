import Link from "next/link";

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-4">Affiliate Program</h1>
        <p className="text-soft-muted">
          Earn by referring authors to manu2print. Commission structure and sign-up. Content coming soon.
        </p>
      </div>
    </div>
  );
}
