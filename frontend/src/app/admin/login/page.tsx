'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminLogin } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Invalid credentials');
      } else {
        setError('Login failed. Please check your backend connection and credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>⚡</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Tech<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Haven</span>
            </span>
          </Link>
          <h2 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-4)', fontWeight: 700 }}>
            Admin Portal Login
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sign in to manage your inventory & store settings
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              className="input"
              placeholder="admin@techhaven.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: 'var(--space-2)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
