import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AIChatService {
  private groqClient: Groq | null = null;

  constructor() {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      this.groqClient = new Groq({
        apiKey: groqApiKey,
      });
      console.log("✓ GROQ AI Chat Service initialized");
    } else {
      console.warn("⚠️  GROQ_API_KEY not set. AI chat features will be limited.");
    }
  }

  /**
   * Get AI response for gaming chat
   */
  async getChatResponse(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    // If GROQ is not available, use fallback responses
    if (!this.groqClient) {
      return this.getFallbackResponse(message);
    }

    try {
      const systemPrompt = `You are an AI Gaming Assistant for a blockchain gaming platform called "Gasless Arcade". 

Your role:
- Help players improve their gaming skills and strategies
- Explain the rewards system (100 points = 1 tCRO)
- Provide tips for different games (Bubble Tap, Snake, Crypto Dodger)
- Guide users on achievements and how to unlock them
- Answer questions about gameplay, scoring, and crypto rewards
- Be friendly, encouraging, and helpful

Game Information:
- Bubble Tap: Pop bubbles to score points, avoid bombs, collect power-ups
- Snake: Classic snake game with modern twist
- Crypto Dodger: Dodge bombs, collect coins, use freeze power-ups
- Rewards: Available in classic mode (3 lives) with minimum 100 points
- All games support rewards when scoring 100+ points

Keep responses concise, friendly, and focused on gaming help. Use emojis sparingly but appropriately.`;

      const messages: ChatMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        {
          role: "user",
          content: message,
        },
      ];

      const completion = await this.groqClient.chat.completions.create({
        messages: messages as any,
        model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      
      if (!responseText.trim()) {
        return this.getFallbackResponse(message);
      }

      return responseText.trim();
    } catch (error) {
      console.error("GROQ AI Chat error:", error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Fallback response when AI is not available
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("strategy") || lowerMessage.includes("tip") || lowerMessage.includes("help")) {
      return "🎯 **Strategy Tips:**\n\n• Focus on building combos - rapid taps = more points!\n• In Snake: Plan your route to trap food near walls\n• In Crypto Dodger: Prioritize coins, use freeze strategically\n• Watch for power-ups - they're game changers!\n\nWhich game would you like more specific tips for?";
    }
    
    if (lowerMessage.includes("reward") || lowerMessage.includes("tcro") || lowerMessage.includes("earn")) {
      return "💰 **Rewards System:**\n\n• Score 100+ points in any game to earn rewards\n• 100 points = 1 tCRO\n• Rewards are sent directly to your wallet\n• All games support rewards when scoring 100+\n• Maximum reward per game: Based on your score!\n\nKeep playing and building your score! 🚀";
    }
    
    if (lowerMessage.includes("achievement") || lowerMessage.includes("unlock")) {
      return "🏆 **Achievements Guide:**\n\nAvailable achievements:\n• 🎯 Bubble Popper - Pop 100 bubbles\n• ⏱️ Time Master - Complete time attack\n• 🛡️ Survivor - Survive 5 minutes\n• 🔥 Combo King - Get 10x combo\n• 💰 Crypto Collector - Earn 10 tCRO\n• 👑 Legendary - Reach top 10\n\nKeep playing to unlock them all!";
    }
    
    if (lowerMessage.includes("score") || lowerMessage.includes("points") || lowerMessage.includes("high")) {
      return "⭐ **Scoring Tips:**\n\n• Smaller bubbles = more points\n• Build combos by tapping rapidly\n• Collect bonus items for extra points\n• Avoid bombs - they cost you lives/points\n• Power-ups can multiply your score!\n\nTry different game modes to find your best strategy!";
    }
    
    if (lowerMessage.includes("game") || lowerMessage.includes("play") || lowerMessage.includes("mode")) {
      return "🎮 **Game Modes:**\n\n**Bubble Tap:**\n• Classic: 3 lives with rewards\n• Time Attack: Race against the clock\n• Survival: Unlimited lives\n\n**Snake:** Traditional snake with modern twist\n**Crypto Dodger:** Dodge bombs, collect coins!\n\nWhich game would you like to try? Head to the Play page! 🚀";
    }
    
    return "🤖 Thanks for your question! I'm here to help with:\n\n• Game strategies and tips\n• Understanding rewards\n• Achievement progress\n• Performance tips\n\nFeel free to ask me anything about the games! 💡";
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.groqClient !== null;
  }
}

