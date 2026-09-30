import { Market, MarketStatus } from '../types';
import { getNestAreas, RawNestAreaItem } from './api';

// In-memory dynamic market state cache
let dynamicMarketsCache: Market[] = [];

export const marketService = {
  async getMarkets(): Promise<Market[]> {
    try {
      const res = await getNestAreas();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Market[] = res.data.map((a: RawNestAreaItem, idx: number) => {
          const expertsCount = typeof a.Experts === 'number' ? a.Experts : (a.Experts ? Number(a.Experts) : 0);
          const availableCount = Math.round(expertsCount * 0.7);
          const busyCount = Math.max(0, expertsCount - availableCount);

          return {
            id: a.areaName || a.tableId,
            tableId: a.tableId,
            name: (a.areaName || '').replace(/_/g, ' '),
            area: [a.city, a.state].filter(Boolean).join(', ') || a.country || '',
            city: a.city || '',
            state: a.state || '',
            country: a.country || '',
            radius: typeof a.coverageRadius === 'number' ? a.coverageRadius : (a.coverageRadius ? Number(a.coverageRadius) : 0),
            maxRadius: 2500,
            availableWorkers: availableCount,
            busyWorkers: busyCount,
            activeOrders: 0,
            queuedOrders: 0,
            capacity: Math.min(100, Math.round(((idx + 1) / Math.max(1, res.data.length)) * 100)),
            status: (a.isActive ? (a.serviceStatus !== false ? 'Healthy' : 'Tight') : 'Critical') as MarketStatus,
            neighboringMarkets: res.data
              .filter((other: RawNestAreaItem) => other.areaName !== a.areaName)
              .map((o: RawNestAreaItem) => o.areaName || o.tableId),
            center: { lat: 12.8452 + (idx * 0.005), lng: 77.6602 + (idx * 0.005) },
            bounds: { minLat: 12.83, maxLat: 12.86, minLng: 77.64, maxLng: 77.68 },
            instantBookingEnabled: true,
            surgeIncentiveActive: false,
            surgeMultiplier: 1.0,
            rawArea: a,
          };
        });
        dynamicMarketsCache = mapped;
        return mapped;
      }
    } catch (e) {
      console.error('Failed to load nest areas in marketService:', e);
    }
    return Promise.resolve([]);
  },

  async getMarketById(id: string): Promise<Market | undefined> {
    const list = await this.getMarkets();
    return list.find(m => m.id === id || m.tableId === id);
  },

  async updateMarketStatus(id: string, status: MarketStatus): Promise<boolean> {
    const market = dynamicMarketsCache.find(m => m.id === id || m.tableId === id);
    if (market) {
      market.status = status;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async updateMarketRadius(id: string, newRadius: number): Promise<boolean> {
    const market = dynamicMarketsCache.find(m => m.id === id || m.tableId === id);
    if (market) {
      market.radius = newRadius;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async toggleSurgeIncentive(id: string): Promise<boolean> {
    const market = dynamicMarketsCache.find(m => m.id === id || m.tableId === id);
    if (market) {
      market.surgeIncentiveActive = !market.surgeIncentiveActive;
      market.surgeMultiplier = market.surgeIncentiveActive ? 1.35 : 1.0;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async togglePauseMarket(id: string): Promise<boolean> {
    const market = dynamicMarketsCache.find(m => m.id === id || m.tableId === id);
    if (market) {
      market.paused = !market.paused;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
