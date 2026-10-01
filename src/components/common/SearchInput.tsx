import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by ID, name, area...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="pointer-events-none absolute left-2.5 sm:left-3.5 h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#6B6B6B]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] py-2 sm:py-2.5 pl-8 sm:pl-10 pr-7 sm:pr-9 text-xs text-[#1F1F1F] placeholder-[#9CA3AF] transition-all focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-[#9CA3AF] hover:text-[#1F1F1F] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
