'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getCategories, getBrands, Product } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [isFeatured, setIsFeatured] = useState(searchParams.get('is_featured') === 'true');

  useEffect(() => {
    const cat = searchParams.get('category');
    const feat = searchParams.get('is_featured');
    if (cat) setSelectedCategory(cat);
    if (feat === 'true') setIsFeatured(true);
  }, [searchParams]);

  // Fetch categories and brands
  useEffect(() => {
    async function fetchMeta() {
      try {
        const [cats, brs] = await Promise.allSettled([getCategories(), getBrands()]);
        if (cats.status === 'fulfilled') setCategories(cats.value);
        if (brs.status === 'fulfilled') setBrands(brs.value);
      } catch {}
    }
    fetchMeta();
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const result = await getProducts({
          page,
          page_size: 12,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          min_price: minPrice ? parseFloat(minPrice) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          is_featured: isFeatured || undefined,
        });
        setProducts(result.products);
        setTotal(result.total);
        setTotalPages(result.total_pages);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [page, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy, sortOrder, isFeatured]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setIsFeatured(false);
    setPage(1);
  };

  return (
    <div className={`container ${styles.page}`}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {selectedCategory || (isFeatured ? 'Featured Products' : 'All Products')}
        </h1>
        <p className={styles.resultCount}>{total} products found</p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.filterList}>
              <button
                className={`${styles.filterOption} ${!selectedCategory ? styles.filterActive : ''}`}
                onClick={() => { setSelectedCategory(''); setPage(1); }}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.name}
                  className={`${styles.filterOption} ${selectedCategory === cat.name ? styles.filterActive : ''}`}
                  onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                >
                  {cat.name}
                  <span className={styles.filterCount}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Price Range</h3>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                className={`input ${styles.priceInput}`}
              />
              <span className={styles.priceDash}>—</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                className={`input ${styles.priceInput}`}
              />
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Brand</h3>
            <div className={styles.filterList}>
              <button
                className={`${styles.filterOption} ${!selectedBrand ? styles.filterActive : ''}`}
                onClick={() => { setSelectedBrand(''); setPage(1); }}
              >
                All Brands
              </button>
              {brands.map(brand => (
                <button
                  key={brand}
                  className={`${styles.filterOption} ${selectedBrand === brand ? styles.filterActive : ''}`}
                  onClick={() => { setSelectedBrand(brand); setPage(1); }}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <button onClick={clearFilters} className="btn btn-secondary w-full">
            Clear All Filters
          </button>
        </aside>

        {/* Product Grid */}
        <div className={styles.mainContent}>
          {/* Sort Bar */}
          <div className={styles.sortBar}>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className={`input select ${styles.sortSelect}`}
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton`} style={{ aspectRatio: '1', width: '100%' }} />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                    <div className="skeleton" style={{ height: '14px', width: '90%' }} />
                    <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>No products found</h3>
              <p>Try adjusting your filters or browse all products.</p>
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className={`btn btn-secondary ${styles.pageBtn}`}
                  >
                    ← Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className={`btn btn-secondary ${styles.pageBtn}`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
