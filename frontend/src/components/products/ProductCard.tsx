'use client';

import Link from 'next/link';
import { Product } from '@/lib/api';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const discount = hasDiscount ? getDiscountPercent(product.price, product.sale_price!) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cart = JSON.parse(localStorage.getItem('techhaven_cart') || '[]');
    const existing = cart.find((item: { id: string }) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: displayPrice,
        original_price: product.price,
        image: product.images[0] || '',
        quantity: 1,
        category: product.category,
      });
    }

    localStorage.setItem('techhaven_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={`${styles.card} animate-fade-in`}
      style={{ animationDelay: `${index * 0.05}s` }}
      id={`product-card-${product.id}`}
    >
      {/* Image Container */}
      <div className={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {hasDiscount && (
            <span className={`badge badge-sale ${styles.badge}`}>-{discount}%</span>
          )}
          {product.is_featured && (
            <span className={`badge badge-featured ${styles.badge}`}>Featured</span>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <button
            onClick={handleAddToCart}
            className={styles.addToCartBtn}
            aria-label="Add to cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className={styles.rating}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} width="14" height="14" viewBox="0 0 24 24"
                  fill={star <= Math.round(product.rating) ? '#fbbf24' : 'none'}
                  stroke="#fbbf24" strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <span className={styles.ratingText}>
              {product.rating} ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={`${styles.price} ${hasDiscount ? styles.priceOnSale : ''}`}>
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className={styles.originalPrice}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
