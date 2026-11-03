import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'light' | 'dark';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by ID, name, area...',
  className = '',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`pointer-events-none absolute left-2.5 sm:left-3.5 h-3.5 sm:h-4 w-3.5 sm:w-4 ${
          isDark ? 'text-white' : 'text-[#6B6B6B]'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl py-2 sm:py-2.5 pl-8 sm:pl-10 pr-7 sm:pr-9 text-xs transition-all ${
          isDark
            ? 'border border-white/20 bg-white/10 text-white placeholder-white/70 focus:border-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20'
            : 'border border-[#EEEEF2] bg-[#F7F5FA] text-[#1F1F1F] placeholder-[#9CA3AF] focus:border-[#162766] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162766]/20'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-3 transition-colors ${
            isDark ? 'text-white hover:text-white' : 'text-[#9CA3AF] hover:text-[#1F1F1F]'
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
