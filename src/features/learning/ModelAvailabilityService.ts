/**
 * VisiOS — Model Availability Service
 * Implementation 3: Unified Subject Intelligence Router
 * Evaluates reachability of the local model daemon and tracks installed specialist models.
 */

export interface ModelAvailabilityStatus {
  isServiceAvailable: boolean;
  daemonUrl: string;
  installedModels: string[];
  activeRunningModel: string | null;
  lastCheckedTimestamp: number;
}

export class ModelAvailabilityService {
  private static cachedStatus: ModelAvailabilityStatus | null = null;
  private static readonly CACHE_TTL_MS = 5000; // 5-second cache
  private static readonly PING_TIMEOUT_MS = 1500;

  public static getDaemonUrl(): string {
    return process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  }

  /**
   * Clears the cached availability status (useful during testing or after model installs).
   */
  public static clearCache(): void {
    this.cachedStatus = null;
  }

  /**
   * Retrieves overall model availability, installed tags, and current active runner.
   */
  public static async checkAvailability(forceRefresh = false): Promise<ModelAvailabilityStatus> {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && now - this.cachedStatus.lastCheckedTimestamp < this.CACHE_TTL_MS) {
      return this.cachedStatus;
    }

    const daemonUrl = this.getDaemonUrl();

    try {
      const response = await fetch(`${daemonUrl}/api/tags`, {
        signal: AbortSignal.timeout(this.PING_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.cachedStatus = {
          isServiceAvailable: false,
          daemonUrl,
          installedModels: [],
          activeRunningModel: null,
          lastCheckedTimestamp: now,
        };
        return this.cachedStatus;
      }

      const data = await response.json();
      const models: string[] = Array.isArray(data.models)
        ? data.models.map((m: { name: string }) => m.name)
        : [];

      // Check running models via /api/ps if supported
      let activeRunningModel: string | null = null;
      try {
        const psRes = await fetch(`${daemonUrl}/api/ps`, {
          signal: AbortSignal.timeout(this.PING_TIMEOUT_MS),
        });
        if (psRes.ok) {
          const psData = await psRes.json();
          if (Array.isArray(psData.models) && psData.models.length > 0) {
            activeRunningModel = psData.models[0].name || null;
          }
        }
      } catch {
        // /api/ps optional
      }

      this.cachedStatus = {
        isServiceAvailable: true,
        daemonUrl,
        installedModels: models,
        activeRunningModel,
        lastCheckedTimestamp: now,
      };
      return this.cachedStatus;
    } catch {
      this.cachedStatus = {
        isServiceAvailable: false,
        daemonUrl,
        installedModels: [],
        activeRunningModel: null,
        lastCheckedTimestamp: now,
      };
      return this.cachedStatus;
    }
  }

  /**
   * Checks whether a specific model is installed and accessible in Ollama.
   */
  public static async isModelInstalled(modelName: string): Promise<boolean> {
    const status = await this.checkAvailability();
    if (!status.isServiceAvailable) return false;

    const lowerTarget = modelName.toLowerCase();
    return status.installedModels.some((m) => {
      const lower = m.toLowerCase();
      return lower === lowerTarget || lower.startsWith(lowerTarget) || lowerTarget.startsWith(lower);
    });
  }

  /**
   * Fast check if the local daemon is online.
   */
  public static async isDaemonOnline(): Promise<boolean> {
    const status = await this.checkAvailability();
    return status.isServiceAvailable;
  }
}

