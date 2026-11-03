import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Maximize2, 
  X, 
  MapPin, 
  Clock, 
  CreditCard, 
  UserCheck, 
  ShieldCheck, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  User
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDurationInHours } from '../../services/bookingService';

interface DynamicKeyValueRendererProps {
  data: Record<string, any>;
  className?: string;
  excludeAlreadyDisplayed?: boolean;
  customExcludeKeys?: string[];
}

/**
 * Default list of keys that are already displayed in the top Booking Overview,
 * Assigned Expert card, and Dispatch & Fulfillment Timeline cards.
 * We normalize and filter these out so only new/additional API fields are shown.
 */
const DEFAULT_ALREADY_DISPLAYED_KEYS = new Set([
  'tableid',
  'bookingid',
  'id',
  'bookingstatus',
  'status',
  'service',
  'priority',
  'bookingtype',
  'customername',
  'customerphone',
  'phone',
  'address',
  'serviceaddress',
  'areaname',
  'areaid',
  'notes',
  'customernotes',
  'date',
  'starttime',
  'duration',
  'durationminutes',
  'totalamount',
  'amount',
  'paymentstatus',
  'slatimer',
  'slaalert',
  'vendorname',
  'vendorid',
  'vendorphoto',
  'createdtime',
  'requestedtime',
  'assignedtime',
  'startedtime',
  'completedtime',
  'createdat',
  'updatedat',
  'timeline',
  'rawmessage',
  // Excluded per user request: dont show these fields (Payment breakdown, Service buffer, Customer additional)
  'paymentmethod',
  'surgeamount',
  'platformfee',
  'baseprice',
  'tips',
  'extendedamount',
  'refundstatus',
  'coupon',
  'walletusage',
  'paymentid',
  'extendedpaymentid',
  'extendedduration',
  'bufferminutes',
  'customeremail',
  'email',
]);

/**
 * Converts camelCase, PascalCase, or snake_case field keys to title-cased labels
 * with proper capitalization for acronyms (ID, SLA, OTP, GPS, etc.).
 */
export const formatFieldLabel = (key: string): string => {
  if (!key) return '';

  const knownMap: Record<string, string> = {
    paymentid: 'Payment ID',
    paymentId: 'Payment ID',
    extendedpaymentid: 'Extended Payment ID',
    extendedpaymentId: 'Extended Payment ID',
    extendedPaymentId: 'Extended Payment ID',
    passid: 'Pass ID',
    passId: 'Pass ID',
    passbooking: 'Pass Booking',
    passBooking: 'Pass Booking',
    otp: 'OTP',
    jobcompletedby: 'Job Completed By',
    jobCompletedBy: 'Job Completed By',
    visitphoto: 'Visit Photo',
    visitPhoto: 'Visit Photo',
    workeravailableafter: 'Worker Available After',
    workerAvailableAfter: 'Worker Available After',
    baseprice: 'Base Price',
    basePrice: 'Base Price',
    surgeamount: 'Surge Amount',
    surgeAmount: 'Surge Amount',
    platformfee: 'Platform Fee',
    platformFee: 'Platform Fee',
    walletusage: 'Wallet Usage',
    walletUsage: 'Wallet Usage',
    extendedamount: 'Extended Amount',
    extendedAmount: 'Extended Amount',
    extendedduration: 'Extended Duration',
    extendedDuration: 'Extended Duration',
    bufferminutes: 'Buffer Minutes',
    bufferMinutes: 'Buffer Minutes',
    refundstatus: 'Refund Status',
    refundStatus: 'Refund Status',
    customeremail: 'Customer Email',
    customerEmail: 'Customer Email',
    assignmentstatus: 'Assignment Status',
    assignmentStatus: 'Assignment Status',
    assignmenttype: 'Assignment Type',
    assignmentType: 'Assignment Type',
  };

  if (knownMap[key]) {
    return knownMap[key];
  }

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ');

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'id') return 'ID';
      if (lower === 'otp') return 'OTP';
      if (lower === 'sla') return 'SLA';
      if (lower === 'url') return 'URL';
      if (lower === 'gps') return 'GPS';
      if (lower === 'api') return 'API';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

