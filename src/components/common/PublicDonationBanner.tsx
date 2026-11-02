import React, { useState, useEffect } from 'react';
import { HeartHandshake, QrCode } from 'lucide-react';

export const PublicDonationBanner: React.FC = () => {
  const [donation, setDonation] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/donations')
      .then((res) => res.json())
      .then((data) => {
        if (data.donation && data.donation.enabled) {
          setDonation(data.donation);
        }
      })
      .catch(() => {});
  }, []);

  if (!donation || !donation.enabled) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 sm:px-8 my-14 select-none">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0c0c0e] via-[#121216] to-[#0c0c0e] border border-white/15 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Authentic QR container */}
          {donation.qrCodeImageUrl && (
            <div className="w-[140px] h-[140px] rounded-2xl bg-white p-2.5 flex items-center justify-center flex-shrink-0 shadow-xl border border-black/10">
              <img
                src={donation.qrCodeImageUrl}
                alt="Payment QR"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Message Content */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/30 text-[#fbbf24] text-[11px] font-bold uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Voluntary Community Support</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-black text-white leading-tight">
              {donation.title || 'Support MIRAI'}
            </h3>
            <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-[640px] leading-relaxed">
              {donation.message || 'Help keep streaming free, fast, and high quality for anime & manga fans.'}
            </p>

            {donation.upiId && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
                <span>UPI ID:</span>
                <strong className="text-white">{donation.upiId}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
