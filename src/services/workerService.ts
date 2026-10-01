import { Worker, WorkerStatus, ServiceType } from '../types';
import { mockWorkers } from '../data/mock/mockWorkers';
import { registerEmployee } from './api';

/**
 * Service abstraction for Worker Operations.
 * In Phase 2, these mock queries will be replaced with:
 * return fetch('/api/v1/workers').then(r => r.json());
 */
export const workerService = {
  async getWorkers(): Promise<Worker[]> {
    return Promise.resolve([...mockWorkers]);
  },

  async getWorkerById(id: string): Promise<Worker | undefined> {
    return Promise.resolve(mockWorkers.find(w => w.id === id));
  },

  async updateWorkerStatus(workerId: string, status: WorkerStatus): Promise<boolean> {
    const worker = mockWorkers.find(w => w.id === workerId);
    if (worker) {
      worker.status = status;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async getCandidatesForJob(
    service: ServiceType, 
    _areaId: string, 
    searchRadiusMeters: number = 500,
    allowNeighborMarkets: boolean = false
  ): Promise<{ worker: Worker; distanceMeters: number; etaMinutes: number; matchReasons: string[]; conflict?: string }[]> {
    // In Phase 2: PostGIS spatial query ST_DWithin + Redis availability
    const candidates = mockWorkers.map(w => {
      // Calculate simulated distance based on lat/lng
      const isNeighbor = w.areaId !== _areaId;
      const baseDist = isNeighbor ? 850 : 220;
      const distanceMeters = baseDist + Math.floor(Math.abs(w.lat * 1000) % 300);
      const etaMinutes = Math.max(3, Math.round(distanceMeters / 80));

      const hasSkill = w.skills.includes(service) || w.skills.some(s => s.toLowerCase().includes(service.toLowerCase().split(' ')[0]));
      const isAvailable = w.status === 'Available';
      const isVerified = w.complianceStatus === 'Verified';

      const matchReasons: string[] = [];
      if (isAvailable) matchReasons.push('Available now');
      else matchReasons.push(`Currently ${w.status}`);

      matchReasons.push(`${distanceMeters}m away (~${etaMinutes} min ETA)`);
      if (hasSkill) matchReasons.push(`Specialized in ${service}`);
      if (isVerified) matchReasons.push('Compliance verified');

      let conflict: string | undefined = undefined;
      if (w.currentJobId) {
        conflict = `Assigned to ${w.currentJobId} until next slot`;
      } else if (w.status !== 'Available') {
        conflict = `Status is currently ${w.status}`;
      }

      return {
        worker: w,
        distanceMeters,
        etaMinutes,
        matchReasons,
        conflict,
        isEligibleRadius: distanceMeters <= searchRadiusMeters || (allowNeighborMarkets && isNeighbor),
      };
    });

    return Promise.resolve(
      candidates
        .filter(c => c.isEligibleRadius)
        .sort((a, b) => {
          if (!a.conflict && b.conflict) return -1;
          if (a.conflict && !b.conflict) return 1;
          return a.distanceMeters - b.distanceMeters;
        })
    );
  },

  async registerExpert(payload: RegisterExpertPayload): Promise<RegisterExpertResult> {
    return registerEmployee(payload);
  },
  async registerEmployee(payload: RegisterExpertPayload): Promise<RegisterExpertResult> {
    return registerEmployee(payload);
  },
};

export interface RegisterExpertPayload {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profileImage: string | null;
  areaNames: string[];
  accessLevel: string;
}

export type RegisterEmployeePayload = RegisterExpertPayload;

export interface RegisterExpertResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type RegisterEmployeeResult = RegisterExpertResult;

