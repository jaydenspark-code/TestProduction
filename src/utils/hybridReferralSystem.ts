/**
 * PROGRESSIVE RESET HYBRID REFERRAL COUNTING SYSTEM UTILITIES
 * 
 * This system implements the hybrid approach with progressive reset logic:
 * - First 4 Tiers (Rookie-Steel): Direct referrals only with progressive reset system
 * - Advanced Tiers (Silver+): Direct + Level 1 indirect referrals with base reset system
 * 
 * Progressive Reset System:
 * - First 4 tiers: Original attempt + 2 resets (start from half target)
 * - Advanced tiers: Original attempt + 3 retries (start from half of max reached)
 * - Failure after max attempts → Demotion to previous tier
 * 
 * Level 1 indirect = referrals made by your direct referrals
 */

import { AgentTier, AgentProfile } from '../types';

// Tier categories for different referral counting methods
export const FIRST_FOUR_TIERS = ['rookie', 'bronze', 'iron', 'steel'] as const;
export const ADVANCED_TIERS = ['silver', 'gold', 'platinum', 'diamond'] as const;

/**
 * Determines if a tier uses direct-only or network counting
 */
export function usesDirectOnlyCount(tierName: string): boolean {
  return FIRST_FOUR_TIERS.includes(tierName as any);
}

/**
 * Determines if a tier uses the progressive reset system
 * Rookie: Special case - restart from 0 (proves basic potential)
 * Bronze-Steel: Progressive reset system
 * Advanced: Base reset system
 */
export function usesProgressiveResetSystem(tierName: string): boolean {
  return ['bronze', 'iron', 'steel'].includes(tierName);
}

/**
 * Gets maximum attempts allowed for a tier with updated Rookie logic
 * Rookie: 1 retry (restart from 0 with 10 days)
 * Bronze-Steel: 2 resets (progressive from half)
 * Advanced: 3 retries (base from half max)
 */
export function getMaxAttemptsForTier(tierName: string): number {
  if (tierName === 'rookie') return 1; // 1 retry from 0
  return usesProgressiveResetSystem(tierName) ? 2 : 3; // 2 resets for bronze-steel, 3 retries for advanced
}

/**
 * Calculates reset starting point based on tier and attempt
 * Rookie: Always starts from 0 (proves basic potential)
 * Bronze-Steel: Progressive reset from half target
 * Advanced: Base reset from half max reached
 */
export function calculateResetStartingPoint(
  tierName: string,
  attemptNumber: number,
  tierRequirement: number,
  maxReached: number = 0
): number {
  if (attemptNumber === 0) return 0; // Original attempt starts from 0
  
  // Rookie tier always starts from 0 (no progressive advantage)
  if (tierName === 'rookie') {
    return 0;
  }
  
  if (usesProgressiveResetSystem(tierName)) {
    // Bronze, Iron, Steel: Progressive reset - start from half the target
    return Math.floor(tierRequirement / 2);
  } else {
    // Advanced tiers: Base reset - start from half of max reached
    return Math.floor(Math.max(0, maxReached / 2));
  }
}

/**
 * Gets challenge duration with Steel tier special rule
 */
export function getChallengeDuration(tierName: string, attemptNumber: number): number {
  // Steel tier gets 10 days for reset attempts
  if (tierName === 'steel' && attemptNumber > 0) {
    return 10;
  }
  
  // Default durations by tier
  const defaultDurations: Record<string, number> = {
    rookie: 7,
    bronze: 7,
    iron: 7,
    steel: 7,
    silver: 30,
    gold: 90,
    platinum: 150,
    diamond: 300
  };
  
  return defaultDurations[tierName] || 7;
}

/**
 * Gets previous tier for demotion logic
 */
export function getPreviousTier(currentTier: string): string {
  const tierOrder = ['rookie', 'bronze', 'iron', 'steel', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex <= 0) return 'rookie'; // Can't go below rookie
  return tierOrder[currentIndex - 1];
}

/**
 * Gets the appropriate referral count for a tier based on the hybrid system
 */
export function getReferralCountForTier(
  tierName: string,
  directCount: number,
  networkCount: number
): number {
  return usesDirectOnlyCount(tierName) ? directCount : networkCount;
}

/**
 * Gets the current challenge progress count based on tier type
 */
export function getChallengeProgressCount(agentProfile: AgentProfile): number {
  if (!agentProfile.currentChallengeTier) return 0;
  
  return usesDirectOnlyCount(agentProfile.currentChallengeTier)
    ? agentProfile.challengeDirectReferrals
    : agentProfile.challengeTotalNetwork;
}

/**
 * Calculates total network size from direct and level 1 indirect
 */
export function calculateNetworkSize(
  directReferrals: number,
  level1IndirectReferrals: number
): number {
  return directReferrals + level1IndirectReferrals;
}

/**
 * Checks if agent meets tier requirements using hybrid system
 */
export function checkTierRequirement(
  agentProfile: AgentProfile,
  targetTier: AgentTier
): boolean {
  const currentCount = getChallengeProgressCount(agentProfile);
  return currentCount >= targetTier.referralRequirement;
}

/**
 * Gets tier display information including referral counting method
 */
export function getTierDisplayInfo(tier: AgentTier) {
  const isDirectOnly = usesDirectOnlyCount(tier.tierName);
  
  return {
    name: tier.displayName || tier.tierName,
    referralType: isDirectOnly ? 'Direct Only' : 'Network (Direct + Level 1)',
    description: isDirectOnly 
      ? 'Personal recruitment skills focus'
      : 'Network building & mentoring focus',
    dailyTarget: calculateDailyTarget(tier.referralRequirement, tier.challengeDurationDays || 7),
    achievabilityRating: getAchievabilityRating(tier, isDirectOnly)
  };
}

