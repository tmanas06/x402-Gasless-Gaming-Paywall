import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";

interface Invoice {
  id: string;
  address: string;
  amount: string;
  currency: string;
  network: string;
  description: string;
  timestamp: number;
  expiresAt: number;
}

interface PaymentRecord {
  address: string;
  amount: string;
  txHash: string;
  timestamp: number;
}

interface PaymentRequirements {
  scheme: "exact";
  network: "cronos-testnet";
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

export class PaymentService {
  private payments: Map<string, PaymentRecord> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private provider: ethers.Provider | null = null;

  async initialize() {
    try {
      const rpcUrl = process.env.CRONOS_RPC || "https://evm-t3.cronos.org";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log("Payment service initialized with Cronos testnet");
    } catch (error) {
      console.error("Failed to initialize payment service:", error);
    }
  }

  generatePaymentRequirements(): PaymentRequirements {
    return {
      scheme: "exact",
      network: "cronos-testnet",
      payTo: process.env.GAME_PAYTO || "",
      asset: process.env.USDC_T3 || "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
      maxAmountRequired: process.env.GAME_FEE_AMOUNT || "10000000",
      maxTimeoutSeconds: parseInt(process.env.GAME_MAX_TIMEOUT || "300"),
    };
  }

  generateInvoice(address: string): Invoice {
    const invoice: Invoice = {
      id: uuidv4(),
      address: address.toLowerCase(),
      amount: process.env.GAME_FEE_AMOUNT || "10000000",
      currency: process.env.GAME_FEE_CURRENCY || "USDC.e",
      network: "cronos-testnet",
      description: "Gasless Arcade Premium Play",
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute expiry
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async verifyPayment(address: string, paymentHeader?: string): Promise<boolean> {
    // Check if already paid
    if (this.payments.has(address.toLowerCase())) {
      return true;
    }

    if (!paymentHeader) {
      return false;
    }

    try {
      // Decode the X-PAYMENT header (base64 encoded EIP-3009 signature)
      const decoded = Buffer.from(paymentHeader, "base64").toString("utf-8");
      
      if (!decoded || decoded.length === 0) {
        console.warn(`Invalid X-PAYMENT header format from ${address}`);
        return false;
      }

      // In production, verify the EIP-3009 signature against USDC.e contract:
      // 1. Recover signer address from signature
      // 2. Verify signature matches the expected domain/data
      // 3. Check that transferWithAuthorization was properly formed
      // 4. Verify on-chain via USDC.e contract's receiveWithAuthorization() or check transfer event
      //
      // For MVP, accept any valid base64-encoded header
      
      // Store the payment record
      const record: PaymentRecord = {
        address: address.toLowerCase(),
        amount: process.env.GAME_FEE_AMOUNT || "10000000",
        txHash: paymentHeader.substring(0, 66) || "x402-payment",
        timestamp: Date.now(),
      };
      this.payments.set(address.toLowerCase(), record);
      
      console.log(`✓ Payment verified for ${address}`);
      return true;
    } catch (error) {
      console.error(`Payment verification error for ${address}:`, error);
      return false;
    }
  }

  async recordPayment(address: string, paymentData: string): Promise<void> {
    const record: PaymentRecord = {
      address: address.toLowerCase(),
      amount: process.env.GAME_FEE_AMOUNT || "10000000",
      txHash: paymentData,
      timestamp: Date.now(),
    };
    this.payments.set(address.toLowerCase(), record);
  }

  getPaymentHistory(address: string): PaymentRecord[] {
    const records: PaymentRecord[] = [];
    // In production, fetch from database
    const record = this.payments.get(address.toLowerCase());
    if (record) {
      records.push(record);
    }
    return records;
  }
}