export const isImageUrl = (key: string, val: any): boolean => {
  if (typeof val !== 'string') return false;
  const str = val.trim();
  if (!str.startsWith('http://') && !str.startsWith('https://')) return false;
  if (/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i.test(str)) return true;
  if (/photo|image|avatar|pic|picture/i.test(key)) return true;
  if (/wixstatic\.com|cloudinary\.com|images\.unsplash\.com/i.test(str)) return true;
  return false;
};

export const isDateOrTimestamp = (key: string, val: any): boolean => {
  if (val === null || val === undefined || val === '') return false;
  const keyLower = key.toLowerCase();
  if (keyLower === 'slatimer' || keyLower === 'timer') return false;

  const matchesKey = /^(createdtime|requestedtime|assignedtime|startedtime|completedtime|createdat|updatedat|date|datetime|time|timestamp)$/i.test(key) ||
    /time$/i.test(key) ||
    /date$/i.test(key);

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return true;
    if (matchesKey && !isNaN(Date.parse(trimmed)) && !/^\d+$/.test(trimmed)) return true;
    if (matchesKey && /^\d{13}$/.test(trimmed)) return true;
  } else if (typeof val === 'number') {
    if (matchesKey && val > 1000000000000) return true;
  }

  return false;
};

export const formatDateValue = (val: any): string => {
  try {
    let d: Date;
    if (typeof val === 'number') {
      d = new Date(val);
    } else {
      const trimmed = String(val).trim();
      if (/^\d{13}$/.test(trimmed)) {
        d = new Date(parseInt(trimmed, 10));
      } else {
        d = new Date(trimmed);
      }
    }

    if (isNaN(d.getTime())) return String(val);

    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return String(val);
  }
};

export const isCurrencyKey = (key: string): boolean => {
  return /amount|price|baseprice|surgeamount|platformfee|tips|walletusage|extendedamount|fee|refundamount/i.test(key);
};

export const isDurationKey = (key: string): boolean => {
  return /^(duration|bufferminutes|extendedduration)$/i.test(key);
};

interface CategoryDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  matcher: (key: string) => boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'payment',
    title: 'Payment & Billing Breakdown',
    icon: <CreditCard className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /payment|basePrice|surgeAmount|platformFee|tips|walletUsage|refundStatus|coupon|amount|price|fee|cost/i.test(k),
  },
  {
    id: 'service',
    title: 'Service & Buffer Specifications',
    icon: <Clock className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /duration|bufferMinutes|extendedDuration|extendedAmount|slot/i.test(k),
  },
  {
    id: 'vendor',
    title: 'Dispatch & Assignment Details',
    icon: <UserCheck className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /vendor|worker|expert|assignmentStatus|assignmentType|jobCompletedBy|workerAvailableAfter/i.test(k),
  },
  {
    id: 'quality',
    title: 'Verification, Quality & Codes',
    icon: <ShieldCheck className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /rating|review|otp|visitPhoto|slaTimer|slaAlert|sla/i.test(k),
  },
  {
    id: 'pass',
    title: 'Pass & Subscription Details',
    icon: <FileText className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /pass/i.test(k),
  },
  {
    id: 'customer',
    title: 'Customer Details (Additional)',
    icon: <User className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /customer|email/i.test(k),
  },
  {
    id: 'location',
    title: 'Location Coordinates',
    icon: <MapPin className="h-4 w-4 text-[#1B2E79]" />,
    matcher: (k) => /latitude|longitude|lat|lng|pincode|postalCode|landmark/i.test(k),
  },
];

