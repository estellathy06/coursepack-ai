"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function PricingCancelPage() {
  const router = useRouter();

  // Redirect to home page pricing section after a small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/#pricing");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-slate-50 px-4 font-sans text-slate-650 antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xl shadow-slate-100 space-y-5">
        
        <div className="mx-auto w-12 h-12 bg-amber-55 border border-amber-100 text-amber-500 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-800">
            Payment Cancelled
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Your transaction was not completed. No charges were made to your account.
          </p>
        </div>

        <p className="text-[10px] text-slate-400">
          Redirecting you back to the pricing plans...
        </p>

        <a
          href="/#pricing"
          className="w-full py-2.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200/50 hover:border-slate-350 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return Immediately
        </a>
      </div>
    </div>
  );
}
