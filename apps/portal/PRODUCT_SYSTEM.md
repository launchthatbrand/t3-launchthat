# Unified Product System

## Overview

We've consolidated all product functionality into a single table called `products`. This single source of truth provides a complete feature set for e-commerce functionality while eliminating confusion and redundancy.

## Schema

The unified product schema includes:

- **Basic Information**
  - name: Product name
  - slug: URL-friendly version of name
  - description: Full product description
  - shortDescription: Brief description for listings
  - sku: Stock keeping unit identifier
- **Categorization**
  - primaryCategoryId: Main category for the product
  - categoryIds: Array of all categories the product belongs to
- **Pricing**
  - price: Regular price (in cents)
  - salePrice: Discounted price (in cents)
  - costPrice: Purchase cost (for profit calculations)
- **Inventory**
  - stockQuantity: Available inventory count
- **Status & Visibility**
  - status: Product status (active, draft, archived)
  - isVisible: Whether to display in storefront
- **Product Type**
  - isDigital: Whether it's a digital product
  - hasVariants: Whether it has different variants (size, color, etc.)
- **Images & Media**
  - images: Array of product images
- **Marketing**
  - isFeatured: Whether to highlight in the store
  - tags: Array of relevant tags
- **SEO**
  - metaTitle: SEO title tag
  - metaDescription: SEO meta description
  - metaKeywords: SEO keywords

## API Functions

The product system exposes these primary functions:

- **Queries**
  - `listProducts`: Get products with optional filtering
  - `getProduct`: Get a single product by ID
  - `getProductBySlug`: Get a product by its URL slug
  - `getProductCount`: Count products with optional filtering
- **Mutations**
  - `createProduct`: Create a new product
  - `updateProduct`: Update an existing product
  - `deleteProduct`: Delete a product
  - `createSampleProduct`: Create a sample product for testing

## Usage Examples

**1. Fetch all visible, active products:**

```typescript
const products = useQuery(api.products.listProducts, {
  isVisible: true,
  status: "active",
});
```

**2. Fetch products in a specific category:**

```typescript
const products = useQuery(api.products.listProducts, {
  categoryId: "category-id-here",
});
```

**3. Get a single product:**

```typescript
const product = useQuery(api.products.getProduct, {
  productId: "product-id-here",
});
```

**4. Create a new product:**

```typescript
const productId = await mutate(api.products.createProduct, {
  name: "New Product",
  description: "Product description",
  price: 1999, // $19.99
  // ... other fields
});
```

## Category Integration

Products are integrated with the hierarchical category system. Each product has:

- A primary category (primaryCategoryId)
- Multiple categories (categoryIds array)

This allows products to appear in multiple category views while maintaining a primary categorization.

## Product Variants

The system supports product variants through the related `productVariants` table, which connects to the main products table.
