'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, uploadProductImages } from '@/lib/api';
import { CATEGORIES } from '@/lib/utils';
import styles from '../../admin.module.css';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrlsInput, setImageUrlsInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Specifications builder
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ]);

  const addSpecRow = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecRow = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    setSpecs(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build specifications dict
      const specifications: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) {
          specifications[s.key.trim()] = s.value.trim();
        }
      });

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      // Parse image URLs
      const images = imageUrlsInput
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean);

      // Create product payload
      const payload = {
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        price: parseFloat(price),
        sale_price: salePrice ? parseFloat(salePrice) : undefined,
        stock: parseInt(stock, 10) || 0,
        is_featured: isFeatured,
        is_active: isActive,
        tags,
        specifications,
        images,
      };

      const created = await createProduct(payload);

      // If local files were selected for upload, upload them
      if (selectedFiles && selectedFiles.length > 0) {
        try {
          await uploadProductImages(created.id, selectedFiles);
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr);
        }
      }

      router.push('/admin/products');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formCard}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Create New Product</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Fill in the details to publish to your store</p>
        </div>
        <Link href="/admin/products" className="btn btn-secondary btn-sm">
          ← Cancel
        </Link>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Name */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="prod-name">Product Name *</label>
            <input
              id="prod-name"
              type="text"
              className="input"
              placeholder="e.g. ProBass Elite Wireless Earbuds"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="label" htmlFor="prod-cat">Category *</label>
            <select
              id="prod-cat"
              className="input select"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div className="form-group">
            <label className="label" htmlFor="prod-subcat">Subcategory / Type</label>
            <input
              id="prod-subcat"
              type="text"
              className="input"
              placeholder="e.g. True Wireless, 4K LED TV"
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="form-group">
            <label className="label" htmlFor="prod-brand">Brand</label>
            <input
              id="prod-brand"
              type="text"
              className="input"
              placeholder="e.g. ProBass, Samsung"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>

          {/* Stock */}
          <div className="form-group">
            <label className="label" htmlFor="prod-stock">Stock Units</label>
            <input
              id="prod-stock"
              type="number"
              className="input"
              placeholder="10"
              value={stock}
              onChange={e => setStock(e.target.value)}
              min="0"
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="label" htmlFor="prod-price">Regular Price ($) *</label>
            <input
              id="prod-price"
              type="number"
              step="0.01"
              className="input"
              placeholder="79.99"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              min="0.01"
            />
          </div>

          {/* Sale Price */}
          <div className="form-group">
            <label className="label" htmlFor="prod-sale">Sale Price ($) (Optional)</label>
            <input
              id="prod-sale"
              type="number"
              step="0.01"
              className="input"
              placeholder="59.99"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              min="0.01"
            />
          </div>

          {/* Description */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="prod-desc">Description</label>
            <textarea
              id="prod-desc"
              className="input textarea"
              rows={4}
              placeholder="Detailed description of features, materials, and benefits..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="prod-tags">Tags (Comma-separated)</label>
            <input
              id="prod-tags"
              type="text"
              className="input"
              placeholder="bluetooth, wireless, anc, fast charging"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
          </div>

          {/* Image URLs */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="prod-images">Image URLs (One URL per line)</label>
            <textarea
              id="prod-images"
              className="input textarea"
              rows={3}
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrlsInput}
              onChange={e => setImageUrlsInput(e.target.value)}
            />
          </div>

          {/* Direct File Upload */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="prod-files">Or Upload Images from Computer</label>
            <input
              id="prod-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="input"
              onChange={e => setSelectedFiles(e.target.files)}
            />
          </div>

          {/* Specifications Builder */}
          <div className="form-group formGridFull">
            <label className="label">Specifications (Key / Value)</label>
            {specs.map((spec, i) => (
              <div key={i} className={styles.specRow}>
                <input
                  type="text"
                  className="input"
                  placeholder="Spec name (e.g. Battery Life)"
                  value={spec.key}
                  onChange={e => updateSpec(i, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Value (e.g. 40 hours)"
                  value={spec.value}
                  onChange={e => updateSpec(i, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeSpecRow(i)}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecRow}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--space-2)' }}
            >
              + Add Specification Row
            </button>
          </div>

          {/* Options */}
          <div className="form-group formGridFull" style={{ display: 'flex', gap: 'var(--space-8)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>Featured on Homepage</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>Active (Visible to Customers)</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)' }}>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? 'Creating Product...' : 'Publish Product'}
          </button>
          <Link href="/admin/products" className="btn btn-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
