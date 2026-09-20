import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PaymentVerification from "./PaymentVerification";

interface PaymentCallbackPageProps {
  searchParams: Promise<{
    reference?: string;
  }>;
}

export default async function PaymentCallbackPage({
  searchParams,
}: PaymentCallbackPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const reference = params.reference;

  if (!reference) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Payment Reference Missing
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            We could not find a payment reference for this transaction.
          </p>

          <Link
            href="/subscription"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Subscription
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <PaymentVerification reference={reference} />
    </main>
  );
}