'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import styles from './profile.module.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function BarberProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    experienceYears: '',
    specialties: [] as string[],
    languagesSpoken: [] as string[],
    state: '',
    city: '',
    address: '',
    currentSpecialty: '',
    currentLanguage: '',
  });

  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetchAuth('/api/v1/barber/profile');
      const data = await response.json();
      
      if (data.success) {
        const prof = data.data;
        setProfile(prof);
        setFormData({
          name: prof.name || '',
          phone: prof.phone || '',
          bio: prof.bio || '',
          experienceYears: prof.experienceYears?.toString() || '',
          specialties: prof.specialties || [],
          languagesSpoken: prof.languagesSpoken || [],
          state: prof.state || '',
          city: prof.city || '',
          address: prof.address || '',
          currentSpecialty: '',
          currentLanguage: '',
        });
        // Initialize availability for all days
        const initialAvailability = DAYS_OF_WEEK.map(day => {
          const existing = prof.availability?.find((a: any) => a.dayOfWeek === day.value);
          if (existing) {
            // Parse time from database format (HH:mm:ss) to HTML time format (HH:mm)
            const startTime = existing.startTime ? (typeof existing.startTime === 'string' ? existing.startTime.split(':').slice(0, 2).join(':') : '09:00') : '09:00';
            const endTime = existing.endTime ? (typeof existing.endTime === 'string' ? existing.endTime.split(':').slice(0, 2).join(':') : '17:00') : '17:00';
            return {
              dayOfWeek: day.value,
              startTime,
              endTime,
              isAvailable: existing.isAvailable !== false,
            };
          }
          return {
            dayOfWeek: day.value,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
          };
        });
        setAvailability(initialAvailability);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Update profile with new avatar URL
        const updateResponse = await fetchAuth('/api/v1/barber/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: data.data.url }),
        });

        const updateData = await updateResponse.json();
        if (updateData.success) {
          setProfile({ ...profile, avatarUrl: data.data.url });
          setSuccess('Profile picture updated successfully');
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    handleFileUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Format availability data - ensure all required fields are present and valid
      const formattedAvailability = availability
        .filter(avail => 
          avail && 
          avail.dayOfWeek !== undefined && 
          avail.dayOfWeek !== null &&
          typeof avail.dayOfWeek === 'number'
        )
        .map(avail => {
          // Ensure times are in proper format
          let startTime = avail.startTime || '09:00';
          let endTime = avail.endTime || '17:00';
          
          // Remove seconds if present (HH:mm:ss -> HH:mm)
          if (typeof startTime === 'string' && startTime.split(':').length > 2) {
            startTime = startTime.split(':').slice(0, 2).join(':');
          }
          if (typeof endTime === 'string' && endTime.split(':').length > 2) {
            endTime = endTime.split(':').slice(0, 2).join(':');
          }
          
          return {
            dayOfWeek: Number(avail.dayOfWeek),
            startTime: `${startTime}:00`, // Convert to HH:mm:ss format for database
            endTime: `${endTime}:00`,
            isAvailable: avail.isAvailable !== false,
          };
        });

      const response = await fetchAuth('/api/v1/barber/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
          specialties: formData.specialties,
          languagesSpoken: formData.languagesSpoken,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          availability: formattedAvailability,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(data.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (formData.currentSpecialty.trim()) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, formData.currentSpecialty.trim()],
        currentSpecialty: '',
      });
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((_, i) => i !== index),
    });
  };

  const addLanguage = () => {
    if (formData.currentLanguage.trim()) {
      setFormData({
        ...formData,
        languagesSpoken: [...formData.languagesSpoken, formData.currentLanguage.trim()],
        currentLanguage: '',
      });
    }
  };

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languagesSpoken: formData.languagesSpoken.filter((_, i) => i !== index),
    });
  };

  const updateAvailability = (dayOfWeek: number, field: string, value: any) => {
    const updated = [...availability];
    const existingIndex = updated.findIndex(a => a.dayOfWeek === dayOfWeek);
    
    if (existingIndex >= 0) {
      // Update existing entry
      updated[existingIndex] = { ...updated[existingIndex], [field]: value };
    } else {
      // Create new entry for this day
      updated.push({
        dayOfWeek,
        startTime: field === 'startTime' ? value : '09:00',
        endTime: field === 'endTime' ? value : '17:00',
        isAvailable: field === 'isAvailable' ? value : true,
      });
    }
    
    setAvailability(updated);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/barber" className={styles.backLink}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <h1>My Profile</h1>
        <p className={styles.headerSubtitle}>Manage your profile information and availability</p>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.alert} style={{ background: '#fee', borderColor: '#fcc', color: '#c33' }}>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.alert} style={{ background: '#efe', borderColor: '#cfc', color: '#3c3' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Profile Picture */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Picture</h2>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                <img
                  src={profile?.avatarUrl || '/images/default-avatar.png'}
                  alt="Profile"
                  className={styles.avatar}
                />
                {uploading && <div className={styles.uploadOverlay}>Uploading...</div>}
              </div>
              <label htmlFor="avatar-upload" className={styles.uploadButton}>
                {uploading ? 'Uploading...' : 'Change Picture'}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>
          </section>

          {/* Personal Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Professional Information</h2>
            <div className={styles.formGroup}>
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell customers about yourself..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Years of Experience</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Specialties</label>
              <div className={styles.tagInput}>
                <input
                  type="text"
                  value={formData.currentSpecialty}
                  onChange={(e) => setFormData({ ...formData, currentSpecialty: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="Add a specialty (e.g., Fade, Beard Trim)"
                />
                <button type="button" onClick={addSpecialty} className={styles.addButton}>
                  Add
                </button>
              </div>
              <div className={styles.tags}>
                {formData.specialties.map((specialty, index) => (
                  <span key={index} className={styles.tag}>
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Languages Spoken</label>
              <div className={styles.tagInput}>
                <input
                  type="text"
                  value={formData.currentLanguage}
                  onChange={(e) => setFormData({ ...formData, currentLanguage: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  placeholder="Add a language (e.g., English, Yoruba)"
                />
                <button type="button" onClick={addLanguage} className={styles.addButton}>
                  Add
                </button>
              </div>
              <div className={styles.tags}>
                {formData.languagesSpoken.map((language, index) => (
                  <span key={index} className={styles.tag}>
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Location Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Location</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </section>

          {/* Availability */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Availability</h2>
            <div className={styles.availabilityList}>
              {DAYS_OF_WEEK.map((day) => {
                const avail = availability.find(a => a.dayOfWeek === day.value) || {
                  dayOfWeek: day.value,
                  startTime: '09:00',
                  endTime: '17:00',
                  isAvailable: true,
                };

                return (
                  <div key={day.value} className={styles.availabilityItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={avail.isAvailable}
                        onChange={(e) => updateAvailability(day.value, 'isAvailable', e.target.checked)}
                      />
                      <span>{day.label}</span>
                    </label>
                    {avail.isAvailable && (
                      <div className={styles.timeInputs}>
                        <input
                          type="time"
                          value={avail.startTime || '09:00'}
                          onChange={(e) => updateAvailability(day.value, 'startTime', e.target.value)}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={avail.endTime || '17:00'}
                          onChange={(e) => updateAvailability(day.value, 'endTime', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Submit Button */}
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
