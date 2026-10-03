import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Maximize2,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  User,
  ShieldCheck,
  Activity
} from 'lucide-react';

export interface EnrichedVendorLiveTrackItem {
  vendor: string;
  workerId: string;
  latitude: number;
  longitude: number;
  onlineStatus: boolean;
  currentArea: string;
  areaName: string;
  lastUpdated: string;
  distanceMeters: number;
  isInsideCoverage: boolean;
  coverageRadius: number;
}

export interface LiveAreaDetails {
  areaName: string;
  latitude: number;
  longitude: number;
  coverageRadius: number;
}

interface LiveOperationsMapProps {
  area?: LiveAreaDetails | null;
  areas?: LiveAreaDetails[];
  workers: EnrichedVendorLiveTrackItem[];
  selectedWorkerId?: string | null;
  onSelectWorker?: (worker: EnrichedVendorLiveTrackItem | null) => void;
  isLoading?: boolean;
}

export const LiveOperationsMap: React.FC<LiveOperationsMapProps> = ({
  area,
  areas,
  workers,
  selectedWorkerId,
  onSelectWorker,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const areaLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const workersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const workerMarkerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [activeTileLayer, setActiveTileLayer] = useState<'streets' | 'light'>('streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Normalize areas dynamically from props (Requirement 2 & 3: Works for 0, 1, 3, 5, 20 areas)
  const normalizedAreas: LiveAreaDetails[] = useMemo(() => {
    if (Array.isArray(areas) && areas.length > 0) {
      return areas.filter((a) => a && !isNaN(a.latitude) && !isNaN(a.longitude));
    }
    if (area && !isNaN(area.latitude) && !isNaN(area.longitude)) {
      return [area];
    }
    return [];
  }, [areas, area]);

  // Format distance helper
  const formatDist = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Format relative time helper
  const formatRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: first area or Bangalore fallback
    const initialLat = normalizedAreas[0]?.latitude ?? 12.82057;
    const initialLng = normalizedAreas[0]?.longitude ?? 77.65774;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const streetTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }
    ).addTo(map);

    tileLayerRef.current = streetTiles;

    const areaGroup = L.layerGroup().addTo(map);
    const workersGroup = L.layerGroup().addTo(map);

    areaLayerGroupRef.current = areaGroup;
    workersLayerGroupRef.current = workersGroup;
    mapInstanceRef.current = map;
    setMapReady(true);

    // Watch for size changes (sidebar collapse, window resize)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Tile Layer
  const toggleTileLayer = () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (activeTileLayer === 'streets') {
      const lightTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
      tileLayerRef.current = lightTiles;
      setActiveTileLayer('light');
    } else {
      const streetTiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
      tileLayerRef.current = streetTiles;
      setActiveTileLayer('streets');
    }
  };

  // Helper: Fit all areas and workers in view (Requirement 9: Map should fit ALL areas)
  const fitMapToAllAreasAndWorkers = (animate = true) => {
    if (!mapInstanceRef.current || normalizedAreas.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Include all area centers & coverage circles
    normalizedAreas.forEach((a) => {
      bounds.extend([a.latitude, a.longitude]);
      // Extend bounds to encompass coverage radius so circles are not cut off
      const radiusDeg = (a.coverageRadius / 111320);
      bounds.extend([a.latitude + radiusDeg, a.longitude + radiusDeg]);
      bounds.extend([a.latitude - radiusDeg, a.longitude - radiusDeg]);
    });

    // Include worker coordinates
    workers.forEach((w) => {
      if (w.latitude && w.longitude && !isNaN(w.latitude) && !isNaN(w.longitude)) {
        bounds.extend([w.latitude, w.longitude]);
      }
    });

    if (bounds.isValid()) {
      if (normalizedAreas.length === 1 && workers.length === 0) {
        mapInstanceRef.current.setView([normalizedAreas[0].latitude, normalizedAreas[0].longitude], 15, { animate });
      } else {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate,
        });
      }
    }
  };

  // 3. Render Center Markers and Dynamic Coverage Circles for EVERY Area (Requirement 3, 4, 5)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !areaLayerGroupRef.current) return;

    const areaGroup = areaLayerGroupRef.current;
    areaGroup.clearLayers();

    if (normalizedAreas.length === 0) return;

    normalizedAreas.forEach((areaItem) => {
      const { latitude, longitude, coverageRadius, areaName } = areaItem;

      // 1. Draw dynamic coverage circle for this specific area (Requirement 5)
      const circle = L.circle([latitude, longitude], {
        radius: coverageRadius,
        color: '#7C3AED',
        fillColor: '#8B5CF6',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6',
        interactive: false,
      });
      areaGroup.addLayer(circle);

      // 2. Count workers in this specific area for the popup (Requirement 10)
      const areaWorkers = workers.filter((w) =>
        (w.areaName && w.areaName.toLowerCase() === areaName.toLowerCase()) ||
        (w.currentArea && w.currentArea.toLowerCase() === areaName.toLowerCase())
      );
      const onlineCount = areaWorkers.filter((w) => w.onlineStatus).length;
      const offlineCount = areaWorkers.length - onlineCount;

      // 3. Area Center Marker with pulsing effect and dynamic name label (Requirement 4)
      const areaCenterIcon = L.divIcon({
        className: 'custom-area-center-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <span style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(124, 58, 237, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9999px; background: linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%); border: 2.5px solid #FFFFFF; box-shadow: 0 10px 15px -3px rgba(76, 29, 149, 0.4); color: white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="position: absolute; bottom: -20px; background: #4C1D95; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
              ${areaName}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

      const areaMarker = L.marker([latitude, longitude], { icon: areaCenterIcon });

      // Requirement 10: Clicking an area center shows: Area Name, Coverage Radius, Workers, Online, Offline
      const areaPopupContent = `
        <div style="font-family: inherit; padding: 6px 2px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #F3F4F6; padding-bottom: 6px;">
            <span style="display: flex; width: 10px; height: 10px; border-radius: 9999px; background: #7C3AED;"></span>
            <h4 style="font-size: 14px; font-weight: 700; color: #1F2937; margin: 0;">${areaName}</h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: #4B5563;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Coverage Radius:</span>
              <strong style="color: #6D28D9; font-weight: 700;">${coverageRadius} m</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Total Workers:</span>
              <strong style="color: #111827; font-weight: 700;">${areaWorkers.length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Online Workers:</span>
              <span style="color: #059669; font-weight: 700;">${onlineCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Offline Workers:</span>
              <span style="color: #64748B; font-weight: 600;">${offlineCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #E5E7EB; padding-top: 4px; margin-top: 2px;">
              <span style="color: #9CA3AF; font-size: 10px;">Coordinates:</span>
              <span style="font-family: monospace; font-size: 10px; color: #6B7280;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>
            </div>
          </div>
        </div>
      `;

      areaMarker.bindPopup(areaPopupContent, { className: 'custom-leaflet-popup' });
      areaGroup.addLayer(areaMarker);
    });

    // Automatically fit all areas and workers within the viewport (Requirement 9)
    fitMapToAllAreasAndWorkers(true);
  }, [mapReady, normalizedAreas, workers]);

  // 4. Render Worker Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !workersLayerGroupRef.current) return;

    const workersGroup = workersLayerGroupRef.current;
    workersGroup.clearLayers();
    workerMarkerMapRef.current.clear();

    workers.forEach((worker) => {
      const {
        workerId,
        vendor,
        latitude,
        longitude,
        onlineStatus,
        isInsideCoverage,
        distanceMeters,
        currentArea,
        lastUpdated,
      } = worker;

      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

      // Color scheme based on Online + Coverage state
      const isOnline = onlineStatus;
      const isInside = isInsideCoverage;

      let pinBgColor = '#94A3B8'; // Offline slate
      let pinShadow = '0 2px 4px rgba(0,0,0,0.15)';
      let pulseHtml = '';
      let badgeBg = isInside ? '#059669' : '#D97706';
      let badgeIcon = isInside ? '✓' : '!';

      if (isOnline) {
        if (isInside) {
          pinBgColor = '#10B981'; // Online + Inside -> Emerald Green
          pinShadow = '0 6px 12px -2px rgba(16, 185, 129, 0.45)';
          pulseHtml = `
            <span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); animation: pulse 2.5s infinite;"></span>
          `;
        } else {
          pinBgColor = '#F59E0B'; // Online + Outside -> Amber Warning
          pinShadow = '0 6px 12px -2px rgba(245, 158, 11, 0.45)';
          pulseHtml = `
            <span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(245, 158, 11, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(245, 158, 11, 0.15); animation: pulse 2.5s infinite;"></span>
          `;
        }
      }

      const workerDivIcon = L.divIcon({
        className: `worker-marker-node worker-${workerId}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${pulseHtml}
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 9999px; background: ${pinBgColor}; border: 2.5px solid #FFFFFF; box-shadow: ${pinShadow}; color: white; transition: transform 0.2s ease;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style="position: absolute; top: -3px; right: -3px; width: 15px; height: 15px; border-radius: 9999px; background: ${badgeBg}; color: white; font-size: 9px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 1.5px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
              ${badgeIcon}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([latitude, longitude], { icon: workerDivIcon });

      // Rich Worker Popup matching Requirement 13
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px 2px; min-width: 220px;">
          <!-- Top Row: Avatar & Name -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px 0;">${vendor}</h3>
              <span style="font-family: monospace; font-size: 11px; background: #F3F4F6; color: #4B5563; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${workerId}</span>
            </div>
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; ${
              isOnline ? 'background: #ECFDF5; color: #047857;' : 'background: #F1F5F9; color: #64748B;'
            }">
              <span style="display: block; width: 6px; height: 6px; border-radius: 9999px; ${
                isOnline ? 'background: #10B981;' : 'background: #94A3B8;'
              }"></span>
              ${isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <!-- Metadata Rows -->
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Coverage:</span>
              <span style="font-weight: 700; padding: 2px 7px; border-radius: 6px; font-size: 11px; ${
                isInside ? 'background: #ECFDF5; color: #047857;' : 'background: #FFFBEB; color: #B45309;'
              }">
                ${isInside ? '✓ Inside Coverage' : '! Outside Coverage'}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Distance to Center:</span>
              <strong style="color: #111827; font-weight: 700;">${formatDist(distanceMeters)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Current Area:</span>
              <span style="font-weight: 600; color: #374151;">${currentArea || 'N/A'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6B7280;">Last Updated:</span>
              <span style="font-size: 11px; color: #4B5563;">${formatRelativeTime(lastUpdated)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #E5E7EB; padding-top: 5px; margin-top: 2px;">
              <span style="color: #9CA3AF; font-size: 10px;">Coordinates:</span>
              <span style="font-family: monospace; font-size: 10px; color: #6B7280;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });

      marker.on('click', () => {
        onSelectWorker?.(worker);
      });

      workersGroup.addLayer(marker);
      workerMarkerMapRef.current.set(workerId, marker);
    });
  }, [mapReady, workers]);

  // 5. Handle Programmatic Focus on a Worker (from table selection)
  useEffect(() => {
    if (!selectedWorkerId || !mapInstanceRef.current) return;
    const targetMarker = workerMarkerMapRef.current.get(selectedWorkerId);
    if (targetMarker) {
      const latLng = targetMarker.getLatLng();
      mapInstanceRef.current.setView(latLng, 16, { animate: true });
      targetMarker.openPopup();
    }
  }, [selectedWorkerId]);

  // Recenter to Area Center (or all area centers if multiple)
  const handleRecenter = () => {
    if (!mapInstanceRef.current || normalizedAreas.length === 0) return;
    if (normalizedAreas.length === 1) {
      mapInstanceRef.current.setView([normalizedAreas[0].latitude, normalizedAreas[0].longitude], 15, { animate: true });
    } else {
      const bounds = L.latLngBounds(normalizedAreas.map((a) => [a.latitude, a.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  // Fit all markers & radius circles in view (Requirement 9)
  const handleFitAll = () => {
    fitMapToAllAreasAndWorkers(true);
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[580px] rounded-2xl overflow-hidden border border-purple-200/80 shadow-soft-md bg-slate-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 animate-spin">
            <Compass className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-purple-900 tracking-wide">
            Syncing live worker coordinates & area coverage...
          </p>
        </div>
      )}

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-3.5 right-3.5 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-soft-sm border border-slate-200/80 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer focus:outline-none"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-soft-sm border border-slate-200/80 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer focus:outline-none"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-soft-sm border border-slate-200/80 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer focus:outline-none"
          title="Recenter on Area(s)"
          aria-label="Recenter on Area(s)"
        >
          <Navigation className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleFitAll}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-soft-sm border border-slate-200/80 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer focus:outline-none"
          title="Fit All Areas & Markers"
          aria-label="Fit All Areas & Markers"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggleTileLayer}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-soft-sm border border-slate-200/80 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer focus:outline-none"
          title={`Switch to ${activeTileLayer === 'streets' ? 'Light Carto' : 'OpenStreetMap'}`}
          aria-label="Toggle Tile Map Style"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Active Area Info Badge Top-Left */}
      {normalizedAreas.length > 0 && (
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-soft-md border border-purple-200/80 backdrop-blur-sm pointer-events-auto max-w-[calc(100%-4.5rem)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shrink-0">
            <MapPin className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {normalizedAreas.length === 1 ? normalizedAreas[0].areaName : `${normalizedAreas.length} Operating Areas`}
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <span className="text-[10px] text-purple-700 font-semibold truncate max-w-[200px]">
              {normalizedAreas.length === 1
                ? `Radius: ${normalizedAreas[0].coverageRadius}m`
                : normalizedAreas.map((a) => a.areaName).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Floating Map Legend Bottom-Left (Requirement 10 & 24) */}
      <div className="absolute bottom-3.5 left-3.5 z-20 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-soft-md border border-slate-200/80 backdrop-blur-sm pointer-events-auto max-w-[calc(100%-1.75rem)] sm:max-w-[340px]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-purple-600" />
            <span>Map Legend</span>
          </div>
          {normalizedAreas.length > 1 && (
            <span className="text-purple-600 font-semibold lowercase">
              {normalizedAreas.length} areas
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#5B21B6] border border-white shadow-xs shrink-0" />
            <span>Area Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white shadow-xs shrink-0" />
            <span>Online Worker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 border border-white shadow-xs shrink-0" />
            <span>Offline Worker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-b-2 border-dashed border-purple-600 shrink-0" />
            <span>Radius Circle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
              ✓
            </span>
            <span>Inside Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
              !
            </span>
            <span>Outside Zone</span>
          </div>
        </div>

        {/* Quick Area Focus Buttons if multiple areas (Requirement 10) */}
        {normalizedAreas.length > 1 && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Focus Area
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
              {normalizedAreas.map((a) => (
                <button
                  key={a.areaName}
                  type="button"
                  onClick={() => {
                    mapInstanceRef.current?.setView([a.latitude, a.longitude], 15, { animate: true });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200/50 cursor-pointer"
                  title={`Focus ${a.areaName} (${a.coverageRadius}m)`}
                >
                  <MapPin className="h-2.5 w-2.5 text-purple-600" />
                  <span>{a.areaName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
