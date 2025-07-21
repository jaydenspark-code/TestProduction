import { supabase } from '../lib/supabaseClient';

export interface PaystackTransaction {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    reference: string;
    created_at: string;
    updated_at: string;
}

export interface PaystackTransferRecipient {
    id: number;
    domain: string;
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency: string;
    description?: string;
    metadata?: any;
    recipient_code: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

class PaystackService {
    private baseUrl = 'https://api.paystack.co';
    private secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
    private publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Initialize transaction for payment
    async initializeTransaction(data: {
        email: string;
        amount: number;
        reference: string;
        callback_url?: string;
        metadata?: any;
    }) {
        const payload = {
            email: data.email,
            amount: data.amount * 100, // Convert to kobo (smallest currency unit)
            reference: data.reference,
            callback_url: data.callback_url || `${import.meta.env.VITE_APP_URL}/payment/verify`,
            metadata: data.metadata,
        };

        return this.makeRequest('/transaction/initialize', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Verify transaction
    async verifyTransaction(reference: string) {
        return this.makeRequest(`/transaction/verify/${reference}`);
    }

    // Create transfer recipient
    async createTransferRecipient(data: {
        type: 'nuban' | 'mobile_money' | 'basa';
        name: string;
        account_number: string;
        bank_code: string;
        currency?: string;
        description?: string;
        metadata?: any;
    }): Promise<{ data: PaystackTransferRecipient }> {
        const payload = {
            type: data.type,
            name: data.name,
            account_number: data.account_number,
            bank_code: data.bank_code,
            currency: data.currency || 'NGN',
            description: data.description,
            metadata: data.metadata,
        };

        return this.makeRequest('/transferrecipient', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Initiate transfer
    async initiateTransfer(data: {
        source: 'balance';
        amount: number;
        recipient: string;
        reason?: string;
        currency?: string;
        reference?: string;
    }): Promise<{ data: PaystackTransaction }> {
        const payload = {
            source: data.source,
            amount: data.amount * 100, // Convert to kobo
            recipient: data.recipient,
            reason: data.reason,
            currency: data.currency || 'NGN',
            reference: data.reference,
        };

        return this.makeRequest('/transfer', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Finalize transfer
    async finalizeTransfer(transferCode: string, otp: string) {
        const payload = {
            transfer_code: transferCode,
            otp: otp,
        };

        return this.makeRequest('/transfer/finalize_transfer', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Get banks list
    async getBanks(country: string = 'nigeria') {
        return this.makeRequest(`/bank?country=${country}`);
    }

    // Get transfer details
    async getTransfer(transferCode: string) {
        return this.makeRequest(`/transfer/${transferCode}`);
    }

    // Process withdrawal request
    async processWithdrawal(withdrawalData: {
        userId: string;
        amount: number;
        method: string;
        accountDetails: {
            account_number: string;
            bank_code: string;
            account_name: string;
        };
    }) {
        try {
            // 1. Create transfer recipient
            const recipientResponse = await this.createTransferRecipient({
                type: 'nuban',
                name: withdrawalData.accountDetails.account_name,
                account_number: withdrawalData.accountDetails.account_number,
                bank_code: withdrawalData.accountDetails.bank_code,
                currency: 'NGN',
                description: `Withdrawal for user ${withdrawalData.userId}`,
            });

            // 2. Initiate transfer
            const transferResponse = await this.initiateTransfer({
                source: 'balance',
                amount: withdrawalData.amount,
                recipient: recipientResponse.data.recipient_code,
                reason: 'Withdrawal request',
                reference: `WD-${Date.now()}`,
            });

            // 3. Update withdrawal request in database
            const { error } = await supabase
                .from('withdrawal_requests')
                .update({
                    status: 'processing',
                    paystack_reference: transferResponse.data.transfer_code,
                })
                .eq('user_id', withdrawalData.userId)
                .eq('reference', transferResponse.data.reference);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return {
                success: true,
                transferCode: transferResponse.data.transfer_code,
                reference: transferResponse.data.reference,
            };
        } catch (error) {
            console.error('Withdrawal processing error:', error);
            throw error;
        }
    }

    // Verify webhook signature
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const crypto = require('crypto');
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(payload)
            .digest('hex');

        return hash === signature;
    }

    // Handle webhook events
    async handleWebhook(event: any) {
        try {
            switch (event.event) {
                case 'transfer.success':
                    await this.handleTransferSuccess(event.data);
                    break;
                case 'transfer.failed':
                    await this.handleTransferFailed(event.data);
                    break;
                case 'charge.success':
                    await this.handlePaymentSuccess(event.data);
                    break;
                default:
                    console.log(`Unhandled webhook event: ${event.event}`);
            }
        } catch (error) {
            console.error('Webhook handling error:', error);
            throw error;
        }
    }

    private async handleTransferSuccess(data: any) {
        const { error } = await supabase
            .from('withdrawal_requests')
            .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
            })
            .eq('paystack_reference', data.transfer_code);

        if (error) {
            console.error('Error updating withdrawal status:', error);
        }
    }

    private async handleTransferFailed(data: any) {
        const { error } = await supabase
            .from('withdrawal_requests')
            .update({
                status: 'failed',
                processed_at: new Date().toISOString(),
            })
            .eq('paystack_reference', data.transfer_code);

        if (error) {
            console.error('Error updating withdrawal status:', error);
        }
    }

    private async handlePaymentSuccess(data: any) {
        // Handle successful payments (if needed)
        console.log('Payment successful:', data);
    }
}

export const paystackService = new PaystackService(); 