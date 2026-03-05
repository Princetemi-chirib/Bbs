'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth, isAdmin, hasRole, isViewOnly } from '@/lib/auth';
import { orderApi, productApi } from '@/lib/api';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import styles from './orders.module.css';

interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  ageGroup: 'fixed' | 'adults' | 'kids';
  unitPrice: number;
  totalPrice: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [markingPaidOrderId, setMarkingPaidOrderId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  // View mode for Customer Rep: overview | assignment | status | history | declined; else legacy (dashboard, all, etc.)
  const viewMode = searchParams?.get('view') || '';
  const viewAssignment = viewMode === 'assignment';
  const viewOverview = viewMode === 'overview';
  const viewStatus = viewMode === 'status';
  const viewHistory = viewMode === 'history';
  const viewDeclined = viewMode === 'declined';
  const unassignedOnly = viewAssignment;
  
  // Order form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    city: '',
    location: '',
    address: '',
    additionalNotes: '',
    paymentReference: '',
    paymentMethod: 'cash',
    paymentStatus: 'COMPLETED' as 'PENDING' | 'COMPLETED',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    ageGroup: 'fixed' as 'fixed' | 'adults' | 'kids',
    quantity: 1,
  });
  type BookingType = 'individual' | 'family' | 'enterprise';
  const [bookingType, setBookingType] = useState<BookingType>('individual');

  const createFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrders();
    loadBarbers();
    loadProducts();
  }, []);

  // Refetch barbers when opening assign modal so online status is up to date
  useEffect(() => {
    if (selectedOrder) {
      loadBarbers();
    }
  }, [selectedOrder]);

  // Open create form when URL has ?create=1 (view-only and admin cannot create; redirect away)
  useEffect(() => {
    if (searchParams?.get('create') === '1') {
      if (isViewOnly() || isAdmin()) {
        router.replace('/admin/orders');
        return;
      }
      setShowCreateForm(true);
    }
  }, [searchParams]);

  // Scroll create form into view when opened so user doesn't have to scroll down
  useEffect(() => {
    if (showCreateForm && createFormRef.current) {
      createFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCreateForm]);

  const loadOrders = async () => {
    try {
      const data = await orderApi.getAll();
      if (data.success) {
        const ordersData = data.data || [];
        console.log('📦 Loaded orders:', ordersData.length);
        console.log('📦 Orders data:', ordersData.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          paymentStatus: o.paymentStatus,
          assignedBarberId: o.assignedBarberId,
          status: o.status,
        })));
        setOrders(ordersData);
      } else {
        console.error('❌ Failed to load orders - API returned error:', data.error);
      }
    } catch (err) {
      console.error('❌ Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadBarbers = async () => {
    try {
      const response = await fetchAuth('/api/v1/barbers');
      const data = await response.json();
      if (data.success) {
        // Sort barbers: available first, then unavailable
        const barbersData = (data.data || []).sort((a: any, b: any) => {
          if (a.isAvailable === b.isAvailable) return 0;
          return a.isAvailable ? -1 : 1;
        });
        setBarbers(barbersData);
      }
    } catch (err) {
      console.error('Failed to load barbers:', err);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    setMarkingPaidOrderId(orderId);
    try {
      const response = await fetchAuth(`/api/v1/admin/orders/${orderId}/mark-paid`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (data.success) {
        alert('Order marked as paid. You can now assign a barber.');
        loadOrders();
      } else {
        alert(data.error?.message || 'Failed to mark order as paid');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark order as paid');
    } finally {
      setMarkingPaidOrderId(null);
    }
  };

  const handleAssign = async (orderId: string) => {
    if (!selectedBarber) {
      alert('Please select a barber');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/orders/assign`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          barberId: selectedBarber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Order assigned successfully. The barber will be notified.');
        setSelectedOrder(null);
        setSelectedBarber('');
        loadOrders();
      } else {
        alert(data.error?.message || 'Failed to assign order');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === currentItem.productId);
    if (!product) {
      alert('Please select a product');
      return;
    }

    const price = currentItem.ageGroup === 'kids' && product.kidsPrice 
      ? product.kidsPrice 
      : product.adultPrice;

    const newItem: OrderItem = {
      productId: product.id,
      title: product.title,
      quantity: currentItem.quantity,
      ageGroup: currentItem.ageGroup,
      unitPrice: price,
      totalPrice: price * currentItem.quantity,
    };

    setOrderItems([...orderItems, newItem]);
    setCurrentItem({ productId: '', ageGroup: 'fixed', quantity: 1 });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || 
        !formData.city || !formData.location || orderItems.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = bookingType === 'family' ? Math.round(subtotal * 0.8) : subtotal;
    const bookingNote = bookingType === 'family' ? '[Family booking - 20% off] ' : bookingType === 'enterprise' ? '[Enterprise contract] ' : '';
    const additionalNotesWithBooking = bookingNote + (formData.additionalNotes || '');

    setCreating(true);
    try {
      const result = await orderApi.create({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        city: formData.city,
        location: formData.location,
        address: formData.address || undefined,
        additionalNotes: additionalNotesWithBooking.trim() || undefined,
        items: orderItems,
        totalAmount,
        paymentReference: formData.paymentReference || undefined,
        paymentMethod: formData.paymentMethod || undefined,
      });

      if (result.success) {
        alert(`Order created successfully! Order #${result.data.orderNumber}. Customer confirmation email has been sent.`);
        // Reset form
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          city: '',
          location: '',
          address: '',
          additionalNotes: '',
          paymentReference: '',
          paymentMethod: 'cash',
          paymentStatus: 'COMPLETED',
        });
        setOrderItems([]);
        setBookingType('individual');
        setShowCreateForm(false);
        loadOrders();
      } else {
        alert(result.error?.message || 'Failed to create order');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  // Filter orders: first by date/status/etc., then by view (All orders = assigned only, New order = unassigned only)
  const filteredOrders = orders
    .filter((order) => {
      // Date range filter: Start = local start-of-day, End = local end-of-day
      if (dateRange.start || dateRange.end) {
        const orderDate = new Date(order.createdAt);
        if (orderDate.toString() === 'Invalid Date') return false;
        if (dateRange.start) {
          const start = new Date(dateRange.start + 'T00:00:00');
          if (!isNaN(start.getTime()) && orderDate < start) return false;
        }
        if (dateRange.end) {
          const end = new Date(dateRange.end + 'T23:59:59.999');
          if (!isNaN(end.getTime()) && orderDate > end) return false;
        }
      }
      // Order status filter
      if (orderStatusFilter && order.status !== orderStatusFilter) return false;
      // Payment status filter
      if (paymentStatusFilter && order.paymentStatus !== paymentStatusFilter) return false;
      // Payment method filter
      if (paymentMethodFilter && order.paymentMethod !== paymentMethodFilter) return false;
      // Service type filter (check if any item matches)
      if (serviceTypeFilter && order.items) {
        const hasService = order.items.some((item: any) =>
          item.title?.toLowerCase().includes(serviceTypeFilter.toLowerCase())
        );
        if (!hasService) return false;
      }
      return true;
    })
    .filter((order) => {
      if (viewDeclined) return (order.jobStatus || '').toUpperCase() === 'DECLINED';
      if (viewAssignment) return (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED') && !order.assignedBarberId;
      if (viewOverview || viewStatus || viewHistory) return true; // show all for overview, status, history
      // Default / dashboard: show only assigned orders
      return !!order.assignedBarberId;
    });

  // Calculate metrics
  const metrics = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    completedOrders: filteredOrders.filter(o => o.status === 'COMPLETED').length,
    cancelledOrders: filteredOrders.filter(o => o.status === 'CANCELLED').length,
    refundedOrders: filteredOrders.filter(o => o.paymentStatus === 'REFUNDED').length,
    averageOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) / filteredOrders.length 
      : 0,
    ordersInProgress: filteredOrders.filter(o => 
      o.status === 'PROCESSING' || o.status === 'CONFIRMED' || (o.jobStatus && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(o.jobStatus))
    ).length,
  };

  // Filter orders that need assignment
  // PaymentStatus enum: PENDING, PAID, PARTIALLY_PAID, REFUNDED, FAILED
  // Unassigned orders are those with PAID status and no assigned barber
  const unassignedOrders = filteredOrders.filter(
    (order) => (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED') && !order.assignedBarberId
  );

  // Assigned orders are those with a barber assigned
  const assignedOrders = filteredOrders.filter((order) => order.assignedBarberId);

  const createOrderSubtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const createOrderTotal = bookingType === 'family' ? Math.round(createOrderSubtotal * 0.8) : createOrderSubtotal;

  if (loading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  const setPresetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateRange({ start: today, end: today });
    router.replace('/admin/orders');
  };
  const setPresetWeek = () => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    setDateRange({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
    router.replace('/admin/orders');
  };
  const setPresetUnassigned = () => {
    setDateRange({ start: '', end: '' });
    router.replace('/admin/orders?view=assignment');
  };
  const setPresetAllTime = () => {
    setDateRange({ start: '', end: '' });
    router.replace('/admin/orders');
  };

  const exportOrderHistory = () => {
    const headers = ['Order #', 'Customer', 'Email', 'Phone', 'City', 'Location', 'Payment Status', 'Order Status', 'Job Status', 'Barber', 'Total (₦)', 'Created'];
    const rows = filteredOrders.map((o: any) => [
      o.orderNumber,
      o.customerName || '',
      o.customerEmail || '',
      o.customerPhone || '',
      o.city || '',
      o.location || '',
      o.paymentStatus || '',
      o.status || '',
      o.jobStatus || '',
      o.assignedBarber?.name || '',
      Number(o.totalAmount || 0).toLocaleString(),
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Orders' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className={styles.pageTitle}>
              {viewOverview && '1. Overview'}
              {viewAssignment && '2. Order Assignments'}
              {viewStatus && '3. Order Management status'}
              {viewHistory && '5. Order History'}
              {viewDeclined && '6. Declined Orders'}
              {!viewOverview && !viewAssignment && !viewStatus && !viewHistory && !viewDeclined && 'Orders'}
            </h1>
            <p className={styles.pageSubtitle}>
              {viewOverview && 'High-level statistics and recent activity of orders from the website.'}
              {viewAssignment && 'Assign and reassign booking orders. Select an unassigned paid order and choose a barber.'}
              {viewStatus && 'Filter by paid, unpaid, pending, complete, and other statuses.'}
              {viewHistory && 'View complete service history with filters and export.'}
              {viewDeclined && 'Declined orders show a reason. Reassign them to another barber using the Assign button.'}
              {!viewOverview && !viewAssignment && !viewStatus && !viewHistory && !viewDeclined && 'View orders, assign barbers, and track status. Use filters or quick presets below.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {viewHistory && (
              <button
                type="button"
                onClick={exportOrderHistory}
                className={styles.primaryBtn}
                style={{ padding: '12px 24px' }}
              >
                Export to CSV
              </button>
            )}
            {!isViewOnly() && (hasRole('REP') || hasRole('MANAGER')) && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className={styles.primaryBtn}
                style={{ padding: '12px 24px' }}
              >
                {showCreateForm ? 'Cancel' : '+ Create order'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Create New Order – at top when open so no scrolling needed (hidden for view-only) */}
        {showCreateForm && !isViewOnly() && (hasRole('REP') || hasRole('MANAGER')) && (
          <section ref={createFormRef} className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>4. Create new order manually</h2>
            <p className={styles.sectionSubtext} style={{ marginBottom: 16 }}>Choose booking type: individual, family (20% off), or enterprise contract.</p>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Booking type *</label>
                <select
                  className={styles.input}
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as BookingType)}
                >
                  <option value="individual">Individual booking</option>
                  <option value="family">Family booking (20% off)</option>
                  <option value="enterprise">Enterprise contract booking</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Customer Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className={styles.label}>Customer Email *</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <label className={styles.label}>Customer Phone *</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="08012345678"
                />
              </div>
              
              <div>
                <label className={styles.label}>City *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lagos"
                />
              </div>
              
              <div>
                <label className={styles.label}>Location *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ikeja"
                />
              </div>
              
              <div>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <label className={styles.label}>Payment Reference</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <label className={styles.label}>Payment Method</label>
                <select
                  className={styles.input}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="paystack">Paystack</option>
                </select>
                {formData.paymentMethod === 'paystack' && (
                  <p className={styles.helperText}>Customer will receive an email with a Paystack payment link. After they pay, the order is marked as paid automatically.</p>
                )}
                {formData.paymentMethod === 'cash' && (
                  <p className={styles.helperText}>Customer will pay by cash. Use &quot;Mark as paid&quot; in the orders list once payment is received.</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label className={styles.label}>Additional Notes</label>
              <textarea
                className={styles.input}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #e5e5e5', paddingTop: '24px' }}>
              <h3 className={styles.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Order Items</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
                <div>
                  <label className={styles.label}>Product *</label>
                  <select
                    className={styles.input}
                    value={currentItem.productId}
                    onChange={(e) => setCurrentItem({ ...currentItem, productId: e.target.value })}
                  >
                    <option value="">Select Product</option>
                    {products.filter(p => p.isActive).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.title} - ₦{product.adultPrice?.toLocaleString() || '0'}
                        {product.kidsPrice ? ` / ₦${product.kidsPrice.toLocaleString()} (Kids)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={styles.label}>Age Group</label>
                  <select
                    className={styles.input}
                    value={currentItem.ageGroup}
                    onChange={(e) => setCurrentItem({ ...currentItem, ageGroup: e.target.value as any })}
                    disabled={!currentItem.productId || !products.find(p => p.id === currentItem.productId)?.kidsPrice}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="adults">Adults</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
                
                <div>
                  <label className={styles.label}>Quantity</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                
                <button
                  onClick={handleAddItem}
                  className={styles.primaryBtn}
                  disabled={!currentItem.productId}
                >
                  Add
                </button>
              </div>

              {orderItems.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Age Group</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.title}</td>
                          <td>{item.ageGroup === 'kids' ? 'Kids' : item.ageGroup === 'adults' ? 'Adults' : 'Fixed'}</td>
                          <td>{item.quantity}</td>
                          <td>₦{item.unitPrice.toLocaleString()}</td>
                          <td>₦{item.totalPrice.toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className={styles.dangerLink}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, paddingTop: '12px' }}>
                          {bookingType === 'family' && (
                            <>Subtotal: ₦{createOrderSubtotal.toLocaleString()} → 20% off → </>
                          )}
                          Total:
                        </td>
                        <td style={{ fontWeight: 700, paddingTop: '12px' }}>₦{createOrderTotal.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCreateOrder}
                  className={styles.primaryBtn}
                  disabled={creating || orderItems.length === 0 || createOrderTotal <= 0}
                >
                  {creating ? 'Creating...' : 'Create Order & Send Email'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      customerName: '',
                      customerEmail: '',
                      customerPhone: '',
                      city: '',
                      location: '',
                      address: '',
                      additionalNotes: '',
                      paymentReference: '',
                      paymentMethod: 'cash',
                      paymentStatus: 'COMPLETED',
                    });
                    setOrderItems([]);
                    setBookingType('individual');
                  }}
                  className={styles.ghostBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Declined Orders notice (Customer Rep) */}
        {viewDeclined && (
          <section className={styles.section} style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 16 }}>
            <p style={{ margin: 0, color: '#856404' }}>
              <strong>Handling Declined Orders:</strong> Declined orders show a Declined status with a reason. Reassign them to another barber using the same assignment steps — click <strong>Assign</strong> and choose a different barber.
            </p>
          </section>
        )}

        {/* Order Overview Metrics */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>{viewOverview ? 'High-level statistics' : 'Summary'}</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Orders</div>
              <div className={styles.metricValue}>{metrics.totalOrders}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Revenue</div>
              <div className={styles.metricValue}>₦{metrics.totalRevenue.toLocaleString()}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Completed</div>
              <div className={styles.metricValue}>{metrics.completedOrders}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Cancelled</div>
              <div className={styles.metricValue}>{metrics.cancelledOrders}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Refunded</div>
              <div className={styles.metricValue}>{metrics.refundedOrders}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Avg Order Value</div>
              <div className={styles.metricValue}>₦{Math.round(metrics.averageOrderValue).toLocaleString()}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>In Progress</div>
              <div className={styles.metricValue}>{metrics.ordersInProgress}</div>
            </div>
          </div>
          {viewOverview && (
            <div style={{ marginTop: 24 }}>
              <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: 12 }}>Recent activity</h3>
              <p className={styles.sectionSubtext} style={{ marginBottom: 12 }}>Latest orders from the website.</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Barber</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders
                      .slice(0, 10)
                      .map((order: any) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{order.customerName}</td>
                          <td>{order.paymentStatus}</td>
                          <td>{order.status} {order.jobStatus ? ` / ${order.jobStatus}` : ''}</td>
                          <td>{order.assignedBarber?.name || '—'}</td>
                          <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && <p className={styles.sectionSubtext}>No orders in this view.</p>}
            </div>
          )}
        </section>

        {/* Filters Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Filters</h2>
          <p className={styles.sectionSubtext} style={{ marginBottom: '16px' }}>Quick presets or set dates and status below.</p>
          <div className={styles.presetRow}>
            <button
              type="button"
              className={unassignedOnly ? styles.presetBtnActive : styles.presetBtn}
              onClick={setPresetUnassigned}
            >
              Unassigned
            </button>
            <button
              type="button"
              className={!unassignedOnly && dateRange.start && dateRange.start === dateRange.end && dateRange.start === new Date().toISOString().slice(0, 10) ? styles.presetBtnActive : styles.presetBtn}
              onClick={setPresetToday}
            >
              Today
            </button>
            <button
              type="button"
              className={!unassignedOnly && dateRange.start && dateRange.end ? styles.presetBtnActive : styles.presetBtn}
              onClick={setPresetWeek}
            >
              Last 7 days
            </button>
            <button
              type="button"
              className={!unassignedOnly && !dateRange.start && !dateRange.end ? styles.presetBtnActive : styles.presetBtn}
              onClick={setPresetAllTime}
            >
              All time
            </button>
          </div>
          <div className={styles.filtersGrid}>
            <div>
              <label className={styles.label}>Date range (start)</label>
              <input
                type="date"
                className={styles.input}
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className={styles.label}>Date range (end)</label>
              <input
                type="date"
                className={styles.input}
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <label className={styles.label}>Order Status</label>
              <select
                className={styles.input}
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Payment Status</label>
              <select
                className={styles.input}
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <option value="">All Payment Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Payment Method</label>
              <select
                className={styles.input}
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="paystack">Paystack</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Service Type</label>
              <input
                type="text"
                className={styles.input}
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                placeholder="Search by service name..."
              />
            </div>
          </div>
          {(dateRange.start || dateRange.end || orderStatusFilter || paymentStatusFilter || paymentMethodFilter || serviceTypeFilter || unassignedOnly) && (
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setOrderStatusFilter('');
                setPaymentStatusFilter('');
                setPaymentMethodFilter('');
                setServiceTypeFilter('');
                router.replace('/admin/orders');
              }}
              className={styles.ghostBtn}
              style={{ marginTop: '16px' }}
            >
              Clear Filters
            </button>
          )}
        </section>

        {/* Orders Table */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Order list</h2>
            <span className={styles.sectionBadge}>{filteredOrders.length} orders</span>
          </div>
          <div className={styles.statusLegend}>
            <span className={styles.statusLegendItem}><span className={styles.legendDot} style={{ background: '#fff3cd' }} /> Pending</span>
            <span className={styles.statusLegendItem}><span className={styles.legendDot} style={{ background: '#d1ecf1' }} /> Completed</span>
            <span className={styles.statusLegendItem}><span className={styles.legendDot} style={{ background: '#f8d7da' }} /> Cancelled</span>
            <span className={styles.statusLegendItem}><span className={styles.legendDot} style={{ background: '#d1e7dd' }} /> In progress</span>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Booking Date & Time</th>
                  <th>Customer Name</th>
                  <th>Stylist Name</th>
                  <th>Services Included</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th>Discount Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className={styles.emptyCell}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '2px' }}>
                          {new Date(order.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td style={{ maxWidth: '150px' }}>{order.customerName}</td>
                      <td style={{ maxWidth: '130px' }}>{order.assignedBarber?.name || <span style={{ color: '#6c757d' }}>Unassigned</span>}</td>
                      <td style={{ maxWidth: '180px' }}>
                        {order.items && order.items.length > 0 ? (
                          <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} style={{ marginBottom: '4px' }}>
                                {item.title} ({item.quantity}x)
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                +{order.items.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.statusBadge} data-status={order.status?.toLowerCase()}>
                          {order.status || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusBadge} data-payment-status={order.paymentStatus?.toLowerCase()}>
                          {order.paymentStatus || 'N/A'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : <span style={{ color: '#6c757d' }}>N/A</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>₦{Number(order.totalAmount || 0).toLocaleString()}</strong>
                      </td>

                      
                      <td style={{ whiteSpace: 'nowrap', color: '#6c757d' }}>₦0</td>
                      <td>
                        {(hasRole('REP') || hasRole('MANAGER')) && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') && String(order.paymentMethod || '').toLowerCase() === 'cash' && (
                          <button
                            onClick={() => handleMarkAsPaid(order.id)}
                            disabled={markingPaidOrderId === order.id}
                            className={styles.primaryBtn}
                            style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px' }}
                          >
                            {markingPaidOrderId === order.id ? '...' : 'Mark as paid'}
                          </button>
                        )}
                        {hasRole('REP') && (
                          ( (!order.assignedBarberId && (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED')) ||
                            (order.jobStatus === 'DECLINED') ) && (
                          <button
                            onClick={() => setSelectedOrder(order.id === selectedOrder ? null : order.id)}
                            className={styles.assignButton}
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            {selectedOrder === order.id ? 'Cancel' : order.jobStatus === 'DECLINED' ? 'Reassign' : 'Assign'}
                          </button>
                        ) )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Assignment Modal/Form for selected order (only Customer Rep can assign) */}
        {hasRole('REP') && selectedOrder && (() => {
          const orderToAssign = orders.find(o => o.id === selectedOrder);
          if (!orderToAssign) return null;
          
          return (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>
                Assign Barber to Order {orderToAssign.orderNumber}
              </h2>
              <div className={styles.orderDetails} style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p><strong>Customer:</strong> {orderToAssign.customerName}</p>
                <p><strong>Location:</strong> {orderToAssign.city}, {orderToAssign.location}</p>
                <p><strong>Total Amount:</strong> ₦{Number(orderToAssign.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div className={styles.assignForm}>
                <select
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select Barber</option>
                  {barbers
                    .filter((b) => {
                      const barberLocation = (b.city || b.location || '').toLowerCase();
                      const barberState = (b.state || '').toLowerCase();
                      const orderCity = (orderToAssign.city || '').toLowerCase();
                      return b.status === 'ACTIVE' && 
                        (barberLocation.includes(orderCity) || 
                         barberState.includes(orderCity) ||
                         orderCity.includes(barberLocation) ||
                         orderCity.includes(barberState));
                    })
                  .map((barber) => {
                    const isOnline = barber.isOnline === true;
                    const isAvailable = barber.isAvailable === true;
                    const statusLabel = !isOnline ? ' (Offline)' : !isAvailable ? ' (Outside hours)' : '';
                    return (
                      <option 
                        key={barber.id} 
                        value={barber.id}
                        disabled={!isAvailable}
                        style={{ 
                          color: isAvailable ? 'inherit' : '#999',
                          backgroundColor: isAvailable ? 'inherit' : '#f5f5f5'
                        }}
                      >
                        {barber.user?.name || 'Unknown'} - {barber.address || barber.city || barber.location || 'No address'}
                        {statusLabel}
                      </option>
                    );
                    })}
                </select>
                <div className={styles.formActions}>
                  <button
                    onClick={() => handleAssign(selectedOrder)}
                    disabled={assigning || !selectedBarber}
                    className={styles.assignButton}
                  >
                    {assigning ? 'Assigning...' : 'Assign Barber'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setSelectedBarber('');
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          );
        })()}

      </main>
    </div>
  );
}
