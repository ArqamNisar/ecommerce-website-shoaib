'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to the backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✅</span>
          <h2>Message Sent!</h2>
          <p>Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="btn btn-primary">
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Get in <span className="text-gradient">Touch</span>
        </h1>
        <p className={styles.subtitle}>
          Have a question about a product or want to place an order? We&apos;d love to hear from you!
        </p>
      </div>

      <div className={styles.layout}>
        {/* Contact Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="label" htmlFor="contact-name">Full Name</label>
            <input
              id="contact-name"
              type="text"
              className="input"
              placeholder="Your name"
              value={formData.name}
              onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              className="input"
              placeholder="your@email.com"
              value={formData.email}
              onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="contact-phone">Phone (Optional)</label>
            <input
              id="contact-phone"
              type="tel"
              className="input"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              className="input textarea"
              placeholder="Tell us about your order or question..."
              rows={5}
              value={formData.message}
              onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full">
            Send Message
          </button>
        </form>

        {/* Contact Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>📧</span>
            <h3>Email Us</h3>
            <p>support@techhaven.com</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>📞</span>
            <h3>Call Us</h3>
            <p>+1 (555) 123-4567</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>💬</span>
            <h3>Live Chat</h3>
            <p>Use our AI assistant for instant help!</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🕐</span>
            <h3>Business Hours</h3>
            <p>Mon - Fri: 9AM - 6PM EST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
