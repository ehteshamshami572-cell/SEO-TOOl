import { env } from "./env";
import { logger } from "./logger";

export class NeonRealtime {
  public static getEndpoint(): string | null {
    return env.NEON_REALTIME_URL || process.env.NEON_REALTIME_URL || null;
  }

  public static isConfigured(): boolean {
    const url = this.getEndpoint();
    const secret = env.NEON_REALTIME_SECRET || process.env.NEON_REALTIME_SECRET;
    return !!(url && secret);
  }

  /**
   * Returns realtime connection status metadata
   */
  public static getStatus(): {
    configured: boolean;
    endpoint: string | null;
  } {
    return {
      configured: this.isConfigured(),
      endpoint: this.getEndpoint(),
    };
  }
}
