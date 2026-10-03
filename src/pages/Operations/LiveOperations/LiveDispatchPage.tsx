import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  getActiveAreas,
  getVendorLiveTrack,
  ActiveAreaItem,
  VendorLiveTrackItem,
  VendorLiveTrackArea,
} from '../../../services/api';
import {
  LiveOperationsMap,
  EnrichedVendorLiveTrackItem,
  LiveAreaDetails,
} from '../../../components/operations/LiveOperationsMap';
import {
  Radio,
  Users,
  UserX,
  Compass,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Filter,
  Eye,
  X,
  ShieldCheck,
  ChevronDown,
  Navigation,
  Check,
} from 'lucide-react';

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the standard Haversine formula (returned in meters).
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance in meters or kilometers
 * Below 1000m -> meters (e.g. 320 m)
 * 1000m or above -> kilometers (e.g. 1.25 km)
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats ISO timestamp to human-friendly format
 */
function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Returns human-readable relative time (e.g., '2m ago')
 */
function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

type FilterType = 'ALL' | 'ONLINE' | 'OFFLINE' | 'INSIDE' | 'OUTSIDE';

export const LiveDispatchPage: React.FC = () => {
  const { accessibleAreas, hasAllAreaAccess } = useAuth();

  // Area selector state
  const [activeAreas, setActiveAreas] = useState<ActiveAreaItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [loadingAreas, setLoadingAreas] = useState<boolean>(true);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState<boolean>(false);
  const [areaSearch, setAreaSearch] = useState<string>('');
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  // Close Area Dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAreaDropdownOpen) {
        setIsAreaDropdownOpen(false);
      }
    };
    if (isAreaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAreaDropdownOpen]);

  // Dynamic area options based on login permissions
  const availableAreaOptions = useMemo(() => {
    if (hasAllAreaAccess) {
      if (activeAreas.length > 0) {
        return activeAreas.map((a) => a.areaName);
      }
      return accessibleAreas.length > 0 ? accessibleAreas : [];
    }
    return accessibleAreas;
  }, [hasAllAreaAccess, activeAreas, accessibleAreas]);

  // Filtered area options for dropdown search
  const filteredAreaOptions = useMemo(() => {
    if (!areaSearch.trim()) return availableAreaOptions;
    const query = areaSearch.toLowerCase().trim();
    return availableAreaOptions.filter((a) => a.toLowerCase().includes(query));
  }, [availableAreaOptions, areaSearch]);

  // Live Tracking state (Requirement 2 & 3: Process ALL returned areas)
  const [rawArea, setRawArea] = useState<VendorLiveTrackArea | null>(null);
  const [rawAreas, setRawAreas] = useState<VendorLiveTrackArea[]>([]);
  const [rawVendors, setRawVendors] = useState<VendorLiveTrackItem[]>([]);
  const [loadingTracking, setLoadingTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  // Filters & selection
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedWorkerId, setFocusedWorkerId] = useState<string | null>(null);
  const [drawerWorker, setDrawerWorker] = useState<EnrichedVendorLiveTrackItem | null>(null);

  // 1. Fetch Active Operating Areas only if user has all area access or to get metadata
  useEffect(() => {
    let isMounted = true;
    const loadAreas = async () => {
      setLoadingAreas(true);
      try {
        const res = await getActiveAreas(1, 50);
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setActiveAreas(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load active areas:', err);
      } finally {
        if (isMounted) setLoadingAreas(false);
      }
    };

    loadAreas();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync selected area when available options are ready
  useEffect(() => {
    if (availableAreaOptions.length > 0) {
      if (!selectedArea || !availableAreaOptions.includes(selectedArea)) {
        const preferred = availableAreaOptions.find(
          (a) => a.toLowerCase() === 'neo_town'
        );
        setSelectedArea(preferred || availableAreaOptions[0]);
      }
    }
  }, [availableAreaOptions, selectedArea]);

  // 2. Fetch Live Tracking Data for Selected Area (Processes ALL returned areas)
  const fetchLiveTrack = useCallback(async (areaName: string) => {
    if (!areaName) return;
    setLoadingTracking(true);
    setError(null);

    try {
      const res = await getVendorLiveTrack(areaName);
      if (res.success && res.data) {
        // Dynamic areas array extraction (Requirement 2 & 13)
        const returnedAreas = Array.isArray(res.data.areas) && res.data.areas.length > 0
          ? res.data.areas
          : (res.data.area ? [res.data.area] : []);

        setRawAreas(returnedAreas);
        setRawArea(res.data.area || returnedAreas[0] || null);
        setRawVendors(res.data.vendors || []);
        setLastSyncedTime(new Date());
      } else {
        setError(res.error || 'Failed to fetch real-time worker tracking.');
      }
    } catch (err: any) {
      console.error('Error fetching live track:', err);
      setError(err?.message || 'Network error while retrieving operations data.');
    } finally {
      setLoadingTracking(false);
    }
  }, []);

  useEffect(() => {
    if (selectedArea) {
      fetchLiveTrack(selectedArea);
    }
  }, [selectedArea, fetchLiveTrack]);

  // 3. Enrich Vendors with Haversine distance and Inside/Outside coverage for THEIR SPECIFIC area (Requirement 8)
  const enrichedWorkers = useMemo<EnrichedVendorLiveTrackItem[]>(() => {
    if (!rawVendors || rawVendors.length === 0) return [];

    return rawVendors.map((vendor) => {
      // Step 1: Identify the specific area that contains this worker (Requirement 8)
      let targetArea: VendorLiveTrackArea | undefined;

      if (rawAreas.length > 0) {
        if (vendor.areaName) {
          targetArea = rawAreas.find(
            (a) => a.areaName.toLowerCase() === vendor.areaName.toLowerCase()
          );
        }
        if (!targetArea && vendor.currentArea) {
          targetArea = rawAreas.find(
            (a) => a.areaName.toLowerCase() === vendor.currentArea.toLowerCase()
          );
        }
        if (!targetArea && (vendor as any).areaLat !== undefined && (vendor as any).areaLng !== undefined) {
          targetArea = rawAreas.find(
            (a) => a.latitude === (vendor as any).areaLat && a.longitude === (vendor as any).areaLng
          );
        }
        if (!targetArea && !isNaN(vendor.latitude) && !isNaN(vendor.longitude)) {
          let minD = Infinity;
          for (const a of rawAreas) {
            if (!isNaN(a.latitude) && !isNaN(a.longitude)) {
              const d = calculateHaversineDistance(a.latitude, a.longitude, vendor.latitude, vendor.longitude);
              if (d < minD) {
                minD = d;
                targetArea = a;
              }
            }
          }
        }
        if (!targetArea) {
          targetArea = rawAreas[0];
        }
      } else if (rawArea) {
        targetArea = rawArea;
      }

      // Step 2 & 3: Use THAT area's center and coverageRadius
      const areaLat = targetArea?.latitude;
      const areaLng = targetArea?.longitude;
      const radius = targetArea?.coverageRadius ?? 900;
      const matchedAreaName = targetArea?.areaName || vendor.areaName || vendor.currentArea || selectedArea;

      let distanceMeters = 0;
      let isInsideCoverage = false;

      // Step 4 & 5: Calculate distance from THIS area's center
      if (
        areaLat !== undefined &&
        areaLng !== undefined &&
        vendor.latitude !== undefined &&
        vendor.longitude !== undefined &&
        !isNaN(vendor.latitude) &&
        !isNaN(vendor.longitude)
      ) {
        distanceMeters = calculateHaversineDistance(
          areaLat,
          areaLng,
          vendor.latitude,
          vendor.longitude
        );
        // Step 6: Worker distance from THIS area's center <= THIS area's coverageRadius
        isInsideCoverage = distanceMeters <= radius;
      }

      return {
        vendor: vendor.vendor,
        workerId: vendor.workerId,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        onlineStatus: vendor.onlineStatus,
        currentArea: vendor.currentArea || matchedAreaName,
        areaName: matchedAreaName,
        lastUpdated: vendor.lastUpdated,
        distanceMeters,
        isInsideCoverage,
        coverageRadius: radius,
      };
    });
  }, [rawVendors, rawAreas, rawArea, selectedArea]);

  // 4. Compute Dynamic Summary Metrics across ALL returned areas (Requirement 11)
  const metrics = useMemo(() => {
    const total = enrichedWorkers.length;
    const online = enrichedWorkers.filter((w) => w.onlineStatus).length;
    const offline = total - online;
    const inside = enrichedWorkers.filter((w) => w.isInsideCoverage).length;
    const outside = total - inside;
    const areasCount = rawAreas.length > 0 ? rawAreas.length : (rawArea ? 1 : 0);
    const radius = rawArea?.coverageRadius ?? 900;

    return {
      total,
      online,
      offline,
      inside,
      outside,
      areasCount,
      radius,
      onlinePercent: total > 0 ? Math.round((online / total) * 100) : 0,
      insidePercent: total > 0 ? Math.round((inside / total) * 100) : 0,
    };
  }, [enrichedWorkers, rawAreas, rawArea]);

  // 5. Filter & Search Enriched Workers
  const filteredWorkers = useMemo(() => {
    return enrichedWorkers.filter((worker) => {
      // Filter Type Check
      if (filterType === 'ONLINE' && !worker.onlineStatus) return false;
      if (filterType === 'OFFLINE' && worker.onlineStatus) return false;
      if (filterType === 'INSIDE' && !worker.isInsideCoverage) return false;
      if (filterType === 'OUTSIDE' && worker.isInsideCoverage) return false;

      // Search Query Check
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = worker.vendor.toLowerCase().includes(query);
        const matchesId = worker.workerId.toLowerCase().includes(query);
        const matchesArea = worker.currentArea.toLowerCase().includes(query) || worker.areaName.toLowerCase().includes(query);
        return matchesName || matchesId || matchesArea;
      }

      return true;
    });
  }, [enrichedWorkers, filterType, searchQuery]);

  // Area details payload for the map (Requirement 3: all areas)
  const mapAreaDetails: LiveAreaDetails[] = useMemo(() => {
    if (rawAreas.length > 0) {
      return rawAreas.map((a) => ({
        areaName: a.areaName,
        latitude: a.latitude,
        longitude: a.longitude,
        coverageRadius: a.coverageRadius || 900,
      }));
    }
    if (rawArea) {
      return [
        {
          areaName: rawArea.areaName || selectedArea,
          latitude: rawArea.latitude,
          longitude: rawArea.longitude,
          coverageRadius: rawArea.coverageRadius || 900,
        },
      ];
    }
    return [];
  }, [rawAreas, rawArea, selectedArea]);

  const handleFocusWorkerOnMap = (worker: EnrichedVendorLiveTrackItem) => {
    setFocusedWorkerId(worker.workerId);
    // Smooth scroll back to map if viewed on mobile or lower viewport
    const mapElement = document.getElementById('live-operations-map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* HEADER SECTION                                             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 shadow-soft-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Live Operations
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time geofence tracking, vendor live positions, and operational coverage monitoring.
          </p>
        </div>

        {/* Action Controls: Area Selector Dropdown + Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Active Area Selector */}
          <div className="flex items-center gap-2" ref={areaDropdownRef}>
            <label
              htmlFor="live-area-select"
              className="text-xs font-semibold text-slate-600 whitespace-nowrap"
            >
              Area:
            </label>
            <div className="relative">
              <button
                id="live-area-select"
                type="button"
                disabled={(loadingAreas && availableAreaOptions.length === 0) || loadingTracking || availableAreaOptions.length === 0}
                onClick={() => {
                  setIsAreaDropdownOpen((prev) => !prev);
                  setAreaSearch('');
                }}
                className={`group flex items-center justify-between gap-2.5 h-9 min-w-[190px] sm:min-w-[210px] max-w-[260px] rounded-xl border px-3 text-xs font-bold transition-all shadow-soft-xs cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAreaDropdownOpen
                    ? 'border-[#5B21B6] bg-white ring-2 ring-[#5B21B6]/15 text-[#5B21B6]'
                    : 'border-[#EEEEF2] bg-[#FAF9FC] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isAreaDropdownOpen}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MapPin
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isAreaDropdownOpen ? 'text-[#5B21B6]' : 'text-[#7C3AED] group-hover:text-[#5B21B6]'
                    }`}
                  />
                  <span className="truncate text-left font-bold text-[#1F1F1F]">
                    {loadingAreas && availableAreaOptions.length === 0
                      ? 'Loading operating areas...'
                      : availableAreaOptions.length === 0
                      ? 'No accessible areas'
                      : selectedArea || 'Select Area'}
                  </span>
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${
                    isAreaDropdownOpen ? 'rotate-180 text-[#5B21B6]' : 'group-hover:text-[#1F1F1F]'
                  }`}
                />
              </button>

              {/* Floating Menu Popover */}
              {isAreaDropdownOpen && availableAreaOptions.length > 0 && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-full min-w-[220px] max-w-[320px] rounded-xl border border-[#EEEEF2] bg-white shadow-soft-lg animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  {/* Search filter if more than 5 options */}
                  {availableAreaOptions.length > 5 && (
                    <div className="p-2 border-b border-[#EEEEF2] bg-[#FAF9FC]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                        <input
                          type="text"
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          placeholder="Search operating area..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {/* List of Area Options */}
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5" role="listbox">
                    {filteredAreaOptions.length === 0 ? (
                      <div className="py-3 px-3 text-center text-xs text-[#6B6B6B]">
                        No matching areas found
                      </div>
                    ) : (
                      filteredAreaOptions.map((areaName) => {
                        const isSelected = areaName === selectedArea;
                        return (
                          <button
                            key={areaName}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedArea(areaName);
                              setIsAreaDropdownOpen(false);
                              setAreaSearch('');
                            }}
                            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                                : 'text-[#1F1F1F] hover:bg-[#FAF9FC] hover:text-[#5B21B6] font-medium'
                            }`}
                            title={areaName}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MapPin
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isSelected ? 'text-[#5B21B6]' : 'text-[#6B6B6B]'
                                }`}
                              />
                              <span className="truncate">{areaName}</span>
                            </div>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-[#5B21B6] shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveTrack(selectedArea)}
            disabled={loadingTracking || !selectedArea}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-purple-700 active:scale-95 transition-all cursor-pointer focus:outline-none disabled:opacity-50"
            title="Refresh Real-Time Locations"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingTracking ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {lastSyncedTime && !error && (
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-purple-500" />
            <span>Last synchronized: {lastSyncedTime.toLocaleTimeString()}</span>
          </div>
          <span className="font-medium text-slate-500">
            {metrics.total} workers assigned across {metrics.areasCount > 1 ? `${metrics.areasCount} operating areas` : selectedArea}
          </span>
        </div>
      )}

      {/* Error Alert State (Requirement 21) */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs shadow-soft-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-rose-800 font-medium">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-900">Unable to load live operations data</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchLiveTrack(selectedArea)}
            className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white text-xs hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SUMMARY STATS CARDS (Requirement 15)                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Workers */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Workers</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.total}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">In selected area</p>
        </div>

        {/* Online Workers */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Online</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {metrics.online}
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            {metrics.onlinePercent}% active now
          </p>
        </div>

        {/* Offline Workers */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Offline</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-600">
              {metrics.offline}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">Inactive or away</p>
        </div>

        {/* Inside Coverage */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Inside Coverage</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {metrics.inside}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            &le; {metrics.radius}m boundary
          </p>
        </div>

        {/* Outside Coverage */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Outside Coverage</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600">
              {metrics.outside}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-semibold truncate">
            &gt; {metrics.radius}m boundary
          </p>
        </div>

        {/* Coverage Radius / Operating Areas (Requirement 11) */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 shadow-soft-sm border border-purple-200 bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold">
              {metrics.areasCount > 1 ? 'Total Areas' : 'Coverage Radius'}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-purple-900">
              {metrics.areasCount > 1 ? metrics.areasCount : metrics.radius}
            </span>
            <span className="text-xs font-bold text-purple-700">
              {metrics.areasCount > 1 ? (metrics.areasCount === 1 ? 'Area' : 'Areas') : 'meters'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700 font-medium truncate">
            {metrics.areasCount > 1
              ? `${rawAreas.map((a) => a.areaName).join(', ')}`
              : 'Geofence boundary'}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE LIVE MAP SECTION (Requirements 3, 4, 5, 9, 10)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div id="live-operations-map-section" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Live Operations Map
            </h2>
            <span className="text-xs text-slate-400">
              ({enrichedWorkers.length} live pins across {metrics.areasCount} {metrics.areasCount === 1 ? 'area' : 'areas'})
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any worker or area center marker to view real-time diagnostics
          </span>
        </div>

        <LiveOperationsMap
          areas={mapAreaDetails}
          area={mapAreaDetails[0] || null}
          workers={filteredWorkers}
          selectedWorkerId={focusedWorkerId}
          onSelectWorker={(worker) => setDrawerWorker(worker)}
          isLoading={loadingTracking}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* WORKER DETAILS TABLE & FILTERS (Requirements 14 & 16)       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-soft-sm border border-slate-200/80 overflow-hidden">
        {/* Table Filter & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Worker Operational Telemetry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live distance metrics computed dynamically from area center via Haversine geodetic calculation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search worker or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-white text-purple-700 shadow-soft-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ONLINE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'ONLINE'
                    ? 'bg-white text-emerald-700 shadow-soft-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Online ({metrics.online})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('OFFLINE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'OFFLINE'
                    ? 'bg-white text-slate-800 shadow-soft-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Offline ({metrics.offline})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('INSIDE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'INSIDE'
                    ? 'bg-white text-emerald-700 shadow-soft-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inside ({metrics.inside})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('OUTSIDE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'OUTSIDE'
                    ? 'bg-white text-amber-700 shadow-soft-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Outside ({metrics.outside})
              </button>
            </div>
          </div>
        </div>

        {/* Empty State (Requirement 20) */}
        {!loadingTracking && filteredWorkers.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              No workers found in this operational area
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery || filterType !== 'ALL'
                ? 'Try adjusting your search criteria or active filter filters to view workers.'
                : `Currently no active vendor assignments registered for ${selectedArea}. The map continues displaying the area center and coverage radius.`}
            </p>
            {(searchQuery || filterType !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                }}
                className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Worker Table (Desktop / Tablet) */}
        {filteredWorkers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3">
                    Worker
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Worker ID
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Coverage Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Distance to Center
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Current Area
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Last Updated
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredWorkers.map((worker) => {
                  const isOnline = worker.onlineStatus;
                  const isInside = worker.isInsideCoverage;

                  return (
                    <tr
                      key={worker.workerId}
                      className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                      onClick={() => setDrawerWorker(worker)}
                    >
                      {/* Worker Name & Avatar */}
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs shrink-0 shadow-soft-xs">
                            {worker.vendor.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 truncate">
                              {worker.vendor}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {worker.latitude.toFixed(4)}, {worker.longitude.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Worker ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          {worker.workerId}
                        </span>
                      </td>

                      {/* Online / Offline Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOnline
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>

                      {/* Coverage Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isInside
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          {isInside ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 stroke-[2.5]" />
                          )}
                          <span>
                            {isInside ? 'Inside Coverage' : 'Outside Coverage'}
                          </span>
                        </span>
                      </td>

                      {/* Distance */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {formatDistance(worker.distanceMeters)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isInside
                              ? `${worker.coverageRadius - worker.distanceMeters}m inside limit`
                              : `${worker.distanceMeters - worker.coverageRadius}m beyond zone`}
                          </span>
                        </div>
                      </td>

                      {/* Area (Requirement 12: Include corresponding area name) */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <MapPin className="h-3 w-3 text-purple-500 shrink-0" />
                          <span>{worker.areaName || worker.currentArea || 'N/A'}</span>
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        <div className="flex flex-col">
                          <span>{formatTime(worker.lastUpdated)}</span>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(worker.lastUpdated)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 sm:px-6 py-3 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFocusWorkerOnMap(worker)}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-soft-xs cursor-pointer"
                            title="Locate and zoom on map"
                          >
                            <Navigation className="h-3 w-3" />
                            <span>Locate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDrawerWorker(worker)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="View diagnostics"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* WORKER DETAIL DRAWER / POPUP MODAL (Requirement 13)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {drawerWorker && (
        <div
          role="presentation"
          onClick={() => setDrawerWorker(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-purple-100 overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-base shadow-sm">
                  {drawerWorker.vendor.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 id="worker-modal-title" className="text-base font-bold text-slate-900">
                    {drawerWorker.vendor}
                  </h3>
                  <span className="font-mono text-xs bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {drawerWorker.workerId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerWorker(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer focus:outline-none"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Detailed Diagnostics */}
            <div className="p-6 space-y-4 text-xs">
              {/* Status & Coverage Quick Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/50 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Connection Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        drawerWorker.onlineStatus
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                    <strong className="text-sm font-bold text-slate-900">
                      {drawerWorker.onlineStatus ? 'Online & Available' : 'Offline'}
                    </strong>
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-3 flex flex-col gap-1 ${
                    drawerWorker.isInsideCoverage
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Area Geofence
                  </span>
                  <div className="flex items-center gap-1.5">
                    {drawerWorker.isInsideCoverage ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <strong
                      className={`text-sm font-bold ${
                        drawerWorker.isInsideCoverage
                          ? 'text-emerald-800'
                          : 'text-amber-800'
                      }`}
                    >
                      {drawerWorker.isInsideCoverage
                        ? 'Inside Coverage'
                        : 'Outside Coverage'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Haversine Geodetic Computation Details */}
              <div className="rounded-xl bg-purple-50/50 p-4 border border-purple-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-900">
                    Distance to Area Center:
                  </span>
                  <span className="font-black text-base text-purple-700">
                    {formatDistance(drawerWorker.distanceMeters)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Assigned Operating Area:</span>
                  <strong className="text-slate-900">{drawerWorker.areaName || drawerWorker.currentArea}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Geofence Boundary Limit:</span>
                  <strong className="text-slate-900">
                    {drawerWorker.coverageRadius || 900} meters
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delta from Radius:</span>
                  <strong
                    className={
                      drawerWorker.isInsideCoverage
                        ? 'text-emerald-600 font-bold'
                        : 'text-amber-600 font-bold'
                    }
                  >
                    {drawerWorker.isInsideCoverage
                      ? `${(drawerWorker.coverageRadius || 900) - drawerWorker.distanceMeters}m safe buffer`
                      : `${drawerWorker.distanceMeters - (drawerWorker.coverageRadius || 900)}m outside zone`}
                  </strong>
                </div>
              </div>

              {/* Coordinates & Telemetry Timestamps */}
              <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Worker GPS Latitude:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {drawerWorker.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Worker GPS Longitude:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {drawerWorker.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Last Location Ping:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(drawerWorker.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDrawerWorker(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrawerWorker(null);
                  handleFocusWorkerOnMap(drawerWorker);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Locate on Live Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDispatchPage;
