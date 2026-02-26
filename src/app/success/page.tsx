import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center 
      justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl text-brand-cream mb-4">
          Payment Coming Soon
        </h1>
        <p className="text-brand-muted mb-8">
          Payment gateway is being configured. 
          Use your beta access code to unlock tools.
        </p>
        <Link href="/formatter" 
          className="bg-brand-gold text-brand-bg font-bold 
          px-6 py-3 rounded-lg">
          Back to Tools
        </Link>
      </div>
    </div>
  );
}
