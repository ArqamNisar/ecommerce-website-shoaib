import Link from 'next/link';
import { CATEGORIES } from '@/lib/utils';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        {/* Brand Column */}
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>
              Tech<span className={styles.logoAccent}>Haven</span>
            </span>
          </Link>
          <p className={styles.brandDescription}>
            Your premium destination for the latest electronics, gadgets, and accessories.
            Quality products, unbeatable prices.
          </p>
          <div className={styles.socialLinks}>
            <a href="#" className={styles.socialLink} aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="#" className={styles.socialLink} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Categories Column */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Categories</h4>
          <ul className={styles.linkList}>
            {CATEGORIES.slice(0, 6).map(cat => (
              <li key={cat.slug}>
                <Link href={`/products?category=${encodeURIComponent(cat.name)}`} className={styles.footerLink}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links Column */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            <li><Link href="/products" className={styles.footerLink}>All Products</Link></li>
            <li><Link href="/products?is_featured=true" className={styles.footerLink}>Featured</Link></li>
            <li><Link href="/search" className={styles.footerLink}>Search</Link></li>
            <li><Link href="/cart" className={styles.footerLink}>Shopping Cart</Link></li>
            <li><Link href="/contact" className={styles.footerLink}>Contact Us</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Get in Touch</h4>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              support@techhaven.com
            </li>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              +1 (555) 123-4567
            </li>
            <li className={styles.contactItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Worldwide Shipping
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomBarInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} TechHaven. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <a href="#" className={styles.bottomLink}>Privacy Policy</a>
            <a href="#" className={styles.bottomLink}>Terms of Service</a>
            <a href="#" className={styles.bottomLink}>Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
