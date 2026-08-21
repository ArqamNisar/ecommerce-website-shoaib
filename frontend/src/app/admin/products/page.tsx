'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, deleteProduct, bulkDeleteProducts, getCategories, Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import styles from '../admin.module.css';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchProductsList = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const result = await getProducts({
        page,
        page_size: 15,
        category: selectedCategory || undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      setProducts(result.products);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProductsList();
  }, [page, selectedCategory]);

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length && products.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected product(s)? This action cannot be undone.`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const res = await bulkDeleteProducts(ids);
      alert(res.message || `Successfully deleted ${ids.length} products.`);
      fetchProductsList();
    } catch (err: unknown) {
      alert(`Failed to bulk delete products: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert(`Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < products.length;

  return (
    <div className={styles.tableCard}>
      {/* Table Header Filter Toolbar */}
      <div className={styles.tableHeaderBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
          <select
            className="input select"
            style={{ maxWidth: '240px' }}
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories ({total})</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn btn-danger btn-sm"
            >
              {bulkDeleting ? 'Deleting...' : `🗑️ Delete Selected (${selectedIds.size})`}
            </button>
          )}
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Floating bulk banner when items selected */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-6)',
            background: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--text-main)',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            ✓ {selectedIds.size} of {products.length} product(s) selected on this page
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-ghost btn-sm"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn btn-danger btn-sm"
            >
              {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Products`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            No products found matching your filters.
          </p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            Add Product
          </Link>
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: 'var(--space-4)' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAll}
                    aria-label="Select all products on this page"
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.05)' : undefined,
                    }}
                  >
                    <td style={{ paddingLeft: 'var(--space-4)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(p.id)}
                        aria-label={`Select ${p.name}`}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className={styles.productThumb} />
                        ) : (
                          <div className={styles.productThumb}>📦</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {p.brand ? `Brand: ${p.brand}` : 'No Brand'} • Rating: {p.rating}★
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-category">{p.category}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {formatPrice(p.sale_price || p.price)}
                      </div>
                      {p.sale_price && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatPrice(p.price)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: p.stock > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {p.stock} in stock
                      </span>
                    </td>
                    <td>
                      {p.is_featured && <span className="badge badge-featured" style={{ marginRight: '4px' }}>Featured</span>}
                      {p.is_active ? (
                        <span className="badge badge-new">Active</span>
                      ) : (
                        <span className="badge badge-sale">Hidden</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <Link href={`/admin/products/${p.id}/edit`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className="btn btn-danger btn-sm"
                        >
                          {deletingId === p.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-secondary btn-sm"
              >
                ← Previous
              </button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
