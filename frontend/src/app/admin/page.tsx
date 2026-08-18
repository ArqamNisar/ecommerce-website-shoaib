'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, getCategories, Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import styles from './admin.module.css';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          getProducts({ page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
          getCategories(),
        ]);

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.products);
          setTotalProducts(prodRes.value.total);
        }
        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const featuredCount = products.filter(p => p.is_featured).length;
  const inStockCount = products.filter(p => p.stock > 0).length;

  return (
    <div>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalProducts}</span>
            <span className={styles.statLabel}>Total Products</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏷️</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{categories.length}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{featuredCount}</span>
            <span className={styles.statLabel}>Featured Items</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{inStockCount}</span>
            <span className={styles.statLabel}>In Stock</span>
          </div>
        </div>
      </div>

      {/* Recent Products Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Recently Added Products</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Latest inventory additions</p>
          </div>
          <Link href="/admin/products" className="btn btn-secondary btn-sm">
            View All Products →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading inventory data...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>No products found in the catalog.</p>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              Add Your First Product
            </Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className={styles.productThumb} />
                      ) : (
                        <div className={styles.productThumb}>📦</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.brand || 'No Brand'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-category">{p.category}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>
                      {formatPrice(p.sale_price || p.price)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: p.stock > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {p.stock > 0 ? `${p.stock} units` : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    {p.is_featured ? (
                      <span className="badge badge-featured">Featured</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/products/${p.id}/edit`} className="btn btn-ghost btn-sm">
                        ✏️ Edit
                      </Link>
                      <Link href={`/products/${p.id}`} target="_blank" className="btn btn-ghost btn-sm">
                        👁️ View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
