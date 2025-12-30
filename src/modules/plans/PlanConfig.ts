/**
 * Subscription Plan Configuration
 * 
 * Defines rate limits for each subscription plan
 * This configuration is centralized and can be easily modified
 * or moved to database for dynamic configuration
 */

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

export interface PlanLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
}

/**
 * Plan configuration mapping
 * Defines rate limits for each plan type
 * 
 * Architecture Decision:
 * - Centralized configuration allows easy modification
 * - Can be extended to load from database for dynamic plans
 * - Type-safe with enum and interface
 */
export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    requestsPerMinute: 10,
    requestsPerDay: 1000,
  },
  [PlanType.PRO]: {
    requestsPerMinute: 100,
    requestsPerDay: 100000,
  },
};

/**
 * Get plan limits by plan type
 * Returns default FREE plan limits if plan not found
 */
export function getPlanLimits(plan: string): PlanLimits {
  const planType = plan as PlanType;
  return PLAN_CONFIG[planType] || PLAN_CONFIG[PlanType.FREE];
}

/**
 * Validate if plan type is valid
 */
export function isValidPlan(plan: string): plan is PlanType {
  return Object.values(PlanType).includes(plan as PlanType);
}

