export const mockHourlyDemand = [
  { hour: '06:00', orders: 12, availableWorkers: 45, busyWorkers: 10 },
  { hour: '07:00', orders: 28, availableWorkers: 58, busyWorkers: 24 },
  { hour: '08:00', orders: 65, availableWorkers: 62, busyWorkers: 55 },
  { hour: '09:00', orders: 92, availableWorkers: 48, busyWorkers: 85 },
  { hour: '10:00', orders: 138, availableWorkers: 32, busyWorkers: 120 },
  { hour: '11:00', orders: 142, availableWorkers: 28, busyWorkers: 135 },
  { hour: '12:00', orders: 110, availableWorkers: 40, busyWorkers: 105 },
  { hour: '13:00', orders: 85, availableWorkers: 52, busyWorkers: 78 },
  { hour: '14:00', orders: 95, availableWorkers: 45, busyWorkers: 88 },
  { hour: '15:00', orders: 120, availableWorkers: 36, busyWorkers: 112 },
  { hour: '16:00', orders: 135, availableWorkers: 30, busyWorkers: 128 },
  { hour: '17:00', orders: 115, availableWorkers: 42, busyWorkers: 102 },
];

export const mockMarketCapacityChart = [
  { market: 'KOR-03', capacity: 100, orders: 10, workers: 10, status: 'Critical' },
  { market: 'KOR-04', capacity: 71, orders: 13, workers: 17, status: 'Tight' },
  { market: 'IND-02', capacity: 58, orders: 11, workers: 19, status: 'Normal' },
  { market: 'BTM-01', capacity: 44, orders: 8, workers: 16, status: 'Normal' },
  { market: 'HSR-01', capacity: 36, orders: 9, workers: 22, status: 'Healthy' },
  { market: 'JYN-02', capacity: 29, orders: 6, workers: 17, status: 'Healthy' },
];

export const mockDailyMetrics = {
  completionRate: 97.8,
  cancellationRate: 1.4,
  avgAssignmentTimeSec: 21,
  avgEtaMinutes: 8.4,
  totalOrdersToday: 486,
  grossGMVToday: 584200,
  netPayoutsToday: 182450,
};
