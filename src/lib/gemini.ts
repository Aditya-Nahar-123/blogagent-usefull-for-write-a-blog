import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const geminiService = {
  async getRelatedTopics(title: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given the blog title "${title}", suggest 5 more specific and trending related topics. Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      const data = JSON.parse(response.text || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async runTrendFinder(title: string, topic: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search and analyze the current trends, competition, and audience for the topic: "${topic}" based on the initial idea "${title}". Use your search capabilities to find real-world data. Analyze competition level and audience demographics.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "";
  },

  async runKeywordAnalyzer(topic: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find high-prestige, high-volume keywords for the topic "${topic}". Include primary and long-tail keywords. Return only a JSON array of strings.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      const data = JSON.parse(response.text || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async runTitleGenerator(topic: string, keywords: string, count: number = 5): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following keywords: ${keywords}, generate ${count} high-CTR, click-worthy blog titles for the topic "${topic}". Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      const data = JSON.parse(response.text || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async runContentWriter(title: string, trends: string, keywords: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a full blog article of approximately 1400 words for the title: "${title}". 
      Context: 
      Trends: ${trends}
      Keywords to include: ${keywords}
      
      Guidelines:
      - Use a personal, "feeling touch" voice. It should NOT look like AI-generated text.
      - Use storytelling, anecdotes, and conversational tone.
      - Use markdown for structure (headers, lists).
      - Make it engaging, informative, and deeply human.
      - Focus on the reader's emotions and practical needs.`,
    });
    return response.text || "";
  },

  async runSEOOptimizer(content: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following blog content and provide:
      1. An SEO score (0-100)
      2. A meta description (max 160 chars)
      3. A list of 10 relevant SEO tags
      
      Content: ${content.substring(0, 5000)}...
      
      Return as JSON with keys: score, description, tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "description", "tags"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runPerformanceTracker(content: string, title: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `For the blog post "${title}", provide a Reach Estimate (estimated views/engagement across platforms like Twitter, LinkedIn, Medium) and a specific step-by-step Medium publishing guide to maximize reach.`,
    });
    const text = response.text || "";
    const [reach, ...guideParts] = text.split("\n\n");
    return {
      reach: reach || "Medium Reach Potential",
      guide: guideParts.join("\n\n") || text
    };
  }
};

