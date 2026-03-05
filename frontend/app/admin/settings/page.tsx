'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Palette,
  Building2,
  Plug,
  Database,
  Info,
  Save,
  Loader2,
} from 'lucide-react';
import { fetchAuth, getUserData, isAdmin, hasRole } from '@/lib/auth';
import { BBS_ADMIN_SETTINGS_KEY, notifySettingsUpdated } from '@/lib/adminSettings';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import Link from 'next/link';
import styles from './settings.module.css';

type TabId = 'profile' | 'security' | 'notifications' | 'display' | 'business' | 'integrations' | 'data' | 'about';

interface NotificationsState {
  newOrderEmail: boolean;
  assignmentAlert: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  marketing: boolean;
  soundEnabled: boolean;
}

interface DisplayState {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  ordersPerPage: number;
  defaultOrderView: string;
  language: string;
  timezone: string;
  dateFormat: string;
}

interface BusinessState {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  timezone: string;
  currency: string;
  fiscalYearStart: string;
}

interface StoredSettings {
  notifications?: Partial<NotificationsState>;
  display?: Partial<DisplayState>;
  business?: Partial<BusinessState>;
}

type DashboardRole = 'ADMIN' | 'REP' | 'MANAGER' | 'VIEWER';

const TABS: { id: TabId; label: string; Icon: typeof User; roles?: DashboardRole[] }[] = [
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'security', label: 'Security', Icon: Shield },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'display', label: 'Display & preferences', Icon: Palette },
  { id: 'business', label: 'Business settings', Icon: Building2, roles: ['ADMIN'] },
  { id: 'integrations', label: 'Integrations', Icon: Plug, roles: ['ADMIN'] },
  { id: 'data', label: 'Data & privacy', Icon: Database, roles: ['ADMIN'] },
  { id: 'about', label: 'About', Icon: Info },
];

