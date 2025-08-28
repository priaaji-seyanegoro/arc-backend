import midtransClient from 'midtrans-client';
import { MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION } from '../config/env';
import { logger } from '../utils/logger';

interface PaymentItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
}

interface CustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  billing_address?: {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country_code: string;
  };
  shipping_address?: {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country_code: string;
  };
}

interface TransactionDetails {
  order_id: string;
  gross_amount: number;
}

interface CreateTransactionParams {
  transaction_details: TransactionDetails;
  item_details: PaymentItem[];
  customer_details: CustomerDetails;
  enabled_payments?: string[];
  custom_expiry?: {
    order_time: string;
    expiry_duration: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
}

interface MidtransResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  bca_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}

interface WebhookNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
  settlement_time?: string;
  refund_amount?: string;
  refund_key?: string;
}

class PaymentService {
  private snap: any;
  private core: any;

  constructor() {
    // Initialize Snap API
    this.snap = new midtransClient.Snap({
      isProduction: MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY
    });

    // Initialize Core API
    this.core = new midtransClient.CoreApi({
      isProduction: MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY
    });

    logger.info('Payment service initialized', {
      service: 'payment-service',
      isProduction: MIDTRANS_IS_PRODUCTION === 'true'
    });
  }

  /**
   * Create transaction token for Snap payment
   */
  async createTransaction(params: CreateTransactionParams): Promise<{
    token: string;
    redirect_url: string;
  }> {
    try {
      logger.info('Creating transaction', {
        service: 'payment-service',
        orderId: params.transaction_details.order_id,
        amount: params.transaction_details.gross_amount
      });

      const transaction = await this.snap.createTransaction(params);
      
      logger.info('Transaction created successfully', {
        service: 'payment-service',
        orderId: params.transaction_details.order_id,
        token: transaction.token
      });

      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url
      };
    } catch (error: any) {
      logger.error('Failed to create transaction', {
        service: 'payment-service',
        orderId: params.transaction_details.order_id,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to create payment transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(orderId: string): Promise<MidtransResponse> {
    try {
      logger.info('Getting transaction status', {
        service: 'payment-service',
        orderId
      });

      const response = await this.core.transaction.status(orderId);
      
      logger.info('Transaction status retrieved', {
        service: 'payment-service',
        orderId,
        status: response.transaction_status
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to get transaction status', {
        service: 'payment-service',
        orderId,
        error: error.message
      });
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(orderId: string): Promise<MidtransResponse> {
    try {
      logger.info('Canceling transaction', {
        service: 'payment-service',
        orderId
      });

      const response = await this.core.transaction.cancel(orderId);
      
      logger.info('Transaction canceled', {
        service: 'payment-service',
        orderId,
        status: response.transaction_status
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to cancel transaction', {
        service: 'payment-service',
        orderId,
        error: error.message
      });
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  /**
   * Approve transaction (for challenge fraud status)
   */
  async approveTransaction(orderId: string): Promise<MidtransResponse> {
    try {
      logger.info('Approving transaction', {
        service: 'payment-service',
        orderId
      });

      const response = await this.core.transaction.approve(orderId);
      
      logger.info('Transaction approved', {
        service: 'payment-service',
        orderId,
        status: response.transaction_status
      });

      return response;
    } catch (error: any) {
      logger.error('Failed to approve transaction', {
        service: 'payment-service',
        orderId,
        error: error.message
      });
      throw new Error(`Failed to approve transaction: ${error.message}`);
    }
  }

  /**
   * Verify webhook notification signature
   */
  verifyWebhookSignature(notification: WebhookNotification): boolean {
    try {
      const { order_id, status_code, gross_amount, signature_key } = notification;
      const serverKey = MIDTRANS_SERVER_KEY;
      
      // Create signature
      const crypto = require('crypto');
      const hash = crypto
        .createHash('sha512')
        .update(order_id + status_code + gross_amount + serverKey)
        .digest('hex');

      const isValid = hash === signature_key;
      
      logger.info('Webhook signature verification', {
        service: 'payment-service',
        orderId: order_id,
        isValid
      });

      return isValid;
    } catch (error: any) {
      logger.error('Failed to verify webhook signature', {
        service: 'payment-service',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhookNotification(notification: WebhookNotification): Promise<{
    orderId: string;
    transactionStatus: string;
    fraudStatus?: string;
    paymentType: string;
    grossAmount: string;
  }> {
    try {
      // Verify signature first
      if (!this.verifyWebhookSignature(notification)) {
        throw new Error('Invalid webhook signature');
      }

      const {
        order_id,
        transaction_status,
        fraud_status,
        payment_type,
        gross_amount
      } = notification;

      logger.info('Processing webhook notification', {
        service: 'payment-service',
        orderId: order_id,
        transactionStatus: transaction_status,
        fraudStatus: fraud_status,
        paymentType: payment_type
      });

      return {
        orderId: order_id,
        transactionStatus: transaction_status,
        fraudStatus: fraud_status,
        paymentType: payment_type,
        grossAmount: gross_amount
      };
    } catch (error: any) {
      logger.error('Failed to process webhook notification', {
        service: 'payment-service',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  getAvailablePaymentMethods(): string[] {
    return [
      'credit_card',
      'mandiri_clickpay',
      'cimb_clicks',
      'bca_klikbca',
      'bca_klikpay',
      'bri_epay',
      'echannel',
      'permata_va',
      'bca_va',
      'bni_va',
      'other_va',
      'gopay',
      'shopeepay',
      'indomaret',
      'alfamart',
      'akulaku'
    ];
  }

  /**
   * Create custom expiry time
   */
  createCustomExpiry(duration: number, unit: 'second' | 'minute' | 'hour' | 'day' = 'hour') {
    const now = new Date();
    const orderTime = now.toISOString().replace(/\.\d{3}Z$/, ' +0700');
    
    return {
      order_time: orderTime,
      expiry_duration: duration,
      unit
    };
  }
}

export default new PaymentService();
export { PaymentItem, CustomerDetails, TransactionDetails, CreateTransactionParams, MidtransResponse, WebhookNotification };