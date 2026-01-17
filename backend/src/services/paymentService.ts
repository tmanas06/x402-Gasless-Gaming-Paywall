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

export class PaymentService {
  private payments: Map<string, PaymentRecord> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private provider: ethers.Provider | null = null;

  async initialize() {
    try {
      const rpcUrl = process.env.CRONOS_TESTNET_RPC || "https://evm-t3.cronos.org";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log("Payment service initialized with Cronos testnet");
    } catch (error) {
      console.error("Failed to initialize payment service:", error);
    }
  }

  generateInvoice(address: string): Invoice {
    const invoice: Invoice = {
      id: uuidv4(),
      address: address.toLowerCase(),
      amount: process.env.GAME_FEE_AMOUNT || "10000000",
      currency: process.env.GAME_FEE_CURRENCY || "USDC",
      network: "cronos-t3",
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
      // In production, verify the x402 payment signature here
      // For now, we'll accept any valid header format
      if (paymentHeader.startsWith("Bearer ")) {
        // Store the payment record
        const record: PaymentRecord = {
          address: address.toLowerCase(),
          amount: process.env.GAME_FEE_AMOUNT || "10000000",
          txHash: paymentHeader,
          timestamp: Date.now(),
        };
        this.payments.set(address.toLowerCase(), record);
        return true;
      }
    } catch (error) {
      console.error("Payment verification error:", error);
    }

    return false;
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
