import React, { useState, useMemo } from 'react';
import { Worker, Booking, Market, WorkerStatus, BookingStatus } from '../../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  User, 
  ShoppingBag
} from 'lucide-react';
import { WorkerDetailDrawer } from './WorkerDetailDrawer';
import { BookingDetailDrawer } from './BookingDetailDrawer';
import { AssignWorkerModal } from '../assignments/AssignWorkerModal';

interface InteractiveMapProps {
  workers: Worker[];
  bookings: Booking[];
  markets: Market[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  workers,
  bookings,
  markets,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer toggles
  const [showWorkers, setShowWorkers] = useState(true);
  const [showBookings, setShowBookings] = useState(true);
  const [showMarkets, setShowMarkets] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Filters
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [workerStatusFilter, setWorkerStatusFilter] = useState<string>('ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');

  // Selected item for drawer inspection
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignModalBooking, setAssignModalBooking] = useState<Booking | null>(null);

  const MAP_BOUNDS = {
    minLat: 12.9000,
    maxLat: 12.9800,
    minLng: 77.5700,
    maxLng: 77.6600,
  };

  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 700;

  const project = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * SVG_WIDTH;
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * SVG_HEIGHT;
    return { x, y };
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (selectedAreaFilter !== 'ALL' && w.areaId !== selectedAreaFilter) return false;
      if (workerStatusFilter !== 'ALL' && w.status !== workerStatusFilter) return false;
      return true;
    });
  }, [workers, selectedAreaFilter, workerStatusFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedAreaFilter !== 'ALL' && b.areaId !== selectedAreaFilter) return false;
      if (bookingStatusFilter !== 'ALL' && b.status !== bookingStatusFilter) return false;
      return true;
    });
  }, [bookings, selectedAreaFilter, bookingStatusFilter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.6, Math.min(2.8, prev + delta)));
  };

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getWorkerColor = (status: WorkerStatus) => {
    switch (status) {
      case 'Available': return '#10B981'; // Green
      case 'Assigned': return '#7C3AED'; // Secondary Purple
      case 'Busy': return '#5B21B6'; // Primary Purple
      case 'Traveling': return '#F59E0B'; // Orange
      case 'Offline': return '#9CA3AF'; // Gray
      case 'GPS Stale': return '#EA580C'; // Amber
      case 'Suspended': return '#E11D48'; // Red
      default: return '#7C3AED';
    }
  };

  const getBookingColor = (status: BookingStatus | string) => {
    switch (status) {
      case 'SLA Risk': return '#E11D48'; // Red
      case 'Searching': return '#5B21B6'; // Purple
      case 'Queued': return '#F59E0B'; // Amber
      case 'In Progress': return '#7C3AED'; // Secondary Purple
      case 'En Route': return '#D97706'; // Amber
      case 'Completed': return '#10B981'; // Green
      default: return '#6B7280';
    }
  };

  return (
    <div className="relative h-[calc(100vh-10rem)] w-full overflow-hidden rounded-3xl border border-[#EEEEF2] bg-[#F8F7FC] shadow-soft-md select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#EEEEF2] bg-white/95 p-2.5 shadow-soft-md backdrop-blur-md">
        {/* Area Filter */}
        <select
          value={selectedAreaFilter}
          onChange={(e) => setSelectedAreaFilter(e.target.value)}
          aria-label="Filter Map by Area"
          className="rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="ALL">All Nano-Markets</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} ({m.name.split(' ')[0]})
            </option>
          ))}
        </select>

        {/* Expert Status Filter */}
        <select
          value={workerStatusFilter}
          onChange={(e) => setWorkerStatusFilter(e.target.value)}
          aria-label="Filter Map by Expert Status"
          className="rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="ALL">All Expert Statuses</option>
          <option value="Available">🟢 Available Only</option>
          <option value="Assigned">🟣 Assigned Only</option>
          <option value="Busy">🟣 Busy Only</option>
          <option value="GPS Stale">🟠 GPS Stale</option>
          <option value="Offline">⚪ Offline</option>
        </select>

        {/* Booking Status Filter */}
        <select
          value={bookingStatusFilter}
          onChange={(e) => setBookingStatusFilter(e.target.value)}
          aria-label="Filter Map by Booking Status"
          className="rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] px-3 py-1.5 text-xs font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="ALL">All Bookings</option>
          <option value="SLA Risk">⚠️ SLA Risk Only</option>
          <option value="Searching">Searching / Unassigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Queued">Queued</option>
        </select>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 border-l border-[#EEEEF2] pl-2">
          <button
            onClick={() => setShowWorkers(!showWorkers)}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
              showWorkers
                ? 'bg-[#EDE9FE] text-[#5B21B6] shadow-soft-sm'
                : 'bg-[#F7F5FA] text-[#6B6B6B]'
            }`}
            title="Toggle Experts Layer"
          >
            <User className="h-3 w-3" />
            Experts ({filteredWorkers.length})
          </button>

          <button
            onClick={() => setShowBookings(!showBookings)}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
              showBookings
                ? 'bg-[#EDE9FE] text-[#5B21B6] shadow-soft-sm'
                : 'bg-[#F7F5FA] text-[#6B6B6B]'
            }`}
            title="Toggle Bookings Layer"
          >
            <ShoppingBag className="h-3 w-3" />
            Bookings ({filteredBookings.length})
          </button>

          <button
            onClick={() => setShowMarkets(!showMarkets)}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
              showMarkets
                ? 'bg-[#EDE9FE] text-[#5B21B6] shadow-soft-sm'
                : 'bg-[#F7F5FA] text-[#6B6B6B]'
            }`}
            title="Toggle Nano-Markets Layer"
          >
            <Compass className="h-3 w-3" />
            Zones
          </button>
        </div>
      </div>

      {/* Floating Zoom & Compass HUD */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 rounded-2xl border border-[#EEEEF2] bg-white/95 p-1.5 shadow-soft-md backdrop-blur-md">
        <button
          onClick={() => handleZoom(0.25)}
          className="rounded-xl p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.25)}
          className="rounded-xl p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetViewport}
          className="rounded-xl p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors"
          title="Reset Center"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Status Legend */}
      <div className="absolute bottom-6 left-6 z-10 hidden sm:flex items-center gap-4 rounded-2xl border border-[#EEEEF2] bg-white/95 px-4 py-2.5 shadow-soft-md backdrop-blur-md text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-[#027A48]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-[#A6F4C5]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#5B21B6]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5B21B6] ring-2 ring-[#EDE9FE]" />
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#7C3AED]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED] ring-2 ring-[#EDE9FE]" />
          <span>Busy</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#C2410C]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] ring-2 ring-[#FED7AA]" />
          <span>GPS Stale</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#B42318] border-l border-[#EEEEF2] pl-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E11D48] ring-4 ring-[#FECDCA] animate-pulse" />
          <span>SLA Risk Order</span>
        </div>
      </div>

      {/* SVG Vector Interactive Map Canvas */}
      <div
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Light Grid lines */}
            {showGrid && (
              <g stroke="#E9E7F2" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.7">
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={SVG_HEIGHT} />
                ))}
                {Array.from({ length: 15 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2={SVG_WIDTH} y2={i * 50} />
                ))}
              </g>
            )}

            {/* Arterial Highways & Roads in South Bangalore (Clean soft corridors) */}
            <g strokeLinecap="round">
              <path d="M 150,580 Q 550,520 850,220" fill="none" stroke="#E5E1F0" strokeWidth="10" />
              <path d="M 450,150 L 520,680" fill="none" stroke="#E5E1F0" strokeWidth="10" />
              <path d="M 650,80 L 750,280" fill="none" stroke="#EBE7F5" strokeWidth="7" />
              <path d="M 520,280 Q 600,320 680,240" fill="none" stroke="#EBE7F5" strokeWidth="6" />
            </g>

            {/* Nano-Market Zones / Polygons (Soft Lilac Fills with Purple Borders) */}
            {showMarkets &&
              markets.map((m) => {
                const topLeft = project(m.bounds.maxLat, m.bounds.minLng);
                const bottomRight = project(m.bounds.minLat, m.bounds.maxLng);
                const width = Math.abs(bottomRight.x - topLeft.x);
                const height = Math.abs(bottomRight.y - topLeft.y);
                const center = project(m.center.lat, m.center.lng);

                const getZoneFill = () => {
                  switch (m.status) {
                    case 'Critical': return '#FEF2F2';
                    case 'Tight': return '#FFF7ED';
                    default: return '#F5F3FF';
                  }
                };

                const getZoneStroke = () => {
                  switch (m.status) {
                    case 'Critical': return '#E11D48';
                    case 'Tight': return '#F59E0B';
                    default: return '#7C3AED';
                  }
                };

                return (
                  <g key={m.id}>
                    {/* Zone Boundary */}
                    <rect
                      x={topLeft.x}
                      y={topLeft.y}
                      width={width}
                      height={height}
                      rx="18"
                      fill={getZoneFill()}
                      fillOpacity="0.65"
                      stroke={getZoneStroke()}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      className="transition-all hover:stroke-width-2"
                    />

                    {/* Zone Search Radius Circle */}
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={Math.min(160, m.radius * 0.14)}
                      fill="none"
                      stroke={getZoneStroke()}
                      strokeWidth="1"
                      strokeOpacity="0.4"
                    />

                    {/* Zone Center Label */}
                    <text
                      x={center.x}
                      y={topLeft.y + 20}
                      fill="#5B21B6"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {m.id} • {m.capacity}%
                    </text>
                  </g>
                );
              })}

            {/* Booking Pins */}
            {showBookings &&
              filteredBookings.map((b) => {
                const pos = project(b.lat, b.lng);
                const isSlaRisk = b.status === 'SLA Risk';
                const color = getBookingColor(b.status);

                return (
                  <g
                    key={b.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                    }}
                  >
                    {isSlaRisk && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#E11D48"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.8"
                      />
                    )}

                    <rect
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      rx="7"
                      fill="#FFFFFF"
                      stroke={color}
                      strokeWidth="2"
                      className="shadow-soft-sm"
                    />

                    <circle cx="0" cy="0" r="3.5" fill={color} />

                    <text
                      x="0"
                      y="-14"
                      fill="#1F1F1F"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="pointer-events-none drop-shadow-sm"
                    >
                      #{b.id}
                    </text>
                  </g>
                );
              })}

            {/* Worker Markers */}
            {showWorkers &&
              filteredWorkers.map((w) => {
                const pos = project(w.lat, w.lng);
                const color = getWorkerColor(w.status);
                const isAvailable = w.status === 'Available';

                return (
                  <g
                    key={w.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer transition-transform hover:scale-130"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWorker(w);
                    }}
                  >
                    {isAvailable && (
                      <circle
                        r="14"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        className="radar-pulse"
                      />
                    )}

                    <circle
                      cx="0"
                      cy="0"
                      r="9"
                      fill="#FFFFFF"
                      stroke={color}
                      strokeWidth="2.5"
                      className="shadow-soft-sm"
                    />

                    <circle cx="0" cy="0" r="4" fill={color} />

                    <polygon
                      points="0,-12 -3,-8 3,-8"
                      fill={color}
                      className="opacity-90"
                    />

                    <text
                      x="0"
                      y="18"
                      fill="#1F1F1F"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      textAnchor="middle"
                      className="pointer-events-none drop-shadow-sm"
                    >
                      {w.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

      {/* Drawers */}
      <WorkerDetailDrawer
        worker={selectedWorker}
        isOpen={Boolean(selectedWorker)}
        onClose={() => setSelectedWorker(null)}
        onAssignClick={() => {
          const unassigned = bookings.find((b) => b.status === 'Searching' || b.status === 'SLA Risk');
          if (unassigned) setAssignModalBooking(unassigned);
        }}
      />

      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
      />

      {assignModalBooking && (
        <AssignWorkerModal
          booking={assignModalBooking}
          isOpen={true}
          onClose={() => setAssignModalBooking(null)}
        />
      )}
    </div>
  );
};
