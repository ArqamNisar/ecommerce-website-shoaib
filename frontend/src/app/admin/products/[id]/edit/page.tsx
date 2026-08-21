'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProduct, updateProduct, deleteProduct, uploadProductImages } from '@/lib/api';
import { CATEGORIES } from '@/lib/utils';
import styles from '../../../admin.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrlsInput, setImageUrlsInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Specifications
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    async function loadProduct() {
      try {
        const prod = await getProduct(productId);
        setName(prod.name);
        setCategory(prod.category);
        setSubcategory(prod.subcategory || '');
        setBrand(prod.brand || '');
        setDescription(prod.description || '');
        setPrice(String(prod.price));
        setSalePrice(prod.sale_price ? String(prod.sale_price) : '');
        setStock(String(prod.stock));
        setIsFeatured(prod.is_featured);
        setIsActive(prod.is_active);
        setTagsInput(prod.tags ? prod.tags.join(', ') : '');
        setImageUrlsInput(prod.images ? prod.images.join('\n') : '');

        if (prod.specifications && Object.keys(prod.specifications).length > 0) {
          setSpecs(
            Object.entries(prod.specifications).map(([k, v]) => ({
              key: k,
              value: String(v),
            }))
          );
        } else {
          setSpecs([{ key: '', value: '' }]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

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
    setSubmitting(true);

    try {
      const specifications: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) {
          specifications[s.key.trim()] = s.value.trim();
        }
      });

      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const images = imageUrlsInput
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean);

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

      await updateProduct(productId, payload);

      if (selectedFiles && selectedFiles.length > 0) {
        try {
          await uploadProductImages(productId, selectedFiles);
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr);
        }
      }

      router.push('/admin/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this product'}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProduct(productId);
      router.push('/admin/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.formCard} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Edit Product</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Update product info, pricing, and specs</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link href={`/products/${productId}`} target="_blank" className="btn btn-ghost btn-sm">
            View on Site ↗
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-danger btn-sm"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete Product'}
          </button>
          <Link href="/admin/products" className="btn btn-secondary btn-sm">
            ← Back
          </Link>
        </div>
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
            <label className="label" htmlFor="edit-name">Product Name *</label>
            <input
              id="edit-name"
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="label" htmlFor="edit-cat">Category *</label>
            <select
              id="edit-cat"
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
            <label className="label" htmlFor="edit-subcat">Subcategory / Type</label>
            <input
              id="edit-subcat"
              type="text"
              className="input"
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="form-group">
            <label className="label" htmlFor="edit-brand">Brand</label>
            <input
              id="edit-brand"
              type="text"
              className="input"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>

          {/* Stock */}
          <div className="form-group">
            <label className="label" htmlFor="edit-stock">Stock Units</label>
            <input
              id="edit-stock"
              type="number"
              className="input"
              value={stock}
              onChange={e => setStock(e.target.value)}
              min="0"
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="label" htmlFor="edit-price">Regular Price ($) *</label>
            <input
              id="edit-price"
              type="number"
              step="0.01"
              className="input"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              min="0.01"
            />
          </div>

          {/* Sale Price */}
          <div className="form-group">
            <label className="label" htmlFor="edit-sale">Sale Price ($) (Optional)</label>
            <input
              id="edit-sale"
              type="number"
              step="0.01"
              className="input"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              min="0.01"
            />
          </div>

          {/* Description */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="edit-desc">Description</label>
            <textarea
              id="edit-desc"
              className="input textarea"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="edit-tags">Tags (Comma-separated)</label>
            <input
              id="edit-tags"
              type="text"
              className="input"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
          </div>

          {/* Image URLs */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="edit-images">Image URLs (One URL per line)</label>
            <textarea
              id="edit-images"
              className="input textarea"
              rows={3}
              value={imageUrlsInput}
              onChange={e => setImageUrlsInput(e.target.value)}
            />
          </div>

          {/* Add more files */}
          <div className="form-group formGridFull">
            <label className="label" htmlFor="edit-files">Upload Additional Images</label>
            <input
              id="edit-files"
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
                  placeholder="Spec name"
                  value={spec.key}
                  onChange={e => updateSpec(i, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Value"
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

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <button type="submit" disabled={submitting || deleting} className="btn btn-primary btn-lg">
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <Link href="/admin/products" className="btn btn-secondary btn-lg">
              Cancel
            </Link>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="btn btn-danger"
          >
            {deleting ? 'Deleting Product...' : 'Delete Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
