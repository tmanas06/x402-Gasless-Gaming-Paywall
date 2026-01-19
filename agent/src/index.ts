import { ethers } from "ethers";
import axios from "axios";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

interface X402Invoice {
  id: string;
  address: string;
  amount: string;
  currency: string;
  network: string;
  description: string;
  "X-Payment-Amount"?: string;
  "X-Payment-Currency"?: string;
  "X-Payment-To"?: string;
}

interface PaymentRule {
  maxPaymentPerTx: number;
  dailySpendingLimit: number;
  autoPayEnabled: boolean;
}

type AIType = "cronos" | "groq" | "both";

class AutoPayAgent {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private gameApiUrl: string;
  private rules: PaymentRule;
  private dailySpending: number = 0;
  private lastResetDate: Date;
  private groqClient: Groq | null = null;
  private aiType: AIType;

  constructor() {
    const rpcUrl = process.env.CRONOS_RPC || "https://evm-t3.cronos.org";
    const privateKey = process.env.AGENT_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("AGENT_PRIVATE_KEY not set in .env");
    }

    // Validate that private key is not a placeholder
    if (privateKey.includes("your_private_key_here") || privateKey.length < 64) {
      throw new Error(
        "AGENT_PRIVATE_KEY is not set correctly. Please set a valid private key in agent/.env file.\n" +
        "You can generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }

    // Validate private key format
    try {
      // Check if it's a valid hex string (with or without 0x prefix)
      const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
      if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        throw new Error("Invalid private key format");
      }
    } catch (error) {
      throw new Error(
        `Invalid AGENT_PRIVATE_KEY format. It must be a 64-character hex string (with or without 0x prefix).\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.gameApiUrl = process.env.BACKEND_URL || process.env.GAME_API_URL || "http://localhost:5000";

    this.rules = {
      maxPaymentPerTx: parseFloat(
        process.env.MAX_PAYMENT_PER_TX || "0.05"
      ),
      dailySpendingLimit: parseFloat(
        process.env.DAILY_SPENDING_LIMIT || "0.50"
      ),
      autoPayEnabled: process.env.AUTO_PAY_ENABLED === "true",
    };

    // Initialize AI type
    const aiTypeEnv = (process.env.AI_TYPE || "cronos").toLowerCase();
    this.aiType = (aiTypeEnv === "groq" || aiTypeEnv === "both") 
      ? (aiTypeEnv === "both" ? "both" : "groq")
      : "cronos";

    // Initialize GROQ client if needed
    if (this.aiType === "groq" || this.aiType === "both") {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        console.warn("⚠️  GROQ_API_KEY not set. AI features will be disabled.");
        this.aiType = "cronos";
      } else {
        this.groqClient = new Groq({
          apiKey: groqApiKey,
        });
        console.log(`✓ GROQ AI initialized (AI Type: ${this.aiType})`);
      }
    }

    this.lastResetDate = new Date();
  }

  async initialize() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`✓ Agent initialized: ${this.wallet.address}`);
      console.log(`✓ Agent balance: ${ethers.formatEther(balance)} tCRO`);
      console.log(`✓ Auto-pay rules:`, this.rules);
      console.log(`✓ AI Decision Type: ${this.aiType}`);
    } catch (error) {
      console.error("Failed to initialize agent:", error);
      throw error;
    }
  }

  private shouldResetDailyLimit() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return this.lastResetDate < midnight;
  }

  async canPay(amount: number, invoice?: X402Invoice): Promise<{ allowed: boolean; reason?: string }> {
    // Reset daily limit if needed
    if (this.shouldResetDailyLimit()) {
      this.dailySpending = 0;
      this.lastResetDate = new Date();
    }

    // Check if auto-pay is enabled
    if (!this.rules.autoPayEnabled) {
      return { allowed: false, reason: "Auto-pay disabled" };
    }

    // Rule-based checks (always performed)
    const ruleCheck = this.checkPaymentRules(amount);
    if (!ruleCheck.allowed) {
      return ruleCheck;
    }

    // AI-based decision making
    if (this.aiType === "groq" || this.aiType === "both") {
      if (invoice && this.groqClient) {
        const aiDecision = await this.askGROQ(invoice, amount);
        if (this.aiType === "groq") {
          // GROQ-only mode: use AI decision
          return aiDecision;
        } else {
          // Both mode: AI must approve AND rules must pass
          if (!aiDecision.allowed) {
            return aiDecision;
          }
        }
      }
    }

    return { allowed: true };
  }

  private checkPaymentRules(amount: number): { allowed: boolean; reason?: string } {
    // Check max payment per transaction
    if (amount > this.rules.maxPaymentPerTx) {
      return {
        allowed: false,
        reason: `Amount exceeds max payment per tx (${this.rules.maxPaymentPerTx})`,
      };
    }

    // Check daily spending limit
    if (this.dailySpending + amount > this.rules.dailySpendingLimit) {
      return {
        allowed: false,
        reason: `Daily spending limit would be exceeded`,
      };
    }

    return { allowed: true };
  }

  private async askGROQ(invoice: X402Invoice, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.groqClient) {
      return { allowed: false, reason: "GROQ client not initialized" };
    }

    try {
      const prompt = `You are an AI payment agent for a blockchain gaming platform. Evaluate whether to approve this payment request.

Payment Details:
- Amount: ${amount} USDC
- Invoice ID: ${invoice.id}
- Description: ${invoice.description}
- Recipient: ${invoice["X-Payment-To"] || "Unknown"}
- Network: ${invoice.network}
- Daily spending so far: ${this.dailySpending.toFixed(4)} USDC
- Daily limit: ${this.rules.dailySpendingLimit} USDC
- Max per transaction: ${this.rules.maxPaymentPerTx} USDC

Rules:
1. Amount must be reasonable for gaming (typically 0.01-0.05 USDC)
2. Daily spending should not exceed limits
3. Only approve legitimate gaming payments
4. Reject suspicious or unusually large amounts

Respond with ONLY a JSON object in this exact format:
{
  "allowed": true or false,
  "reason": "brief explanation"
}`;

      const completion = await this.groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a payment security agent. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      
      // Try to parse JSON from response
      let decision;
      try {
        // Extract JSON from response (handle cases where there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          decision = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse GROQ response:", responseText);
        // Fallback: if response contains "allowed" or "approve", allow it
        const lowerResponse = responseText.toLowerCase();
        decision = {
          allowed: lowerResponse.includes("allowed") || lowerResponse.includes("approve"),
          reason: "AI decision (parsed from text)",
        };
      }

      console.log(`🤖 GROQ Decision: ${decision.allowed ? "✓ Approved" : "✗ Denied"} - ${decision.reason}`);
      return {
        allowed: decision.allowed === true,
        reason: decision.reason || "AI evaluation",
      };
    } catch (error) {
      console.error("GROQ AI error:", error);
      // Fallback to rule-based decision on AI error
      return this.checkPaymentRules(amount);
    }
  }

  async processPayment(invoice: X402Invoice): Promise<{
    success: boolean;
    txHash?: string;
    signature?: string;
    error?: string;
  }> {
    try {
      const amount = parseFloat(invoice["X-Payment-Amount"] || "0");
      const amountInUsdc = amount / 1e6; // Convert from wei to USDC

      console.log(`\n💳 Processing payment...`);
      console.log(`  Amount: ${amountInUsdc} USDC`);
      console.log(`  Description: ${invoice.description}`);

      // Check if payment is allowed (pass invoice for AI evaluation)
      const canPay = await this.canPay(amountInUsdc, invoice);
      if (!canPay.allowed) {
        console.error(`  ✗ Payment denied: ${canPay.reason}`);
        return {
          success: false,
          error: canPay.reason,
        };
      }

      // Generate EIP-3009 signature for USDC.e transfer
      const signature = await this.generateAndSignEIP3009Transfer(
        invoice["X-Payment-To"] || "",
        invoice["X-Payment-Amount"] || "0"
      );

      // Update daily spending
      this.dailySpending += amountInUsdc;

      console.log(`  ✓ Payment authorized`);
      console.log(`  ✓ Signature: ${signature.substring(0, 30)}...`);

      return {
        success: true,
        signature,
        txHash: `0x${Date.now().toString(16)}`, // Mock tx hash
      };
    } catch (error) {
      console.error(`  ✗ Payment failed:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private async generateAndSignEIP3009Transfer(
    to: string,
    amount: string
  ): Promise<string> {
    try {
      // EIP-712 domain for USDC.e on Cronos testnet (chain ID 338)
      const domain = {
        name: "USD Coin",
        version: "2",
        chainId: 338,
        verifyingContract: process.env.USDC_T3 || "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
      };

      // EIP-3009 TransferWithAuthorization type definition
      const types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };

      // Generate random nonce
      const nonce = ethers.randomBytes(32);
      const now = Math.floor(Date.now() / 1000);
      const validBefore = now + parseInt(process.env.GAME_MAX_TIMEOUT || "300");

      // Create the transfer message
      const value = {
        from: this.wallet.address,
        to: to,
        value: amount,
        validAfter: 0,
        validBefore: validBefore,
        nonce: nonce,
      };

      // Sign the EIP-712 message
      const signature = await this.wallet.signTypedData(domain, types, value);

      // Return base64 encoded signature for X-PAYMENT header
      return Buffer.from(signature.substring(2), "hex").toString("base64");
    } catch (error) {
      console.error("Error generating EIP-3009 signature:", error);
      throw error;
    }
  }

  private generateEIP3009Signature(invoice: X402Invoice): string {
    // Legacy method - kept for compatibility
    const data = JSON.stringify({
      invoiceId: invoice.id,
      amount: invoice["X-Payment-Amount"],
      recipient: invoice["X-Payment-To"],
      nonce: Math.floor(Date.now() / 1000),
    });

    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  async run() {
    console.log("🤖 Gasless Arcade Auto-Pay Agent Started\n");

    // Check agent configuration
    const agentBalance = await this.provider.getBalance(this.wallet.address);
    console.log(`  Agent Address: ${this.wallet.address}`);
    console.log(`  Agent Balance: ${ethers.formatEther(agentBalance)} tCRO`);
    console.log(`  Chain ID: 338 (Cronos Testnet)`);
    console.log(`  USDC.e Contract: ${process.env.USDC_T3}`);
    console.log(`  Game API: ${this.gameApiUrl}`);
    console.log(`  Auto-Pay Enabled: ${this.rules.autoPayEnabled}`);
    console.log(`  Max Payment Per Tx: ${this.rules.maxPaymentPerTx} USDC`);
    console.log(`  Daily Spending Limit: ${this.rules.dailySpendingLimit} USDC\n`);

    if (agentBalance === 0n) {
      console.warn(
        "⚠️  Agent balance is 0. The agent won't be able to pay invoices."
      );
    }

    // Poll for invoices periodically
    setInterval(async () => {
      try {
        // In production, this would listen to 402 responses from the game API
        const currentBalance = await this.provider.getBalance(this.wallet.address);
        if (currentBalance > 0n) {
          console.log(`📡 Agent listening... (Balance: ${ethers.formatEther(currentBalance)} tCRO)`);
        }
      } catch (error) {
        console.error("Error in agent loop:", error);
      }
    }, 30000);

    // Keep the agent running
    console.log("📡 Agent listening for x402 invoices...\n");
  }
}

// Main execution
async function main() {
  try {
    const agent = new AutoPayAgent();
    await agent.initialize();
    await agent.run();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
