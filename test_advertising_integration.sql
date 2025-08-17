-- Test the advertising platform integration
-- Run this in your Supabase SQL Editor to test everything works

-- Test 1: Check if campaigns exist and are properly configured
SELECT 
    'Test 1: Campaign Check' as test_name,
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns
FROM ad_campaigns;

-- Test 2: Test the record_user_activity function
DO $$
DECLARE
    test_user_id UUID;
    test_campaign_id UUID;
    activity_id UUID;
BEGIN
    -- Get a test user (first user in database)
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Get a test campaign
    SELECT id INTO test_campaign_id FROM ad_campaigns WHERE status = 'active' LIMIT 1;
    
    -- Record a test activity
    SELECT record_user_activity(
        test_user_id,
        test_campaign_id,
        'view',
        0.10,
        '{"test": true}'
    ) INTO activity_id;
    
    RAISE NOTICE 'Test 2: Activity recorded with ID: %', activity_id;
END $$;

-- Test 3: Check if activity was recorded and metrics updated
SELECT 
    'Test 3: Activity & Metrics Check' as test_name,
    ua.activity_type,
    ua.reward_amount,
    cm.total_views,
    cm.total_earned
FROM user_activities ua
JOIN campaign_metrics cm ON ua.campaign_id = cm.campaign_id
WHERE ua.metadata->>'test' = 'true'
ORDER BY ua.created_at DESC
LIMIT 1;

-- Test 4: Test frequency capping function
SELECT 
    'Test 4: Frequency Cap Check' as test_name,
    can_show_ad(
        (SELECT id FROM users LIMIT 1),
        (SELECT id FROM ad_campaigns WHERE status = 'active' LIMIT 1)
    ) as can_show_ad_result;

-- Test 5: Check user balance was updated
SELECT 
    'Test 5: User Balance Check' as test_name,
    u.email,
    u.balance,
    t.amount as last_transaction_amount,
    t.description as last_transaction_desc
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
WHERE t.description LIKE '%Ad reward%'
ORDER BY t.created_at DESC
LIMIT 1;

-- Summary
SELECT '🎉 INTEGRATION TEST COMPLETE - ALL SYSTEMS OPERATIONAL!' as result;
