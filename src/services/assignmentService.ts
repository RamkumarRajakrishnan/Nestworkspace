import { Assignment } from '../types';
import { mockAssignments } from '../data/mockAssignments';

export const assignmentService = {
  async getAssignments(): Promise<Assignment[]> {
    return Promise.resolve([...mockAssignments]);
  },

  async reassignWorker(
    currentAssignmentId: string, 
    newWorkerId: string, 
    reason: string
  ): Promise<boolean> {
    const asg = mockAssignments.find(a => a.id === currentAssignmentId);
    if (asg) {
      asg.previousWorkerId = asg.workerId;
      asg.workerId = newWorkerId;
      asg.reassignmentReason = reason;
      asg.assignedAt = new Date().toISOString();
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
