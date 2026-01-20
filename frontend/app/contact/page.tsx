'use client';

import Image from 'next/image';
import { useState } from 'react';
import { contactApi } from '@/lib/api';
import styles from './page.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await contactApi.submit(formData);

      if (response.success) {
        setSubmitted(true);
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(response.error?.message || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError(err.response?.data?.error?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I place an order?',
      answer:
        "Booking with BBS Limited is simple and seamless. Start by browsing our catalog and selecting the service that best suits you. Add it to your cart and review your choices. When you're ready, proceed to checkout, choose your preferred location for the haircut, enter your billing details, and select a payment method. Once your payment is confirmed, you'll receive an instant email confirmation with all the details of your booking",
    },
    {
      question: 'What is BBS Limited?',
      answer:
        "BBS Limited is Nigeria's professional haircut company, setting the standard for style, precision, and customer care. With a network of skilled barbers and modern grooming lounges across the country, we deliver more than just haircuts — we create confident looks tailored to each client. Our mission is simple: to combine world-class techniques with Nigerian flair, giving every customer a first-class grooming experience, every time",
    },
    {
      question: 'What payment methods are accepted?',
      answer:
        'We accept all major credit and debit cards, including Visa and MasterCard, as well as bank transfers. Every transaction is processed through secure, encrypted channels to ensure your payment details remain fully protected.',
    },
    {
      question: 'How long will it take for a professional BBS barber to get to my location?',
      answer:
        'Once your service order is confirmed, a trained BBS barber will arrive at your chosen location in less than 10 minutes.',
    },
    {
      question: 'Can I track the barber on the way to my location?',
      answer:
        "Yes. You'll receive email updates at the address you provided, keeping you informed of your assigned barber's location and how close they are to you.",
    },
    {
      question: 'Is my personal information safe?',
      answer:
        'Yes. Your privacy and security are our top priority. All data shared on our site is protected with SSL encryption, and payments are processed exclusively through trusted, secure providers. We never store sensitive card details on our servers.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>Get in Touch</h1>
            <p>Reach out to us. We&apos;re here to assist you and answer your queries.</p>
          </div>
        </div>
      </section>

      {/* Headquarters Section */}
      <section className={styles.headquartersSection}>
        <div className={styles.container}>
          <h2 className={styles.locationTitle}>Headquarters Benin City</h2>
        </div>
      </section>

      {/* Location Zones Section */}
      <section className={styles.locationsSection}>
        <div className={styles.container}>
          <div className={styles.locationsGrid}>
            {/* Abuja Zone */}
            <div className={styles.locationCard}>
              <div className={styles.locationImageWrapper}>
                <Image
                  src="/images/WhatsApp Image 2025-11-13 at 20.12.20_03861e78.jpg"
                  alt="Abuja Zone"
                  width={600}
                  height={400}
                  className={styles.locationImage}
                />
              </div>
              <div className={styles.locationContent}>
                <h3>Abuja Zone</h3>
              </div>
            </div>

            {/* Lagos Zone */}
            <div className={styles.locationCard}>
              <div className={styles.locationImageWrapper}>
                <Image
                  src="/images/WhatsApp Image 2025-11-13 at 20.12.20_0928ecd1.jpg"
                  alt="Lagos Zone"
                  width={600}
                  height={400}
                  className={styles.locationImage}
                />
              </div>
              <div className={styles.locationContent}>
                <h3>Lagos Zone</h3>
              </div>
            </div>

            {/* Delta Zone (Warri) */}
            <div className={styles.locationCard}>
              <div className={styles.locationImageWrapper}>
                <Image
                  src="/images/WhatsApp Image 2025-11-16 at 16.02.44_c168ed1b.jpg"
                  alt="Delta Zone"
                  width={600}
                  height={400}
                  className={styles.locationImage}
                />
              </div>
              <div className={styles.locationContent}>
                <h3>Delta Zone</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className={styles.contactInfoSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div className={styles.contactHeader}>
              <h2>Contact Us</h2>
              <p>Find our contact details and get in touch with our team for any assistance or inquiries.</p>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <path d="M511.2 387l-23.25 100.8c-3.266 14.25-15.79 24.22-30.46 24.22C205.2 512 0 306.8 0 54.5c0-14.66 9.969-27.2 24.22-30.45l100.8-23.25C139.7-2.602 154.7 5.018 160.8 18.92l46.52 108.5c5.438 12.78 1.77 27.67-8.98 36.45L144.5 207.1c33.98 69.22 90.26 125.5 159.5 159.5l44.08-53.8c8.688-10.78 23.69-14.51 36.47-8.975l108.5 46.51C506.1 357.2 514.6 372.4 511.2 387z" />
                </svg>
              </div>
              <div className={styles.contactText}>
                <a href="tel:02013306086" className={styles.contactLink}>
                  02013306086
                </a>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <path d="M464 64C490.5 64 512 85.49 512 112C512 127.1 504.9 141.3 492.8 150.4L275.2 313.6C263.8 322.1 248.2 322.1 236.8 313.6L19.2 150.4C7.113 141.3 0 127.1 0 112C0 85.49 21.49 64 48 64H464zM217.6 339.2C240.4 356.3 271.6 356.3 294.4 339.2L512 176V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V176L217.6 339.2z" />
                </svg>
              </div>
              <div className={styles.contactText}>
                <a href="mailto:support@bbslimited.online" className={styles.contactLink}>
                  support@bbslimited.online
                </a>
              </div>
            </div>

            <div className={styles.businessHours}>
              <h3>
                <strong>Business hours</strong>
              </h3>
              <p>
                Monday 08 AM–05 PM<br />
                Tuesday 08 AM–05 PM<br />
                Wednesday 08 AM–05 PM<br />
                Thursday 08 AM–05 PM<br />
                Friday 08 AM–05 PM<br />
                Saturday 08 AM–05 PM<br />
                Sunday Closed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className={styles.contactFormSection}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h2>Send Us a Message</h2>
              <p>Use the form below to reach out to us. We&apos;ll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={styles.formTextarea}
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Submit Form'}
              </button>

              {submitted && (
                <div className={styles.successMessage}>
                  The form has been submitted successfully! We will get back to you soon.
                </div>
              )}

              {error && (
                <div className={styles.errorMessage} style={{ 
                  marginTop: '16px', 
                  padding: '12px 16px', 
                  backgroundColor: '#fee', 
                  border: '1px solid #fcc', 
                  borderRadius: '8px', 
                  color: '#c00' 
                }}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <button
                  className={`${styles.faqQuestion} ${openFaq === index ? styles.active : ''}`}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  <span className={styles.faqIcon}>
                    {openFaq === index ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z" />
                      </svg>
                    )}
                  </span>
                  <span className={styles.faqQuestionText}>{faq.question}</span>
                </button>
                {openFaq === index && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
