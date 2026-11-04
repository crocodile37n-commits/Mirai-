import { BACKEND_CONFIG } from './config';

/**
 * Admin Panel Backend Adapter
 *
 * Centralized interface for administrative actions, plugin management,
 * streaming source configs, sync status, and system logs.
 */
export const adminAdapter = {
  /**
   * Fetch overview dashboard metrics
   */
  async getOverview(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.adminOverview}`, {
        headers: BACKEND_CONFIG.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  /**
   * Fetch configured streaming plugins
   */
  async getPlugins(): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.adminPlugins}`, {
        headers: BACKEND_CONFIG.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.plugins)) return json.plugins;
      }
    } catch {}
    return [];
  },

  /**
   * Toggle a provider plugin enabled / disabled
   */
  async togglePlugin(pluginId: string, enabled: boolean): Promise<boolean> {
    try {
      const res = await fetch(
        `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.adminPluginToggle(pluginId)}`,
        {
          method: 'POST',
          headers: BACKEND_CONFIG.getHeaders(),
          body: JSON.stringify({ enabled }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Test plugin connection health
   */
  async testPlugin(pluginId: string): Promise<{ success: boolean; latencyMs?: number; message?: string }> {
    try {
      const res = await fetch(
        `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.adminPluginTest(pluginId)}`,
        {
          method: 'POST',
          headers: BACKEND_CONFIG.getHeaders(),
        }
      );
      if (res.ok) return await res.json();
    } catch {}
    return { success: false, message: 'Provider service unreachable' };
  },

  /**
   * Trigger catalog synchronization job
   */
  async triggerSync(target: 'anime' | 'manga' | 'all'): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.adminSyncStart}`, {
        method: 'POST',
        headers: BACKEND_CONFIG.getHeaders(),
        body: JSON.stringify({ target }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
