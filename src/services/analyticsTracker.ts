/**
 * Client-Side Telemetry Service for MIRAI
 * Collects real analytics events and transmits them to /api/analytics/event.
 * Strictly adheres to privacy principles: no PII, no passwords.
 */

let lastEventKey = '';
let lastEventTime = 0;

export async function trackEvent(params: {
  type: 'page_view' | 'episode_start' | 'episode_complete' | 'manga_view' | 'chapter_open' | 'search_query' | 'feature_click';
  path: string;
  targetId?: string | number;
  targetTitle?: string;
  category?: 'anime' | 'manga' | 'system' | 'navigation';
  metadata?: Record<string, any>;
}): Promise<void> {
  const now = Date.now();
  const eventKey = `${params.type}_${params.path}_${params.targetId || ''}`;

  // Deduplicate identical events within 2000ms
  if (eventKey === lastEventKey && now - lastEventTime < 2000) {
    return;
  }
  lastEventKey = eventKey;
  lastEventTime = now;

  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      keepalive: true,
    });
  } catch (err) {
    // Non-blocking telemetry
  }
}

export function syncUserRegistration(user: {
  fullName?: string;
  username?: string;
  email: string;
  favoriteGenres?: string[];
}): void {
  fetch('/api/auth/register-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});
}
