import React from 'react';
import { PackageOpen, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = PackageOpen,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE9FE] text-[#5B21B6]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#1F1F1F]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-[#6B6B6B]">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all hover:bg-[#4C1D95] active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
