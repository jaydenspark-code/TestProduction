-- Create user_referrals table for referral codes
CREATE TABLE IF NOT EXISTS user_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table for tracking referral relationships
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    commission_earned DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_user_id) -- One user can only be referred once
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_user_id ON user_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Enable RLS
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their own referral codes" ON user_referrals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes" ON user_referrals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON user_referrals
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update referral status" ON referrals
    FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Function to handle referral registration
CREATE OR REPLACE FUNCTION handle_referral_registration()
RETURNS TRIGGER AS $$
DECLARE
    referrer_user_id UUID;
    referral_code_used TEXT;
BEGIN
    -- Check if the new user was referred
    SELECT ref_code INTO referral_code_used 
    FROM NEW.raw_user_meta_data 
    WHERE ref_code IS NOT NULL;
    
    IF referral_code_used IS NOT NULL THEN
        -- Find the referrer
        SELECT user_id INTO referrer_user_id
        FROM user_referrals
        WHERE referral_code = referral_code_used;
        
        IF referrer_user_id IS NOT NULL THEN
            -- Create referral record
            INSERT INTO referrals (
                referrer_id, 
                referred_user_id, 
                referral_code, 
                status
            ) VALUES (
                referrer_user_id, 
                NEW.id, 
                referral_code_used, 
                'pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_referral_registration();

-- Function to activate referral when user pays
CREATE OR REPLACE FUNCTION activate_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    level1_commission DECIMAL(10,2) := 1.50; -- $1.50 for direct referral (sustainable)
    level2_commission DECIMAL(10,2) := 1.00; -- $1.00 for level 2 (sustainable)
    level3_commission DECIMAL(10,2) := 0.50; -- $0.50 for level 3 (sustainable)
    referrer_level1 UUID;
    referrer_level2 UUID;
    referrer_level3 UUID;
BEGIN
    -- Check if user just became paid and update referral status
    IF OLD.is_paid = FALSE AND NEW.is_paid = TRUE THEN
        -- Get Level 1 referrer (direct referrer)
        SELECT referrer_id INTO referrer_level1 
        FROM referrals 
        WHERE referred_user_id = NEW.id;
        
        IF referrer_level1 IS NOT NULL THEN
            -- Update Level 1 referral status and commission
            UPDATE referrals 
            SET status = 'active', 
                commission_earned = level1_commission,
                updated_at = NOW()
            WHERE referred_user_id = NEW.id;
            
            -- Add Level 1 commission to referrer's balance
            UPDATE users 
            SET balance = balance + level1_commission,
                updated_at = NOW()
            WHERE id = referrer_level1;
            
            -- Create Level 1 transaction record
            INSERT INTO transactions (
                user_id, 
                amount, 
                type, 
                description, 
                status
            ) VALUES (
                referrer_level1,
                level1_commission,
                'referral_bonus',
                'Level 1 referral commission - Direct referral activation',
                'completed'
            );
            
            -- Get Level 2 referrer (referrer's referrer)
            SELECT referrer_id INTO referrer_level2 
            FROM referrals 
            WHERE referred_user_id = referrer_level1;
            
            IF referrer_level2 IS NOT NULL THEN
                -- Add Level 2 commission
                UPDATE users 
                SET balance = balance + level2_commission,
                    updated_at = NOW()
                WHERE id = referrer_level2;
                
                -- Create Level 2 transaction record
                INSERT INTO transactions (
                    user_id, 
                    amount, 
                    type, 
                    description, 
                    status
                ) VALUES (
                    referrer_level2,
                    level2_commission,
                    'referral_bonus',
                    'Level 2 referral commission - Indirect referral activation',
                    'completed'
                );
                
                -- Get Level 3 referrer (referrer's referrer's referrer)
                SELECT referrer_id INTO referrer_level3 
                FROM referrals 
                WHERE referred_user_id = referrer_level2;
                
                IF referrer_level3 IS NOT NULL THEN
                    -- Add Level 3 commission
                    UPDATE users 
                    SET balance = balance + level3_commission,
                        updated_at = NOW()
                    WHERE id = referrer_level3;
                    
                    -- Create Level 3 transaction record
                    INSERT INTO transactions (
                        user_id, 
                        amount, 
                        type, 
                        description, 
                        status
                    ) VALUES (
                        referrer_level3,
                        level3_commission,
                        'referral_bonus',
                        'Level 3 referral commission - Multi-level activation',
                        'completed'
                    );
                END IF;
            END IF;
        END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user payment activation
DROP TRIGGER IF EXISTS on_user_paid_referral_commission ON users;
CREATE TRIGGER on_user_paid_referral_commission
    AFTER UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION activate_referral_commission();

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid UUID)
RETURNS TABLE(
    total_referrals INTEGER,
    active_referrals INTEGER,
    pending_referrals INTEGER,
    total_earnings DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_referrals,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_referrals,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_referrals,
        COALESCE(SUM(commission_earned), 0.00) as total_earnings
    FROM referrals
    WHERE referrer_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_referrals TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
