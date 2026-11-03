import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  Navigation, 
  ChevronDown, 
  ChevronUp,
  Map as MapIcon 
} from 'lucide-react';

interface CoordinatesMiniMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  defaultExpanded?: boolean;
}

export const CoordinatesMiniMap: React.FC<CoordinatesMiniMapProps> = ({
  latitude,
  longitude,
  address,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Validate coordinates
  const isValidLat = !isNaN(latitude) && latitude >= -90 && latitude <= 90 && latitude !== 0;
  const isValidLng = !isNaN(longitude) && longitude >= -180 && longitude <= 180 && longitude !== 0;
  const hasValidCoordinates = isValidLat && isValidLng;

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  useEffect(() => {
    if (!isExpanded || !hasValidCoordinates || !mapContainerRef.current) return;

    // Destroy existing instance if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Custom Nest theme pin marker with pulsing ripple
    const customPinIcon = L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(27, 46, 121, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9999px; background: #1B2E79; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(27, 46, 121, 0.35); color: white;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });

    const marker = L.marker([latitude, longitude], { icon: customPinIcon }).addTo(map);
    markerRef.current = marker;

    const popupHtml = `
      <div style="font-family: inherit; font-size: 11px; padding: 4px 2px; min-width: 190px;">
        <div style="display: flex; align-items: center; gap: 4px; font-weight: 700; color: #1B2E79; margin-bottom: 4px;">
          <span style="display: inline-block; width: 7px; height: 7px; border-radius: 9999px; background: #1B2E79;"></span>
          Target Coordinates
        </div>
        <div style="font-family: monospace; font-size: 11px; font-weight: 600; color: #1F1F1F; margin-bottom: 4px;">
          ${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°
        </div>
        ${address ? `<div style="font-size: 10px; color: #6B6B6B; line-height: 1.35; border-top: 1px solid #EEEEF2; padding-top: 4px;">${address}</div>` : ''}
      </div>
    `;

    marker.bindPopup(popupHtml).openPopup();
    mapInstanceRef.current = map;

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isExpanded, hasValidCoordinates, latitude, longitude, address]);

  if (!hasValidCoordinates) {
    return null;
  }

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
      markerRef.current?.openPopup();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[#EEEEF2] bg-white overflow-hidden shadow-soft-sm transition-all">
      {/* Option Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#FAF9FC] border-b border-[#EEEEF2]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#EEF3FF] flex items-center justify-center text-[#1B2E79]">
            <MapIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1F1F1F] font-mono">MAP VIEW</span>
            <span className="ml-2 font-mono text-[11px] text-[#6B6B6B]">
              {latitude.toFixed(6)}°, {longitude.toFixed(6)}°
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* External Google Maps Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#C4D9FD] bg-white hover:bg-[#EEF3FF] text-[#1B2E79] text-[11px] font-semibold transition-colors shadow-soft-sm"
            title="Open in Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Toggle Map Option Button */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EEEEF2] bg-white hover:bg-[#FAF9FC] text-[#1F1F1F] text-[11px] font-semibold transition-colors shadow-soft-sm cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Map' : 'Show Map'}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#6B6B6B]" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[#6B6B6B]" />
            )}
          </button>
        </div>
      </div>

      {/* Map Body */}
      {isExpanded && (
        <div className="relative h-64 sm:h-72 w-full bg-[#FAF9FC]">
          <div ref={mapContainerRef} className="h-full w-full z-0" />

          {/* Floating Map Controls */}
          <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl border border-[#EEEEF2] shadow-soft-md">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <div className="h-px bg-[#EEEEF2] mx-1 my-0.5" />
            <button
              type="button"
              onClick={handleRecenter}
              className="p-1.5 rounded-lg text-[#1F1F1F] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors"
              title="Recenter Pin"
            >
              <Navigation className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bottom Coordinates Indicator */}
          <div className="absolute bottom-2.5 left-2.5 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#EEEEF2] text-[10px] font-mono text-[#1B2E79] font-bold shadow-soft-sm flex items-center gap-1.5 pointer-events-none">
            <MapPin className="h-3 w-3 text-[#1B2E79]" />
            <span>{latitude.toFixed(6)}°, {longitude.toFixed(6)}°</span>
          </div>
        </div>
      )}
    </div>
  );
};

