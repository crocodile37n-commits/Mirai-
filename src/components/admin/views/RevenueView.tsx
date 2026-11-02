import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  HeartHandshake,
  Megaphone,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const RevenueView: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getRevenue().then((res) => {
      setRevenueData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  const adsEnabled = revenueData?.adsEnabled;
  const confirmedDonation = revenueData?.confirmedDonationRevenue || 0;
  const estimatedAdRevenue = revenueData?.estimatedAdRevenue || 0;

  return (
    <div className="space-y-6 select-none max-w-[1000px]">
      <div className="pb-4 border-b border-white/10">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#22c55e]" />
          <span>Revenue &amp; Earnings Overview</span>
        </h2>
        <p className="text-xs text-white/50 mt-0.5">
          Audited breakdown distinguishing verified donations from estimated ad revenues.
        </p>
      </div>

      {/* Verified vs Estimated Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confirmed Donations */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#fbbf24]" />
              <span>Confirmed Voluntary Donations</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              Verified
            </span>
          </div>

          <div className="font-heading text-3xl font-extrabold text-white">
            ₹{confirmedDonation.toLocaleString()}
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            Direct voluntary community contributions. Verified via payment gateway or manual reconciliation.
          </p>
        </div>

        {/* Estimated Ad Revenue */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between text-white/60">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#8b5cf6]" />
              <span>Advertising Network Revenue</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                adsEnabled
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {adsEnabled ? 'Active' : 'Disabled by Default'}
            </span>
          </div>

          <div className="font-heading text-3xl font-extrabold text-white">
            ₹{estimatedAdRevenue.toLocaleString()}
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            {adsEnabled
              ? 'Estimated ad earnings from active campaigns.'
              : 'Zero revenue generated because all advertisements are completely disabled as requested.'}
          </p>
        </div>
      </div>

      {/* Gateway Integration Notice */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fbbf24] mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white text-sm">Payment Gateway &amp; Ad Network Status</h4>
            <p className="text-white/60 leading-relaxed max-w-[680px]">
              {revenueData?.notice ||
                'To maintain truthful accounting, revenue is reported as ₹0 until legitimate payment gateway webhooks (such as Razorpay/Stripe) or authentic ad network credentials (such as Google AdSense) are connected by the site owner.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
