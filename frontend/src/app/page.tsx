'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getProducts, getTrendingProducts, Product } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

// Hero Slider Data
const HERO_SLIDES = [
  {
    id: 1,
    tag: '⚡ TECHHAVEN EXCLUSIVE',
    title: 'PREMIUM EARBUDS',
    subtitle: 'Built for music, Gaming and Calls',
    ctaText: 'View Collection →',
    ctaLink: '/products?category=Earbuds%20%26%20Airpods',
    bgGradient: 'linear-gradient(135deg, #091224 0%, #0d1b38 50%, #060b18 100%)',
    accentColor: '#3b82f6',
    emoji: '🎧',
    features: ['Active Noise Cancellation', 'Hi-Res Audio', '40H Battery Life'],
  },
  {
    id: 2,
    tag: '🔥 TOP RATED 2026',
    title: 'SMART WATCHES & BANDS',
    subtitle: 'Track fitness, heart rate & stay connected in style',
    ctaText: 'Explore Watches →',
    ctaLink: '/products?category=Smart%20Watches',
    bgGradient: 'linear-gradient(135deg, #180d24 0%, #291244 50%, #0d0818 100%)',
    accentColor: '#a855f7',
    emoji: '⌚',
    features: ['AMOLED Display', 'GPS Tracking', '14-Day Battery'],
  },
  {
    id: 3,
    tag: '🔋 ULTRA FAST CHARGING',
    title: 'POWERBANKS & CHARGERS',
    subtitle: '100W PD Power Delivery for phones, tablets & laptops',
    ctaText: 'Shop Chargers →',
    ctaLink: '/products?category=Mobile%20Accessories',
    bgGradient: 'linear-gradient(135deg, #09201f 0%, #0d3835 50%, #061514 100%)',
    accentColor: '#10b981',
    emoji: '⚡',
    features: ['100W Fast Charge', 'Multi-Device Support', 'Universal Compatibility'],
  },
];

// Circular Collections Data matching Image 2
const CIRCULAR_COLLECTIONS = [
  {
    id: 'earbuds',
    name: 'Earphones & Headsets',
    href: '/products?category=Earbuds%20%26%20Airpods',
    icon: '🎧',
    badge: 'Trending',
  },
  {
    id: 'powerbanks',
    name: 'Powerbanks And Charger',
    href: '/products?category=Mobile%20Accessories',
    icon: '🔋',
    badge: 'Hot',
  },
  {
    id: 'watches',
    name: 'Smart Watches And Bands',
    href: '/products?category=Smart%20Watches',
    icon: '⌚',
    badge: 'Popular',
  },
  {
    id: 'gadgets',
    name: 'Tech Gadgets',
    href: '/products?category=Electronic%20Gadgets',
    icon: '🎮',
    badge: 'New',
  },
  {
    id: 'flashlights',
    name: 'Flashlights & Gear',
    href: '/products?category=Flashlights%20%26%20Searchlights',
    icon: '🔦',
    badge: 'Sale',
  },
  {
    id: 'soundbars',
    name: 'Remotes & Soundbars',
    href: '/products?category=Bluetooth%20Soundbars%20%26%20Audio',
    icon: '🔊',
    badge: 'Premium',
  },
  {
    id: 'under50',
    name: 'Under $50 Deals',
    href: '/products?max_price=50',
    icon: '🏷️',
    badge: 'Save Big',
  },
  {
    id: 'under25',
    name: 'Under $25 Budget',
    href: '/products?max_price=25',
    icon: '💰',
    badge: 'Best Value',
  },
];

