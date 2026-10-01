import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ArrowLeft, Construction, Sparkles, LayoutDashboard } from 'lucide-react';

interface ModulePlaceholderPageProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  category?: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  title,
  subtitle,
  icon: Icon = Construction,
  category,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F]">
                {title}
              </h1>
              {category && (
                <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                  {category}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-all shadow-soft-sm cursor-pointer"
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-[#5B21B6]" />
          <span>Operations Dashboard</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-8 sm:p-12 text-center shadow-soft-sm space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] shadow-soft-xs">
          <Icon className="h-8 w-8" />
        </div>

        <div className="max-w-md mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-semibold text-[#5B21B6]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Portal Structure Configured</span>
          </div>
          <h2 className="text-lg font-bold text-[#1F1F1F] pt-1">
            {title} Module
          </h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            This section has been assigned in the navigation hierarchy. The operational telemetry and integration services for this module will connect as backend contracts are released.
          </p>
        </div>
      </div>
    </div>
  );
};
