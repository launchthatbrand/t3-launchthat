"use client";

export type CartItem = {
  _id: string;
  productPostId: string;
  quantity: number;
  unitPrice?: number | null;
  product?: {
    _id: string;
    title?: string;
    slug?: string;
    isVirtual?: boolean;
    featuredImageUrl?: string;
    features?: string[];
    requiresAccount?: boolean;
    crmMarketingTagIds?: string[];
  } | null;
};

export type ReceiptLineItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};
