'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

export default function BecomeBarberPage() {
  return (
    <>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>Join the Elite</div>
            <h1>Become a Master Barber</h1>
            <p>Transform your passion into a distinguished career. Master the ancient art of barbering with modern techniques and join our exclusive brotherhood of craftsmen.</p>
            <div className={styles.heroCta}>
              <Link href="#apply" className={styles.btnPrimary}>
                Start Your Journey
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14m-7-7l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="#contact" className={styles.btnSecondary}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Why Choose Us</div>
            <h2 className={styles.sectionTitle}>Craft Excellence with BBSLimited</h2>
            <p className={styles.sectionSubtitle}>Join an elite community where tradition meets innovation, and every cut is a masterpiece.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <h3>Master Craftsmanship</h3>
              <p>Learn from legendary barbers with decades of experience. Master traditional techniques while embracing cutting-edge innovations in the art of barbering.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11S11 10.1 11 9V7L9 7.5V9C9 11.8 10.4 14.3 12.8 15.5L14 22H16L17.2 15.5C19.6 14.3 21 11.8 21 9Z"/>
                </svg>
              </div>
              <h3>Premium Rewards</h3>
              <p>Earn exceptional compensation with performance bonuses, comprehensive benefits, and unlimited opportunities for professional growth and advancement.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M16 4C18.2 4 20 5.8 20 8C20 10.2 18.2 12 16 12C13.8 12 12 10.2 12 8C12 5.8 13.8 4 16 4ZM8 4C10.2 4 12 5.8 12 8C12 10.2 10.2 12 8 12C5.8 12 4 10.2 4 8C4 5.8 5.8 4 8 4ZM8 13C10.67 13 16 14.33 16 17V20H0V17C0 14.33 5.33 13 8 13ZM16 13C18.67 13 24 14.33 24 17V20H18V17C18 15.9 17.33 14.97 16 14.22V13Z"/>
                </svg>
              </div>
              <h3>Elite Brotherhood</h3>
              <p>Join a prestigious community of passionate artisans in an environment that celebrates creativity, excellence, and the timeless craft of barbering.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section className={styles.applicationSection} id="apply">
        <div className={styles.container}>
          <div className={styles.applicationContent}>
            <div className={styles.applicationText}>
              <h2>Ready to Begin Your Legacy?</h2>
              <p>Take the first step toward mastering an art form that has shaped men's style for generations. Your journey to becoming a master barber starts with a single application.</p>
              <Link href="#contact" className={styles.btnPrimary}>
                Schedule Consultation
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14m-7-7l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h3>Become a trained professional barbers application</h3>
                <p>Thank you for your interest in becoming a professional barber. Please complete the application form below.</p>
              </div>
              
              <BarberApplicationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection} id="contact">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Get in Touch</div>
            <h2 className={styles.sectionTitle}>Connect With Our Team</h2>
            <p className={styles.sectionSubtitle}>Ready to discuss your future? Our master barbers are here to guide your journey.</p>
          </div>
          
          <div className={styles.contactGrid}>
            <a className={styles.contactCard} href="tel:02013306086">
              <div className={styles.contactIcon}>
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"/>
                </svg>
              </div>
              <h4>Schedule a Call</h4>
              <p>Speak directly with our recruitment team</p>
            </a>
            
            <a className={styles.contactCard} href="mailto:Support@bbslimited.online">
              <div className={styles.contactIcon}>
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                </svg>
              </div>
              <h4>Send a Message</h4>
              <p>Email us your questions and portfolio</p>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// Barber Application Form Component
function BarberApplicationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    portfolio: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend API
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.barberForm}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="phone">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="experience">Years of Experience *</label>
        <select
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
        >
          <option value="">Select experience</option>
          <option value="0-1">0-1 years</option>
          <option value="2-5">2-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="portfolio">Portfolio URL (Optional)</label>
        <input
          type="url"
          id="portfolio"
          name="portfolio"
          value={formData.portfolio}
          onChange={handleChange}
          placeholder="https://yourportfolio.com"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="message">Tell us about yourself *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          required
          placeholder="Share your experience, specialties, and why you want to become a professional barber..."
        />
      </div>

      <button type="submit" className={styles.btnSubmit}>
        Submit Application
      </button>

      {submitted && (
        <div className={styles.formSuccess}>
          Thank you! Your application has been submitted successfully.
        </div>
      )}
    </form>
  );
}
