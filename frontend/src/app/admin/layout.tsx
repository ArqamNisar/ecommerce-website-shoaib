'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isAdminLoggedIn, getAdminEmail, adminLogout } from '@/lib/api';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    setMounted(true);
    if (!isLoginPage && !isAdminLoggedIn()) {
      router.push('/admin/login');
    } else {
      setEmail(getAdminEmail());
    }
  }, [pathname, isLoginPage, router]);

  if (!mounted) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    adminLogout();
    router.push('/admin/login');
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <span className={styles.brandText}>TechHaven</span>
          <span className={styles.brandBadge}>Admin</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            href="/admin"
            className={`${styles.navLink} ${pathname === '/admin' ? styles.navLinkActive : ''}`}
          >
            <span>📊</span> Dashboard
          </Link>
          <Link
            href="/admin/products"
            className={`${styles.navLink} ${pathname.startsWith('/admin/products') ? styles.navLinkActive : ''}`}
          >
            <span>📦</span> Products
          </Link>
          <Link
            href="/admin/products/new"
            className={`${styles.navLink} ${pathname === '/admin/products/new' ? styles.navLinkActive : ''}`}
          >
            <span>➕</span> Add Product
          </Link>
          <Link href="/" target="_blank" className={styles.navLink}>
            <span>🌐</span> View Storefront ↗
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          {email && <span className={styles.userEmail}>👤 {email}</span>}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        <header className={styles.adminHeader}>
          <h1 className={styles.pageHeading}>
            {pathname === '/admin'
              ? 'Dashboard Overview'
              : pathname === '/admin/products'
              ? 'Product Management'
              : pathname === '/admin/products/new'
              ? 'Add New Product'
              : pathname.includes('/edit')
              ? 'Edit Product'
              : 'Admin'}
          </h1>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            + New Product
          </Link>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
