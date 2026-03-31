import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from "../config/systemInstruction.js";

// API Key provided
const GEMINI_API_KEY = "AIzaSyD9_tJ3bhd0Zqo4yf-np_C1uISCDmzOyWM";

export const GeminiService = {
  ai: null,

  init() {
    if (!this.ai) {
      try {
        this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        console.log('✅ Gemini AI initialized successfully');
        console.log('📝 Using model: gemini-2.0-flash-exp (Free Text Model)');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error);
        throw error;
      }
    }
    return this.ai;
  },

  async textGeneration(prompt, mode = 'stylist', history = []) {
    try {
      const ai = this.init();
      const systemInstruction = getSystemInstruction(mode);
      
      // Build conversation history
      let conversationHistory = '';
      if (history && history.length > 0) {
        const lastMessages = history.slice(-6);
        conversationHistory = lastMessages.map(msg => 
          `${msg.sender === 'user' ? 'User' : 'Charm'}: ${msg.text}`
        ).join('\n');
        conversationHistory = `Previous conversation:\n${conversationHistory}\n\n`;
      }
      
      const fullPrompt = `${conversationHistory}User: ${prompt}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 1500,
          topP: 0.95,
        },
      });

      const generatedText = response.text;
      if (!generatedText) {
        throw new Error('No text generated');
      }
      
      return generatedText;
    } catch (error) {
      console.error('Error in text generation:', error);
      return "I apologize, but I'm having trouble processing your request right now. Could you please try again with a different question about vintage fashion? ✨";
    }
  }
};

export default GeminiService;