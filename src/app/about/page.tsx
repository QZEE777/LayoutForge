import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-4">About</h1>
        <p className="text-soft-muted">
          Who we are and why we built manu2print for indie authors. <Link href="/founders" className="text-brave hover:underline">Founders</Link> — apply to join our program. Content coming soon.
        </p>
      </div>
    </div>
  );
}
