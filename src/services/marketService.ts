import { Market, MarketStatus } from '../types';
import { mockMarkets } from '../data/mockMarkets';
import { getActiveAreas } from './api';

export const marketService = {
  async getMarkets(): Promise<Market[]> {
    try {
      const res = await getActiveAreas();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((a, idx) => ({
          id: a.areaName,
          name: a.areaName.replace(/_/g, ' '),
          area: a.city || 'Bangalore',
          radius: 1000,
          maxRadius: 2500,
          availableWorkers: 6 + (idx * 2),
          busyWorkers: 3,
          activeOrders: 4,
          queuedOrders: 1,
          capacity: 40 + (idx * 15),
          status: 'Healthy' as MarketStatus,
          neighboringMarkets: res.data.filter(other => other.areaName !== a.areaName).map(o => o.areaName),
          center: { lat: 12.8452 + (idx * 0.005), lng: 77.6602 + (idx * 0.005) },
          bounds: { minLat: 12.83, maxLat: 12.86, minLng: 77.64, maxLng: 77.68 },
          instantBookingEnabled: true,
          surgeIncentiveActive: false,
          surgeMultiplier: 1.0,
        }));
      }
    } catch (e) {
      console.error('Failed to load active areas in marketService:', e);
    }
    return Promise.resolve([...mockMarkets]);
  },

  async getMarketById(id: string): Promise<Market | undefined> {
    const list = await this.getMarkets();
    return list.find(m => m.id === id);
  },

  async updateMarketStatus(id: string, status: MarketStatus): Promise<boolean> {
    const market = mockMarkets.find(m => m.id === id);
    if (market) {
      market.status = status;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async updateMarketRadius(id: string, newRadius: number): Promise<boolean> {
    const market = mockMarkets.find(m => m.id === id);
    if (market) {
      market.radius = newRadius;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async toggleSurgeIncentive(id: string): Promise<boolean> {
    const market = mockMarkets.find(m => m.id === id);
    if (market) {
      market.surgeIncentiveActive = !market.surgeIncentiveActive;
      market.surgeMultiplier = market.surgeIncentiveActive ? 1.35 : 1.0;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async togglePauseMarket(id: string): Promise<boolean> {
    const market = mockMarkets.find(m => m.id === id);
    if (market) {
      market.paused = !market.paused;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