export const DynamicKeyValueRenderer: React.FC<DynamicKeyValueRendererProps> = ({
  data,
  className = '',
  excludeAlreadyDisplayed = true,
  customExcludeKeys = [],
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; label: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter out keys that are already displayed in the top cards
  const displayableKeys = useMemo(() => {
    if (!data || typeof data !== 'object') return [];

    const excluded = new Set<string>();
    if (excludeAlreadyDisplayed) {
      DEFAULT_ALREADY_DISPLAYED_KEYS.forEach((k) => excluded.add(k));
    }
    customExcludeKeys.forEach((k) => excluded.add(k.toLowerCase().trim()));

    return Object.keys(data).filter((k) => !excluded.has(k.toLowerCase().trim()));
  }, [data, excludeAlreadyDisplayed, customExcludeKeys]);

  // Group remaining keys into defined categories
  const categorizedSections = useMemo(() => {
    if (!displayableKeys.length) return [];

    const assigned = new Set<string>();
    const sections: {
      id: string;
      title: string;
      icon: React.ReactNode;
      keys: string[];
    }[] = [];

    CATEGORIES.forEach((cat) => {
      const matched = displayableKeys.filter((k) => !assigned.has(k) && cat.matcher(k));
      if (matched.length > 0) {
        sections.push({
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          keys: matched,
        });
        matched.forEach((k) => assigned.add(k));
      }
    });

    // Any remaining unexpected/novel fields go to Additional API Fields
    const unassigned = displayableKeys.filter((k) => !assigned.has(k));
    if (unassigned.length > 0) {
      sections.push({
        id: 'additional',
        title: 'Additional Order Attributes',
        icon: <Layers className="h-4 w-4 text-[#1B2E79]" />,
        keys: unassigned,
      });
    }

    return sections;
  }, [displayableKeys]);

  const renderFieldValue = (key: string, value: any) => {
    // 1. Null / Empty
    if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
      return <span className="text-[#9CA3AF] font-mono select-none">—</span>;
    }

    // 2. Boolean
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      const isTrue = value === true || value === 'true';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            isTrue
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {isTrue ? 'Yes' : 'No'}
        </span>
      );
    }

    // 3. Image URL
    if (isImageUrl(key, value)) {
      const label = formatFieldLabel(key);
      return (
        <div className="flex items-center gap-2.5 mt-1">
          <div
            onClick={() => setSelectedImage({ url: value, label })}
            className="group relative h-12 w-12 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] overflow-hidden cursor-pointer shadow-soft-sm hover:ring-2 hover:ring-[#1B2E79] transition-all shrink-0"
          >
            <img src={value} alt={label} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Maximize2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xs space-y-1">
            <button
              onClick={() => setSelectedImage({ url: value, label })}
              className="font-semibold text-[#1B2E79] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Photo</span>
              <Maximize2 className="h-3 w-3" />
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#6B6B6B] hover:text-[#1B2E79] flex items-center gap-0.5 underline font-mono"
            >
              <span>Direct Link</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      );
    }

    // 4. Other URLs
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1B2E79] hover:underline flex items-center gap-1 font-mono text-xs break-all"
        >
          <span>{value}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }

    // 5. Date / Time
    if (isDateOrTimestamp(key, value)) {
      return (
        <div className="font-mono text-xs font-semibold text-[#1B2E79]">
          {formatDateValue(value)}
        </div>
      );
    }

    // 6. Coordinates (Lat / Lng)
    if (/^(latitude|lat)$/i.test(key)) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#1F1F1F]">{value}°</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF3FF] text-[#1B2E79] font-medium">Latitude</span>
        </div>
      );
    }
    if (/^(longitude|lng)$/i.test(key)) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#1F1F1F]">{value}°</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF3FF] text-[#1B2E79] font-medium">Longitude</span>
        </div>
      );
    }

    // 7. Currency amount
    if (isCurrencyKey(key) && !isNaN(Number(value))) {
      const num = Number(value);
      return (
        <div className="font-mono text-xs font-bold text-[#1B2E79]">
          ₹{num.toLocaleString('en-IN')}
        </div>
      );
    }

    // 8. Duration minutes
    if (isDurationKey(key) && !isNaN(Number(value))) {
      const mins = Number(value);
      const hoursStr = formatDurationInHours(mins);
      return (
        <div className="text-xs font-semibold text-[#1F1F1F]">
          {mins} mins {hoursStr !== '—' && <span className="text-[#6B6B6B] font-normal">({hoursStr})</span>}
        </div>
      );
    }

    // 9. OTP
    if (/^otp$/i.test(key)) {
      return (
        <span className="font-mono font-bold tracking-widest text-xs text-[#1B2E79] bg-[#EEF3FF] px-2.5 py-1 rounded-lg border border-[#C4D9FD] inline-block shadow-soft-sm">
          {value}
        </span>
      );
    }

    // 10. Rating
    if (/^rating$/i.test(key) && !isNaN(Number(value))) {
      return (
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          ⭐ {value} / 5
        </span>
      );
    }

    // 11. Status fields
    if (/status$/i.test(key) && typeof value === 'string') {
      return <StatusBadge status={value} size="sm" />;
    }

    // 12. IDs and Long Tokens (with copy button)
    if (/id$/i.test(key) && typeof value === 'string' && value.length > 5) {
      const isCopied = copiedKey === key;
      return (
        <div className="inline-flex items-center gap-1.5 max-w-full">
          <span className="font-mono text-xs text-[#1F1F1F] bg-[#FAF9FC] px-2 py-0.5 rounded border border-[#EEEEF2] break-all">
            {value}
          </span>
          <button
            onClick={() => handleCopy(key, value)}
            title="Copy ID"
            className="p-1 rounded text-[#6B6B6B] hover:text-[#1B2E79] hover:bg-[#EEF3FF] transition-colors cursor-pointer shrink-0"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      );
    }

    // 13. Nested Object / Array
    if (typeof value === 'object' && value !== null) {
      return (
        <pre className="font-mono text-[11px] bg-[#FAF9FC] p-2 rounded-lg border border-[#EEEEF2] overflow-x-auto text-[#1F1F1F] max-h-32">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // 14. Plain strings & numbers
    return (
      <div className="text-xs text-[#1F1F1F] font-medium leading-relaxed break-words">
        {String(value)}
      </div>
    );
  };

  // If there are no additional fields to display, don't show anything redundant
  if (!categorizedSections.length) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Categorized Dynamic Sections Grid (No toolbar/search header as requested) */}
      <div className="space-y-4">
        {categorizedSections.map((section) => {
          const isCollapsed = Boolean(collapsedSections[section.id]);
          return (
            <div
              key={section.id}
              className="rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-sm overflow-hidden transition-all"
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between p-4 bg-white hover:bg-[#FAF9FC] cursor-pointer transition-colors border-b border-[#EEEEF2]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#EEF3FF] flex items-center justify-center">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider font-mono">
                      {section.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9FC] border border-[#EEEEF2] text-[#6B6B6B]">
                    {section.keys.length} {section.keys.length === 1 ? 'field' : 'fields'}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-[#6B6B6B]" />
                  )}
                </div>
              </div>

              {/* Section Fields Grid */}
              {!isCollapsed && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.keys.map((key) => {
                    const label = formatFieldLabel(key);
                    const val = data[key];
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-[#F3F3F6] bg-[#FAF9FC]/60 p-3 space-y-1 hover:border-[#C4D9FD] hover:bg-white transition-all"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B6B6B] truncate">
                            {label}
                          </span>
                        </div>
                        <div className="pt-0.5">
                          {renderFieldValue(key, val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEEEF2] bg-[#FAF9FC]">
              <div className="font-bold text-xs text-[#1F1F1F] font-mono uppercase">
                {selectedImage.label}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1B2E79] hover:bg-white border border-[#EEEEF2] text-xs font-semibold flex items-center gap-1 shadow-soft-sm"
                >
                  <span>Open Original</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-white border border-[#EEEEF2] cursor-pointer shadow-soft-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-soft-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
