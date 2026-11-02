import { env } from "./env";
import { logger } from "./logger";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
}

export class NeonAiGateway {
  private static getCredentials() {
    const baseUrl = env.NEON_AI_GATEWAY_BASE_URL || process.env.NEON_AI_GATEWAY_BASE_URL;
    const token = env.NEON_AI_GATEWAY_TOKEN || process.env.NEON_AI_GATEWAY_TOKEN;

    if (!baseUrl || !token) {
      return null;
    }

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      token,
    };
  }

  public static isConfigured(): boolean {
    return !!this.getCredentials();
  }

  /**
   * Fetches the available models from the Neon AI Gateway
   */
  public static async listModels(): Promise<Array<{ id: string; enabled?: boolean }>> {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error("Neon AI Gateway credentials are not configured.");
    }

    const response = await fetch(`${creds.baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.text();
      logger.warn("Failed to list models from Neon AI Gateway", { status: response.status, err });
      throw new Error(`Neon AI Gateway error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Generates chat completion via the OpenAI-compatible /v1/chat/completions route
   */
  public static async generateCompletion(
    messages: ChatMessage[],
    model: string = "gpt-5-mini"
  ): Promise<string> {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error("Neon AI Gateway credentials are not configured.");
    }

    const response = await fetch(`${creds.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.warn("Neon AI Gateway completion failed", { status: response.status, err });
      throw new Error(`Neon AI Gateway error ${response.status}: ${err}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Provides AI-powered SEO remediation advice for a specific finding
   */
  public static async getSeoAdvice(findingTitle: string, affectedUrl: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are an expert Shopify SEO engineer. Provide a concise 2-sentence actionable remediation recommendation for the merchant.",
      },
      {
        role: "user",
        content: `How do I resolve this Shopify SEO issue on ${affectedUrl}?\nIssue: ${findingTitle}`,
      },
    ];

    return this.generateCompletion(messages);
  }
}
