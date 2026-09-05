/**
 * Plan-based quotas to prevent abuse and limit resource usage per user.
 *
 * These limits are checked server-side before provisioning new databases
 * or before executing queries that would exceed the limit.
 */

export type Plan = 'free' | 'pro' | 'enterprise';

export type Quota = {
  maxProjects: number;
  maxBranchesPerProject: number;
  maxStorageMb: number;        // per database
  maxConnections: number;      // concurrent connections per database
  maxApiKeys: number;
  maxQueryRows: number;        // max rows returned per query
};

export const QUOTAS: Record<Plan, Quota> = {
  free: {
    maxProjects: 1,
    maxBranchesPerProject: 2,
    maxStorageMb: 100,
    maxConnections: 5,
    maxApiKeys: 2,
    maxQueryRows: 1000,
  },
  pro: {
    maxProjects: 10,
    maxBranchesPerProject: 10,
    maxStorageMb: 1024,
    maxConnections: 20,
    maxApiKeys: 10,
    maxQueryRows: 10000,
  },
  enterprise: {
    maxProjects: 100,
    maxBranchesPerProject: 50,
    maxStorageMb: 10240,
    maxConnections: 100,
    maxApiKeys: 100,
    maxQueryRows: 100000,
  },
};

export function getQuota(plan: string): Quota {
  return QUOTAS[plan as Plan] || QUOTAS.free;
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return labels[plan] || 'Free';
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}
