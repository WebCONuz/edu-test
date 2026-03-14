import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private gemini: GoogleGenAI;
  private groq: Groq;

  constructor() {
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }

  async analyzeText(prompt: string): Promise<string>;
  async analyzeText(
    prompt: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string>;
  async analyzeText(
    prompt: string,
    buffer?: Buffer,
    mimeType?: string,
  ): Promise<string> {
    if (buffer && mimeType) {
      const providers = [
        () => this.callGeminiMultimodal(prompt, buffer, mimeType),
        () => this.callGroq(prompt),
        () => this.callOpenRouter(prompt),
      ];
      for (const provider of providers) {
        try {
          return await provider();
        } catch (error) {
          console.warn(`AI provider failed: ${error.message}, trying next...`);
        }
      }
    }

    const providers = [
      () => this.callGemini(prompt),
      () => this.callGroq(prompt),
      () => this.callOpenRouter(prompt),
    ];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        console.warn(`AI provider failed: ${error.message}, trying next...`);
      }
    }

    throw new ServiceUnavailableException(
      "AI xizmati hozirda mavjud emas, keyinroq urinib ko'ring",
    );
  }

  // 1. Gemini — oddiy matn
  private async callGemini(prompt: string): Promise<string> {
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite', // eng ko'p so'rov: 15 RPM, 1000 RPD
      contents: prompt,
    });
    const text = response.text;
    if (!text) throw new Error("Gemini: bo'sh javob");
    return text;
  }

  // 2. Gemini — multimodal (PDF)
  private async callGeminiMultimodal(
    prompt: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: buffer.toString('base64') } },
            { text: prompt },
          ],
        },
      ],
    });
    const text = response.text;
    if (!text) throw new Error("Gemini multimodal: bo'sh javob");
    return text;
  }

  // 3. Groq
  private async callGroq(prompt: string): Promise<string> {
    const result = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const text = result.choices[0]?.message?.content;
    if (!text) throw new Error("Groq: bo'sh javob");
    return text;
  }

  // 4. OpenRouter
  private async callOpenRouter(prompt: string): Promise<string> {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free', // yangi tekin model
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      },
    );

    if (!response.ok) throw new Error(`OpenRouter: ${response.statusText}`);
    const data = await response.json();
    const text = data.choices[0]?.message?.content;
    if (!text) throw new Error("OpenRouter: bo'sh javob");
    return text;
  }
}
