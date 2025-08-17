-- Function to get the complete referral chain for multi-level commissions
CREATE OR REPLACE FUNCTION get_referral_chain(p_user_id UUID)
RETURNS TABLE(
    level1_referrer UUID,
    level2_referrer UUID,
    level3_referrer UUID
) AS $$
DECLARE
    l1_ref UUID;
    l2_ref UUID;
    l3_ref UUID;
BEGIN
    -- Get Level 1 referrer (direct referrer)
    SELECT referrer_id INTO l1_ref
    FROM referrals 
    WHERE referred_user_id = p_user_id;
    
    -- Get Level 2 referrer (referrer's referrer)
    IF l1_ref IS NOT NULL THEN
        SELECT referrer_id INTO l2_ref
        FROM referrals 
        WHERE referred_user_id = l1_ref;
    END IF;
    
    -- Get Level 3 referrer (referrer's referrer's referrer)
    IF l2_ref IS NOT NULL THEN
        SELECT referrer_id INTO l3_ref
        FROM referrals 
        WHERE referred_user_id = l2_ref;
    END IF;
    
    -- Return the chain
    RETURN QUERY SELECT l1_ref, l2_ref, l3_ref;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_chain TO authenticated;

-- Enhanced function to get referral stats with multi-level breakdown
CREATE OR REPLACE FUNCTION get_enhanced_referral_stats(user_uuid UUID)
RETURNS TABLE(
    total_referrals INTEGER,
    active_referrals INTEGER,
    pending_referrals INTEGER,
    level1_earnings DECIMAL(10,2),
    level2_earnings DECIMAL(10,2),
    level3_earnings DECIMAL(10,2),
    total_earnings DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH referral_levels AS (
        -- Direct referrals (Level 1)
        SELECT 
            r1.referrer_id,
            r1.commission_earned as level1_commission,
            r1.status as level1_status,
            -- Level 2 referrals (referrals of my referrals)
            r2.commission_earned as level2_commission,
            r2.status as level2_status,
            -- Level 3 referrals (referrals of my referrals' referrals)
            r3.commission_earned as level3_commission,
            r3.status as level3_status
        FROM referrals r1
        LEFT JOIN referrals r2 ON r1.referred_user_id = r2.referrer_id
        LEFT JOIN referrals r3 ON r2.referred_user_id = r3.referrer_id
        WHERE r1.referrer_id = user_uuid
    )
    SELECT 
        COUNT(*)::INTEGER as total_referrals,
        COUNT(*) FILTER (WHERE level1_status = 'active')::INTEGER as active_referrals,
        COUNT(*) FILTER (WHERE level1_status = 'pending')::INTEGER as pending_referrals,
        COALESCE(SUM(level1_commission), 0.00) as level1_earnings,
        COALESCE(SUM(level2_commission), 0.00) as level2_earnings,
        COALESCE(SUM(level3_commission), 0.00) as level3_earnings,
        COALESCE(SUM(level1_commission) + SUM(level2_commission) + SUM(level3_commission), 0.00) as total_earnings
    FROM referral_levels;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for enhanced stats
GRANT EXECUTE ON FUNCTION get_enhanced_referral_stats TO authenticated;