export default function Home() {
  const [topSelling, setTopSelling] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [budgetDeals, setBudgetDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const collectionsRef = useRef<HTMLDivElement>(null);

  // Auto-advance hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Store Products
  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, featuredRes, budgetRes] = await Promise.allSettled([
          getTrendingProducts(8),
          getProducts({ is_featured: true, page_size: 8 }),
          getProducts({ max_price: 50, page_size: 8 }),
        ]);

        if (trendingRes.status === 'fulfilled' && trendingRes.value.products?.length > 0) {
          setTopSelling(trendingRes.value.products);
        } else if (featuredRes.status === 'fulfilled') {
          setTopSelling(featuredRes.value.products);
        }

        if (featuredRes.status === 'fulfilled') {
          setFeaturedProducts(featuredRes.value.products);
        }

        if (budgetRes.status === 'fulfilled') {
          setBudgetDeals(budgetRes.value.products);
        }
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const scrollCollections = (direction: 'left' | 'right') => {
    if (collectionsRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      collectionsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className={styles.homeContainer}>
      {/* ===== 1. HERO CAROUSEL BANNER (Reference Image 1) ===== */}
      <section className={styles.heroBanner} style={{ background: slide.bgGradient }}>
        <button
          onClick={prevSlide}
          className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <div className={`container ${styles.heroBannerInner}`}>
          {/* Left Text Column */}
          <div className={styles.heroTextCol}>
            <span className={styles.heroTag} style={{ borderColor: `${slide.accentColor}66` }}>
              {slide.tag}
            </span>
            <h1 className={styles.heroTitle}>{slide.title}</h1>
            <div className={styles.heroUnderline} style={{ background: slide.accentColor }} />
            <p className={styles.heroSubtitle}>{slide.subtitle}</p>

            <div className={styles.heroFeaturePills}>
              {slide.features.map((feat, idx) => (
                <span key={idx} className={styles.featurePill}>
                  ✓ {feat}
                </span>
              ))}
            </div>

            <div className={styles.heroCtaRow}>
              <Link
                href={slide.ctaLink}
                className={styles.heroCtaBtn}
                style={{ background: slide.accentColor }}
              >
                {slide.ctaText}
              </Link>
            </div>
          </div>

          {/* Right Product 3D Display Box */}
          <div className={styles.heroVisualCol}>
            <div className={styles.visualStage}>
              <div
                className={styles.visualGlow}
                style={{ background: `radial-gradient(circle, ${slide.accentColor}44 0%, transparent 70%)` }}
              />
              <div className={styles.podiumRing} style={{ borderColor: `${slide.accentColor}44` }} />
              <div className={styles.heroMainEmoji}>{slide.emoji}</div>
              <div className={styles.heroFloatBadge1}>
                <span>⭐ Top Rated</span>
              </div>
              <div className={styles.heroFloatBadge2}>
                <span>⚡ Instant Shipping</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={nextSlide}
          className={`${styles.sliderArrow} ${styles.sliderArrowRight}`}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Carousel Dots */}
        <div className={styles.sliderDots}>
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`${styles.sliderDot} ${currentSlide === idx ? styles.sliderDotActive : ''}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== 2. CIRCULAR "SHOP COLLECTIONS" CAROUSEL (Reference Image 2) ===== */}
      <section className={styles.collectionsSection}>
        <div className="container">
          <div className={styles.sectionHeaderBar}>
            <h2 className={styles.sectionHeading}>Shop Collections</h2>
            <div className={styles.scrollButtons}>
              <button
                onClick={() => scrollCollections('left')}
                className={styles.scrollBtn}
                aria-label="Scroll left"
              >
                ‹
              </button>
              <button
                onClick={() => scrollCollections('right')}
                className={styles.scrollBtn}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          </div>

          <div className={styles.collectionsTrack} ref={collectionsRef}>
            {CIRCULAR_COLLECTIONS.map(item => (
              <Link key={item.id} href={item.href} className={styles.collectionItem}>
                <div className={styles.collectionCircle}>
                  <div className={styles.circleInner}>
                    <span className={styles.collectionEmoji}>{item.icon}</span>
                  </div>
                </div>
                <span className={styles.collectionLabel}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. "TOP SELLING" PRODUCTS SHOWCASE (Reference Image 2) ===== */}
      <section className={styles.topSellingSection}>
        <div className="container">
          <div className={styles.sectionHeaderBar}>
            <h2 className={styles.sectionHeading}>Top Selling</h2>
            <Link href="/products" className={styles.viewAllBtn}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="product-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonImg}`} />
                  <div className={styles.skeletonBody}>
                    <div className="skeleton" style={{ height: '14px', width: '60%' }} />
                    <div className="skeleton" style={{ height: '20px', width: '90%' }} />
                    <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : topSelling.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products available yet.</p>
              <Link href="/admin/products/new" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                Add Products
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {topSelling.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 4. SPECIAL PROMO / FLASH SALE BANNER ===== */}
      <section className={styles.promoSection}>
        <div className="container">
          <div className={styles.promoCard}>
            <div className={styles.promoTextContent}>
              <span className={styles.promoPill}>🔥 Limited Time Flash Sale</span>
              <h3 className={styles.promoHeading}>
                Save up to <span style={{ color: '#3b82f6' }}>40% OFF</span> on Premium Audio & Wearables
              </h3>
              <p className={styles.promoSub}>
                Upgrade your daily gear with high performance noise-cancelling earbuds and AMOLED smartwatches.
              </p>
              <Link href="/products?max_price=60" className="btn btn-primary btn-lg">
                Shop Flash Sale
              </Link>
            </div>
            <div className={styles.promoVisualIcon}>
              ⚡
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. BUDGET FRIENDLY PICKS (UNDER $50) ===== */}
      {budgetDeals.length > 0 && (
        <section className={styles.budgetSection}>
          <div className="container">
            <div className={styles.sectionHeaderBar}>
              <div>
                <h2 className={styles.sectionHeading}>Deals Under $50</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                  Premium tech and everyday mobile essentials without breaking the bank
                </p>
              </div>
              <Link href="/products?max_price=50" className={styles.viewAllBtn}>
                View all Deals →
              </Link>
            </div>

            <div className="product-grid">
              {budgetDeals.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 6. TRUST & STORE BENEFITS BAR ===== */}
      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🚚</span>
              <div>
                <h4>Fast Nationwide Shipping</h4>
                <p>Safe dispatch & live tracking on all orders</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🛡️</span>
              <div>
                <h4>100% Genuine Quality</h4>
                <p>Tested authentic electronics & gadgets</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔄</span>
              <div>
                <h4>Easy 7-Day Returns</h4>
                <p>Hassle-free replacement guarantee</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🤖</span>
              <div>
                <h4>24/7 AI Smart Support</h4>
                <p>Instant product answers & advice anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
