# X402 - Gasless Gaming Paywall
## Complete Technical Documentation

A blockchain-integrated gaming DApp combining **x402 Payment Protocol**, **AI-powered automation**, and **crypto rewards** on Cronos Testnet.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [X402 Protocol Deep Dive](#x402-protocol-deep-dive)
4. [AI Integration](#ai-integration)
5. [Games Explained](#games-explained)
6. [Reward System](#reward-system)
7. [Smart Contracts](#smart-contracts)
8. [Development Setup](#development-setup)
9. [Deployment Guide](#deployment-guide)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What Is This?

X402 is a **freemium blockchain gaming platform** where:
- Users play **3 different games** for free (3 plays each)
- After free plays exhaust → **x402 payment protocol** kicks in
- **AI Agent** automatically evaluates and processes payments
- Players earn **tCRO cryptocurrency rewards** based on scores
- **AI gaming assistant** provides tips and strategies

### Key Features

✅ **3 Playable Games**
- Bubble Tap (pop bubbles, avoid bombs, collect power-ups)
- Snake (classic gameplay with crypto twist)
- Crypto Dodger (dodge bombs, collect coins)

✅ **x402 Payment Integration**
- HTTP 402 Payment Required status
- Standardized payment headers
- Invoice-based payment requests
- 5-minute invoice expiry

✅ **AI Payment Agent**
- Autonomous invoice evaluation
- Rule-based + LLM-powered decisions
- Daily spending limits ($0.50)
- Max per transaction ($0.05)

✅ **Rewards System**
- Earn tCRO on scores ≥100 points
- Formula: 100 points = 1 tCRO
- Prevent duplicate claims
- Blockchain-verified claims

✅ **Gaming Assistant AI**
- GROQ AI (Llama 3.3 70B)
- Game-specific tips
- Strategy guidance
- Fallback rule-based system

---

## Architecture

### Monorepo Structure

```
X402/
├── frontend/          # Next.js 15.2 React DApp
│   ├── app/          # Page routes
│   │   ├── page.tsx  # Landing page
│   │   ├── game/     # Game hub
│   │   ├── leaderboard/
│   │   ├── ai-chat/
│   │   └── profile/
│   ├── components/   # React components
│   │   ├── MainNavbar.tsx     # Navigation
│   │   ├── game.tsx           # Bubble Tap (1056 lines)
│   │   ├── SnakeGame.tsx      # Snake (778 lines)
│   │   ├── CryptoDodger.tsx   # Crypto Dodger (657 lines)
│   │   ├── providers.tsx      # Privy + Theme
│   │   └── navbar.tsx         # Wallet connector
│   ├── lib/
│   │   ├── viem.ts           # Contract interactions
│   │   ├── keyCache.ts       # Private key storage
│   │   └── utils.ts
│   └── public/       # Assets
│
├── backend/           # Express.js TypeScript server
│   ├── src/
│   │   ├── server.ts  # Main app (218 lines)
│   │   └── services/
│   │       ├── gameService.ts        # Game state
│   │       ├── paymentService.ts     # x402 invoices
│   │       ├── rewardService.ts      # tCRO transfers
│   │       └── aiChatService.ts      # AI chat
│   └── Dockerfile
│
├── agent/             # Payment automation
│   ├── src/
│   │   └── index.ts   # AutoPayAgent (360 lines)
│   ├── generate-key.js
│   └── Dockerfile
│
├── contracts/         # Hardhat + Solidity
│   ├── contracts/
│   │   ├── GameRewards.sol  # Main contract
│   │   └── MockUSDC.sol     # Test token
│   ├── scripts/
│   │   ├── deploy.js
│   │   ├── deploy-mock-usdc.js
│   │   ├── fund-treasury.js
│   │   └── update-contract-address.js
│   └── deployments/  # Deployment info
│
├── docker-compose.yml # Service orchestration
├── package.json       # Root monorepo scripts
├── DEPLOYMENT.md      # Deployment instructions
└── README.md         # Quick start guide
```

### Service Dependencies

```
Frontend (port 3000)
    ↓
Backend (port 5000)
    ├─→ GameService (in-memory state)
    ├─→ PaymentService (x402 invoices)
    ├─→ RewardService (blockchain rewards)
    └─→ AIChatService (GROQ API)

Agent (autonomous)
    ├─→ Monitors invoices (GROQ)
    ├─→ Evaluates rules
    ├─→ Sends payments
    └─→ Tracks spending

Contracts (Cronos Testnet)
    ├─→ GameRewards (reward distribution)
    └─→ MockUSDC (test token)
```

---

## X402 Protocol Deep Dive

### What is x402?

x402 is an **HTTP protocol extension** built on HTTP **402 Payment Required** status code. It defines standardized headers for requesting blockchain payments before granting access to resources.

**Standard References**:
- [RFC 3229 - 402 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- x402 Protocol Spec (emerging standard)

### Implementation Flow

#### **Phase 1: Free Play Tracking**

```
User Address → Free Play Counter (in-memory)
  ├─ Play 1 → Count = 1
  ├─ Play 2 → Count = 2
  ├─ Play 3 → Count = 3
  └─ Play 4 → Count = 3 (max reached)
```

**Code Reference**: [gameService.ts](backend/src/services/gameService.ts)

```typescript
private freePlayCounts: Map<string, number> = new Map();

getFreePlayCount(address: string): number {
  return this.freePlayCounts.get(address.toLowerCase()) || 0;
}

incrementFreePlayCount(address: string): void {
  const current = this.getFreePlayCount(address);
  this.freePlayCounts.set(address.toLowerCase(), current + 1);
}
```

**Limitations**:
- In-memory only (resets on server restart)
- No database persistence
- Production should use PostgreSQL/MongoDB

---

#### **Phase 2: Check Free Plays & Return 402**

**Endpoint**: `GET /api/play?address=0x...`

**Code Reference**: [server.ts lines 41-94](backend/src/server.ts)

```typescript
app.get("/api/play", async (req: Request, res: Response) => {
  const address = req.query.address as string;
  const freePlayCount = gameService.getFreePlayCount(address);

  if (freePlayCount >= parseInt(process.env.GAME_FREE_PLAYS || "3")) {
    // ⚠️ FREE PLAYS EXHAUSTED - Return 402
    const invoice = paymentService.generateInvoice(address);

    res.status(402).set({
      "X-Payment-Required": "true",
      "X-Payment-Amount": "10000000", // 0.01 USDC (6 decimals)
      "X-Payment-Currency": "USDC",
      "X-Payment-Network": "cronos-t3",
      "X-Payment-To": process.env.FACILITATOR_ADDRESS || "",
      "X-Payment-Description": "Continue playing Gasless Arcade",
      "X-Invoice-Id": invoice.id,
    }).json({
      error: "Payment required",
      message: "Pay 0.01 USDC to continue playing",
      invoice: {
        id: invoice.id,
        address: address,
        amount: "10000000",
        currency: "USDC",
        network: "cronos-t3",
        description: "Gasless Arcade Premium Play",
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
      },
    });
  } else {
    // ✅ ALLOW FREE PLAY
    const gameData = gameService.getGameData(address, false);
    gameService.incrementFreePlayCount(address);

    res.json({
      allowed: true,
      isPremium: false,
      freePlayRemaining: 3 - freePlayCount - 1,
      gameData: {
        gameId: `game_${Date.now()}`,
        levelDifficulty: 1,
        rewards: ["xp"], // Free: xp only
        powerUps: ["shield"], // Free: 1 power-up
      },
    });
  }
});
```

**Response Breakdown**:

**HTTP 402 Response** (payment needed):
```json
{
  "error": "Payment required",
  "message": "Pay 0.01 USDC to continue playing",
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "address": "0x1234...5678",
    "amount": "10000000",
    "currency": "USDC",
    "network": "cronos-t3",
    "description": "Gasless Arcade Premium Play",
    "timestamp": 1705700000000,
    "expiresAt": 1705700300000
  }
}
```

**HTTP 200 Response** (can play):
```json
{
  "allowed": true,
  "isPremium": false,
  "freePlayRemaining": 1,
  "gameData": {
    "gameId": "game_1705700000000",
    "levelDifficulty": 1,
    "rewards": ["xp"],
    "powerUps": ["shield"]
  }
}
```

**Premium Differences** (after payment):
```
Free Play          vs    Premium Play
────────────────────────────────────────
Difficulty: 1           Difficulty: 2
Rewards: ["xp"]         Rewards: ["xp", "coins", "gem"]
Power-ups: ["shield"]   Power-ups: ["shield", "timefreeze", "doubletap", "multiplier"]
```

---

#### **Phase 3: X402 Headers Explained**

When 402 is returned, these headers are included:

| Header | Value | Type | Purpose |
|--------|-------|------|---------|
| `X-Payment-Required` | `true` | Boolean flag | Indicates payment needed |
| `X-Payment-Amount` | `10000000` | String (wei) | Amount in smallest units (6 decimals for USDC) |
| `X-Payment-Currency` | `USDC` | String | Token type to use |
| `X-Payment-Network` | `cronos-t3` | String | Blockchain network |
| `X-Payment-To` | `0x...` | Address | Destination wallet (facilitator) |
| `X-Payment-Description` | String | String | Human-readable description |
| `X-Invoice-Id` | UUID | String | Unique invoice identifier |

**How Frontend Uses Headers**:

```typescript
const response = await fetch(`/api/play?address=${address}`);

if (response.status === 402) {
  // Parse headers
  const amount = response.headers.get("X-Payment-Amount");
  const currency = response.headers.get("X-Payment-Currency");
  const invoiceId = response.headers.get("X-Invoice-Id");
  
  // Display payment modal
  showPaymentModal({
    amount: amount,
    currency: currency,
    invoiceId: invoiceId,
    message: "Pay to continue playing"
  });
}
```

---

#### **Phase 4: Agent Invoice Processing**

**Code Reference**: [agent/src/index.ts](agent/src/index.ts)

Agent continuously monitors for invoices and evaluates payment decisions.

**Decision Tree**:

```
Invoice Received
    ↓
Auto-pay enabled? ───No──→ ❌ Reject
    │ Yes
    ↓
Rule Check
    ├─ Amount ≤ max ($0.05)? ───No──→ ❌ Reject
    ├─ Amount ≤ daily left? ───No──→ ❌ Reject
    └─ Both pass? ───Yes──→ ✅ Continue
         ↓
AI Enabled?
    ├─ AI_TYPE = "cronos" ───→ Skip AI, approve ✅
    ├─ AI_TYPE = "groq" ───→ Ask GROQ AI ⬇️
    └─ AI_TYPE = "both" ───→ Ask GROQ + Rules both must pass ⬇️
         ↓
    GROQ Evaluates:
    ├─ Amount reasonable for gaming?
    ├─ Recipient legitimate?
    ├─ User spending pattern normal?
    └─ No signs of fraud?
         ├─ All yes → ✅ Approve
         └─ Any no → ❌ Reject
             ↓
    Send Payment ✅
    ├─ Sign tx with agent wallet
    ├─ Send USDC to facilitator
    ├─ Wait for confirmation
    └─ Log tx hash
```

**Rule Check Implementation**:

```typescript
private checkPaymentRules(amount: number): { allowed: boolean; reason?: string } {
  // Check 1: Max per transaction
  if (amount > this.rules.maxPaymentPerTx) {
    return {
      allowed: false,
      reason: `Amount exceeds max payment per tx (${this.rules.maxPaymentPerTx})`
    };
  }

  // Check 2: Daily spending limit
  if (this.shouldResetDailyLimit()) {
    this.dailySpending = 0; // Reset at midnight UTC
    this.lastResetDate = new Date();
  }

  if (this.dailySpending + amount > this.rules.dailySpendingLimit) {
    return {
      allowed: false,
      reason: `Daily spending limit would be exceeded`
    };
  }

  return { allowed: true };
}
```

**Rules Configuration**:

```typescript
this.rules = {
  maxPaymentPerTx: 0.05,    // Set via MAX_PAYMENT_PER_TX env
  dailySpendingLimit: 0.50, // Set via DAILY_SPENDING_LIMIT env
  autoPayEnabled: true,     // Set via AUTO_PAY_ENABLED env
};
```

**Environment Variables**:
```bash
# agent/.env
AGENT_PRIVATE_KEY=<wallet_private_key>
CRONOS_RPC=https://evm-t3.cronos.org
GROQ_API_KEY=<your_groq_api_key>
AI_TYPE=both                           # cronos | groq | both
AUTO_PAY_ENABLED=true
MAX_PAYMENT_PER_TX=0.05
DAILY_SPENDING_LIMIT=0.50
GAME_API_URL=http://backend:5000
```

---

#### **Phase 5: Payment Execution**

Once approved, agent sends transaction:

```typescript
async sendPayment(invoice: X402Invoice, amount: number): Promise<string> {
  try {
    // Create transaction
    const tx = await this.wallet.sendTransaction({
      to: invoice["X-Payment-To"],
      value: ethers.parseUnits(amount.toString(), 6), // USDC: 6 decimals
    });

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log(`✅ Payment sent: ${amount} USDC`);
    console.log(`📝 Tx Hash: ${receipt.hash}`);
    console.log(`⏱️  Block: ${receipt.blockNumber}`);

    // Update daily spending
    this.dailySpending += amount;

    return receipt.hash;
  } catch (error) {
    console.error("Payment failed:", error);
    throw error;
  }
}
```

**What Happens on Chain**:
1. Agent signs transaction with private key
2. USDC transferred from agent wallet to facilitator
3. Transaction confirmed on Cronos testnet
4. Can be viewed on [Testnet Explorer](https://testnet.cronoscan.com/)

**Example Transaction**:
```
From: 0xAgent...Address
To: 0xFacilitator...Address
Token: USDC (0x94ec3c...)
Amount: 0.01 USDC
Gas: ~60,000 (varies)
Status: ✅ Success
```

---

#### **Phase 6: Frontend Retry & Verification**

After payment, frontend retries:

```typescript
// User sees payment modal
// Agent processes and pays
// User clicks "I've paid" or auto-retry

const response = await fetch(`/api/play?address=${address}`);

if (response.ok) {
  // ✅ Payment verified
  const data = await response.json();
  startGame({
    isPremium: data.isPremium, // true after payment
    gameData: data.gameData,   // Premium features unlocked
    ...
  });
}
```

**Backend Payment Verification**:

```typescript
app.post("/api/verify-payment", async (req: Request, res: Response) => {
  const { address, paymentHeader } = req.body;

  // Verify x402 payment header (signature verification)
  const isValid = await paymentService.verifyPayment(address, paymentHeader);

  if (isValid) {
    await paymentService.recordPayment(address, paymentHeader);
    res.json({ success: true, message: "Payment verified" });
  } else {
    res.status(402).json({ success: false, error: "Invalid payment" });
  }
});
```

**Note**: Current implementation accepts any Bearer token. Production should verify cryptographic signatures.

---

## AI Integration

### Overview

The system uses **two AI approaches**:

1. **GROQ AI** - LLM-powered (primary)
2. **Cronos AI** - Rule-based fallback

### GROQ AI - LLM System

#### **1. Gaming Chat Assistant**

**Endpoint**: `POST /api/ai-chat`

**Code Reference**: [aiChatService.ts](backend/src/services/aiChatService.ts)

```typescript
export class AIChatService {
  private groqClient: Groq | null = null;

  constructor() {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      this.groqClient = new Groq({ apiKey: groqApiKey });
      console.log("✓ GROQ AI Chat Service initialized");
    } else {
      console.warn("⚠️ GROQ_API_KEY not set. AI chat will use fallback.");
    }
  }

  async getChatResponse(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    // Try GROQ first
    if (this.groqClient) {
      try {
        return await this.getGROQResponse(message, conversationHistory);
      } catch (error) {
        console.error("GROQ error, falling back to rule-based AI");
        // Fall back to Cronos AI
        return this.getFallbackResponse(message);
      }
    }
    return this.getFallbackResponse(message);
  }
}
```

#### **2. GROQ API Call Details**

```typescript
private async getGROQResponse(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const systemPrompt = `You are an AI Gaming Assistant for "Gasless Arcade".

Your role:
- Help players improve gaming skills and strategies
- Explain the rewards system (100 points = 1 tCRO)
- Provide tips for different games
- Guide users on achievements
- Be friendly, encouraging, and helpful

Games:
- Bubble Tap: Pop bubbles, avoid bombs, collect power-ups (score → rewards)
- Snake: Classic snake with crypto twist
- Crypto Dodger: Dodge bombs, collect coins (score → rewards)

Rewards: Available in classic mode (3 lives) with minimum 100 points
All games support rewards when scoring 100+ points

Keep responses concise and focused on gaming.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 for context
    { role: "user", content: message },
  ];

  const completion = await this.groqClient.chat.completions.create({
    messages: messages as any,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.7, // Balanced creativity
    max_tokens: 500,   // Limit response length
  });

  return completion.choices[0]?.message?.content || "";
}
```

**Parameters Explained**:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `model` | `llama-3.3-70b-versatile` | 70B parameter Llama model |
| `temperature` | 0.7 | Creativity (0=deterministic, 1=random) |
| `max_tokens` | 500 | Response length limit |
| `messages` | Array | Conversation history + system prompt |

**Example Chat Session**:

```
User: "How do I get more points in Bubble Tap?"

System Prompt: [Gaming assistant instructions]

GROQ Response:
💡 AI Assistant: Pop bubbles rapidly to build combo multipliers! 
Quick taps = more points! Avoid red bombs - they're game enders!
Use power-ups strategically for maximum combo potential!
Target the higher-value bubbles (purple and pink) for 2x points.
```

#### **3. Frontend Chat Integration**

**Page**: [app/ai-chat/page.tsx](frontend/app/ai-chat/page.tsx)

```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  // Build conversation history
  const conversationHistory = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add user message to UI
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);

  try {
    // Call backend AI endpoint
    const response = await fetch(`${API_URL}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage.content,
        conversationHistory: conversationHistory
      })
    });

    const data = await response.json();

    if (data.success && data.response) {
      // Add AI response to UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  } catch (error) {
    // Fallback to static response on error
    const aiResponse = generateAIResponse(input);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date()
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

**UI Features**:
- Real-time message display
- Typing indicator while AI responds
- Conversation history maintained
- Graceful fallback on API errors

---

### Cronos AI - Rule-Based Fallback

**Code Reference**: [aiChatService.ts lines 115-148](backend/src/services/aiChatService.ts)

```typescript
private getFallbackResponse(message: string): string {
  const messageLower = message.toLowerCase();

  const responses: { [key: string]: string } = {
    "bubble": `💡 Bubble Tap Tips:
• Quick taps build multipliers
• Avoid red bombs (instant game over)
• Collect green shields for protection
• Purple bubbles = 2x points
• Freeze power-up stops bombs temporarily
• Target 100+ points for rewards`,

    "snake": `🐍 Snake Tips:
• Plan your route 5 steps ahead
• Trap food near walls for longer growth
• Avoid your own tail at all costs
• Patience beats speed every time
• Edge strategy: stay near walls
• Target 100+ points for rewards`,

    "crypto": `⚡ Crypto Dodger Tips:
• Coin collection is priority #1
• Use freeze power-ups strategically
• Avoid bomb patterns by recognizing timing
• Stay centered when overwhelmed
• Collect 3+ coins per spawn for combos
• Target 100+ points for rewards`,

    "reward": `💰 Rewards Explained:
• Calculation: 100 points = 1 tCRO
• Available in Classic Mode (3 lives)
• Minimum score needed: 100 points
• All 3 games support rewards
• Claim directly from game end screen
• Rewards sent to your connected wallet`,

    "payment": `💳 Payment System:
• 3 free plays per address
• After free plays → x402 payment required
• Cost: 0.01 USDC per session
• Agent auto-approves safe payments
• Payment via Cronos testnet
• Instant play activation after payment`,

    "help": `🤖 I can help with:
• Game strategies & tips
• Rewards system explanation
• Achievement guidance
• How payment works
• Game mechanics details
Ask anything about gaming!`,
  };

  // Check for keyword matches
  for (const [keyword, response] of Object.entries(responses)) {
    if (messageLower.includes(keyword)) {
      return response;
    }
  }

  // Default response
  return `🤖 I'm your Gaming Assistant! Ask me about:
• Game tips (bubble, snake, crypto)
• Rewards system
• Payment & free plays
• Game mechanics`;
}
```

**How It Works**:
1. Convert message to lowercase
2. Search for keyword matches
3. Return pre-written response if match found
4. If no match → Return default response
5. Always instant (no API latency)

**Advantages**:
- No API costs
- Instant responses
- Always works (no API failures)
- Predictable behavior

**Disadvantages**:
- Limited to hardcoded keywords
- No context understanding
- Can't answer novel questions
- No learning capability

---

### AI Payment Decision Making

**Code Reference**: [agent/src/index.ts lines 168-210](agent/src/index.ts)

When payment invoice is received and `AI_TYPE=groq` or `AI_TYPE=both`:

```typescript
private async askGROQ(
  invoice: X402Invoice,
  amount: number
): Promise<{ allowed: boolean; reason?: string }> {
  if (!this.groqClient) {
    return { allowed: false, reason: "GROQ client not initialized" };
  }

  try {
    const prompt = `You are an AI payment agent for a blockchain gaming platform.
Evaluate whether to approve this payment request.

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
1. Amount must be reasonable for gaming (0.01-0.05 USDC)
2. Recipient should be legitimate gaming platform
3. Consider user's spending pattern
4. Prevent fraud/exploitation
5. Gaming payments are typically small & frequent

Decision:
Should I approve this payment? Respond with JSON only:
{ "approved": true/false, "reason": "explanation" }`;

    const completion = await this.groqClient.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.3, // Low temp for consistent, logical decisions
      max_tokens: 200,  // Short response
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      return {
        allowed: decision.approved,
        reason: decision.reason
      };
    }

    return { allowed: false, reason: "Could not parse AI decision" };
  } catch (error) {
    console.error("GROQ decision error:", error);
    return { allowed: false, reason: "AI evaluation failed" };
  }
}
```

**Key Differences from Chat AI**:
- **Temperature 0.3** (low) → Consistent, logical decisions
- **Max 500 tokens** → Prevents verbose responses
- **JSON format** → Structured decision output
- **No conversation history** → Each decision evaluated independently
- **Purpose-built prompt** → Focuses on payment legitimacy

**Example Approval**:
```json
{
  "approved": true,
  "reason": "Amount reasonable for gaming, recipient legitimate, spending pattern normal"
}
```

**Example Rejection**:
```json
{
  "approved": false,
  "reason": "Amount would exceed daily spending limit ($0.50)"
}
```

---

### AI Configuration

**Environment Variables**:

```bash
# backend/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# agent/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
AI_TYPE=both  # Options: cronos | groq | both
```

**AI_TYPE Modes**:

| Mode | Behavior | Best For |
|------|----------|----------|
| `"cronos"` | Rule-based only, no GROQ calls | Budget-friendly, offline mode |
| `"groq"` | GROQ AI only, bypasses rules | Trust AI completely |
| `"both"` | Rules AND GROQ, both must approve | Maximum safety (layered validation) |

**How Agent Decides** (with `AI_TYPE=both`):

```
Payment arrives
    ↓
Check rule limits ✓
    ├─ Amount ≤ max ($0.05)? ───No──→ ❌ REJECT
    ├─ Amount ≤ daily left? ───No──→ ❌ REJECT
    └─ Pass? ───Yes──→ Continue
         ↓
Ask GROQ AI ✓
    ├─ Legitimate payment? ───No──→ ❌ REJECT
    ├─ Normal spending pattern? ───No──→ ❌ REJECT
    └─ Pass? ───Yes──→ Continue
         ↓
✅ APPROVE PAYMENT
```

---

## Games Explained

### 1. Bubble Tap (`game.tsx` - 1056 lines)

**Type**: Tap-based arcade game

**Mechanics**:
- Pop bubbles by tapping/clicking
- Avoid red bomb bubbles
- Collect green shield power-ups
- Build combos for multipliers

**Game Modes**:

| Mode | Duration | Lives | Features |
|------|----------|-------|----------|
| **Classic** | Unlimited | 3 | Rewards enabled, bombs, shields |
| **Time Attack** | 60 seconds | 3 | Fast-paced, bonus multipliers |
| **Survival** | Unlimited | ∞ | Difficulty increases, no rewards |

**Bubble Types**:

```typescript
interface Bubble {
  id: string
  x: number
  y: number
  size: number
  color: string
  speed: number
  type: "normal" | "bonus" | "bomb" | "powerup"
  powerUpType?: "freeze"
  points: number
}
```

| Type | Color | Points | Effect |
|------|-------|--------|--------|
| **Normal** | Various | 10 | Pop for points |
| **Bonus** | Gold | 50 | Double points |
| **Bomb** | Red | -1 life | Game over |
| **Shield** | Green | 5 | Extra life |
| **Freeze** | Blue | 20 | Freeze all movement |

**Rewards**:
- Minimum: 100 points
- Calculation: `score ÷ 100 = tCRO`
- Example: 500 points = 5 tCRO

**Code Highlights**:
- Canvas-based rendering
- Collision detection
- Combo multiplier system
- Power-up mechanics
- Blockchain reward claiming

---

### 2. Snake Game (`SnakeGame.tsx` - 778 lines)

**Type**: Grid-based classic game

**Mechanics**:
- Control snake with arrow keys or WASD
- Eat food to grow
- Avoid walls and your own tail
- Grow longer with each food eaten

**Grid System**:
```typescript
const GRID_SIZE = 20;      // 20x20 grid
const GAME_SPEED = 100;    // Update every 100ms
```

**Snake State**:
```typescript
snakeRef.current = [
  { x: 10, y: 10 },  // Head
  { x: 9, y: 10 },   // Segment 1
  { x: 8, y: 10 },   // Segment 2
  // ...etc
]
```

**Food Spawning**:
```typescript
const generateFood = useCallback(() => {
  let x = Math.floor(Math.random() * GRID_SIZE);
  let y = Math.floor(Math.random() * GRID_SIZE);
  
  // Ensure food doesn't spawn on snake
  const isOnSnake = snakeRef.current.some(
    segment => segment.x === x && segment.y === y
  );
  if (isOnSnake) generateFood(); // Retry
  
  foodRef.current = { x, y };
}, []);
```

**Collision Detection**:
- Wall collision → Game over
- Self collision → Game over
- Food collision → Growth + point

**Features**:
- Responsive canvas sizing
- Mobile touch controls
- High score tracking
- Smooth 60 FPS gameplay

**Rewards**:
- Minimum: 100 points
- Calculation: `score ÷ 100 = tCRO`

---

### 3. Crypto Dodger (`CryptoDodger.tsx` - 657 lines)

**Type**: Vertical scrolling dodger

**Mechanics**:
- Move left/right to avoid bombs
- Collect falling coins
- Use freeze power-ups strategically
- Survive endless waves

**Game Area**:
```typescript
const gameWidth = 300;
const gameHeight = 500;
const playerSize = 40;
const moveStep = 20; // Movement increment
```

**Falling Objects**:

| Type | Spawn Rate | Effect | Color |
|------|-----------|--------|-------|
| **Coin** | 70% | +10 points | Gold |
| **Bomb** | 20% | -1 life | Red |
| **Freeze** | 10% | Slow objects | Blue |

**Freeze Mechanic**:
```typescript
const gameLoop = () => {
  // When freeze active, slow down falling objects
  newObjects = objects.map(obj => ({
    ...obj,
    y: obj.y + (freezeActive ? obj.speed * 0.3 : obj.speed)
  }));
};
```

**Level Progression**:
- Speed increases every 1000 points
- Objects spawn more frequently
- Difficulty curve keeps game engaging

**Features**:
- Arrow key controls (desktop)
- Swipe controls (mobile)
- Visual feedback for collisions
- Sound effects (optional)

**Rewards**:
- Minimum: 100 points
- Calculation: `score ÷ 100 = tCRO`

---

## Reward System

### How Rewards Work

**Formula**: `Score ÷ 100 = tCRO Amount`

**Example**:
- Score 150 → 1 tCRO
- Score 500 → 5 tCRO
- Score 1000 → 10 tCRO

### Claim Flow

```
User Finishes Game (Score ≥ 100)
    ↓
Frontend: GET /api/claim-reward
    ├─ address: "0x..."
    ├─ score: 500
    └─ gameMode: "classic"
        ↓
Backend: RewardService.sendReward()
    ├─ Check score ≥ 100 ✓
    ├─ Calculate: 500 ÷ 100 = 5 tCRO
    ├─ Check duplicate (within 5 min) ✓
    ├─ Check wallet balance ✓
    ├─ Sign transaction
    └─ Send tCRO
        ↓
    Blockchain confirms ✅
        ↓
Frontend: Display "5 tCRO claimed!"
    ↓
User: Wallet receives 5 tCRO
```

### Duplicate Prevention

**Code Reference**: [rewardService.ts](backend/src/services/rewardService.ts)

```typescript
// Prevent duplicate claims for same score in same game mode
const recentRewards = Array.from(this.rewards.values()).filter(
  (r) => r.address === playerAddress.toLowerCase() && 
         r.score === score && 
         r.gameMode === gameMode &&
         (Date.now() - r.timestamp) < 5 * 60 * 1000 // Within 5 minutes
);

if (recentRewards.length > 0) {
  return {
    success: false,
    error: "Reward already claimed for this game session",
    rewardAmount,
  };
}
```

**Logic**:
- User can't claim same score twice in 5 minutes
- Different scores = separate claims allowed
- Different game modes = separate claims allowed
- Timeframe: 5 minutes (configurable)

### Transaction Details

```typescript
async sendReward(playerAddress: string, score: number): Promise<...> {
  // 1. Calculate reward
  const rewardAmount = this.calculateReward(score);
  // Example: 500 points → "5000000000000000000" wei (5 tCRO)

  // 2. Check balance
  const balance = await this.provider.getBalance(this.wallet.address);
  if (balance < rewardAmountBigInt) {
    return { success: false, error: "Insufficient funds in reward wallet" };
  }

  // 3. Send transaction
  const tx = await this.wallet.sendTransaction({
    to: playerAddress,
    value: rewardAmountBigInt, // In wei
  });

  // 4. Wait for confirmation
  const receipt = await tx.wait();

  // 5. Return result
  return {
    success: true,
    txHash: receipt.hash,
    rewardAmount: rewardAmount,
  };
}
```

**Blockchain Details**:
- Network: Cronos Testnet (Chain ID 338)
- Token: Cronos Native Token (tCRO)
- Gas: ~21,000 units (standard transfer)
- Speed: ~2-5 seconds confirmation
- Cost: Minimal (testnet)

### Reward History

Players can view their reward history:

```typescript
getRewardHistory(address: string): RewardRecord[] {
  const addressLower = address.toLowerCase();
  return Array.from(this.rewards.values()).filter(
    (r) => r.address === addressLower
  );
}
```

**Record Format**:
```typescript
interface RewardRecord {
  address: string;
  score: number;
  rewardAmount: string; // In wei
  txHash?: string;
  timestamp: number;
  gameMode: string;
}
```

---

## Smart Contracts

### GameRewards Contract

**Address**: `0x33c070F5225E8d5715692968183031dF1B401d44`

**Network**: Cronos Testnet (Chain ID 338)

**File**: [contracts/GameRewards.sol](contracts/contracts/GameRewards.sol)

```solidity
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameRewards is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    address public treasury;
    uint256 public rewardAmount;
    
    mapping(address => bool) public hasClaimed;
    uint256 public totalRewardsDistributed;
    
    function claimReward() external nonReentrant {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(usdc.balanceOf(treasury) >= rewardAmount, "Insufficient funds");
        
        hasClaimed[msg.sender] = true;
        totalRewardsDistributed += rewardAmount;
        
        require(
            usdc.transferFrom(treasury, msg.sender, rewardAmount),
            "Transfer failed"
        );
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }
    
    function setRewardAmount(uint256 newAmount) external onlyOwner {
        rewardAmount = newAmount;
        emit RewardAmountUpdated(newAmount);
    }
    
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
}
```

**Functions**:

| Function | Access | Purpose |
|----------|--------|---------|
| `claimReward()` | Public | One-time claim per address |
| `setRewardAmount()` | Owner | Update reward amount |
| `setTreasury()` | Owner | Update treasury address |
| `getContractInfo()` | View | Get current state |

**Events**:
- `RewardClaimed(address indexed player, uint256 amount)`
- `RewardAmountUpdated(uint256 newAmount)`
- `TreasuryUpdated(address indexed newTreasury)`

---

### MockUSDC Contract

**Address**: `0x94ec3cA5359A20f01912f4F7e4D464C8A52f467b`

**File**: [contracts/MockUSDC.sol](contracts/contracts/MockUSDC.sol)

```solidity
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // Mint 1 million USDC to deployer
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6; // Like real USDC
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**Features**:
- ERC20 standard token
- 6 decimals (matches real USDC)
- Mintable for testing
- Deploys with 1M tokens

---

## Development Setup

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**
- **Docker** (optional, for containerization)

### Installation

**1. Clone Repository**
```bash
git clone https://github.com/tmanas06/x402-Gasless-Gaming-Paywall.git
cd x402-Gasless-Gaming-Paywall
```

**2. Install Root Dependencies**
```bash
npm install
```

This installs `concurrently` for running multiple services.

**3. Install Service Dependencies**
```bash
npm run install:all
```

Or manually:
```bash
cd frontend && npm install
cd ../backend && npm install
cd ../agent && npm install
cd ../contracts && npm install
```

### Environment Setup

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
```

**Backend** (`backend/.env`):
```bash
PORT=5000
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
REWARD_WALLET_PRIVATE_KEY=your_wallet_private_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GAME_FREE_PLAYS=3
GAME_FEE_AMOUNT=10000000
GAME_FEE_CURRENCY=USDC
FACILITATOR_ADDRESS=0x...
```

**Agent** (`agent/.env`):
```bash
AGENT_PRIVATE_KEY=your_agent_wallet_key
CRONOS_RPC=https://evm-t3.cronos.org
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
AI_TYPE=both
AUTO_PAY_ENABLED=true
MAX_PAYMENT_PER_TX=0.05
DAILY_SPENDING_LIMIT=0.50
GAME_API_URL=http://localhost:5000
```

**Contracts** (`contracts/.env`):
```bash
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
AGENT_PRIVATE_KEY=your_deployer_key
USDC_ADDRESS=0x94ec3cA5359A20f01912f4F7e4D464C8A52f467b
```

### Running Development Mode

**All Services Concurrently**:
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`
- Agent (background service)

**Individual Services**:
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Agent only
npm run dev:agent
```

### Building

```bash
npm run build
```

Builds all services in production mode.

### Running Production

```bash
npm run start
```

---

## Deployment Guide

### Smart Contracts

**1. Deploy MockUSDC**
```bash
cd contracts
npm run deploy:mock-usdc
```

**Output**: `contracts/deployments/mock-usdc.json`
```json
{
  "contractAddress": "0x94ec3cA5359A20f01912f4F7e4D464C8A52f467b",
  "network": "cronosTestnet",
  "deployer": "0x...",
  "deployedAt": "2024-01-19T10:00:00Z"
}
```

**2. Deploy GameRewards**
```bash
npm run deploy
```

**Output**: `contracts/deployments/cronos-testnet.json`

Contract address automatically updates in `lib/viem.ts`.

**3. Fund Treasury** (optional)
```bash
npm run fund-treasury
```

Transfers USDC to treasury for rewards.

### Docker Deployment

**Build Images**:
```bash
docker-compose build
```

**Start Services**:
```bash
docker-compose up -d
```

Services available on:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

**View Logs**:
```bash
docker-compose logs -f backend
```

---

## API Reference

### Game API

#### GET `/api/play`

Check play status and get free play info.

**Query Parameters**:
- `address` (required): User's wallet address

**Response (Free Play Available)**:
```json
{
  "allowed": true,
  "isPremium": false,
  "freePlayRemaining": 2,
  "gameData": {
    "gameId": "game_1705700000000",
    "levelDifficulty": 1,
    "rewards": ["xp"],
    "powerUps": ["shield"]
  }
}
```

**Response (402 Payment Required)**:
```json
{
  "error": "Payment required",
  "message": "Pay 0.01 USDC to continue playing",
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "address": "0x1234...5678",
    "amount": "10000000",
    "currency": "USDC",
    "network": "cronos-t3",
    "expiresAt": 1705700300000
  }
}
```

---

#### GET `/api/stats/:address`

Get user game statistics.

**Response**:
```json
{
  "address": "0x1234...5678",
  "totalScore": 2500,
  "bestScore": 1200,
  "gamesPlayed": 15,
  "isPremium": false,
  "lastPlayed": 1705700000000
}
```

---

#### POST `/api/score`

Submit game score.

**Body**:
```json
{
  "address": "0x1234...5678",
  "score": 500,
  "isPremium": false,
  "gameMode": "classic"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Score recorded: 500"
}
```

---

#### POST `/api/claim-reward`

Claim tCRO reward.

**Body**:
```json
{
  "address": "0x1234...5678",
  "score": 500,
  "gameMode": "classic"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "txHash": "0xabc123...",
  "rewardAmount": "5000000000000000000",
  "rewardAmountFormatted": "5",
  "message": "Reward of 5 tCRO sent successfully"
}
```

**Response (Duplicate)**:
```json
{
  "success": false,
  "error": "Reward already claimed for this game session",
  "rewardAmount": "5000000000000000000",
  "rewardAmountFormatted": "5"
}
```

---

#### POST `/api/ai-chat`

Get AI gaming assistant response.

**Body**:
```json
{
  "message": "How do I get more points in Bubble Tap?",
  "conversationHistory": [
    {
      "role": "assistant",
      "content": "Hi, I'm your gaming assistant..."
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "response": "💡 Pop bubbles rapidly to build combo multipliers..."
}
```

---

#### POST `/api/verify-payment`

Verify x402 payment.

**Body**:
```json
{
  "address": "0x1234...5678",
  "paymentHeader": "Bearer eyJhbGc..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified"
}
```

---

### Health Check

#### GET `/health`

Simple health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-19T10:00:00.000Z"
}
```

---

## Troubleshooting

### Common Issues

#### 1. "GROQ_API_KEY not set"

**Error**: `⚠️ GROQ_API_KEY not set. AI chat features will be limited.`

**Solution**:
1. Get API key from [Groq Console](https://console.groq.com)
2. Add to `backend/.env` and `agent/.env`
3. Restart backend service

#### 2. "Insufficient funds in reward wallet"

**Error**: Cannot claim reward because wallet has no balance

**Solution**:
1. Get testnet CRO from [Cronos Faucet](https://cronos.org/faucet)
2. Send tCRO to reward wallet
3. Check balance: `ethers.getBalance(walletAddress)`

#### 3. "Contract address is 0x0"

**Error**: Smart contract address not set in code

**Solution**:
```bash
cd contracts
npm run deploy
npm run update-address
```

#### 4. "USDC_ADDRESS not found"

**Error**: Cannot find MockUSDC deployment

**Solution**:
```bash
npm run deploy:mock-usdc
npm run deploy
```

#### 5. "Cannot find module 'groq-sdk'"

**Error**: GROQ SDK not installed

**Solution**:
```bash
cd backend
npm install groq-sdk
cd ../agent
npm install groq-sdk
```

#### 6. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process using port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev:frontend
```

#### 7. Privy Authentication Failed

**Error**: `400 Bad Request` from Privy

**Solution**:
1. Verify App ID matches in [Privy Dashboard](https://dashboard.privy.io/)
2. Check Client ID is from same app
3. Ensure app is active
4. Restart frontend dev server

#### 8. Agent Private Key Invalid

**Error**: `Invalid AGENT_PRIVATE_KEY format`

**Solution**:
Generate new key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `agent/.env`:
```bash
AGENT_PRIVATE_KEY=<output_from_above>
```

---

### Debug Mode

Enable verbose logging:

**Backend**:
```bash
DEBUG=* npm run dev:backend
```

**Agent**:
```bash
DEBUG=* npm run dev:agent
```

Check logs in terminal for detailed information.

---

### Network Issues

**Cannot connect to Cronos Testnet**:
1. Verify RPC URL: `https://evm-t3.cronos.org`
2. Check internet connection
3. Try different RPC: `https://evm-cronos-testnet-jsonrpc.allthatnode.com:8545`

**Frontend can't reach backend**:
1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Check backend is running: `curl http://localhost:5000/health`
3. Check CORS headers

---

## Security Considerations

### Private Keys

⚠️ **Never commit private keys to Git**:
- Add `.env` to `.gitignore`
- Use `.env.example` for templates
- Rotate keys regularly

### x402 Payment Security

- Current implementation accepts any Bearer token
- Production should verify cryptographic signatures
- Implement replay attack protection
- Add request nonce/timestamp validation

### Smart Contract Security

- Contracts use OpenZeppelin libraries
- ReentrancyGuard protects against reentrancy
- Ownable pattern for access control
- Consider external audit for mainnet

### AI Agent Safety

- Set `AI_TYPE=both` for maximum safety (rules + AI)
- Monitor daily spending limits
- Set conservative max per transaction
- Review agent decisions in logs

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/xyz`
2. Make changes across services as needed
3. Test locally with `npm run dev`
4. Commit with clear messages
5. Push and create Pull Request

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions focused and small

---

## License

MIT

---

## Support

- **Documentation**: See `/DEPLOYMENT.md`
- **Issues**: GitHub Issues
- **Discord**: [Gaming DApp Community]
- **Email**: support@gaslessarcade.xyz

---

**Last Updated**: January 19, 2026

