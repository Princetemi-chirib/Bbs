'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './services.module.css';

type ServiceCategory = 'general' | 'recovery';

type Service = {
  id: string;
  title: string;
  description: string;
  adultPrice: number;
  kidsPrice: number | null;
  category: ServiceCategory;
  beforeImage: string;
  afterImage: string;
  isActive?: boolean;
  displayOrder?: number;
};

type ServiceFormState = {
  title: string;
  description: string;
  adultPrice: string;
  kidsPrice: string;
  category: ServiceCategory;
  beforeImage: string;
  afterImage: string;
  isActive: boolean;
  displayOrder: string;
};

const emptyForm: ServiceFormState = {
  title: '',
  description: '',
  adultPrice: '',
  kidsPrice: '',
  category: 'general',
  beforeImage: '',
  afterImage: '',
  isActive: true,
  displayOrder: '0',
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // 'before' | 'after' | null

  const uploadServiceImage = async (file: File, imageType: 'before' | 'after') => {
    setUploading(imageType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'service');
      formData.append('imageType', imageType);
      formData.append('serviceId', editingId || 'new');

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to upload image');
      }

      // Update the form with the uploaded image URL
      if (imageType === 'before') {
        setForm({ ...form, beforeImage: data.data.url });
      } else {
        setForm({ ...form, afterImage: data.data.url });
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' ? true : s.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [services, query, categoryFilter]);

  const loadServices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/products?active=all', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Failed to load services');
        return;
      }
      setServices((data.data || []) as Service[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      title: service.title || '',
      description: service.description || '',
      adultPrice: String(service.adultPrice ?? ''),
      kidsPrice: service.kidsPrice === null || service.kidsPrice === undefined ? '' : String(service.kidsPrice),
      category: service.category || 'general',
      beforeImage: service.beforeImage || '',
      afterImage: service.afterImage || '',
      isActive: service.isActive ?? true,
      displayOrder: String(service.displayOrder ?? 0),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!form.title.trim()) throw new Error('Title is required');
      if (!form.adultPrice || isNaN(Number(form.adultPrice))) throw new Error('Adult price is required');
      if (!form.beforeImage.trim()) throw new Error('Before image URL is required');
      if (!form.afterImage.trim()) throw new Error('After image URL is required');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        adultPrice: Number(form.adultPrice),
        kidsPrice: form.kidsPrice ? Number(form.kidsPrice) : undefined,
        category: form.category,
        beforeImage: form.beforeImage.trim(),
        afterImage: form.afterImage.trim(),
        isActive: form.isActive,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : 0,
      };

      const url = editingId ? `/api/v1/products/${editingId}` : '/api/v1/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save service');
      }

      await loadServices();
      closeForm();
    } catch (e: any) {
      alert(e.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const res = await fetchAuth(`/api/v1/products/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !(service.isActive ?? true) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to update service');
      await loadServices();
    } catch (e: any) {
      alert(e.message || 'Failed to update service');
    }
  };

  const deleteService = async (service: Service) => {
    if (!confirm(`Delete service "${service.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetchAuth(`/api/v1/products/${service.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to delete service');
      await loadServices();
    } catch (e: any) {
      alert(e.message || 'Failed to delete service');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <h1 className={styles.pageTitle}>Services Management</h1>
            <p className={styles.pageSubtitle}>Manage services that appear on the ordering page</p>
          </div>
          <button className={styles.addButton} onClick={openCreate}>
            + Add Service
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {showForm && (
          <section className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>{editingId ? 'Edit Service' : 'Create Service'}</h2>
              <button className={styles.ghostBtn} onClick={closeForm} disabled={saving}>
                Close
              </button>
            </div>
            <form onSubmit={submitForm} className={styles.form}>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}>
                    <option value="general">General</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Adult Price (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.adultPrice}
                    onChange={(e) => setForm({ ...form, adultPrice: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Kids Price (₦) (optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.kidsPrice}
                    onChange={(e) => setForm({ ...form, kidsPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Before Image *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploading === 'before'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadServiceImage(file, 'before');
                        }
                      }}
                      style={{ marginBottom: '8px' }}
                    />
                    {uploading === 'before' && <small style={{ color: '#666' }}>Uploading...</small>}
                    <input 
                      type="text" 
                      placeholder="Or paste image URL"
                      value={form.beforeImage} 
                      onChange={(e) => setForm({ ...form, beforeImage: e.target.value })} 
                    />
                    {form.beforeImage && (
                      <img 
                        src={form.beforeImage} 
                        alt="Before preview" 
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid #ddd' }}
                      />
                    )}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>After Image *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploading === 'after'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadServiceImage(file, 'after');
                        }
                      }}
                      style={{ marginBottom: '8px' }}
                    />
                    {uploading === 'after' && <small style={{ color: '#666' }}>Uploading...</small>}
                    <input 
                      type="text" 
                      placeholder="Or paste image URL"
                      value={form.afterImage} 
                      onChange={(e) => setForm({ ...form, afterImage: e.target.value })} 
                    />
                    {form.afterImage && (
                      <img 
                        src={form.afterImage} 
                        alt="After preview" 
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid #ddd' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroupInline}>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Active (show on ordering page)
                  </label>
                </div>
                <div className={styles.formGroup}>
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primaryBtn} type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className={styles.ghostBtn} type="button" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>All Services</h2>
            <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <input
                className={styles.search}
                placeholder="Search services..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className={styles.select}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="recovery">Recovery</option>
              </select>
            </div>
              <button className={styles.refreshBtn} onClick={loadServices} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.center}>Loading services...</div>
          ) : error ? (
            <div className={styles.centerError}>
              <p>{error}</p>
              <button className={styles.primaryBtn} onClick={loadServices}>Retry</button>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Adult</th>
                    <th>Kids</th>
                    <th>Active</th>
                    <th>Order</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className={styles.titleCell}>
                          <strong>{s.title}</strong>
                          <span className={styles.muted}>{s.description || ''}</span>
                        </div>
                      </td>
                      <td>{s.category}</td>
                      <td>₦{Number(s.adultPrice).toLocaleString()}</td>
                      <td>{s.kidsPrice === null ? '—' : `₦${Number(s.kidsPrice).toLocaleString()}`}</td>
                      <td>
                        <button
                          className={(s.isActive ?? true) ? styles.activePill : styles.inactivePill}
                          onClick={() => toggleActive(s)}
                        >
                          {(s.isActive ?? true) ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td>{s.displayOrder ?? 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActions}>
                          <button className={styles.linkBtn} onClick={() => openEdit(s)}>Edit</button>
                          <button className={styles.dangerLink} onClick={() => deleteService(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.center}>No services found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

