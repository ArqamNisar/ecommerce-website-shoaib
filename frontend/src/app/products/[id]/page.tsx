'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, getSimilarProducts, deleteProduct, isAdminLoggedIn, Product } from '@/lib/api';
import { formatPrice, getDiscountPercent, getSessionId } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [prod, sim] = await Promise.allSettled([
          getProduct(productId, getSessionId()),
          getSimilarProducts(productId, 4),
        ]);
        if (prod.status === 'fulfilled') setProduct(prod.value);
        if (sim.status === 'fulfilled') setSimilar(sim.value.products);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!window.confirm(`Are you sure you want to delete "${product.name}" from the store? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      alert('Product deleted successfully.');
      router.push('/products');
    } catch (err: unknown) {
      alert(`Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('techhaven_cart') || '[]');
    const existing = cart.find((item: { id: string }) => item.id === product.id);
    const displayPrice = product.sale_price || product.price;

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: displayPrice,
        original_price: product.price,
        image: product.images?.[0] || '',
        quantity,
        category: product.category,
      });
    }

    localStorage.setItem('techhaven_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.detailLayout}>
          <div className={`skeleton`} style={{ aspectRatio: '1', borderRadius: '1rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '16px', width: '30%' }} />
            <div className="skeleton" style={{ height: '32px', width: '80%' }} />
            <div className="skeleton" style={{ height: '14px', width: '100%' }} />
            <div className="skeleton" style={{ height: '14px', width: '90%' }} />
            <div className="skeleton" style={{ height: '28px', width: '40%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.notFound}>
          <span style={{ fontSize: '64px' }}>😕</span>
          <h2>Product Not Found</h2>
          <p>The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const discount = hasDiscount ? getDiscountPercent(product.price, product.sale_price!) : 0;

  return (
    <div className={`container ${styles.page}`}>
      {/* Admin Action Bar if logged in */}
      {isAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-5)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
              ⚡ Store Admin Quick Actions:
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="btn btn-secondary btn-sm"
            >
              ✏️ Edit in Admin
            </Link>
            <button
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="btn btn-danger btn-sm"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete Product'}
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* Product Detail */}
      <div className={styles.detailLayout}>
        {/* Image Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className={styles.productImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            {hasDiscount && (
              <span className={`badge badge-sale ${styles.detailBadge}`}>-{discount}% OFF</span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className={styles.thumbnails}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumbnail} ${selectedImage === i ? styles.thumbnailActive : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <div className={styles.categoryBrand}>
            <span className={styles.infoCat}>{product.category}</span>
            {product.brand && <span className={styles.infoBrand}>{product.brand}</span>}
          </div>

          <h1 className={styles.productName}>{product.name}</h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className={styles.ratingRow}>
              <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} width="18" height="18" viewBox="0 0 24 24"
                    fill={star <= Math.round(product.rating) ? '#fbbf24' : 'none'}
                    stroke="#fbbf24" strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span className={styles.ratingText}>
                {product.rating} ({product.review_count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className={styles.priceSection}>
            <span className={`${styles.mainPrice} ${hasDiscount ? styles.salePrice : ''}`}>
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className={styles.oldPrice}>{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {/* Stock */}
          <div className={styles.stockInfo}>
            {product.stock > 0 ? (
              <span className={styles.inStock}>✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className={styles.outOfStock}>✗ Out of Stock</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {product.stock > 0 && (
            <div className={styles.actions}>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >−</button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                >+</button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`btn btn-primary btn-lg ${styles.addToCartBtn}`}
              >
                {addedToCart ? '✓ Added!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className={styles.tags}>
              {product.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className={styles.tag}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className={styles.specsSection}>
          <h2 className={styles.sectionTitle}>Specifications</h2>
          <div className={styles.specsGrid}>
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className={styles.specItem}>
                <span className={styles.specKey}>{key}</span>
                <span className={styles.specValue}>{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <section className={`section ${styles.similarSection}`}>
          <div className="section-header">
            <h2 className="section-title">Similar <span className="accent">Products</span></h2>
          </div>
          <div className="product-grid">
            {similar.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
