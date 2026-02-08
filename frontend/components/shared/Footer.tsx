'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Footer.module.css';

/* Payment brand icons – simple, recognizable shapes */
function VisaIcon() {
  return (
    <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M19.2 1.6L16 14.4h-3.2L13.6 8c-.4-1.2-1.2-2-2.4-2.4L10.4 14H7.2L10.4 1.6h3.2l.8 4.8c.8.4 1.6 1.2 2 2l1.8-6.8h3.2zm8.8 8.4c0-2-.8-3.2-2.4-3.2-1.2 0-2 .8-2.4 2l-2.4-.4c.4-2.4 2-4 4.8-4 2.8 0 4 1.6 4 3.6 0 3.2-4.4 4.2-4.4 6.4 0 .8.8 1.6 2 1.6 1.2 0 2-.4 2.6-1.2l2.4.4c-.6 2.4-2.2 3.6-5 3.6-2.8 0-4.4-1.6-4.4-3.6 0-3.2 4.4-4.2 4.4-6.4zm12.2 4.4h2.8l-2.4-12.8h-2.6c-.6 0-1 .2-1.2.8l-4.4 12h3.2l.6-1.8h3.8l.4 1.8zm-3-4.8l1.6-4.4 1 4.4h-2.6zm-10.4-7.6l-2.8 12.8h-3.2l2.8-12.8h3.2z" fill="#1A1F71"/>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="10" r="8" fill="#EB001B"/>
      <circle cx="21" cy="10" r="8" fill="#F79E1B"/>
      <path d="M16 4.4a9.97 9.97 0 0 1 0 11.2 10 10 0 0 1 0-11.2z" fill="#FF5F00"/>
    </svg>
  );
}

function VerveIcon() {
  return (
    <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="40" height="24" rx="4" fill="#000"/>
      <path d="M12 8h2.5l1.2 5-1.4-5h2.4l1.4 5 1.2-5h2.5l-2 8h-2.4l-1.3-5.2L12 16H9.6l2.4-8zm10.2 5.2c0-1.2.8-2 2-2 .6 0 1 .2 1.3.6l1.8-1c-.6-.6-1.4-1-2.6-1-2 0-3.4 1.4-3.4 3.4s1.4 3.4 3.4 3.4c1.2 0 2-.4 2.6-1l-1.8-1c-.3.4-.7.6-1.3.6-1.2 0-2-.8-2-2zm8.2-3.2h-2.2l-1.4 4.8-1.4-4.8h-2.2l2.2 6.8v1.2h2.2v-1.2l2.2-6.8z" fill="#fff"/>
    </svg>
  );
}

/* Social media icons – Instagram, TikTok, Facebook */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88 2.1V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email subscription logic
    console.log('Email submitted:', email);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.wrap}>
        <div className={styles.grid}>
          {/* Quick links */}
          <div>
            <h3 className={styles.heading}>Quick links</h3>
            <ul className={styles.links}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/book">Book a service</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/become-barber">Become a barber</Link></li>
              <li><Link href="/barber-recruit">Barber recruit</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={styles.heading}>Contact</h3>
            <div className={styles.contact}>
              <p>
                <a href="tel:02013306086">02013306086</a>
              </p>
              <p>
                <a href="mailto:Support@bbslimited.online">Support@bbslimited.online</a>
              </p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className={styles.heading}>Follow us</h3>
            <div className={styles.socialList}>
              <a href="https://instagram.com/bbslimited" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://tiktok.com/@bbslimited" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok">
                <TikTokIcon />
              </a>
              <a href="https://facebook.com/bbslimited" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className={styles.heading}>Stay up to date</h3>
            <form onSubmit={handleSubmit} className={styles.newsletterForm}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                aria-label="Email for newsletter"
              />
              <button type="submit">Subscribe</button>
            </form>
            {submitted && (
              <p className={styles.newsletterThanks}>Thanks for subscribing.</p>
            )}
          </div>
        </div>

        {/* Payment methods */}
        <div className={styles.paymentSection}>
          <span className={styles.paymentLabel}>We accept</span>
          <div className={styles.paymentList}>
            <span className={styles.paymentItem} title="Visa">
              <VisaIcon />
            </span>
            <span className={styles.paymentItem} title="Mastercard">
              <MastercardIcon />
            </span>
            <span className={styles.paymentItem} title="Verve">
              <VerveIcon />
            </span>
            <span className={`${styles.paymentItem} ${styles.paymentItemPaystack}`} title="Paystack">
              Paystack
            </span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} BBS Limited. All rights reserved.
          </p>
          <nav className={styles.legal} aria-label="Legal">
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
