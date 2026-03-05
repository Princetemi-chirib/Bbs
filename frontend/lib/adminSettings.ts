/**
 * Admin dashboard settings (stored in localStorage).
 * Used by Settings page, SettingsApply component, and Orders page.
 */

export const BBS_ADMIN_SETTINGS_KEY = 'bbs_admin_settings';

export const SETTINGS_UPDATED_EVENT = 'bbs-settings-updated';

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  ordersPerPage: number;
  defaultOrderView: string;
  language: string;
  timezone: string;
  dateFormat: string;
}

const defaultDisplay: DisplaySettings = {
  theme: 'system',
  density: 'comfortable',
  ordersPerPage: 20,
  defaultOrderView: 'overview',
  language: 'en',
  timezone: 'Africa/Lagos',
  dateFormat: 'DD/MM/YYYY',
};

function getStored(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BBS_ADMIN_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Get display settings with defaults. Safe to call on server (returns defaults). */
export function getAdminDisplaySettings(): DisplaySettings {
  const stored = getStored();
  const d = stored.display as Partial<DisplaySettings> | undefined;
  if (!d || typeof d !== 'object') return { ...defaultDisplay };
  return {
    theme: d.theme === 'light' || d.theme === 'dark' || d.theme === 'system' ? d.theme : defaultDisplay.theme,
    density: d.density === 'compact' || d.density === 'comfortable' ? d.density : defaultDisplay.density,
    ordersPerPage: typeof d.ordersPerPage === 'number' && d.ordersPerPage > 0 ? d.ordersPerPage : defaultDisplay.ordersPerPage,
    defaultOrderView: typeof d.defaultOrderView === 'string' ? d.defaultOrderView : defaultDisplay.defaultOrderView,
    language: typeof d.language === 'string' ? d.language : defaultDisplay.language,
    timezone: typeof d.timezone === 'string' ? d.timezone : defaultDisplay.timezone,
    dateFormat: typeof d.dateFormat === 'string' ? d.dateFormat : defaultDisplay.dateFormat,
  };
}

/** Apply theme and density to the document. Call on mount and when settings are saved. */
export function applyDisplaySettings(display?: DisplaySettings): void {
  if (typeof document === 'undefined') return;
  const d = display ?? getAdminDisplaySettings();

  let theme: 'light' | 'dark' = 'light';
  if (d.theme === 'dark') theme = 'dark';
  else if (d.theme === 'light') theme = 'light';
  else if (d.theme === 'system') {
    try {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      theme = 'light';
    }
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-density', d.density);
}

/** Notify other components that settings were updated (e.g. after save). */
export function notifySettingsUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
}

