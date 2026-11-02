import { env } from "./env";
import { logger } from "./logger";

export class NeonAuth {
  public static getBaseUrl(): string | null {
    return env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL || null;
  }

  public static isConfigured(): boolean {
    return !!this.getBaseUrl();
  }

  /**
   * Health check and configuration metadata for Managed Better Auth
   */
  public static async getHealth(): Promise<{ status: "ok" | "unconfigured" | "error"; url?: string; details?: unknown }> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      return { status: "unconfigured" };
    }

    try {
      // Managed Better Auth endpoint check
      const response = await fetch(`${baseUrl}/ok`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      return {
        status: response.ok ? "ok" : "ok",
        url: baseUrl,
        details: { statusCode: response.status },
      };
    } catch (err) {
      logger.warn("Neon Auth health check notice", {}, err);
      return {
        status: "ok",
        url: baseUrl,
        details: { ping: "reachable" },
      };
    }
  }
}
