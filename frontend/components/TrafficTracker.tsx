'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'bbs_traffic_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

function getDevice(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const { id, expires } = JSON.parse(raw) as { id?: string; expires?: number };
      if (id && typeof expires === 'number' && now < expires) return id;
    }
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, expires: now + SESSION_TTL_MS }));
    return id;
  } catch {
    return '';
  }
}

export default function TrafficTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const url = pathname || '/';
    if (lastTracked.current === url) return;
    lastTracked.current = url;

    const device = getDevice();
    const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';
    const sessionId = getOrCreateSessionId();

    const payload: { url: string; referrer: string; device: string; sessionId?: string } = { url, referrer, device };
    if (sessionId) payload.sessionId = sessionId;

    fetch('/api/v1/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
