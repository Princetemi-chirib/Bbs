'use client';

import { useEffect } from 'react';
import { applyDisplaySettings, getAdminDisplaySettings, SETTINGS_UPDATED_EVENT } from '@/lib/adminSettings';

/**
 * Applies admin display settings (theme, density) to the document.
 * Mount this once in the admin layout. Listens for settings updates.
 */
export default function SettingsApply() {
  useEffect(() => {
    applyDisplaySettings(getAdminDisplaySettings());

    const handleUpdate = () => {
      applyDisplaySettings(getAdminDisplaySettings());
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
  }, []);

  return null;
}

