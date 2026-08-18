'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSearchSuggestions } from '@/lib/api';
import { debounce, CATEGORIES } from '@/lib/utils';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Track scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update cart count from localStorage
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

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions
  const fetchSuggestions = debounce(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await getSearchSuggestions(query);
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions([]);
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.headerInner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>
            Tech<span className={styles.logoAccent}>Haven</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <div className={styles.navDropdown}>
            <button className={styles.navLink}>
              Categories
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className={styles.dropdownMenu}>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={styles.dropdownItem}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles.dropdownIcon}>{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/products" className={styles.navLink}>All Products</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </nav>

        {/* Search Bar */}
        <div className={styles.searchWrapper} ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              className={styles.searchInput}
              id="search-input"
            />
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(s)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartButton} id="cart-button">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen1 : ''}`}/>
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen2 : ''}`}/>
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen3 : ''}`}/>
          </button>
        </div>
      </div>
    </header>
  );
}
