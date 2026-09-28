import { mockWorkers } from './mockWorkers';
import { Worker } from '../types';

/**
 * Duplicated dataset for Employees page based on the current Experts data source.
 * This is currently duplicated mock data to keep Employees and Experts distinct
 * before future separate API integrations.
 */
export const mockEmployees: Worker[] = mockWorkers.map((expert) => ({
  ...expert,
}));
