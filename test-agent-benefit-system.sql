-- =================================================================
-- TEST: AGENT BENEFIT SYSTEM WITH COOLDOWN PERIODS
-- =================================================================

-- Test cooldown period calculations
SELECT 
    'rookie' as tier, 
    get_cooldown_period('rookie') as cooldown_days
UNION ALL
SELECT 
    'bronze' as tier, 
    get_cooldown_period('bronze') as cooldown_days
UNION ALL
SELECT 
    'iron' as tier, 
    get_cooldown_period('iron') as cooldown_days
UNION ALL
SELECT 
    'steel' as tier, 
    get_cooldown_period('steel') as cooldown_days
UNION ALL
SELECT 
    'silver' as tier, 
    get_cooldown_period('silver') as cooldown_days;

-- Test scenario: Agent progression with benefits
-- Simulating agent "John" progressing through tiers

-- 1. Create test agent profile (would normally be done through user registration)
INSERT INTO agent_profiles (
    user_id, 
    current_tier, 
    current_challenge_tier,
    total_direct_referrals,
    challenge_direct_referrals,
    is_challenge_active,
    challenge_start_date,
    challenge_end_date
) VALUES (
    gen_random_uuid(),
    'bronze',  -- Current tier (enjoys 7% commission, 1x withdrawal/week)
    'iron',    -- Challenging for iron tier  
    100,       -- Has completed bronze requirement
    50,        -- 50/200 progress on iron challenge
    TRUE,      -- Currently in challenge
    NOW() - INTERVAL '3 days',  -- Started 3 days ago
    NOW() + INTERVAL '4 days'   -- 4 days remaining
);

-- Get the user_id for testing
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT user_id INTO test_user_id FROM agent_profiles WHERE current_tier = 'bronze' AND current_challenge_tier = 'iron' LIMIT 1;
    
    -- Test challenge status
    RAISE NOTICE 'Challenge Status for Agent:';
    PERFORM * FROM get_challenge_status(test_user_id);
    
    -- Test if agent can start challenge (should be TRUE since not in cooldown)
    RAISE NOTICE 'Can start challenge: %', can_start_challenge(test_user_id);
    
    -- Simulate final opportunity failure to test cooldown
    RAISE NOTICE 'Testing final opportunity failure...';
    PERFORM * FROM complete_final_opportunity(test_user_id);
    
    -- Check status after failure (should show cooldown)
    RAISE NOTICE 'Status after failure:';
    PERFORM * FROM get_challenge_status(test_user_id);
    
END $$;

-- =================================================================
-- BENEFIT VERIFICATION EXAMPLES
-- =================================================================

-- Example 1: Steel agent challenging Silver tier
-- Current benefits: 15% commission, 2x withdrawals/week
-- Goal: Complete Silver challenge for 20% commission, 2x withdrawals/week

SELECT 
    'Example: Steel Agent Challenging Silver' as scenario,
    at_current.commission_rate as current_commission,
    at_current.withdrawal_frequency as current_withdrawals,
    at_target.commission_rate as target_commission,
    at_target.withdrawal_frequency as target_withdrawals,
    'Benefits active during challenge: Current tier (Steel)' as note
FROM agent_tiers at_current
CROSS JOIN agent_tiers at_target
WHERE at_current.tier_name = 'steel' 
AND at_target.tier_name = 'silver';

-- Example 2: Commission calculation during challenge
-- Agent with Steel tier (15%) makes $1000 withdrawal
SELECT 
    'Steel Agent Withdrawal Example' as scenario,
    1000.00 as base_amount,
    15.00 as commission_rate_percent,
    (1000.00 * 15.00 / 100) as commission_earned,
    (1000.00 + (1000.00 * 15.00 / 100)) as total_amount_with_commission,
    'Uses current tier rate, not challenge tier rate' as important_note;

-- =================================================================
-- PROGRESSION TIMELINE EXAMPLE  
-- =================================================================

-- Show complete progression path with benefit activation points
SELECT 
    tier_name,
    display_name,
    referral_requirement,
    commission_rate,
    withdrawal_frequency,
    challenge_duration_days,
    'Benefits activate AFTER completing challenge' as benefit_timing
FROM agent_tiers 
ORDER BY referral_requirement;

COMMENT ON SCRIPT IS 'This test demonstrates the agent benefit system where agents enjoy current tier benefits during challenges and only upgrade benefits after successful completion.';
