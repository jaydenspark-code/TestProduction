// AI Development Data Seeder
// This script populates the database with realistic sample data for AI features
// Set ENABLE_AI_SEEDING=false in production to disable

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use service role for seeding
const enableSeeding = process.env.ENABLE_AI_SEEDING !== 'false'; // Default to true in dev

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for seeding');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class AIDataSeeder {
  constructor() {
    this.countries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IN', 'BR', 'NG', 'ZA'];
    this.platforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'facebook'];
    this.seededUserIds = [];
  }

  async seedDatabase() {
    if (!enableSeeding) {
      console.log('🚫 AI data seeding is disabled (ENABLE_AI_SEEDING=false)');
      return;
    }

    console.log('🌱 Starting AI development data seeding...');

    try {
      // Check if we already have sufficient data
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .limit(10);

      if (existingUsers && existingUsers.length >= 50) {
        console.log('✅ Sufficient sample data already exists, skipping seeding');
        return;
      }

      // Seed in order (due to foreign key dependencies)
      await this.seedUsers(100);
      await this.seedTransactions(500);
      await this.seedReferrals(200);
      await this.seedCampaigns(20);
      await this.seedAgentApplications(30);
      await this.seedAdvertiserApplications(15);
      await this.seedUserBehavior(300);
      await this.seedAIMetrics();

      console.log('✅ AI development data seeding completed successfully!');
      console.log('📊 You can now test all AI features with realistic data');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    }
  }

  async seedUsers(count = 100) {
    console.log(`👥 Seeding ${count} users...`);
    
    const users = [];
    const referralCodes = new Set();

    for (let i = 0; i < count; i++) {
      let referralCode;
      do {
        referralCode = faker.string.alphanumeric(8).toUpperCase();
      } while (referralCodes.has(referralCode));
      referralCodes.add(referralCode);

      const joinDate = faker.date.between({
        from: '2023-01-01',
        to: new Date()
      });

      const user = {
        email: faker.internet.email(),
        full_name: faker.person.fullName(),
        country: faker.helpers.arrayElement(this.countries),
        phone: faker.phone.number().substring(0, 20), // Ensure max 20 chars
        is_verified: faker.datatype.boolean(0.7), // 70% verified
        is_paid: faker.datatype.boolean(0.8), // 80% paid
        role: faker.helpers.weightedArrayElement([
          { weight: 70, value: 'user' },
          { weight: 20, value: 'agent' },
          { weight: 8, value: 'advertiser' },
          { weight: 2, value: 'admin' }
        ]),
        balance: faker.number.float({ min: 0, max: 500, fractionDigits: 2 }),
        total_earned: faker.number.float({ min: 0, max: 2000, fractionDigits: 2 }),
        referral_code: referralCode,
        created_at: joinDate,
        updated_at: joinDate
      };

      users.push(user);
    }

    const { data, error } = await supabase
      .from('users')
      .insert(users)
      .select('id');

    if (error) throw error;
    
    this.seededUserIds = data.map(u => u.id);
    console.log(`✅ Created ${data.length} users`);
  }

  async seedTransactions(count = 500) {
    console.log(`💰 Seeding ${count} transactions...`);
    
    if (this.seededUserIds.length === 0) {
      // Get existing user IDs if we didn't just create them
      const { data } = await supabase.from('users').select('id').limit(100);
      this.seededUserIds = data?.map(u => u.id) || [];
    }

    const transactions = [];
    const types = ['earning', 'withdrawal', 'bonus', 'referral'];
    
    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);
      const amount = type === 'withdrawal' 
        ? faker.number.float({ min: 10, max: 200, fractionDigits: 2 })
        : faker.number.float({ min: 1, max: 50, fractionDigits: 2 });

      const transaction = {
        user_id: faker.helpers.arrayElement(this.seededUserIds),
        type,
        amount,
        description: this.generateTransactionDescription(type),
        reference: `TXN${Date.now()}${i}`,
        status: faker.helpers.weightedArrayElement([
          { weight: 85, value: 'completed' },
          { weight: 10, value: 'pending' },
          { weight: 5, value: 'failed' }
        ]),
        created_at: faker.date.between({
          from: '2023-01-01',
          to: new Date()
        })
      };

      transactions.push(transaction);
    }

    const { error } = await supabase
      .from('transactions')
      .insert(transactions);

    if (error) throw error;
    console.log(`✅ Created ${count} transactions`);
  }

  async seedReferrals(count = 200) {
    console.log(`🔗 Seeding ${count} referrals...`);
    
    const referrals = [];
    const usedPairs = new Set();

    for (let i = 0; i < count; i++) {
      let referrerId, referredId;
      let pairKey;
      
      do {
        referrerId = faker.helpers.arrayElement(this.seededUserIds);
        referredId = faker.helpers.arrayElement(this.seededUserIds);
        pairKey = `${referrerId}-${referredId}`;
      } while (referrerId === referredId || usedPairs.has(pairKey));
      
      usedPairs.add(pairKey);

      const referral = {
        referrer_id: referrerId,
        referred_id: referredId,
        status: faker.helpers.weightedArrayElement([
          { weight: 60, value: 'completed' },
          { weight: 25, value: 'pending' },
          { weight: 15, value: 'cancelled' }
        ]),
        reward_amount: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
        created_at: faker.date.between({
          from: '2023-01-01',
          to: new Date()
        })
      };

      if (referral.status === 'completed') {
        referral.completed_at = faker.date.between({
          from: referral.created_at,
          to: new Date()
        });
      }

      referrals.push(referral);
    }

    const { error } = await supabase
      .from('referrals')
      .insert(referrals);

    if (error) throw error;
    console.log(`✅ Created ${count} referrals`);
  }

  async seedCampaigns(count = 20) {
    console.log(`📢 Seeding ${count} campaigns...`);
    
    // Get advertiser users
    const { data: advertisers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'advertiser');

    if (!advertisers || advertisers.length === 0) {
      console.log('⚠️ No advertisers found, skipping campaigns');
      return;
    }

    const campaigns = [];
    
    for (let i = 0; i < count; i++) {
      const startDate = faker.date.between({
        from: '2023-01-01',
        to: new Date()
      });

      const campaign = {
        advertiser_id: faker.helpers.arrayElement(advertisers).id,
        title: faker.commerce.productName() + ' Campaign',
        description: faker.lorem.sentences(2),
        budget: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }),
        reward_per_referral: faker.number.float({ min: 5, max: 50, fractionDigits: 2 }),
        max_referrals: faker.number.int({ min: 100, max: 1000 }),
        status: faker.helpers.arrayElement(['active', 'paused', 'completed']),
        start_date: startDate,
        end_date: faker.date.future({ refDate: startDate }),
        created_at: startDate
      };

      campaigns.push(campaign);
    }

    const { error } = await supabase
      .from('campaigns')
      .insert(campaigns);

    if (error) throw error;
    console.log(`✅ Created ${count} campaigns`);
  }

  async seedAgentApplications(count = 30) {
    console.log(`👨‍💼 Seeding ${count} agent applications...`);
    
    const applications = [];
    
    for (let i = 0; i < count; i++) {
      const application = {
        user_id: faker.helpers.arrayElement(this.seededUserIds),
        status: faker.helpers.weightedArrayElement([
          { weight: 40, value: 'pending' },
          { weight: 35, value: 'approved' },
          { weight: 25, value: 'rejected' }
        ]),
        experience: faker.lorem.paragraphs(2),
        motivation: faker.lorem.paragraphs(1),
        social_media_links: [
          `https://instagram.com/${faker.internet.userName()}`,
          `https://youtube.com/@${faker.internet.userName()}`
        ],
        portfolio_url: faker.internet.url(),
        submitted_at: faker.date.between({
          from: '2023-01-01',
          to: new Date()
        })
      };

      if (application.status !== 'pending') {
        application.reviewed_at = faker.date.future({ refDate: application.submitted_at });
        application.feedback = faker.lorem.sentences(1);
      }

      applications.push(application);
    }

    const { error } = await supabase
      .from('agent_applications')
      .insert(applications);

    if (error) throw error;
    console.log(`✅ Created ${count} agent applications`);
  }

  async seedAdvertiserApplications(count = 15) {
    console.log(`🏢 Seeding ${count} advertiser applications...`);
    
    const applications = [];
    
    for (let i = 0; i < count; i++) {
      const application = {
        user_id: faker.helpers.arrayElement(this.seededUserIds),
        status: faker.helpers.weightedArrayElement([
          { weight: 30, value: 'pending' },
          { weight: 50, value: 'approved' },
          { weight: 20, value: 'rejected' }
        ]),
        business_name: faker.company.name(),
        business_type: faker.helpers.arrayElement(['Technology', 'E-commerce', 'Healthcare', 'Education', 'Finance']),
        website_url: faker.internet.url(),
        budget_range: faker.helpers.arrayElement(['$1,000 - $5,000', '$5,000 - $10,000', '$10,000+']),
        target_audience: faker.lorem.sentences(1),
        campaign_description: faker.lorem.paragraphs(1),
        submitted_at: faker.date.between({
          from: '2023-01-01',
          to: new Date()
        })
      };

      if (application.status !== 'pending') {
        application.reviewed_at = faker.date.future({ refDate: application.submitted_at });
        application.feedback = faker.lorem.sentences(1);
      }

      applications.push(application);
    }

    const { error } = await supabase
      .from('advertiser_applications')
      .insert(applications);

    if (error) throw error;
    console.log(`✅ Created ${count} advertiser applications`);
  }

  async seedUserBehavior(count = 300) {
    console.log(`📊 Seeding ${count} user behavior logs...`);
    
    // This requires the AI features schema to be applied
    try {
      const behaviors = [];
      const actions = ['login', 'referral_click', 'withdrawal_request', 'profile_update', 'campaign_view'];
      
      for (let i = 0; i < count; i++) {
        const behavior = {
          user_id: faker.helpers.arrayElement(this.seededUserIds),
          action: faker.helpers.arrayElement(actions),
          metadata: {
            platform: faker.helpers.arrayElement(this.platforms),
            device: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
            location: faker.location.country()
          },
          created_at: faker.date.between({
            from: '2023-01-01',
            to: new Date()
          })
        };

        behaviors.push(behavior);
      }

      const { error } = await supabase
        .from('user_behavior_logs')
        .insert(behaviors);

      if (error && !error.message.includes('relation "user_behavior_logs" does not exist')) {
        throw error;
      }
      
      if (error) {
        console.log('⚠️ User behavior table not found (AI schema not applied), skipping...');
      } else {
        console.log(`✅ Created ${count} behavior logs`);
      }
    } catch (error) {
      console.log('⚠️ Could not seed user behavior data:', error.message);
    }
  }

  async seedAIMetrics() {
    console.log('🤖 Seeding AI metrics and segments...');
    
    try {
      // Seed user segments
      const segments = [
        {
          name: 'High Value Users',
          description: 'Users with high earnings and engagement',
          criteria: { min_earnings: 100, min_referrals: 5 },
          size: 20
        },
        {
          name: 'Growing Users',
          description: 'Users showing growth potential',
          criteria: { min_earnings: 25, activity_level: 'medium' },
          size: 45
        },
        {
          name: 'New Users',
          description: 'Recently joined users',
          criteria: { days_since_join: 30 },
          size: 35
        }
      ];

      const { error: segmentError } = await supabase
        .from('user_segments')
        .insert(segments);

      if (segmentError && !segmentError.message.includes('relation "user_segments" does not exist')) {
        throw segmentError;
      }

      console.log('✅ AI metrics seeded successfully');
    } catch (error) {
      console.log('⚠️ AI metrics tables not found (AI schema not applied), skipping...');
    }
  }

  generateTransactionDescription(type) {
    const descriptions = {
      earning: ['Task completion bonus', 'Referral reward', 'Daily login bonus', 'Campaign participation'],
      withdrawal: ['Bank withdrawal', 'PayPal withdrawal', 'Crypto withdrawal'],
      bonus: ['Welcome bonus', 'Milestone achievement', 'Special promotion'],
      referral: ['Successful referral', 'Referral milestone bonus', 'Friend joined bonus']
    };

    return faker.helpers.arrayElement(descriptions[type] || ['Transaction']);
  }
}

// Run the seeder
const seeder = new AIDataSeeder();
seeder.seedDatabase().then(() => {
  console.log('🎉 Database seeding completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});
