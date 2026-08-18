'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import styles from './page.module.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image: string;
  quantity: number;
  category: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('techhaven_cart') || '[]');
    setCart(stored);
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('techhaven_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (id: string, delta: number) => {
    const newCart = cart.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    updateCart(newCart);
  };

  const removeItem = (id: string) => {
    updateCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => updateCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven&apos;t added anything yet. Start shopping!</p>
          <Link href="/products" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shopping Cart</h1>
        <span className={styles.itemCount}>{totalItems} items</span>
      </div>

      <div className={styles.layout}>
        {/* Cart Items */}
        <div className={styles.items}>
          {cart.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className={styles.itemInfo}>
                <Link href={`/products/${item.id}`} className={styles.itemName}>{item.name}</Link>
                <span className={styles.itemCategory}>{item.category}</span>
              </div>
              <div className={styles.itemQuantity}>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>−</button>
                <span className={styles.qtyVal}>{item.quantity}</span>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>+</button>
              </div>
              <div className={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          <button onClick={clearCart} className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }}>
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Subtotal ({totalItems} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={styles.freeShipping}>Free</span>
            </div>
            <div className={styles.summaryDivider}/>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link href="/contact" className="btn btn-primary btn-lg w-full" style={{ marginTop: 'var(--space-4)' }}>
              Contact to Order
            </Link>
            <p className={styles.summaryNote}>
              To place your order, contact us with your cart details. We&apos;ll confirm availability and shipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
