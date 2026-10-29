import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { ChefHat, Layers, TrendingUp, ShieldCheck } from 'lucide-react';

const stats = [
  { id: 'stat-locations', value: '4', label: 'Restaurant Locations' },
  { id: 'stat-items', value: '107', label: 'Menu Items Tracked' },
  { id: 'stat-batches', value: '1,240+', label: 'Batches Traced' },
  { id: 'stat-compliance', value: '100%', label: 'FEFO Compliance' },
];

const features = [
  { id: 'feat-kitchen', icon: <ChefHat size={16} />, text: 'Central kitchen to restaurant traceability' },
  { id: 'feat-fefo', icon: <Layers size={16} />, text: 'FEFO batch allocation & expiry management' },
  { id: 'feat-costing', icon: <TrendingUp size={16} />, text: 'Real-time recipe costing & food cost %' },
  { id: 'feat-audit', icon: <ShieldCheck size={16} />, text: 'Immutable stock ledger & full audit trail' },
];

export default function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-2/5 xl:w-1/2 p-10 xl:p-14 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1C0F0E 0%, #3A1410 50%, #1C0F0E 100%)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 rounded-full opacity-10"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 rounded-full opacity-10"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Top */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <AppLogo size={44} />
          <div>
            <div className="font-bold text-white" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
              Samko
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
              KITCHENS · OPERATIONS
            </div>
          </div>
        </div>

        <h1
          className="font-bold text-white leading-tight"
          style={{ fontSize: 32, letterSpacing: '-0.02em', maxWidth: 380 }}
        >
          Complete visibility from{' '}
          <span style={{ color: 'var(--secondary)' }}>kitchen to customer</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 16, lineHeight: 1.6, maxWidth: 360 }}>
          End-to-end food costing, inventory traceability and EPOS consumption tracking
          across all Samko Kitchens locations.
        </p>

        {/* Features */}
        <div className="mt-8 space-y-3">
          {features?.map((f) => (
            <div key={f?.id} className="flex items-center gap-3">
              <div
                className="shrink-0 rounded-md flex items-center justify-center"
                style={{ width: 30, height: 30, background: 'rgba(249,178,51,0.15)', color: 'var(--secondary)' }}
              >
                {f?.icon}
              </div>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)' }}>{f?.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10">
        <div
          className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            {stats?.map((s) => (
              <div key={s?.id}>
                <div
                  className="font-bold tabular-nums"
                  style={{ fontSize: 24, color: 'var(--secondary)', letterSpacing: '-0.02em' }}
                >
                  {s?.value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {s?.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' }}>
          © 2026 Samko Kitchens OPS · All data encrypted · GDPR compliant
        </p>
      </div>
    </div>
  );
}