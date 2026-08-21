'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSearchSuggestions, isAdminLoggedIn } from '@/lib/api';
import { debounce } from '@/lib/utils';
import styles from './Header.module.css';

const NAV_CATEGORIES = [
  { name: 'Home', href: '/' },
  { name: 'Earbuds & Airpods', href: '/products?category=Earbuds%20%26%20Airpods' },
  { name: 'Mobile Accessories', href: '/products?category=Mobile%20Accessories' },
  { name: 'Smart Watches', href: '/products?category=Smart%20Watches' },
  { name: 'Electronic Gadgets', href: '/products?category=Electronic%20Gadgets' },
  { name: 'Flashlights', href: '/products?category=Flashlights%20%26%20Searchlights' },
  { name: 'Audio & Soundbars', href: '/products?category=Bluetooth%20Soundbars%20%26%20Audio' },
  { name: 'Under $25', href: '/products?max_price=25' },
  { name: 'Under $50', href: '/products?max_price=50' },
  { name: 'All Products', href: '/products' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('techhaven_cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('cartUpdated', updateCart);
    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('cartUpdated', updateCart);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = debounce(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await getSearchSuggestions(query);
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchSuggestions(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const toggleSearch = () => {
    setSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      {/* Top Bar */}
      <div className={`container ${styles.topBar}`}>
        {/* Left: Search Trigger */}
        <div className={styles.leftActions}>
          <button
            onClick={toggleSearch}
            className={styles.iconButton}
            aria-label="Search"
            title="Search products"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </button>
        </div>

        {/* Center: Brand Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMoon}>🌙</span>
          <span className={styles.logoText}>TechHaven</span>
        </Link>

        {/* Right: User Admin & Cart */}
        <div className={styles.rightActions}>
          <Link
            href={isAdmin ? '/admin/products' : '/admin/login'}
            className={styles.iconButton}
            aria-label="Admin Profile"
            title={isAdmin ? 'Admin Dashboard' : 'Admin Login'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {isAdmin && <span className={styles.adminIndicator} />}
          </Link>

          <Link href="/cart" className={styles.cartButton} id="cart-button" aria-label="Shopping Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Expandable Search Drawer / Overlay */}
      {searchOpen && (
        <div className={styles.searchOverlay} ref={searchContainerRef}>
          <div className={`container ${styles.searchInner}`}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, brands, gadgets, earbuds..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className={styles.searchCloseBtn}
                aria-label="Close search"
              >
                ✕
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(s)}
                  >
                    🔍 {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Category Navigation Strip */}
      <nav className={styles.categoryNav}>
        <div className={`container ${styles.categoryNavInner}`}>
          {NAV_CATEGORIES.map(cat => {
            const isActive = pathname === cat.href || (cat.href !== '/' && pathname.includes(cat.href));
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className={`${styles.categoryNavLink} ${isActive ? styles.activeLink : ''}`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