function loadStoredSettings(): StoredSettings {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BBS_ADMIN_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSettings(settings: StoredSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BBS_ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export default function AdminSettingsPage() {
  const userRole = getUserData()?.role;
  const isAdminUser = isAdmin();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string | null; avatarUrl: string | null; role: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications (from storage)
  const [notifications, setNotifications] = useState<NotificationsState>({
    newOrderEmail: true,
    assignmentAlert: true,
    dailySummary: false,
    weeklyReport: false,
    marketing: false,
    soundEnabled: false,
  });

  // Display
  const [display, setDisplay] = useState<DisplayState>({
    theme: 'system',
    density: 'comfortable',
    ordersPerPage: 20,
    defaultOrderView: 'overview',
    language: 'en',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
  });

  // Business (admin)
  const [business, setBusiness] = useState<BusinessState>({
    businessName: 'BBS Limited',
    supportEmail: '',
    supportPhone: '',
    address: '',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    fiscalYearStart: '01',
  });

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchAuth('/api/v1/auth/me');
        const data = await res.json();
        if (data.success && data.data) {
          setProfile({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || null,
            avatarUrl: data.data.avatarUrl || null,
            role: data.data.role || '',
          });
        }
      } catch {
        const user = getUserData();
        if (user) setProfile({ name: user.name, email: user.email, phone: user.phone || null, avatarUrl: user.avatarUrl || null, role: user.role });
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const stored = loadStoredSettings();
    if (stored.notifications && Object.keys(stored.notifications).length > 0) setNotifications((prev) => ({ ...prev, ...stored.notifications }));
    if (stored.display && Object.keys(stored.display).length > 0) setDisplay((prev) => ({ ...prev, ...stored.display }));
    if (stored.business && Object.keys(stored.business).length > 0) setBusiness((prev) => ({ ...prev, ...stored.business }));
  }, []);

  const dashboardRole: DashboardRole | null =
    userRole && (userRole === 'ADMIN' || userRole === 'REP' || userRole === 'MANAGER' || userRole === 'VIEWER') ? userRole : null;
  const visibleTabs = TABS.filter((t) => !t.roles || (dashboardRole && t.roles.includes(dashboardRole)));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetchAuth('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully. Use your new password on next sign-in.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error?.message || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const saveNotifications = () => {
    const stored = loadStoredSettings();
    saveStoredSettings({ ...stored, notifications });
    setSaveMessage({ type: 'success', text: 'Notification preferences saved.' });
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const saveDisplay = () => {
    const stored = loadStoredSettings();
    saveStoredSettings({ ...stored, display });
    notifySettingsUpdated();
    setSaveMessage({ type: 'success', text: 'Display preferences saved. Theme and density applied.' });
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const saveBusiness = () => {
    const stored = loadStoredSettings();
    saveStoredSettings({ ...stored, business });
    setSaveMessage({ type: 'success', text: 'Business settings saved.' });
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const toggleNotification = (key: keyof NotificationsState, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.settingsPage}>
      <header className={styles.pageHeader}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]} />
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>
          Manage your profile, security, notifications, and preferences. {isAdminUser && 'As an administrator you can also configure business and data settings.'}
        </p>
      </header>

      <main className={styles.main}>
        <nav className={styles.tabNav} aria-label="Settings sections">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.tabBtnActive : styles.tabBtn}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.Icon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden />
              {tab.label}
            </button>
          ))}
        </nav>

        {saveMessage && (
          <div className={styles.toastWrap} role="alert" aria-live="polite">
            <div className={saveMessage.type === 'success' ? styles.toastSuccess : styles.toastError}>
              {saveMessage.text}
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <User size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Profile</h2>
            </div>
            <p className={styles.sectionDescription}>
              Your account information is used across the dashboard. Contact your administrator to change email or name.
            </p>
            {profileLoading ? (
              <div className={styles.loading}>Loading profile…</div>
            ) : profile ? (
              <>
                <div className={styles.avatarWrap}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{profile.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  )}
                  <div>
                    <strong>{profile.name}</strong>
                    <span className={styles.roleBadge}>{profile.role}</span>
                    <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '0.875rem' }}>{profile.email}</p>
                    {profile.phone && <p style={{ margin: '2px 0 0 0', color: '#6c757d', fontSize: '0.875rem' }}>{profile.phone}</p>}
                  </div>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Display name</label>
                  <input type="text" className={styles.input} value={profile.name} disabled />
                  <p className={styles.helperText}>To update your name, contact your administrator.</p>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Email address</label>
                  <input type="email" className={styles.input} value={profile.email} disabled />
                  <p className={styles.helperText}>Used for login and notifications. Changes require administrator approval.</p>
                </div>
                <div className={styles.formRow}>
                  <label className={`${styles.label} ${styles.labelOptional}`}>Phone (optional)</label>
                  <input type="tel" className={styles.input} value={profile.phone || ''} disabled />
                </div>
              </>
            ) : (
              <p className={styles.sectionDescription}>Could not load profile. Refresh the page or contact support.</p>
            )}
          </section>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Shield size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Security</h2>
            </div>
            <p className={styles.sectionDescription}>
              Change your password and manage sign-in security. Use a strong password with at least 8 characters.
            </p>
            <form onSubmit={handleChangePassword}>
              {passwordMessage && (
                <div className={passwordMessage.type === 'success' ? styles.messageSuccess : styles.messageError} style={{ marginBottom: 16 }}>
                  {passwordMessage.text}
                </div>
              )}
              <div className={styles.formRow}>
                <label className={styles.label}>Current password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>New password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <p className={styles.helperText}>Minimum 8 characters. Use a mix of letters, numbers, and symbols for better security.</p>
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Confirm new password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className={styles.buttonRow}>
                <button type="submit" className={styles.primaryBtn} disabled={changingPassword}>
                  {changingPassword ? <><Loader2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Changing…</> : 'Change password'}
                </button>
              </div>
            </form>
            <div className={styles.divider} />
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: 8 }}>Sessions</h3>
            <p className={styles.sectionDescription} style={{ marginBottom: 16 }}>
              Sign out of all devices from the sidebar logout. For session timeout and password policy, contact your administrator.
            </p>
          </section>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Bell size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Notifications</h2>
            </div>
            <p className={styles.sectionDescription}>
              Choose how and when you receive alerts. Email notifications are sent to your account email.
            </p>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <p className={styles.toggleTitle}>New order email</p>
                <p className={styles.toggleDescription}>Receive an email when a new order is placed from the website.</p>
              </div>
              <div
                className={`${styles.toggle} ${notifications.newOrderEmail ? styles.toggleChecked : ''}`}
                onClick={() => toggleNotification('newOrderEmail', !notifications.newOrderEmail)}
                role="switch"
                aria-checked={notifications.newOrderEmail}
              >
                <span className={styles.toggleKnob} />
              </div>
            </div>
            {hasRole('REP') && (
              <div className={styles.toggleRow}>
                <div className={styles.toggleLabel}>
                  <p className={styles.toggleTitle}>Assignment alerts</p>
                  <p className={styles.toggleDescription}>Get notified when you assign an order or when a barber accepts or declines.</p>
                </div>
                <div
                  className={`${styles.toggle} ${notifications.assignmentAlert ? styles.toggleChecked : ''}`}
                  onClick={() => toggleNotification('assignmentAlert', !notifications.assignmentAlert)}
                  role="switch"
                  aria-checked={notifications.assignmentAlert}
                >
                  <span className={styles.toggleKnob} />
                </div>
              </div>
            )}
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <p className={styles.toggleTitle}>Daily summary</p>
                <p className={styles.toggleDescription}>Receive a daily email with order and revenue summary.</p>
              </div>
              <div
                className={`${styles.toggle} ${notifications.dailySummary ? styles.toggleChecked : ''}`}
                onClick={() => toggleNotification('dailySummary', !notifications.dailySummary)}
                role="switch"
                aria-checked={notifications.dailySummary}
              >
                <span className={styles.toggleKnob} />
              </div>
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <p className={styles.toggleTitle}>Weekly report</p>
                <p className={styles.toggleDescription}>Receive a weekly analytics report by email.</p>
              </div>
              <div
                className={`${styles.toggle} ${notifications.weeklyReport ? styles.toggleChecked : ''}`}
                onClick={() => toggleNotification('weeklyReport', !notifications.weeklyReport)}
                role="switch"
                aria-checked={notifications.weeklyReport}
              >
                <span className={styles.toggleKnob} />
              </div>
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <p className={styles.toggleTitle}>Marketing & updates</p>
                <p className={styles.toggleDescription}>Product updates, tips, and promotional emails from BBS.</p>
              </div>
              <div
                className={`${styles.toggle} ${notifications.marketing ? styles.toggleChecked : ''}`}
                onClick={() => toggleNotification('marketing', !notifications.marketing)}
                role="switch"
                aria-checked={notifications.marketing}
              >
                <span className={styles.toggleKnob} />
              </div>
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <p className={styles.toggleTitle}>Sound alerts</p>
                <p className={styles.toggleDescription}>Play a sound when a new order or assignment appears (when dashboard is open).</p>
              </div>
              <div
                className={`${styles.toggle} ${notifications.soundEnabled ? styles.toggleChecked : ''}`}
                onClick={() => toggleNotification('soundEnabled', !notifications.soundEnabled)}
                role="switch"
                aria-checked={notifications.soundEnabled}
              >
                <span className={styles.toggleKnob} />
              </div>
            </div>
            <div className={styles.buttonRow}>
              <button type="button" onClick={saveNotifications} className={styles.primaryBtn}>
                <Save size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Save notification preferences
              </button>
            </div>
          </section>
        )}

        {/* Display & preferences */}
        {activeTab === 'display' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Display & preferences</h2>
            <p className={styles.sectionDescription}>
              Customize how the dashboard looks and behaves. These settings are stored on this device.
            </p>
            <div className={styles.formRow}>
              <label className={styles.label}>Theme</label>
              <select
                className={styles.select}
                value={display.theme}
                onChange={(e) => setDisplay((p) => ({ ...p, theme: e.target.value as 'light' | 'dark' | 'system' }))}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System (follow device)</option>
              </select>
              <p className={styles.helperText}>Light or dark mode. System uses your device preference.</p>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>List density</label>
              <select
                className={styles.select}
                value={display.density}
                onChange={(e) => setDisplay((p) => ({ ...p, density: e.target.value as 'comfortable' | 'compact' }))}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
              <p className={styles.helperText}>Comfortable uses more spacing; compact shows more rows per screen.</p>
            </div>
            {hasRole('REP') && (
              <div className={styles.formRow}>
                <label className={styles.label}>Default order view</label>
                <select
                  className={styles.select}
                  value={display.defaultOrderView}
                  onChange={(e) => setDisplay((p) => ({ ...p, defaultOrderView: e.target.value }))}
                >
                  <option value="overview">Overview</option>
                  <option value="assignment">Order Assignments</option>
                  <option value="status">Order Management status</option>
                  <option value="history">Order History</option>
                  <option value="declined">Declined Orders</option>
                </select>
                <p className={styles.helperText}>Opening the Orders section will load this view by default.</p>
              </div>
            )}
            <div className={styles.formRow}>
              <label className={styles.label}>Orders per page</label>
              <select
                className={styles.select}
                value={String(display.ordersPerPage)}
                onChange={(e) => setDisplay((p) => ({ ...p, ordersPerPage: Number(e.target.value) }))}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Timezone</label>
              <select
                className={styles.select}
                value={display.timezone}
                onChange={(e) => setDisplay((p) => ({ ...p, timezone: e.target.value }))}
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="UTC">UTC</option>
                <option value="Africa/Abidjan">Africa/Abidjan</option>
                <option value="America/New_York">America/New York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
              <p className={styles.helperText}>Used for dates and times across the dashboard.</p>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Date format</label>
              <select
                className={styles.select}
                value={display.dateFormat}
                onChange={(e) => setDisplay((p) => ({ ...p, dateFormat: e.target.value }))}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Language</label>
              <select
                className={styles.select}
                value={display.language}
                onChange={(e) => setDisplay((p) => ({ ...p, language: e.target.value }))}
              >
                <option value="en">English</option>
              </select>
              <p className={styles.helperText}>More languages can be added in a future update.</p>
            </div>
            <div className={styles.buttonRow}>
              <button type="button" onClick={saveDisplay} className={styles.primaryBtn}>
                <Save size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Save display preferences
              </button>
            </div>
          </section>
        )}

        {/* Business settings (Admin only) */}
        {activeTab === 'business' && isAdminUser && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Building2 size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Business settings</h2>
            </div>
            <p className={styles.sectionDescription}>
              Company information used in emails, receipts, and customer-facing content. Stored locally on this device unless a server sync is configured.
            </p>
            <div className={styles.formRow}>
              <label className={styles.label}>Business name</label>
              <input
                type="text"
                className={styles.input}
                value={business.businessName || ''}
                onChange={(e) => setBusiness((p) => ({ ...p, businessName: e.target.value }))}
                placeholder="BBS Limited"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Support email</label>
              <input
                type="email"
                className={styles.input}
                value={business.supportEmail || ''}
                onChange={(e) => setBusiness((p) => ({ ...p, supportEmail: e.target.value }))}
                placeholder="support@example.com"
              />
              <p className={styles.helperText}>Shown to customers for contact and in order emails.</p>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Support phone</label>
              <input
                type="tel"
                className={styles.input}
                value={business.supportPhone || ''}
                onChange={(e) => setBusiness((p) => ({ ...p, supportPhone: e.target.value }))}
                placeholder="+234 800 000 0000"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Business address</label>
              <textarea
                className={styles.textarea}
                value={business.address || ''}
                onChange={(e) => setBusiness((p) => ({ ...p, address: e.target.value }))}
                placeholder="Street, city, state"
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Default timezone</label>
              <select
                className={styles.select}
                value={business.timezone || 'Africa/Lagos'}
                onChange={(e) => setBusiness((p) => ({ ...p, timezone: e.target.value }))}
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Currency</label>
              <select
                className={styles.select}
                value={business.currency || 'NGN'}
                onChange={(e) => setBusiness((p) => ({ ...p, currency: e.target.value }))}
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Fiscal year start (month)</label>
              <select
                className={styles.select}
                value={business.fiscalYearStart || '01'}
                onChange={(e) => setBusiness((p) => ({ ...p, fiscalYearStart: e.target.value }))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <p className={styles.helperText}>Used for financial reports and year-over-year comparisons.</p>
            </div>
            <div className={styles.buttonRow}>
              <button type="button" onClick={saveBusiness} className={styles.primaryBtn}>
                <Save size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Save business settings
              </button>
            </div>
          </section>
        )}

        {/* Integrations (Admin only) */}
        {activeTab === 'integrations' && isAdminUser && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Plug size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Integrations</h2>
            </div>
            <p className={styles.sectionDescription}>
              Third-party services connected to your account. Configure API keys and webhooks from the links below.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <strong>Paystack</strong> — Payments. Configure in environment variables (PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).
              </li>
              <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <strong>Email (SMTP)</strong> — Order confirmations and notifications. Set SMTP_* environment variables.
              </li>
              <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <Link href="/admin/financials?tab=settings" className={styles.settingsLink}>
                  Financials → Settings
                </Link>
                {' — Export, reports, and data retention.'}
              </li>
            </ul>
            <p className={styles.helperText} style={{ marginTop: 16 }}>
              For security, API keys are not shown in the dashboard. Use your deployment or server environment to update them.
            </p>
          </section>
        )}

        {/* Data & privacy (Admin only) */}
        {activeTab === 'data' && isAdminUser && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Database size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>Data & privacy</h2>
            </div>
            <p className={styles.sectionDescription}>
              Data retention, export, and compliance. Customer data is stored according to your retention policy.
            </p>
            <div className={styles.formRow}>
              <label className={styles.label}>Data retention</label>
              <p className={styles.sectionDescription} style={{ marginBottom: 12 }}>
                Configure how long order, customer, and audit data are kept. After the retention period, data can be automatically deleted or anonymized.
              </p>
              <Link href="/admin/financials?tab=settings" className={styles.primaryBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                Open Data retention settings
              </Link>
            </div>
            <div className={styles.divider} />
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: 8 }}>Export & backup</h3>
            <p className={styles.sectionDescription} style={{ marginBottom: 16 }}>
              Export orders and customer lists from the Orders (Order History → Export to CSV) and Customers pages. For full database backup, use your server or hosting provider tools.
            </p>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: 8 }}>GDPR & compliance</h3>
            <p className={styles.sectionDescription}>
              Customer anonymization and deletion are available per customer in the Customers section. Use the customer detail page to anonymize or merge records as needed.
            </p>
          </section>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Info size={22} className={styles.sectionIcon} aria-hidden />
              <h2 className={styles.sectionTitle}>About</h2>
            </div>
            <p className={styles.sectionDescription}>
              Application and account information.
            </p>
            <dl style={{ margin: 0, display: 'grid', gap: '12px 24px', gridTemplateColumns: 'auto 1fr' }}>
              <dt style={{ color: '#6c757d', fontWeight: 600 }}>Application</dt>
              <dd style={{ margin: 0 }}>BBS Limited — Barber Booking System</dd>
              <dt style={{ color: '#6c757d', fontWeight: 600 }}>Version</dt>
              <dd style={{ margin: 0 }}>1.0.0</dd>
              <dt style={{ color: '#6c757d', fontWeight: 600 }}>Your role</dt>
              <dd style={{ margin: 0 }}>{profile?.role || userRole || '—'}</dd>
              <dt style={{ color: '#6c757d', fontWeight: 600 }}>Account</dt>
              <dd style={{ margin: 0 }}>{profile?.email || '—'}</dd>
            </dl>
            <div className={styles.divider} />
            <p className={styles.sectionDescription}>
              For technical support or to request profile changes, contact your administrator. Settings stored locally (notifications, display, business) are saved on this browser only.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