/**
 * Calculates daily target for a tier
 */
export function calculateDailyTarget(totalRequired: number, days: number): number {
  return Math.ceil(totalRequired / days);
}

/**
 * Gets achievability rating for a tier
 */
export function getAchievabilityRating(tier: AgentTier, isDirectOnly: boolean): string {
  const dailyTarget = calculateDailyTarget(
    tier.referralRequirement, 
    tier.challengeDurationDays || 7
  );
  
  if (isDirectOnly) {
    // Direct referrals are harder - higher thresholds
    if (dailyTarget <= 10) return 'Achievable';
    if (dailyTarget <= 25) return 'Challenging';
    if (dailyTarget <= 50) return 'Very Difficult';
    return 'Extreme';
  } else {
    // Network referrals include viral effect - lower thresholds
    if (dailyTarget <= 30) return 'Achievable';
    if (dailyTarget <= 60) return 'Challenging';
    if (dailyTarget <= 100) return 'Very Difficult';
    return 'Extreme';
  }
}

/**
 * Formats referral count display with context
 */
export function formatReferralCount(
  count: number,
  tierName: string,
  includeType: boolean = true
): string {
  const baseCount = count.toLocaleString();
  
  if (!includeType) return baseCount;
  
  const type = usesDirectOnlyCount(tierName) 
    ? 'direct referrals'
    : 'network referrals';
    
  return `${baseCount} ${type}`;
}

/**
 * Gets tier progression insights
 */
export function getTierProgressionInsights(agentProfile: AgentProfile): {
  currentCount: number;
  nextTierRequirement: number;
  isDirectOnly: boolean;
  progressPercentage: number;
  estimatedDaysToComplete: number;
} {
  const currentTier = agentProfile.tier;
  const challengeTier = agentProfile.challengeTier;
  
  if (!currentTier || !challengeTier) {
    return {
      currentCount: 0,
      nextTierRequirement: 0,
      isDirectOnly: true,
      progressPercentage: 0,
      estimatedDaysToComplete: 0
    };
  }
  
  const currentCount = getChallengeProgressCount(agentProfile);
  const isDirectOnly = usesDirectOnlyCount(challengeTier.tierName);
  const progressPercentage = (currentCount / challengeTier.referralRequirement) * 100;
  
  // Simple estimation based on current progress
  const daysElapsed = agentProfile.challengeStartDate 
    ? Math.max(1, Math.ceil((Date.now() - new Date(agentProfile.challengeStartDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  
  const currentRate = currentCount / daysElapsed;
  const remaining = challengeTier.referralRequirement - currentCount;
  const estimatedDaysToComplete = currentRate > 0 ? Math.ceil(remaining / currentRate) : 999;
  
  return {
    currentCount,
    nextTierRequirement: challengeTier.referralRequirement,
    isDirectOnly,
    progressPercentage: Math.min(progressPercentage, 100),
    estimatedDaysToComplete
  };
}

/**
 * Example network scenarios for different tiers with new names
 */
export function getNetworkExamples() {
  return {
    rookie: {
      scenario: "Direct recruitment challenge - build personal skills",
      calculation: "50 direct referrals",
      timeframe: "7 days",
      dailyGoal: "7 direct referrals per day",
      resetAdvantage: "Resets start from 25 (half target)"
    },
    bronze: {
      scenario: "Progressive recruitment - consistency building",
      calculation: "100 direct referrals", 
      timeframe: "7 days",
      dailyGoal: "14 direct referrals per day",
      resetAdvantage: "Resets start from 50 (half target)"
    },
    iron: {
      scenario: "Advanced recruitment - efficiency development",
      calculation: "200 direct referrals",
      timeframe: "7 days", 
      dailyGoal: "29 direct referrals per day",
      resetAdvantage: "Resets start from 100 (half target)"
    },
    steel: {
      scenario: "Expert recruitment - mastery demonstration",
      calculation: "400 direct referrals",
      timeframe: "7 days (10 days for resets)",
      dailyGoal: "57 direct referrals per day (40/day for resets)",
      resetAdvantage: "Resets start from 200 + extended time"
    },
    silver: {
      scenario: "Network building - recruit quality direct referrals who build teams",
      calculation: "1,000 network: e.g., 40 direct + (40 × 24) = 1,000",
      timeframe: "30 days",
      dailyGoal: "1-2 quality direct referrals with strong networks",
      resetAdvantage: "Retries start from half of max reached"
    },
    gold: {
      scenario: "Leadership development - build and mentor larger networks", 
      calculation: "5,000 network: e.g., 200 direct + (200 × 24) = 5,000",
      timeframe: "90 days",
      dailyGoal: "2-3 strategic direct referrals, focus on team builders",
      resetAdvantage: "Retries start from half of max reached"
    },
    platinum: {
      scenario: "Advanced leadership - create sustainable growth systems",
      calculation: "10,000 network: e.g., 400 direct + (400 × 24) = 10,000", 
      timeframe: "150 days",
      dailyGoal: "3-4 strategic direct referrals, mentor team leaders",
      resetAdvantage: "Retries start from half of max reached"
    },
    diamond: {
      scenario: "Elite mastery - build massive sustainable networks",
      calculation: "25,000 network: e.g., 1,000+ direct + exponential growth",
      timeframe: "300 days",
      dailyGoal: "Build systematic recruitment and mentoring infrastructure",
      resetAdvantage: "Retries start from half of max reached"
    }
  };
}
