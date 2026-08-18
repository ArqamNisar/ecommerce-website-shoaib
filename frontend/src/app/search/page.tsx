'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts, Product } from '@/lib/api';
import { getSessionId } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!query) return;
    async function doSearch() {
      setLoading(true);
      try {
        const result = await searchProducts(query, {
          page,
          page_size: 12,
          session_id: getSessionId(),
        });
        setProducts(result.products);
        setTotal(result.total);
        setTotalPages(result.total_pages);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }
    doSearch();
  }, [query, page]);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Search Results for &ldquo;<span className="text-gradient">{query}</span>&rdquo;
        </h1>
        <p className={styles.count}>{total} products found</p>
      </div>

      {loading ? (
        <div className="product-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                <div className="skeleton" style={{ height: '14px', width: '90%' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize: '64px' }}>🔍</span>
          <h2>No results found</h2>
          <p>Try different keywords or browse our categories.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">← Previous</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading search results...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
