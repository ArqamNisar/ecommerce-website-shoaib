'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, getTrendingProducts, Product } from '@/lib/api';
import { CATEGORIES } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featured, latest, trending] = await Promise.allSettled([
          getProducts({ is_featured: true, page_size: 8 }),
          getProducts({ sort_by: 'created_at', sort_order: 'desc', page_size: 8 }),
          getTrendingProducts(8),
        ]);

        if (featured.status === 'fulfilled') setFeaturedProducts(featured.value.products);
        if (latest.status === 'fulfilled') setNewArrivals(latest.value.products);
        if (trending.status === 'fulfilled') setTrendingProducts(trending.value.products);
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* ===== Hero Section ===== */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOrb1}/>
          <div className={styles.heroOrb2}/>
          <div className={styles.heroOrb3}/>
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>
              ⚡ Premium Electronics Store
            </span>
            <h1 className={styles.heroTitle}>
              Discover the <span className="text-gradient">Future</span> of Technology
            </h1>
            <p className={styles.heroSubtitle}>
              Shop cutting-edge electronics, smart gadgets, and premium accessories.
              Unbeatable quality at prices you&apos;ll love.
            </p>
            <div className={styles.heroCta}>
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop Now
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/products?is_featured=true" className="btn btn-secondary btn-lg">
                View Featured
              </Link>
            </div>

            {/* Stats */}
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>500+</span>
                <span className={styles.statLabel}>Products</span>
              </div>
              <div className={styles.statDivider}/>
              <div className={styles.stat}>
                <span className={styles.statNumber}>8</span>
                <span className={styles.statLabel}>Categories</span>
              </div>
              <div className={styles.statDivider}/>
              <div className={styles.stat}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>AI Support</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardGlow}/>
              <div className={styles.heroCardInner}>
                <span className={styles.heroCardIcon}>🎧</span>
                <span className={styles.heroCardText}>New Arrivals</span>
              </div>
            </div>
            <div className={`${styles.heroCard} ${styles.heroCard2}`}>
              <div className={styles.heroCardGlow}/>
              <div className={styles.heroCardInner}>
                <span className={styles.heroCardIcon}>⌚</span>
                <span className={styles.heroCardText}>Smart Tech</span>
              </div>
            </div>
            <div className={`${styles.heroCard} ${styles.heroCard3}`}>
              <div className={styles.heroCardGlow}/>
              <div className={styles.heroCardInner}>
                <span className={styles.heroCardIcon}>📺</span>
                <span className={styles.heroCardText}>Home Entertainment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Categories Section ===== */}
      <section className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Shop by <span className="accent">Category</span>
            </h2>
            <Link href="/products" className="btn btn-ghost">
              View All →
            </Link>
          </div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`${styles.categoryCard} animate-fade-in`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Featured Products ===== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              ⭐ <span className="accent">Featured</span> Products
            </h2>
            <Link href="/products?is_featured=true" className="btn btn-ghost">
              See All →
            </Link>
          </div>
          {loading ? (
            <div className="product-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonImage}`}/>
                  <div className={styles.skeletonInfo}>
                    <div className={`skeleton ${styles.skeletonLine}`} style={{width: '60%'}}/>
                    <div className={`skeleton ${styles.skeletonLine}`} style={{width: '80%'}}/>
                    <div className={`skeleton ${styles.skeletonLine}`} style={{width: '40%'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Promo Banner ===== */}
      <section className={styles.promoBanner}>
        <div className="container">
          <div className={styles.promoContent}>
            <div className={styles.promoText}>
              <span className={styles.promoBadge}>🔥 Limited Time</span>
              <h2 className={styles.promoTitle}>
                Up to <span className="text-gradient">50% OFF</span> on Selected Items
              </h2>
              <p className={styles.promoSubtitle}>
                Don&apos;t miss out on our biggest sale of the season. Premium electronics at unbeatable prices.
              </p>
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop the Sale
              </Link>
            </div>
            <div className={styles.promoVisual}>
              <div className={styles.promoGlow}/>
              <span className={styles.promoEmoji}>🛍️</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== New Arrivals ===== */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              🆕 New <span className="accent">Arrivals</span>
            </h2>
            <Link href="/products?sort_by=created_at&sort_order=desc" className="btn btn-ghost">
              See All →
            </Link>
          </div>
          {!loading && (
            <div className="product-grid">
              {newArrivals.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Why TechHaven ===== */}
      <section className={`section ${styles.whySection}`}>
        <div className="container">
          <h2 className="section-title text-center" style={{marginBottom: 'var(--space-12)'}}>
            Why Choose <span className="accent">TechHaven</span>?
          </h2>
          <div className={styles.featureGrid}>
            {[
              { icon: '🚚', title: 'Fast Shipping', desc: 'Quick delivery worldwide with real-time tracking on every order.' },
              { icon: '✅', title: 'Quality Guaranteed', desc: 'Every product is tested and certified. 30-day satisfaction guarantee.' },
              { icon: '💰', title: 'Best Prices', desc: 'We match or beat any competitor price. Get the best deals always.' },
              { icon: '🤖', title: 'AI Support 24/7', desc: 'Our AI assistant is always ready to help you find the perfect product.' },
            ].map((feature, i) => (
              <div key={i} className={`${styles.featureCard} glass-card animate-fade-in`} style={{animationDelay: `${i * 0.1}s`}}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
