import { WorkerDocument, DocStatus } from '../types';
import { mockWorkerDocuments } from '../data/mock/mockCompliance';

export const complianceService = {
  async getDocuments(): Promise<WorkerDocument[]> {
    return Promise.resolve([...mockWorkerDocuments]);
  },

  async updateDocumentStatus(
    id: string, 
    status: DocStatus, 
    rejectionReason?: string
  ): Promise<boolean> {
    const doc = mockWorkerDocuments.find(d => d.id === id);
    if (doc) {
      doc.status = status;
      if (rejectionReason) doc.rejectionReason = rejectionReason;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
