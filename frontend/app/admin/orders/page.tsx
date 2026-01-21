'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import { orderApi, productApi } from '@/lib/api';
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
  const [orders, setOrders] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
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

  useEffect(() => {
    loadOrders();
    loadBarbers();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderApi.getAll();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
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
        setBarbers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load barbers:', err);
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
        alert('Order assigned successfully');
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

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    setCreating(true);
    try {
      const result = await orderApi.create({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        city: formData.city,
        location: formData.location,
        address: formData.address || undefined,
        additionalNotes: formData.additionalNotes || undefined,
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

  // Filter orders that need assignment
  const unassignedOrders = orders.filter(
    (order) => order.paymentStatus === 'COMPLETED' && !order.assignedBarberId
  );

  const assignedOrders = orders.filter((order) => order.assignedBarberId);

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className={styles.pageTitle}>Order Management</h1>
            <p className={styles.pageSubtitle}>Manage and assign orders to barbers</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={styles.primaryBtn}
            style={{ padding: '12px 24px' }}
          >
            {showCreateForm ? 'Cancel' : '+ Create Order'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {showCreateForm && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>Create New Order</h2>
            
            <div className={styles.formGrid}>
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
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="paystack">Paystack</option>
                </select>
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
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, paddingTop: '12px' }}>Total:</td>
                        <td style={{ fontWeight: 700, paddingTop: '12px' }}>₦{totalAmount.toLocaleString()}</td>
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
                  disabled={creating || orderItems.length === 0}
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
                  }}
                  className={styles.ghostBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Unassigned Orders</h2>
            <span className={styles.sectionBadge}>{unassignedOrders.length} pending</span>
          </div>
          <div className={styles.ordersGrid}>
            {unassignedOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <strong>{order.orderNumber}</strong>
                  <span>₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
                <div className={styles.orderDetails}>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Location:</strong> {order.city}, {order.location}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                </div>
                {selectedOrder === order.id ? (
                  <div className={styles.assignForm}>
                    <select
                      value={selectedBarber}
                      onChange={(e) => setSelectedBarber(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select Barber</option>
                      {barbers
                        .filter((b) => {
                          // Filter barbers by order location (city or state match)
                          const barberLocation = (b.city || b.location || '').toLowerCase();
                          const barberState = (b.state || '').toLowerCase();
                          const orderCity = (order.city || '').toLowerCase();
                          return b.status === 'ACTIVE' && 
                            (barberLocation.includes(orderCity) || 
                             barberState.includes(orderCity) ||
                             orderCity.includes(barberLocation) ||
                             orderCity.includes(barberState));
                        })
                        .map((barber) => (
                          <option key={barber.id} value={barber.id}>
                            {barber.user?.name || 'Unknown'} - {barber.address || barber.city || barber.location || 'No address'}
                          </option>
                        ))}
                    </select>
                    <div className={styles.formActions}>
                      <button
                        onClick={() => handleAssign(order.id)}
                        disabled={assigning || !selectedBarber}
                        className={styles.assignButton}
                      >
                        {assigning ? 'Assigning...' : 'Assign'}
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
                ) : (
                  <button
                    onClick={() => setSelectedOrder(order.id)}
                    className={styles.assignButton}
                  >
                    Assign Barber
                  </button>
                )}
              </div>
            ))}
            {unassignedOrders.length === 0 && (
              <p className={styles.empty}>No unassigned orders</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Assigned Orders</h2>
            <span className={styles.sectionBadge}>{assignedOrders.length} total</span>
          </div>
          <div className={styles.ordersList}>
            {assignedOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <strong>{order.orderNumber}</strong>
                  <span>₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
                <div className={styles.orderDetails}>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Barber:</strong> {order.assignedBarber?.name || 'N/A'}</p>
                  <p><strong>Status:</strong> {order.jobStatus || 'N/A'}</p>
                </div>
              </div>
            ))}
            {assignedOrders.length === 0 && (
              <p className={styles.empty}>No assigned orders</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
