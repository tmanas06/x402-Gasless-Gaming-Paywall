import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { PaymentService } from "./services/paymentService";
import { GameService } from "./services/gameService";
import { RewardService } from "./services/rewardService";
import { AIChatService } from "./services/aiChatService";
import { MarketService } from "./services/marketService";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Services
const paymentService = new PaymentService();
const gameService = new GameService();
const marketService = new MarketService();
let rewardService: RewardService;
let aiChatService: AIChatService;

// Initialize services
try {
  paymentService.initialize();
  gameService.initialize();
  rewardService = new RewardService();
  aiChatService = new AIChatService();
} catch (error) {
  console.error("Failed to initialize reward service:", error);
  console.error("Make sure REWARD_WALLET_PRIVATE_KEY is set in .env");
}

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Game play endpoint with x402 paywall
app.get("/api/play", async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string;
    const paymentHeader = req.headers["x-payment"] as string;

    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    // Check if user has valid payment
    const hasPaid = await paymentService.verifyPayment(address, paymentHeader);

    if (hasPaid) {
      // Allow premium play
      const gameData = gameService.getGameData(address, true);
      return res.json({
        allowed: true,
        isPremium: true,
        gameData,
      });
    }

    // Check free plays
    const freePlayCount = gameService.getFreePlayCount(address);

    if (freePlayCount >= parseInt(process.env.GAME_FREE_PLAYS || "3")) {
      // Return 402 Payment Required with x402 headers
      const invoice = paymentService.generateInvoice(address);

      res.status(402).set({
        "X-Payment-Required": "true",
        "X-Payment-Amount": process.env.GAME_FEE_AMOUNT || "10000000",
        "X-Payment-Currency": process.env.GAME_FEE_CURRENCY || "USDC",
        "X-Payment-Network": "cronos-t3",
        "X-Payment-To": process.env.FACILITATOR_ADDRESS || "",
        "X-Payment-Description": "Continue playing Gasless Arcade",
        "X-Invoice-Id": invoice.id,
      }).json({
        error: "Payment required",
        message: "Pay 0.01 USDC to continue playing",
        invoice,
      });
    } else {
      // Allow free play
      const gameData = gameService.getGameData(address, false);
      gameService.incrementFreePlayCount(address);

      res.json({
        allowed: true,
        isPremium: false,
        freePlayRemaining: parseInt(process.env.GAME_FREE_PLAYS || "3") - freePlayCount - 1,
        gameData,
      });
    }
  } catch (error) {
    console.error("Play endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify payment endpoint
app.post("/api/verify-payment", async (req: Request, res: Response) => {
  try {
    const { address, paymentHeader } = req.body;

    const isValid = await paymentService.verifyPayment(address, paymentHeader);

    if (isValid) {
      await paymentService.recordPayment(address, paymentHeader);
      res.json({ success: true, message: "Payment verified" });
    } else {
      res.status(402).json({ success: false, error: "Invalid payment" });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Get user game stats
app.get("/api/stats/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const stats = await gameService.getUserStats(address);
    res.json(stats);
  } catch (error) {
    console.error("Stats endpoint error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Submit game score
app.post("/api/score", async (req: Request, res: Response) => {
  try {
    const { address, score, isPremium, gameMode } = req.body;

    if (!address || score === undefined) {
      return res.status(400).json({ error: "Address and score required" });
    }

    const result = await gameService.recordScore(address, score, isPremium);
    res.json(result);
  } catch (error) {
    console.error("Score submission error:", error);
    res.status(500).json({ error: "Failed to record score" });
  }
});

// Claim reward endpoint
app.post("/api/claim-reward", async (req: Request, res: Response) => {
  try {
    const { address, score, gameMode } = req.body;

    if (!address || score === undefined || !gameMode) {
      return res.status(400).json({ error: "Address, score, and gameMode required" });
    }

    if (!rewardService) {
      return res.status(500).json({ error: "Reward service not initialized" });
    }

    const result = await rewardService.sendReward(address, score, gameMode);
    
    if (result.success) {
      res.json({
        success: true,
        txHash: result.txHash,
        rewardAmount: result.rewardAmount,
        rewardAmountFormatted: (parseInt(result.rewardAmount) / 1e18).toString(),
        message: `Reward of ${parseInt(result.rewardAmount) / 1e18} tCRO sent successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        rewardAmount: result.rewardAmount,
        rewardAmountFormatted: (parseInt(result.rewardAmount) / 1e18).toString(),
      });
    }
  } catch (error) {
    console.error("Claim reward error:", error);
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

// AI Chat endpoint
app.post("/api/ai-chat", async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!aiChatService) {
      return res.status(500).json({ error: "AI chat service not initialized" });
    }

    const response = await aiChatService.getChatResponse(message, conversationHistory || []);
    
    res.json({
      success: true,
      response,
      aiAvailable: aiChatService.isAvailable(),
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ 
      error: "Failed to get AI response",
      response: "I'm having trouble right now. Please try again later." 
    });
  }
});

// ============================================
// MARKET GUESS GAME ENDPOINTS
// ============================================

// Get available cryptos
app.get("/api/market/cryptos", async (req: Request, res: Response) => {
  try {
    const cryptos = await marketService.getAvailableCryptos();
    res.json({
      success: true,
      cryptos,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching cryptos:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cryptocurrency data",
    });
  }
});

// Get current price of a crypto
app.get("/api/market/price/:crypto", async (req: Request, res: Response) => {
  try {
    const { crypto } = req.params;
    const priceData = await marketService.getCurrentPrice(crypto);
    res.json({
      success: true,
      ...priceData,
    });
  } catch (error) {
    console.error("Error fetching price:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch price",
    });
  }
});

// Submit a market guess
app.post("/api/market/guess", async (req: Request, res: Response) => {
  try {
    const { address, crypto, startPrice, guess, duration } = req.body;

    if (!address || !crypto || startPrice === undefined || !guess) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: address, crypto, startPrice, guess",
      });
    }

    if (!["up", "down"].includes(guess.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: "Guess must be 'up' or 'down'",
      });
    }

    const guessId = uuidv4();
    const guessDuration = duration || 10; // Default 10 seconds

    // Submit guess and wait for result
    const result = await marketService.submitGuess(
      guessId,
      address,
      crypto.toLowerCase(),
      startPrice,
      guess.toLowerCase() as "up" | "down",
      guessDuration
    );

    // For now, return guessId immediately; client polls for result
    res.json({
      success: true,
      guessId,
      message: `Evaluating guess for ${crypto} in ${guessDuration} seconds...`,
      startPrice,
      duration: guessDuration,
    });

    // Send result after waiting period
    setTimeout(() => {
      res.write(
        JSON.stringify({
          type: "guess_result",
          ...result,
        })
      );
    }, guessDuration * 1000);
  } catch (error) {
    console.error("Error submitting guess:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit guess",
    });
  }
});

// Get guess result (polling endpoint)
app.get("/api/market/guess/:guessId", async (req: Request, res: Response) => {
  try {
    const { guessId } = req.params;

    // This is a placeholder - in production, implement proper result tracking
    res.json({
      success: true,
      message: "Use SSE or WebSocket for real-time results",
    });
  } catch (error) {
    console.error("Error fetching guess result:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch guess result",
    });
  }
});

// Get user market statistics
app.get("/api/market/stats/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const stats = marketService.getUserStats(address);

    res.json({
      success: true,
      address,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market statistics",
    });
  }
});

// Get market leaderboard
app.get("/api/market/leaderboard", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = marketService.getLeaderboard(limit);

    res.json({
      success: true,
      leaderboard,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard",
    });
  }
});

app.listen(port, () => {
  console.log(`Gasless Arcade backend running on http://localhost:${port}`);
});
