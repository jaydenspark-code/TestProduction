import { supabase } from '../lib/supabase';
import { paymentGatewayService, PaymentGateway } from './paymentGatewayService';
import { 
  AdvertisingPackage, 
  UserPackage, 
  PackagePurchase, 
  DEFAULT_PACKAGES 
} from '../types/package';

class PackageService {
  /**
   * Get all available packages
   */
  async getAvailablePackages(): Promise<AdvertisingPackage[]> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Using default packages');
      return DEFAULT_PACKAGES;
    }

    try {
      const { data, error } = await supabase
        .from('advertising_packages')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching packages:', error);
        return DEFAULT_PACKAGES;
      }

      return data?.map(pkg => ({
        ...pkg,
        created_at: new Date(pkg.created_at),
        updated_at: new Date(pkg.updated_at),
      })) || DEFAULT_PACKAGES;
    } catch (error) {
      console.error('Error fetching packages:', error);
      return DEFAULT_PACKAGES;
    }
  }

  /**
   * Get user's current active package
   */
  async getUserActivePackage(userId: string): Promise<UserPackage | null> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Using mock user package');
      const mockPackage = DEFAULT_PACKAGES[1]; // Professional package
      return {
        id: 'mock-user-package-1',
        userId,
        packageId: mockPackage.id,
        package: mockPackage,
        status: 'active',
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        remainingCampaigns: 7,
        remainingImpressions: 45000,
        remainingClicks: 2200,
        remainingBudget: 180000,
        paymentReference: 'MOCK-REF-123',
        autoRenew: false,
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_packages')
        .select(`
          *,
          advertising_packages (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user package:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        packageId: data.package_id,
        package: {
          ...data.advertising_packages,
          created_at: new Date(data.advertising_packages.created_at),
          updated_at: new Date(data.advertising_packages.updated_at),
        },
        status: data.status,
        purchaseDate: new Date(data.purchase_date),
        expiryDate: new Date(data.expiry_date),
        remainingCampaigns: data.remaining_campaigns,
        remainingImpressions: data.remaining_impressions,
        remainingClicks: data.remaining_clicks,
        remainingBudget: data.remaining_budget,
        paymentReference: data.payment_reference,
        autoRenew: data.auto_renew,
      };
    } catch (error) {
      console.error('Error fetching user package:', error);
      return null;
    }
  }

  /**
   * Initiate package purchase
   */
  async purchasePackage(
    userId: string,
    packageId: string,
    userEmail: string,
    gateway: PaymentGateway,
    callbackUrl?: string
  ): Promise<{ success: boolean; authorizationUrl?: string; error?: string }> {
    try {
      // Get package details
      const packages = await this.getAvailablePackages();
      const selectedPackage = packages.find(pkg => pkg.id === packageId);

      if (!selectedPackage) {
        return { success: false, error: 'Package not found' };
      }

      // Generate payment reference
      const reference = `PKG-${packageId}-${userId}-${Date.now()}`;

      // Create purchase record
      const purchase: Omit<PackagePurchase, 'id'> = {
        userId,
        packageId,
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        paymentGateway: gateway,
        paymentReference: reference,
        status: 'pending',
        metadata: {
          packageName: selectedPackage.name,
          duration: selectedPackage.duration,
        },
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Store purchase record in database
      if (supabase) {
        const { error } = await supabase
          .from('package_purchases')
          .insert([{
            user_id: purchase.userId,
            package_id: purchase.packageId,
            amount: purchase.amount,
            currency: purchase.currency,
            payment_gateway: purchase.paymentGateway,
            payment_reference: purchase.paymentReference,
            status: purchase.status,
            metadata: purchase.metadata,
          }]);

        if (error) {
          console.error('Error storing purchase record:', error);
          return { success: false, error: 'Failed to create purchase record' };
        }
      }

      // Initialize payment
      const paymentResult = await paymentGatewayService.initializePayment({
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        email: userEmail,
        reference,
        gateway,
        callbackUrl: callbackUrl || `${import.meta.env.VITE_APP_URL}/advertiser/payment/success`,
        metadata: {
          userId,
          packageId,
          packageName: selectedPackage.name,
          type: 'package_purchase',
        },
      });

      if (paymentResult.success) {
        return {
          success: true,
          authorizationUrl: paymentResult.authorizationUrl,
        };
      } else {
        return {
          success: false,
          error: paymentResult.error || 'Payment initialization failed',
        };
      }
    } catch (error: any) {
      console.error('Package purchase error:', error);
      return {
        success: false,
        error: error.message || 'Package purchase failed',
      };
    }
  }

  /**
   * Verify package purchase payment
   */
  async verifyPackagePurchase(
    paymentReference: string,
    gateway: PaymentGateway
  ): Promise<{ success: boolean; userPackage?: UserPackage; error?: string }> {
    try {
      // Verify payment with gateway
      const verificationResult = await paymentGatewayService.verifyPayment(
        paymentReference,
        gateway
      );

      if (!verificationResult.success) {
        return {
          success: false,
          error: 'Payment verification failed',
        };
      }

      // Get purchase record
      let purchaseRecord: PackagePurchase | null = null;

      if (supabase) {
        const { data, error } = await supabase
          .from('package_purchases')
          .select('*')
          .eq('payment_reference', paymentReference)
          .single();

        if (error) {
          console.error('Error fetching purchase record:', error);
          return { success: false, error: 'Purchase record not found' };
        }

        purchaseRecord = {
          id: data.id,
          userId: data.user_id,
          packageId: data.package_id,
          amount: data.amount,
          currency: data.currency,
          paymentGateway: data.payment_gateway,
          paymentReference: data.payment_reference,
          status: data.status,
          metadata: data.metadata,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
        };
      }

      if (!purchaseRecord) {
        return { success: false, error: 'Purchase record not found' };
      }

      // Get package details
      const packages = await this.getAvailablePackages();
      const packageDetails = packages.find(pkg => pkg.id === purchaseRecord!.packageId);

      if (!packageDetails) {
        return { success: false, error: 'Package details not found' };
      }

      // Create user package
      const userPackage = await this.activateUserPackage(
        purchaseRecord.userId,
        packageDetails,
        paymentReference
      );

      // Update purchase status
      if (supabase) {
        await supabase
          .from('package_purchases')
          .update({ status: 'completed' })
          .eq('payment_reference', paymentReference);
      }

      return {
        success: true,
        userPackage,
      };
    } catch (error: any) {
      console.error('Package purchase verification error:', error);
      return {
        success: false,
        error: error.message || 'Purchase verification failed',
      };
    }
  }

  /**
   * Activate user package after successful payment
   */
  private async activateUserPackage(
    userId: string,
    packageDetails: AdvertisingPackage,
    paymentReference: string
  ): Promise<UserPackage | null> {
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + packageDetails.duration * 24 * 60 * 60 * 1000);

      const userPackageData = {
        user_id: userId,
        package_id: packageDetails.id,
        status: 'active',
        purchase_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        remaining_campaigns: packageDetails.limits.maxCampaigns === -1 ? 999999 : packageDetails.limits.maxCampaigns,
        remaining_impressions: packageDetails.limits.maxImpressions,
        remaining_clicks: packageDetails.limits.maxClicks,
        remaining_budget: packageDetails.limits.maxBudget,
        payment_reference: paymentReference,
        auto_renew: false,
      };

      if (supabase) {
        // Deactivate any existing active packages
        await supabase
          .from('user_packages')
          .update({ status: 'cancelled' })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Create new user package
        const { data, error } = await supabase
          .from('user_packages')
          .insert([userPackageData])
          .select()
          .single();

        if (error) {
          console.error('Error creating user package:', error);
          return null;
        }

        return {
          id: data.id,
          userId: data.user_id,
          packageId: data.package_id,
          package: packageDetails,
          status: data.status,
          purchaseDate: new Date(data.purchase_date),
          expiryDate: new Date(data.expiry_date),
          remainingCampaigns: data.remaining_campaigns,
          remainingImpressions: data.remaining_impressions,
          remainingClicks: data.remaining_clicks,
          remainingBudget: data.remaining_budget,
          paymentReference: data.payment_reference,
          autoRenew: data.auto_renew,
        };
      }

      // Mock mode - return mock user package
      return {
        id: `mock-${Date.now()}`,
        userId,
        packageId: packageDetails.id,
        package: packageDetails,
        status: 'active',
        purchaseDate: now,
        expiryDate,
        remainingCampaigns: packageDetails.limits.maxCampaigns === -1 ? 999999 : packageDetails.limits.maxCampaigns,
        remainingImpressions: packageDetails.limits.maxImpressions,
        remainingClicks: packageDetails.limits.maxClicks,
        remainingBudget: packageDetails.limits.maxBudget,
        paymentReference,
        autoRenew: false,
      };
    } catch (error) {
      console.error('Error activating user package:', error);
      return null;
    }
  }

  /**
   * Check if user can create new campaign based on package limits
   */
  async canCreateCampaign(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const userPackage = await this.getUserActivePackage(userId);

    if (!userPackage) {
      return {
        allowed: false,
        reason: 'No active package. Please purchase a package to create campaigns.',
      };
    }

    if (userPackage.status !== 'active') {
      return {
        allowed: false,
        reason: 'Your package is not active. Please renew your package.',
      };
    }

    if (userPackage.expiryDate < new Date()) {
      return {
        allowed: false,
        reason: 'Your package has expired. Please renew your package.',
      };
    }

    if (userPackage.remainingCampaigns <= 0 && userPackage.package.limits.maxCampaigns !== -1) {
      return {
        allowed: false,
        reason: 'You have reached your campaign limit. Please upgrade your package.',
      };
    }

    return { allowed: true };
  }

  /**
   * Consume campaign quota when user creates a campaign
   */
  async consumeCampaignQuota(userId: string): Promise<boolean> {
    const userPackage = await this.getUserActivePackage(userId);

    if (!userPackage || userPackage.package.limits.maxCampaigns === -1) {
      return true; // Unlimited campaigns or no package restrictions
    }

    if (supabase) {
      const { error } = await supabase
        .from('user_packages')
        .update({
          remaining_campaigns: userPackage.remainingCampaigns - 1,
        })
        .eq('id', userPackage.id);

      if (error) {
        console.error('Error updating campaign quota:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Get package purchase history for user
   */
  async getPackagePurchaseHistory(userId: string): Promise<PackagePurchase[]> {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Using mock purchase history');
      return [
        {
          id: 'mock-purchase-1',
          userId,
          packageId: 'professional',
          amount: 15000,
          currency: 'NGN',
          paymentGateway: 'paystack',
          paymentReference: 'PKG-professional-123',
          status: 'completed',
          metadata: { packageName: 'Professional', duration: 30 },
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('package_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase history:', error);
        return [];
      }

      return data?.map(purchase => ({
        id: purchase.id,
        userId: purchase.user_id,
        packageId: purchase.package_id,
        amount: purchase.amount,
        currency: purchase.currency,
        paymentGateway: purchase.payment_gateway,
        paymentReference: purchase.payment_reference,
        status: purchase.status,
        metadata: purchase.metadata,
        created_at: new Date(purchase.created_at),
        updated_at: new Date(purchase.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }
  }

  /**
   * Cancel package auto-renewal
   */
  async cancelAutoRenewal(userId: string): Promise<boolean> {
    const userPackage = await this.getUserActivePackage(userId);

    if (!userPackage) {
      return false;
    }

    if (supabase) {
      const { error } = await supabase
        .from('user_packages')
        .update({ auto_renew: false })
        .eq('id', userPackage.id);

      if (error) {
        console.error('Error canceling auto-renewal:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Enable package auto-renewal
   */
  async enableAutoRenewal(userId: string): Promise<boolean> {
    const userPackage = await this.getUserActivePackage(userId);

    if (!userPackage) {
      return false;
    }

    if (supabase) {
      const { error } = await supabase
        .from('user_packages')
        .update({ auto_renew: true })
        .eq('id', userPackage.id);

      if (error) {
        console.error('Error enabling auto-renewal:', error);
        return false;
      }
    }

    return true;
  }
}

export const packageService = new PackageService();
export default packageService;
