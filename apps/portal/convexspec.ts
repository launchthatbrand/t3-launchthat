import type { FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  ecommerce: {
    orders: {
      mockData: {
        createMockOrder: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          {
            orderAmount: number;
            orderDbId?: Id<"orders">;
            orderId?: string;
            success: boolean;
          }
        >;
        createMockOrders: FunctionReference<
          "mutation",
          "public",
          { quantity: number },
          { count: number; orderIds: Array<string>; success: boolean }
        >;
      };
      mutations: {
        updateOrderStatus: FunctionReference<
          "mutation",
          "public",
          {
            notes?: string;
            orderId: Id<"orders">;
            status:
              | "pending"
              | "processing"
              | "shipped"
              | "delivered"
              | "completed"
              | "cancelled"
              | "refunded"
              | "partially_refunded"
              | "on_hold"
              | "chargeback";
          },
          null
        >;
        createOrder: FunctionReference<
          "mutation",
          "public",
          {
            customerInfo: {
              company?: string;
              firstName: string;
              lastName: string;
              phone?: string;
            };
            email: string;
            items: Array<{
              price: number;
              productId: Id<"products">;
              quantity: number;
            }>;
            notes?: string;
            totalAmount: number;
            userId?: Id<"users">;
          },
          any
        >;
        deleteOrder: FunctionReference<
          "mutation",
          "public",
          { orderId: Id<"orders"> },
          any
        >;
      };
      notes: {
        addOrderNote: FunctionReference<
          "mutation",
          "public",
          {
            authorId?: Id<"users">;
            authorName?: string;
            content: string;
            isPrivate?: boolean;
            orderId: Id<"orders">;
          },
          any
        >;
        updateOrderNote: FunctionReference<
          "mutation",
          "public",
          {
            content: string;
            isPrivate?: boolean;
            noteId: string;
            orderId: Id<"orders">;
          },
          any
        >;
        deleteOrderNote: FunctionReference<
          "mutation",
          "public",
          { noteId: string; orderId: Id<"orders"> },
          any
        >;
        getOrderNotes: FunctionReference<
          "query",
          "public",
          { includePrivate?: boolean; orderId: Id<"orders"> },
          any
        >;
      };
      queries: {
        getOrder: FunctionReference<
          "query",
          "public",
          { orderId: Id<"orders"> },
          any
        >;
        listOrders: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            offset?: number;
            organizationId?: Id<"organizations">;
            status?: string;
            userId?: Id<"users">;
          },
          any
        >;
        getOrdersCount: FunctionReference<
          "query",
          "public",
          { status?: string; userId?: Id<"users"> },
          any
        >;
      };
    };
    products: {
      queries: {
        listProducts: FunctionReference<
          "query",
          "public",
          {
            categoryId?: Id<"categories">;
            isVisible?: boolean;
            status?: "draft" | "active" | "archived";
          },
          any
        >;
        getProductById: FunctionReference<
          "query",
          "public",
          { productId: Id<"products"> },
          any
        >;
        getProductCount: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getCategoryCount: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
      };
      uploads: {
        generateUploadUrl: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          string
        >;
        saveProductImage: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            isPrimary?: boolean;
            position?: number;
            productId?: Id<"products">;
            storageId: Id<"_storage">;
          },
          {
            alt?: string;
            isPrimary?: boolean;
            position?: number;
            storageId: Id<"_storage">;
            url: string;
          }
        >;
        deleteProductImage: FunctionReference<
          "mutation",
          "public",
          { storageId: Id<"_storage"> },
          null
        >;
      };
      media: {
        addProductMedia: FunctionReference<
          "mutation",
          "public",
          {
            mediaItems: Array<{
              alt?: string;
              isPrimary?: boolean;
              mediaItemId: Id<"mediaItems">;
              position?: number;
            }>;
            productId: Id<"products">;
          },
          { imagesAdded: number; success: boolean }
        >;
        replaceProductMedia: FunctionReference<
          "mutation",
          "public",
          {
            mediaItems: Array<{
              alt?: string;
              isPrimary?: boolean;
              mediaItemId: Id<"mediaItems">;
              position?: number;
            }>;
            productId: Id<"products">;
          },
          { success: boolean; totalImages: number }
        >;
        removeProductMedia: FunctionReference<
          "mutation",
          "public",
          { mediaItemIds: Array<Id<"mediaItems">>; productId: Id<"products"> },
          { removedCount: number; success: boolean }
        >;
        getProductWithMedia: FunctionReference<
          "query",
          "public",
          { productId: Id<"products"> },
          null | {
            _id: Id<"products">;
            description?: string;
            images: Array<{
              alt?: string;
              isPrimary?: boolean;
              position?: number;
              url: string;
            }>;
            mediaItems?: Array<{
              _id: Id<"mediaItems">;
              alt?: string;
              isPrimary?: boolean;
              position?: number;
              title?: string;
              url?: string;
            }>;
            name: string;
            price: number;
          }
        >;
        createProductWithMedia: FunctionReference<
          "mutation",
          "public",
          {
            categoryIds: Array<Id<"productCategories">>;
            description?: string;
            hasVariants: boolean;
            isDigital: boolean;
            isFeatured: boolean;
            isVisible: boolean;
            mediaMetadata?: Array<{
              alt?: string;
              caption?: string;
              isPrimary?: boolean;
              position?: number;
              title?: string;
            }>;
            name: string;
            price: number;
            primaryCategoryId: Id<"productCategories">;
            sku: string;
            slug: string;
            status: string;
            storageIds?: Array<Id<"_storage">>;
            taxable: boolean;
          },
          { mediaItemIds: Array<Id<"mediaItems">>; productId: Id<"products"> }
        >;
      };
      mutations: {
        createProduct: FunctionReference<
          "mutation",
          "public",
          {
            basePrice?: number;
            categoryIds: Array<Id<"productCategories">>;
            costPrice?: number;
            customSlug?: string;
            description?: string;
            hasVariants: boolean;
            images: Array<{
              alt?: string;
              isPrimary?: boolean;
              name?: string;
              position?: number;
              size?: number;
              storageId?: Id<"_storage">;
              url: string;
            }>;
            inventoryLevel?: number;
            isDigital: boolean;
            isFeatured?: boolean;
            isVisible: boolean;
            metaDescription?: string;
            metaKeywords?: Array<string>;
            metaTitle?: string;
            name: string;
            price?: number;
            primaryCategoryId?: Id<"productCategories">;
            salePrice?: number;
            shortDescription?: string;
            sku: string;
            status: "draft" | "active" | "archived";
            stockQuantity?: number;
            stockStatus?: "in_stock" | "out_of_stock";
            tags?: Array<string>;
            taxable: boolean;
          },
          any
        >;
        updateProduct: FunctionReference<
          "mutation",
          "public",
          {
            categoryIds?: Array<Id<"productCategories">>;
            costPrice?: number;
            customSlug?: string;
            description?: string;
            hasVariants?: boolean;
            images?: Array<{
              alt?: string;
              isPrimary?: boolean;
              name?: string;
              position?: number;
              size?: number;
              storageId?: Id<"_storage">;
              url: string;
            }>;
            isDigital?: boolean;
            isFeatured?: boolean;
            isVisible?: boolean;
            metaDescription?: string;
            metaKeywords?: Array<string>;
            metaTitle?: string;
            name?: string;
            price?: number;
            primaryCategoryId?: Id<"productCategories">;
            productId: Id<"products">;
            salePrice?: number;
            shortDescription?: string;
            sku?: string;
            status?: "draft" | "active" | "archived";
            stockQuantity?: number;
            stockStatus?: "in_stock" | "out_of_stock";
            tags?: Array<string>;
            taxable?: boolean;
          },
          any
        >;
        deleteProduct: FunctionReference<
          "mutation",
          "public",
          { productId: Id<"products"> },
          any
        >;
      };
    };
    balances: {
      queries: {
        getTransferWithOrders: FunctionReference<
          "query",
          "public",
          { transferId: Id<"transfers"> },
          any
        >;
        getBankAccount: FunctionReference<
          "query",
          "public",
          { bankAccountId: Id<"bankAccounts"> },
          any
        >;
      };
      mutations: {
        createJunctionTableEntries: FunctionReference<
          "mutation",
          "public",
          { orderIds: Array<Id<"orders">>; transferId: Id<"transfers"> },
          any
        >;
        addOrdersToTransfer: FunctionReference<
          "mutation",
          "public",
          { orderIds: Array<Id<"orders">>; transferId: Id<"transfers"> },
          any
        >;
        removeOrdersFromTransfer: FunctionReference<
          "mutation",
          "public",
          { orderIds: Array<Id<"orders">>; transferId: Id<"transfers"> },
          any
        >;
        createBankAccount: FunctionReference<
          "mutation",
          "public",
          {
            accountHolderName: string;
            accountNumber: string;
            accountType: "checking" | "savings";
            bankName: string;
            isDefault?: boolean;
            routingNumber: string;
          },
          any
        >;
        updateBankAccount: FunctionReference<
          "mutation",
          "public",
          {
            accountHolderName?: string;
            bankAccountId: Id<"bankAccounts">;
            bankName?: string;
            isDefault?: boolean;
          },
          any
        >;
        createTransfer: FunctionReference<
          "mutation",
          "public",
          {
            amount: number;
            bankAccountId: Id<"bankAccounts">;
            currency: string;
            description?: string;
          },
          any
        >;
        updateStoreBalance: FunctionReference<
          "mutation",
          "public",
          { amount: number; operation: "add" | "subtract" },
          any
        >;
        deleteBankAccount: FunctionReference<
          "mutation",
          "public",
          { bankAccountId: Id<"bankAccounts"> },
          any
        >;
      };
    };
    categories: {
      mutations: {
        createCategory: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            displayOrder?: number;
            iconUrl?: string;
            imageUrl?: string;
            isActive: boolean;
            isVisible: boolean;
            metaDescription?: string;
            metaKeywords?: Array<string>;
            metaTitle?: string;
            name: string;
            parentId?: Id<"productCategories">;
          },
          any
        >;
        updateCategory: FunctionReference<
          "mutation",
          "public",
          {
            categoryId: Id<"productCategories">;
            description?: string;
            displayOrder?: number;
            iconUrl?: string;
            imageUrl?: string;
            isActive?: boolean;
            isVisible?: boolean;
            metaDescription?: string;
            metaKeywords?: Array<string>;
            metaTitle?: string;
            name?: string;
            parentId?: Id<"productCategories"> | null;
          },
          any
        >;
        deleteCategory: FunctionReference<
          "mutation",
          "public",
          { categoryId: Id<"productCategories"> },
          any
        >;
      };
      queries: {
        getProductCategories: FunctionReference<
          "query",
          "public",
          {
            isActive?: boolean;
            isVisible?: boolean;
            parentId?: Id<"productCategories">;
          },
          Array<{
            _creationTime: number;
            _id: Id<"productCategories">;
            createdAt: number;
            description?: string;
            displayOrder?: number;
            iconUrl?: string;
            imageUrl?: string;
            isActive: boolean;
            isVisible: boolean;
            level: number;
            metaDescription?: string;
            metaKeywords?: Array<string>;
            metaTitle?: string;
            name: string;
            parentId?: Id<"productCategories">;
            path: Array<Id<"productCategories">>;
            slug: string;
            updatedAt: number;
          }>
        >;
        getCategoryTree: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<any>
        >;
        getCategory: FunctionReference<
          "query",
          "public",
          { categoryId: Id<"productCategories"> },
          null | any
        >;
        getCategoryBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          null | any
        >;
        getCategoryBreadcrumbs: FunctionReference<
          "query",
          "public",
          { categoryId: Id<"productCategories"> },
          any
        >;
        getCategoryCount: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          number
        >;
      };
    };
    cart: {
      mutations: {
        addToCart: FunctionReference<
          "mutation",
          "public",
          {
            guestSessionId?: string;
            productId: Id<"products">;
            quantity: number;
            savedForLater?: boolean;
            userId?: Id<"users">;
            variationId?: Id<"productVariants">;
          },
          any
        >;
        updateCartItemQuantity: FunctionReference<
          "mutation",
          "public",
          {
            cartItemId: Id<"cartItems">;
            guestSessionId?: string;
            quantity: number;
            userId?: Id<"users">;
          },
          any
        >;
        removeFromCart: FunctionReference<
          "mutation",
          "public",
          {
            cartItemId: Id<"cartItems">;
            guestSessionId?: string;
            userId?: Id<"users">;
          },
          any
        >;
        clearCart: FunctionReference<
          "mutation",
          "public",
          { guestSessionId?: string; userId?: Id<"users"> },
          any
        >;
      };
      queries: {
        getCart: FunctionReference<
          "query",
          "public",
          { guestSessionId?: string; sessionId?: string; userId?: Id<"users"> },
          {
            items: Array<{
              _creationTime: number;
              _id: Id<"cartItems">;
              addedAt: number;
              guestSessionId?: string;
              price: number;
              productId: Id<"products">;
              productSnapshot: {
                description?: string;
                image?: string;
                name: string;
                sku?: string;
                slug?: string;
              };
              quantity: number;
              savedForLater: boolean;
              updatedAt: number;
              userId?: string;
              variationId?: Id<"productVariants">;
              variationSnapshot?: {
                attributes: Record<string, string>;
                name: string;
              };
            }>;
            savedItems: Array<{
              _creationTime: number;
              _id: Id<"cartItems">;
              addedAt: number;
              guestSessionId?: string;
              price: number;
              productId: Id<"products">;
              productSnapshot: {
                description?: string;
                image?: string;
                name: string;
                sku?: string;
                slug?: string;
              };
              quantity: number;
              savedForLater: boolean;
              updatedAt: number;
              userId?: string;
              variationId?: Id<"productVariants">;
              variationSnapshot?: {
                attributes: Record<string, string>;
                name: string;
              };
            }>;
            summary: {
              _creationTime?: number;
              _id?: Id<"cartSummary">;
              estimatedShipping: number;
              estimatedTax: number;
              guestSessionId?: string;
              itemCount: number;
              subtotal: number;
              updatedAt: number;
              userId?: string;
            };
          }
        >;
      };
    };
    chargebacks: {
      evidence: {
        getChargebackEvidence: FunctionReference<
          "query",
          "public",
          {
            chargebackId: Id<"chargebacks">;
            documentType?: string;
            submissionStatus?: string;
          },
          Array<{
            _creationTime: number;
            _id: Id<"chargebackEvidence">;
            chargebackId: Id<"chargebacks">;
            description?: string;
            documentType:
              | "receipt"
              | "shipping_proof"
              | "customer_communication"
              | "refund_policy"
              | "terms_of_service"
              | "product_description"
              | "customer_signature"
              | "billing_statement"
              | "transaction_history"
              | "dispute_response"
              | "audit_log"
              | "other";
            fileStorageId?: Id<"_storage">;
            importance: "critical" | "high" | "medium" | "low";
            metadata?: Record<string, string | number | boolean>;
            processorRelevance?: {
              authorizeNet?: boolean;
              paypal?: boolean;
              square?: boolean;
              stripe?: boolean;
            };
            submissionStatus:
              | "draft"
              | "ready"
              | "submitted"
              | "accepted"
              | "rejected";
            submittedAt?: number;
            submittedBy?: string;
            tags?: Array<string>;
            textContent?: string;
            title: string;
            url?: string;
          }>
        >;
        getEvidence: FunctionReference<
          "query",
          "public",
          { evidenceId: Id<"chargebackEvidence"> },
          null | {
            _creationTime: number;
            _id: Id<"chargebackEvidence">;
            chargebackId: Id<"chargebacks">;
            description?: string;
            documentType:
              | "receipt"
              | "shipping_proof"
              | "customer_communication"
              | "refund_policy"
              | "terms_of_service"
              | "product_description"
              | "customer_signature"
              | "billing_statement"
              | "transaction_history"
              | "dispute_response"
              | "other";
            fileStorageId?: Id<"_storage">;
            importance: "critical" | "high" | "medium" | "low";
            metadata?: Record<string, string | number | boolean>;
            processorRelevance?: {
              authorizeNet?: boolean;
              paypal?: boolean;
              square?: boolean;
              stripe?: boolean;
            };
            submissionStatus:
              | "draft"
              | "ready"
              | "submitted"
              | "accepted"
              | "rejected";
            submittedAt?: number;
            submittedBy?: string;
            tags?: Array<string>;
            textContent?: string;
            title: string;
            url?: string;
          }
        >;
        createEvidence: FunctionReference<
          "mutation",
          "public",
          {
            chargebackId: Id<"chargebacks">;
            description?: string;
            documentType:
              | "receipt"
              | "shipping_proof"
              | "customer_communication"
              | "refund_policy"
              | "terms_of_service"
              | "product_description"
              | "customer_signature"
              | "billing_statement"
              | "transaction_history"
              | "dispute_response"
              | "other";
            fileStorageId?: Id<"_storage">;
            importance: "critical" | "high" | "medium" | "low";
            metadata?: Record<string, string | number | boolean>;
            processorRelevance?: {
              authorizeNet?: boolean;
              paypal?: boolean;
              square?: boolean;
              stripe?: boolean;
            };
            submittedBy?: string;
            tags?: Array<string>;
            textContent?: string;
            title: string;
            url?: string;
          },
          Id<"chargebackEvidence">
        >;
        updateEvidence: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            fileStorageId?: Id<"_storage">;
            id: Id<"chargebackEvidence">;
            importance?: "critical" | "high" | "medium" | "low";
            metadata?: Record<string, string | number | boolean>;
            processorRelevance?: {
              authorizeNet?: boolean;
              paypal?: boolean;
              square?: boolean;
              stripe?: boolean;
            };
            submissionStatus?:
              | "draft"
              | "ready"
              | "submitted"
              | "accepted"
              | "rejected";
            tags?: Array<string>;
            textContent?: string;
            title?: string;
            url?: string;
          },
          null
        >;
        submitEvidence: FunctionReference<
          "mutation",
          "public",
          { evidenceIds: Array<Id<"chargebackEvidence">>; submittedBy: string },
          { error?: string; submittedCount: number; success: boolean }
        >;
        deleteEvidence: FunctionReference<
          "mutation",
          "public",
          { id: Id<"chargebackEvidence"> },
          null
        >;
        generateUploadUrl: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          string
        >;
        getEvidenceSummary: FunctionReference<
          "query",
          "public",
          { chargebackId: Id<"chargebacks"> },
          {
            acceptedCount: number;
            criticalCount: number;
            documentsWithFiles: number;
            documentsWithText: number;
            documentsWithUrls: number;
            draftCount: number;
            readyCount: number;
            rejectedCount: number;
            submittedCount: number;
            totalCount: number;
          }
        >;
      };
      mockData: {
        createMockChargeback: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          {
            chargebackId?: string;
            error?: string;
            orderId?: string;
            success: boolean;
          }
        >;
      };
      mutations: {
        updateChargebackStatus: FunctionReference<
          "mutation",
          "public",
          {
            chargebackId: Id<"chargebacks">;
            status:
              | "accepted"
              | "won"
              | "lost"
              | "expired"
              | "received"
              | "under_review"
              | "disputed";
          },
          any
        >;
        addChargebackEvidence: FunctionReference<
          "mutation",
          "public",
          { chargebackId: Id<"chargebacks">; evidence: string },
          any
        >;
      };
      queries: {
        getChargebacks: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"chargebacks">;
            amount: number;
            caseId?: string;
            chargebackDate: number;
            chargebackFee?: number;
            chargebackId: string;
            currency: string;
            customerCommunication?: string;
            customerInfo: { customerId?: string; email: string; name: string };
            disputeDeadline?: number;
            evidenceDetails?: string;
            evidenceSubmitted?: boolean;
            internalNotes?: string;
            metadata?: Record<string, string | number | boolean>;
            orderId: Id<"orders">;
            previousChargebacks?: number;
            processorName: string;
            reasonCode: string;
            reasonDescription: string;
            receivedDate: number;
            refundAmount?: number;
            resolvedDate?: number;
            riskScore?: number;
            status:
              | "received"
              | "under_review"
              | "accepted"
              | "disputed"
              | "won"
              | "lost"
              | "expired";
            transactionId?: string;
          }>
        >;
        getChargeback: FunctionReference<
          "query",
          "public",
          { chargebackId: Id<"chargebacks"> },
          {
            _creationTime: number;
            _id: Id<"chargebacks">;
            amount: number;
            caseId?: string;
            chargebackDate: number;
            chargebackFee?: number;
            chargebackId: string;
            currency: string;
            customerCommunication?: string;
            customerInfo: { customerId?: string; email: string; name: string };
            disputeDeadline?: number;
            evidenceDetails?: string;
            evidenceSubmitted?: boolean;
            internalNotes?: string;
            metadata?: Record<string, string | number | boolean>;
            orderId: Id<"orders">;
            previousChargebacks?: number;
            processorName: string;
            reasonCode: string;
            reasonDescription: string;
            receivedDate: number;
            refundAmount?: number;
            resolvedDate?: number;
            riskScore?: number;
            status:
              | "received"
              | "under_review"
              | "accepted"
              | "disputed"
              | "won"
              | "lost"
              | "expired";
            transactionId?: string;
          } | null
        >;
      };
    };
    checkout: {
      mutations: {
        createCheckoutSession: FunctionReference<
          "mutation",
          "public",
          { items: Array<{ productId: Id<"products">; quantity: number }> },
          any
        >;
        completeCheckout: FunctionReference<
          "mutation",
          "public",
          { paymentMethodId: string; sessionId: string },
          any
        >;
      };
      queries: {
        getCheckoutSession: FunctionReference<
          "query",
          "public",
          { sessionId: string },
          any
        >;
      };
    };
    payments: {
      mutations: {
        processPayment: FunctionReference<
          "mutation",
          "public",
          { amount: number; orderId: Id<"orders">; paymentMethodId: string },
          any
        >;
        refundPayment: FunctionReference<
          "mutation",
          "public",
          { amount?: number; paymentId: string },
          any
        >;
      };
      queries: {
        getPaymentMethods: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getPayment: FunctionReference<
          "query",
          "public",
          { paymentId: string },
          any
        >;
      };
    };
    transfers: {
      mockData: {
        createMockTransfer: FunctionReference<
          "mutation",
          "public",
          { orderCount?: number },
          {
            orderIds: Array<string>;
            success: boolean;
            totalAmount: number;
            transferId: string;
          }
        >;
      };
      mutations: {
        createTransfer: FunctionReference<
          "mutation",
          "public",
          { amount: number; bankAccountId: Id<"bankAccounts"> },
          any
        >;
        updateTransferStatus: FunctionReference<
          "mutation",
          "public",
          {
            status:
              | "pending"
              | "completed"
              | "failed"
              | "cancelled"
              | "in_transit"
              | "reversed";
            transferId: Id<"transfers">;
          },
          any
        >;
      };
      queries: {
        getTransfers: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getTransfer: FunctionReference<
          "query",
          "public",
          { transferId: Id<"transfers"> },
          any
        >;
      };
    };
    variations: {
      mutations: {
        createProductVariant: FunctionReference<
          "mutation",
          "public",
          {
            name: string;
            price: number;
            productId: Id<"products">;
            sku?: string;
          },
          any
        >;
        updateProductVariant: FunctionReference<
          "mutation",
          "public",
          { name?: string; price?: number; variantId: Id<"productVariants"> },
          any
        >;
        deleteProductVariant: FunctionReference<
          "mutation",
          "public",
          { variantId: Id<"productVariants"> },
          any
        >;
      };
      queries: {
        getProductVariations: FunctionReference<
          "query",
          "public",
          { productId: Id<"products"> },
          any
        >;
        getVariation: FunctionReference<
          "query",
          "public",
          { variationId: Id<"productVariants"> },
          any
        >;
      };
    };
    funnels: {
      queries: {
        getAllFunnels: FunctionReference<
          "query",
          "public",
          { status?: string },
          any
        >;
        getFunnelCheckoutBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          any
        >;
        getFunnelEdges: FunctionReference<
          "query",
          "public",
          { funnelId: Id<"funnels"> },
          any
        >;
        getFunnelSession: FunctionReference<
          "query",
          "public",
          { sessionId: Id<"funnelSessions"> },
          any
        >;
        getFunnelStepById: FunctionReference<
          "query",
          "public",
          { stepId: Id<"funnelSteps"> },
          any
        >;
        getFunnelSteps: FunctionReference<
          "query",
          "public",
          { funnelId: Id<"funnels"> },
          any
        >;
      };
      mutations: {
        createCustomCheckoutSession: FunctionReference<
          "mutation",
          "public",
          { checkoutSlug: string; email?: string; name?: string },
          any
        >;
        updateCustomCheckoutSessionInfo: FunctionReference<
          "mutation",
          "public",
          {
            email: string;
            name?: string;
            phone?: string;
            sessionId: Id<"funnelSessions">;
            shippingAddress?: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
          },
          any
        >;
        completeCustomCheckoutSession: FunctionReference<
          "mutation",
          "public",
          {
            billingAddress?: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
            paymentIntentId?: string;
            paymentMethod: string;
            sessionId: Id<"funnelSessions">;
          },
          any
        >;
        createFunnel: FunctionReference<
          "mutation",
          "public",
          {
            allowCoupons?: boolean;
            cancelUrl?: string;
            collectBillingAddress?: boolean;
            collectEmail: boolean;
            collectName: boolean;
            collectPhone?: boolean;
            collectShippingAddress?: boolean;
            contentTypeId?: Id<"contentTypes">;
            description?: string;
            slug: string;
            status: string;
            successUrl?: string;
            title: string;
          },
          any
        >;
        updateCustomCheckout: FunctionReference<
          "mutation",
          "public",
          {
            allowCoupons?: boolean;
            cancelUrl?: string;
            collectBillingAddress?: boolean;
            collectEmail?: boolean;
            collectName?: boolean;
            collectPhone?: boolean;
            collectShippingAddress?: boolean;
            description?: string;
            id: Id<"funnels">;
            productIds?: Array<Id<"products">>;
            status?: string;
            successUrl?: string;
            title?: string;
          },
          any
        >;
        deleteCustomCheckout: FunctionReference<
          "mutation",
          "public",
          { id: Id<"funnels"> },
          any
        >;
        addFunnelStep: FunctionReference<
          "mutation",
          "public",
          {
            config?: {
              allowCoupons?: boolean;
              cancelUrl?: string;
              checkoutLayout?: "one_step" | "two_step";
              collectBillingAddress?: boolean;
              collectEmail?: boolean;
              collectName?: boolean;
              collectPhone?: boolean;
              collectShippingAddress?: boolean;
              productIds?: Array<Id<"products">>;
              successUrl?: string;
            };
            funnelId: Id<"funnels">;
            label?: string;
            position?: number;
            type:
              | "landing"
              | "funnelCheckout"
              | "upsell"
              | "order_confirmation";
          },
          any
        >;
        updateFunnelStep: FunctionReference<
          "mutation",
          "public",
          {
            config?: {
              allowCoupons?: boolean;
              cancelUrl?: string;
              checkoutLayout?: "one_step" | "two_step";
              collectBillingAddress?: boolean;
              collectEmail?: boolean;
              collectName?: boolean;
              collectPhone?: boolean;
              collectShippingAddress?: boolean;
              productIds?: Array<Id<"products">>;
              successUrl?: string;
              uiPosition?: { x: number; y: number };
            };
            label?: string;
            position?: number;
            slug?: string;
            stepId: Id<"funnelSteps">;
            type?:
              | "landing"
              | "funnelCheckout"
              | "upsell"
              | "order_confirmation";
          },
          any
        >;
        deleteFunnelStep: FunctionReference<
          "mutation",
          "public",
          { stepId: Id<"funnelSteps"> },
          any
        >;
        setCheckoutSessionItems: FunctionReference<
          "mutation",
          "public",
          {
            productIds: Array<Id<"products">>;
            sessionId: Id<"funnelSessions">;
          },
          any
        >;
        addFunnelEdge: FunctionReference<
          "mutation",
          "public",
          {
            funnelId: Id<"funnels">;
            label?: string;
            source: Id<"funnelSteps">;
            target: Id<"funnelSteps">;
          },
          any
        >;
        deleteFunnelEdge: FunctionReference<
          "mutation",
          "public",
          { edgeId: Id<"funnelEdges"> },
          any
        >;
        updateFunnelEdge: FunctionReference<
          "mutation",
          "public",
          {
            edgeId: Id<"funnelEdges">;
            label?: string;
            source?: Id<"funnelSteps">;
            target?: Id<"funnelSteps">;
          },
          any
        >;
      };
    };
    checkouts: {
      queries: {
        getCheckoutBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          any
        >;
        getCheckoutSession: FunctionReference<
          "query",
          "public",
          { sessionId: Id<"funnelSessions"> },
          any
        >;
      };
      mutations: {
        createCheckoutSession: FunctionReference<
          "mutation",
          "public",
          { checkoutSlug: string; email?: string; name?: string },
          any
        >;
        updateCheckoutSessionInfo: FunctionReference<
          "mutation",
          "public",
          {
            email: string;
            name?: string;
            phone?: string;
            sessionId: Id<"funnelSessions">;
            shippingAddress?: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
          },
          any
        >;
        completeCheckoutSession: FunctionReference<
          "mutation",
          "public",
          {
            billingAddress?: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
            paymentIntentId?: string;
            paymentMethod: string;
            sessionId: Id<"funnelSessions">;
          },
          any
        >;
        setCheckoutSessionItems: FunctionReference<
          "mutation",
          "public",
          {
            productIds: Array<Id<"products">>;
            sessionId: Id<"funnelSessions">;
          },
          any
        >;
      };
    };
  };
  env: { get: FunctionReference<"query", "public", { name: string }, any> };
  notifications: {
    mutations: {
      markNotificationAsRead: FunctionReference<
        "mutation",
        "public",
        { notificationId: Id<"notifications"> },
        boolean
      >;
      markAllNotificationsAsRead: FunctionReference<
        "mutation",
        "public",
        { userId: Id<"users"> },
        number
      >;
      createNotification: FunctionReference<
        "mutation",
        "public",
        {
          actionData?: Record<string, string>;
          actionUrl?: string;
          content?: string;
          expiresAt?: number;
          message?: string;
          relatedId?: Id<"groupInvitations">;
          sourceOrderId?: Id<"transactions">;
          sourceUserId?: Id<"users">;
          title: string;
          type:
            | "friendRequest"
            | "friendAccepted"
            | "message"
            | "mention"
            | "groupInvite"
            | "groupJoinRequest"
            | "groupJoinApproved"
            | "groupJoinRejected"
            | "groupInvitation"
            | "invitationAccepted"
            | "invitationDeclined"
            | "groupPost"
            | "groupComment"
            | "eventInvite"
            | "eventReminder"
            | "eventUpdate"
            | "newDownload"
            | "courseUpdate"
            | "orderConfirmation"
            | "paymentSuccess"
            | "paymentFailed"
            | "productUpdate"
            | "systemAnnouncement"
            | "reaction"
            | "comment"
            | "commentReply"
            | "share"
            | "newFollowedUserPost";
          userId: Id<"users">;
        },
        Id<"notifications">
      >;
      deleteNotification: FunctionReference<
        "mutation",
        "public",
        { notificationId: Id<"notifications"> },
        boolean
      >;
      deleteAllNotifications: FunctionReference<
        "mutation",
        "public",
        { userId: Id<"users"> },
        number
      >;
      batchCreateNotifications: FunctionReference<
        "mutation",
        "public",
        {
          actionData?: Record<string, string>;
          actionUrl?: string;
          content?: string;
          expiresAt?: number;
          message?: string;
          relatedId?: Id<"groupInvitations">;
          sourceOrderId?: Id<"transactions">;
          sourceUserId?: Id<"users">;
          title: string;
          type:
            | "friendRequest"
            | "friendAccepted"
            | "message"
            | "mention"
            | "groupInvite"
            | "groupJoinRequest"
            | "groupJoinApproved"
            | "groupJoinRejected"
            | "groupInvitation"
            | "invitationAccepted"
            | "invitationDeclined"
            | "groupPost"
            | "groupComment"
            | "eventInvite"
            | "eventReminder"
            | "eventUpdate"
            | "newDownload"
            | "courseUpdate"
            | "orderConfirmation"
            | "paymentSuccess"
            | "paymentFailed"
            | "productUpdate"
            | "systemAnnouncement"
            | "reaction"
            | "comment"
            | "commentReply"
            | "share"
            | "newFollowedUserPost";
          userIds: Array<Id<"users">>;
        },
        Array<Id<"notifications">>
      >;
    };
    preferences: {
      getNotificationPreferences: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        any
      >;
      updateNotificationPreferences: FunctionReference<
        "mutation",
        "public",
        {
          appPreferences?: Record<string, never>;
          emailPreferences?: Record<string, never>;
          pushEnabled?: boolean;
          pushToken?: string;
          userId: Id<"users">;
        },
        boolean
      >;
      resetNotificationPreferences: FunctionReference<
        "mutation",
        "public",
        { userId: Id<"users"> },
        boolean
      >;
      updateSingleNotificationPreference: FunctionReference<
        "mutation",
        "public",
        {
          appEnabled?: boolean;
          emailEnabled?: boolean;
          type:
            | "friendRequest"
            | "friendAccepted"
            | "message"
            | "mention"
            | "groupInvite"
            | "groupJoinRequest"
            | "groupJoinApproved"
            | "groupJoinRejected"
            | "groupInvitation"
            | "invitationAccepted"
            | "invitationDeclined"
            | "groupPost"
            | "groupComment"
            | "eventInvite"
            | "eventReminder"
            | "eventUpdate"
            | "newDownload"
            | "courseUpdate"
            | "orderConfirmation"
            | "paymentSuccess"
            | "paymentFailed"
            | "productUpdate"
            | "systemAnnouncement";
          userId: Id<"users">;
        },
        any
      >;
      updatePushSettings: FunctionReference<
        "mutation",
        "public",
        { pushEnabled: boolean; pushToken?: string; userId: Id<"users"> },
        any
      >;
    };
    queries: {
      getNotificationsByClerkId: FunctionReference<
        "query",
        "public",
        {
          clerkId: string;
          filters?: { type?: string };
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      listNotificationsByClerkId: FunctionReference<
        "query",
        "public",
        { clerkId: string },
        any
      >;
    };
  };
  tasks: {
    boards: {
      mutations: {
        createBoard: FunctionReference<
          "mutation",
          "public",
          { name: string },
          any
        >;
        updateBoard: FunctionReference<
          "mutation",
          "public",
          { boardId: Id<"taskBoards">; name: string },
          any
        >;
        deleteBoard: FunctionReference<
          "mutation",
          "public",
          { boardId: Id<"taskBoards"> },
          any
        >;
      };
      queries: {
        listBoards: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getBoard: FunctionReference<
          "query",
          "public",
          { boardId: Id<"taskBoards"> },
          any
        >;
      };
    };
    mutations: {
      createTask: FunctionReference<
        "mutation",
        "public",
        {
          boardId?: Id<"taskBoards">;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          status?: "pending" | "completed" | "cancelled";
          title: string;
        },
        Id<"tasks">
      >;
      updateTask: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          status?: "pending" | "completed" | "cancelled";
          taskId: Id<"tasks">;
          title?: string;
        },
        boolean
      >;
      deleteTask: FunctionReference<
        "mutation",
        "public",
        { taskId: Id<"tasks"> },
        boolean
      >;
      reorderTasks: FunctionReference<
        "mutation",
        "public",
        { tasks: Array<{ sortIndex: number; taskId: Id<"tasks"> }> },
        boolean
      >;
    };
    queries: {
      listTasks: FunctionReference<
        "query",
        "public",
        Record<string, never>,
        Array<{
          _creationTime: number;
          _id: Id<"tasks">;
          boardId?: Id<"taskBoards">;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }>
      >;
      getTask: FunctionReference<
        "query",
        "public",
        { taskId: Id<"tasks"> },
        null | {
          _creationTime: number;
          _id: Id<"tasks">;
          boardId?: Id<"taskBoards">;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }
      >;
      listTasksByBoard: FunctionReference<
        "query",
        "public",
        { boardId: Id<"taskBoards"> },
        Array<{
          _creationTime: number;
          _id: Id<"tasks">;
          boardId?: Id<"taskBoards">;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }>
      >;
    };
  };
  vimeo: {
    actions: {
      listFolders: FunctionReference<
        "action",
        "public",
        { connectionId: Id<"connections"> },
        Array<{ id: string; name: string }>
      >;
      getCachedVimeoVideos: FunctionReference<
        "action",
        "public",
        { ownerId: Id<"users"> | string },
        any
      >;
    };
    mutations: {
      createVideo: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: Id<"connections">;
          createdAt: number;
          description?: string;
          embedUrl: string;
          publishedAt: number;
          thumbnailUrl?: string;
          title: string;
          updatedAt: number;
          videoId: string;
        },
        Id<"vimeoVideos">
      >;
      updateVideo: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          embedUrl?: string;
          id: Id<"vimeoVideos">;
          publishedAt?: number;
          thumbnailUrl?: string;
          title?: string;
          updatedAt: number;
        },
        Id<"vimeoVideos">
      >;
      triggerSync: FunctionReference<
        "mutation",
        "public",
        { connectionId: Id<"connections"> },
        null
      >;
    };
    queries: {
      listVideos: FunctionReference<
        "query",
        "public",
        { connectionId?: Id<"connections"> },
        Array<{
          _id: Id<"vimeoVideos">;
          description?: string;
          embedUrl: string;
          publishedAt: number;
          thumbnailUrl?: string;
          title: string;
          videoId: string;
        }>
      >;
      getVideoByExternalId: FunctionReference<
        "query",
        "public",
        { videoId: string },
        null | {
          _id: Id<"vimeoVideos">;
          connectionId: Id<"connections">;
          embedUrl: string;
          publishedAt: number;
          thumbnailUrl?: string;
          title: string;
          videoId: string;
        }
      >;
    };
  };
  core: {
    tags: {
      mutations: {
        createTag: FunctionReference<
          "mutation",
          "public",
          { description?: string; name: string },
          Id<"tags">
        >;
        updateTag: FunctionReference<
          "mutation",
          "public",
          { description?: string; id: Id<"tags">; name?: string },
          null
        >;
        deleteTag: FunctionReference<
          "mutation",
          "public",
          { id: Id<"tags"> },
          null
        >;
      };
      queries: {
        listTags: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"tags">;
            description?: string;
            name: string;
            slug: string;
          }>
        >;
      };
    };
    menus: {
      mutations: {
        createMenu: FunctionReference<
          "mutation",
          "public",
          { isBuiltIn?: boolean; location: string; name: string },
          any
        >;
        addMenuItem: FunctionReference<
          "mutation",
          "public",
          {
            isBuiltIn?: boolean;
            label: string;
            menuId: Id<"menus">;
            order?: number;
            parentId?: Id<"menuItems"> | null;
            url: string;
          },
          any
        >;
        removeMenuItem: FunctionReference<
          "mutation",
          "public",
          { itemId: Id<"menuItems"> },
          any
        >;
        reorderMenuItems: FunctionReference<
          "mutation",
          "public",
          {
            menuId: Id<"menus">;
            updates: Array<{ itemId: Id<"menuItems">; order: number }>;
          },
          any
        >;
        updateMenu: FunctionReference<
          "mutation",
          "public",
          { data: { location?: string; name?: string }; menuId: Id<"menus"> },
          any
        >;
        updateMenuItem: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              label?: string;
              order?: number;
              parentId?: Id<"menuItems"> | null;
              url?: string;
            };
            itemId: Id<"menuItems">;
          },
          any
        >;
      };
      queries: {
        listMenus: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"menus">;
            createdAt: number;
            isBuiltIn?: boolean;
            itemCount?: number;
            location: string;
            name: string;
            updatedAt?: number;
          }>
        >;
        getMenu: FunctionReference<
          "query",
          "public",
          { menuId: Id<"menus"> },
          {
            _creationTime: number;
            _id: Id<"menus">;
            createdAt: number;
            isBuiltIn?: boolean;
            itemCount?: number;
            location: string;
            name: string;
            updatedAt?: number;
          } | null
        >;
        getMenuItems: FunctionReference<
          "query",
          "public",
          { menuId: Id<"menus"> },
          Array<{
            _creationTime: number;
            _id: Id<"menuItems">;
            createdAt: number;
            isBuiltIn?: boolean;
            label: string;
            menuId: Id<"menus">;
            order?: number;
            parentId?: Id<"menuItems"> | null;
            updatedAt?: number;
            url: string;
          }>
        >;
        getMenuByLocation: FunctionReference<
          "query",
          "public",
          { location: string },
          {
            _creationTime: number;
            _id: Id<"menus">;
            createdAt: number;
            isBuiltIn?: boolean;
            itemCount?: number;
            location: string;
            name: string;
            updatedAt?: number;
          } | null
        >;
        getMenuWithItemsByLocation: FunctionReference<
          "query",
          "public",
          { location: string },
          {
            items: Array<{
              _creationTime: number;
              _id: Id<"menuItems">;
              createdAt: number;
              isBuiltIn?: boolean;
              label: string;
              menuId: Id<"menus">;
              order?: number;
              parentId?: Id<"menuItems"> | null;
              updatedAt?: number;
              url: string;
            }>;
            menu: {
              _creationTime: number;
              _id: Id<"menus">;
              createdAt: number;
              isBuiltIn?: boolean;
              itemCount?: number;
              location: string;
              name: string;
              updatedAt?: number;
            };
          } | null
        >;
      };
    };
    options: {
      get: FunctionReference<
        "query",
        "public",
        {
          metaKey: string;
          orgId?: Id<"organizations"> | "portal-root";
          type?: "store" | "site";
        },
        any
      >;
      getByType: FunctionReference<
        "query",
        "public",
        {
          orgId?: Id<"organizations"> | "portal-root";
          type?: "store" | "site";
        },
        any
      >;
      getStoreOptions: FunctionReference<
        "query",
        "public",
        { orgId?: Id<"organizations"> | "portal-root" },
        any
      >;
      set: FunctionReference<
        "mutation",
        "public",
        {
          metaKey: string;
          metaValue: any;
          orgId?: Id<"organizations"> | "portal-root";
          type?: "store" | "site";
        },
        any
      >;
      setBatch: FunctionReference<
        "mutation",
        "public",
        {
          options: Array<{ metaKey: string; metaValue: any }>;
          orgId?: Id<"organizations"> | "portal-root";
          type?: "store" | "site";
        },
        any
      >;
      remove: FunctionReference<
        "mutation",
        "public",
        {
          metaKey: string;
          orgId?: Id<"organizations"> | "portal-root";
          type?: "store" | "site";
        },
        any
      >;
    };
    permissions: {
      mutations: {
        createRole: FunctionReference<
          "mutation",
          "public",
          {
            description: string;
            isAssignable: boolean;
            name: string;
            parentId?: Id<"roles">;
            priority: number;
            scope: "global" | "group" | "course" | "organization";
          },
          { _id: Id<"roles"> }
        >;
        deletePermission: FunctionReference<
          "mutation",
          "public",
          { permissionId: Id<"permissions"> },
          { success: boolean }
        >;
        deleteRole: FunctionReference<
          "mutation",
          "public",
          { roleId: Id<"roles"> },
          { success: boolean }
        >;
      };
      queries: {
        getPermissions: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"permissions">;
            action: string;
            category?: string;
            defaultLevel: "none" | "own" | "group" | "all";
            dependencies?: Array<string>;
            description: string;
            isSystem: boolean;
            key: string;
            name: string;
            resource: string;
          }>
        >;
        getRoles: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"roles">;
            customData?: any;
            description: string;
            isAssignable: boolean;
            isSystem: boolean;
            name: string;
            parentId?: Id<"roles">;
            priority: number;
            scope: "global" | "group" | "course" | "organization";
          }>
        >;
        checkUserPermission: FunctionReference<
          "query",
          "public",
          {
            permissionKey: string;
            resourceOwnerId?: Id<"users">;
            scopeId?: string;
            scopeType?: "global" | "group" | "course" | "organization";
            userId: Id<"users">;
          },
          boolean
        >;
      };
    };
    posts: {
      mutations: {
        createPost: FunctionReference<
          "mutation",
          "public",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: Id<"organizations">;
            postTypeSlug?: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          any
        >;
        createTemplate: FunctionReference<
          "mutation",
          "public",
          {
            loopContext?: string;
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            targetPostType?: string;
            templateCategory: "single" | "archive" | "loop" | "container";
            title: string;
          },
          any
        >;
        updatePost: FunctionReference<
          "mutation",
          "public",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            id: Id<"posts">;
            meta?: Record<string, string | number | boolean | null>;
            postTypeSlug?: string;
            slug?: string;
            status?: "published" | "draft" | "archived";
            tags?: Array<string>;
            title?: string;
          },
          any
        >;
        deletePost: FunctionReference<
          "mutation",
          "public",
          { id: Id<"posts"> },
          any
        >;
        updatePostStatus: FunctionReference<
          "mutation",
          "public",
          { id: Id<"posts">; status: "published" | "draft" | "archived" },
          any
        >;
        bulkUpdatePostStatus: FunctionReference<
          "mutation",
          "public",
          {
            ids: Array<Id<"posts">>;
            status: "published" | "draft" | "archived";
          },
          any
        >;
      };
      queries: {
        getAllPosts: FunctionReference<
          "query",
          "public",
          {
            filters?: {
              authorId?: Id<"users">;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId?: Id<"organizations">;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "public",
          { id: Id<"posts">; organizationId?: Id<"organizations"> },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; postId: Id<"posts"> },
          any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; slug: string },
          any
        >;
        searchPosts: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            organizationId?: Id<"organizations">;
            searchTerm: string;
          },
          any
        >;
        getPostTags: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          any
        >;
        getPostCategories: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          any
        >;
        listTemplates: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          any
        >;
        getTemplateForPostType: FunctionReference<
          "query",
          "public",
          {
            organizationId?: Id<"organizations">;
            postTypeSlug?: string;
            templateCategory: "single" | "archive" | "loop" | "container";
          },
          any
        >;
      };
    };
    categories: {
      mutations: {
        createCategory: FunctionReference<
          "mutation",
          "public",
          { description?: string; name: string },
          any
        >;
        updateCategory: FunctionReference<
          "mutation",
          "public",
          { description?: string; newName: string; oldName: string },
          any
        >;
        deleteCategory: FunctionReference<
          "mutation",
          "public",
          { name: string },
          any
        >;
      };
      queries: {
        getCategories: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"categories">;
            createdAt?: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories">;
            postTypes?: Array<string>;
            slug: string;
            updatedAt?: number;
          }>
        >;
        getProductCategories: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{ categoryId: Id<"categories">; count: number }>
        >;
        getCategoryBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          {
            _creationTime: number;
            _id: Id<"categories">;
            createdAt?: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories">;
            postTypes?: Array<string>;
            slug: string;
            updatedAt?: number;
          } | null
        >;
        getCategoryById: FunctionReference<
          "query",
          "public",
          { id: Id<"categories"> },
          {
            _creationTime: number;
            _id: Id<"categories">;
            createdAt?: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories">;
            postTypes?: Array<string>;
            slug: string;
            updatedAt?: number;
          } | null
        >;
        getChildCategories: FunctionReference<
          "query",
          "public",
          { parentId?: Id<"categories"> },
          Array<{
            _creationTime: number;
            _id: Id<"categories">;
            createdAt?: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories">;
            postTypes?: Array<string>;
            slug: string;
            updatedAt?: number;
          }>
        >;
        listCategoriesByPostType: FunctionReference<
          "query",
          "public",
          { postType: string },
          Array<{
            _creationTime: number;
            _id: Id<"categories">;
            createdAt?: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories">;
            postTypes?: Array<string>;
            slug: string;
            updatedAt?: number;
          }>
        >;
      };
    };
    accessControl: {
      mutations: {
        assignDownloadRole: FunctionReference<
          "mutation",
          "public",
          { roleToAssign: string; userIdToAssign: Id<"users"> },
          boolean
        >;
      };
      queries: {
        checkIsAdmin: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          boolean
        >;
      };
    };
    media: {
      integration: {
        linkMediaToPost: FunctionReference<
          "mutation",
          "public",
          {
            fieldName: string;
            mediaItemId: Id<"mediaItems">;
            postId: string;
            postType: string;
          },
          { success: boolean; url?: string }
        >;
        createMediaForPost: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            externalUrl?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            title?: string;
          },
          { mediaItemId: Id<"mediaItems">; url?: string }
        >;
        getMediaWithUrl: FunctionReference<
          "query",
          "public",
          { mediaItemId: Id<"mediaItems"> },
          null | {
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            title?: string;
            url?: string;
          }
        >;
        createLMSFeaturedMedia: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            caption?: string;
            storageId?: Id<"_storage">;
            title?: string;
            vimeoId?: string;
            vimeoUrl?: string;
          },
          | { mediaItemId: Id<"mediaItems">; type: "convex" }
          | { type: "vimeo"; vimeoId: string; vimeoUrl: string }
        >;
        createProductImages: FunctionReference<
          "mutation",
          "public",
          {
            mediaItems: Array<{
              alt?: string;
              isPrimary?: boolean;
              mediaItemId: Id<"mediaItems">;
              position?: number;
            }>;
          },
          Array<{
            alt?: string;
            isPrimary?: boolean;
            name?: string;
            position?: number;
            size?: number;
            storageId?: Id<"_storage">;
            url: string;
          }>
        >;
        bulkCreateMedia: FunctionReference<
          "mutation",
          "public",
          {
            items: Array<{
              alt?: string;
              caption?: string;
              categories?: Array<string>;
              externalUrl?: string;
              storageId?: Id<"_storage">;
              title?: string;
            }>;
          },
          Array<{ mediaItemId: Id<"mediaItems">; url?: string }>
        >;
      };
      mutations: {
        generateUploadUrl: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          string
        >;
        saveMedia: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            status?: "draft" | "published";
            storageId: Id<"_storage">;
            title?: string;
          },
          {
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            status: "draft" | "published";
            storageId: Id<"_storage">;
            title?: string;
            url: string;
          }
        >;
        updateMedia: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            id: Id<"mediaItems">;
            status?: "draft" | "published";
            title?: string;
          },
          Id<"mediaItems">
        >;
        deleteMedia: FunctionReference<
          "mutation",
          "public",
          { id: Id<"mediaItems"> },
          null
        >;
        upsertMediaMeta: FunctionReference<
          "mutation",
          "public",
          {
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            status?: "draft" | "published";
            storageId: Id<"_storage">;
            title?: string;
          },
          Id<"mediaItems">
        >;
      };
      queries: {
        getMediaItem: FunctionReference<
          "query",
          "public",
          { id: Id<"mediaItems"> },
          null | {
            _creationTime: number;
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            externalUrl?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            title?: string;
            url?: string;
          }
        >;
        getMediaByStorageId: FunctionReference<
          "query",
          "public",
          { storageId: Id<"_storage"> },
          null | {
            _creationTime: number;
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            externalUrl?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            title?: string;
            url?: string;
          }
        >;
        getMediaById: FunctionReference<
          "query",
          "public",
          { id: Id<"mediaItems"> },
          null | {
            _creationTime: number;
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            externalUrl?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            title?: string;
            url?: string;
          }
        >;
        listMediaItemsWithUrl: FunctionReference<
          "query",
          "public",
          {
            categoryIds?: Array<Id<"categories">>;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            searchTerm?: string;
            status?: "draft" | "published";
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"mediaItems">;
              alt?: string;
              caption?: string;
              categories?: Array<string>;
              categoryIds?: Array<Id<"categories">>;
              externalUrl?: string;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              title?: string;
              url?: string;
            }>;
            pageStatus?: string | null;
            splitCursor?: string | null;
          }
        >;
        listMedia: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"mediaItems">;
              alt?: string;
              caption?: string;
              categories?: Array<string>;
              categoryIds?: Array<Id<"categories">>;
              externalUrl?: string;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              title?: string;
              url?: string;
            }>;
          }
        >;
        listImages: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"mediaItems">;
              alt?: string;
              caption?: string;
              categories?: Array<string>;
              categoryIds?: Array<Id<"categories">>;
              externalUrl?: string;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              title?: string;
              url?: string;
            }>;
          }
        >;
        searchMedia: FunctionReference<
          "query",
          "public",
          {
            categoryIds?: Array<Id<"categories">>;
            limit?: number;
            searchTerm: string;
            status?: "draft" | "published";
          },
          Array<{
            _creationTime: number;
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            categoryIds?: Array<Id<"categories">>;
            externalUrl?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            title?: string;
            url?: string;
          }>
        >;
      };
    };
    organizations: {
      mutations: {
        create: FunctionReference<
          "mutation",
          "public",
          {
            allowSelfRegistration?: boolean;
            description?: string;
            isPublic?: boolean;
            name: string;
            planId?: Id<"plans">;
          },
          Id<"organizations">
        >;
        update: FunctionReference<
          "mutation",
          "public",
          {
            allowSelfRegistration?: boolean;
            customDomain?: string;
            description?: string;
            isPublic?: boolean;
            logo?: string;
            name?: string;
            organizationId: Id<"organizations">;
            planId?: Id<"plans">;
            primaryColor?: string;
          },
          null
        >;
        inviteUser: FunctionReference<
          "mutation",
          "public",
          {
            email: string;
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
          },
          Id<"organizationInvitations">
        >;
        acceptInvitation: FunctionReference<
          "mutation",
          "public",
          { token: string },
          Id<"userOrganizations">
        >;
        removeUser: FunctionReference<
          "mutation",
          "public",
          { organizationId: Id<"organizations">; userId: Id<"users"> },
          null
        >;
        updateUserRole: FunctionReference<
          "mutation",
          "public",
          {
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
            userId: Id<"users">;
          },
          null
        >;
        grantCustomerAccessMutation: FunctionReference<
          "mutation",
          "public",
          {
            accessType:
              | "product_purchase"
              | "course_enrollment"
              | "manual_grant";
            customerUserId: Id<"users">;
            expiresAt?: number;
            organizationId: Id<"organizations">;
            sourceId?: Id<"products"> | string;
          },
          Id<"userOrganizations">
        >;
        deleteOrganization: FunctionReference<
          "mutation",
          "public",
          { organizationId: Id<"organizations"> },
          null
        >;
        addUser: FunctionReference<
          "mutation",
          "public",
          {
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
            userId: Id<"users">;
          },
          Id<"userOrganizations">
        >;
        addUserByEmail: FunctionReference<
          "mutation",
          "public",
          {
            email: string;
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
          },
          Id<"userOrganizations">
        >;
        createPlan: FunctionReference<
          "mutation",
          "public",
          {
            description: string;
            displayName: string;
            features: Array<string>;
            isActive?: boolean;
            maxOrganizations: number;
            name: "free" | "starter" | "business" | "agency";
            priceMonthly: number;
            priceYearly?: number;
            sortOrder?: number;
          },
          Id<"plans">
        >;
        updatePlan: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            displayName?: string;
            features?: Array<string>;
            isActive?: boolean;
            maxOrganizations?: number;
            name?: "free" | "starter" | "business" | "agency";
            planId: Id<"plans">;
            priceMonthly?: number;
            priceYearly?: number;
            sortOrder?: number;
          },
          null
        >;
        deletePlan: FunctionReference<
          "mutation",
          "public",
          { planId: Id<"plans"> },
          null
        >;
      };
      queries: {
        myOrganizations: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<any>
        >;
        getById: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations"> },
          {
            _creationTime: number;
            _id: Id<"organizations">;
            allowSelfRegistration: boolean;
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: number;
            currentPeriodStart?: number;
            customDomain?: string;
            description?: string;
            isPublic: boolean;
            logo?: string;
            memberCount?: number;
            name: string;
            ownerId: Id<"users">;
            planId?: Id<"plans">;
            primaryColor?: string;
            slug: string;
            subscriptionId?: string;
            subscriptionStatus:
              | "active"
              | "trialing"
              | "past_due"
              | "canceled"
              | "unpaid";
            updatedAt: number;
            userRole?: "owner" | "admin" | "editor" | "viewer" | "student";
          } | null
        >;
        getBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          {
            _creationTime: number;
            _id: Id<"organizations">;
            allowSelfRegistration: boolean;
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: number;
            currentPeriodStart?: number;
            customDomain?: string;
            description?: string;
            isPublic: boolean;
            logo?: string;
            memberCount?: number;
            name: string;
            ownerId: Id<"users">;
            planId?: Id<"plans">;
            primaryColor?: string;
            slug: string;
            subscriptionId?: string;
            subscriptionStatus:
              | "active"
              | "trialing"
              | "past_due"
              | "canceled"
              | "unpaid";
            updatedAt: number;
            userRole?: "owner" | "admin" | "editor" | "viewer" | "student";
          } | null
        >;
        getUserPlanDetails: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          {
            _creationTime: number;
            _id: Id<"plans">;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            maxOrganizations: number;
            name: "free" | "starter" | "business" | "agency";
            priceMonthly: number;
            priceYearly?: number;
            sortOrder: number;
            updatedAt: number;
          } | null
        >;
        getPlans: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"plans">;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            maxOrganizations: number;
            name: "free" | "starter" | "business" | "agency";
            priceMonthly: number;
            priceYearly?: number;
            sortOrder: number;
            updatedAt: number;
          }>
        >;
        canCreateOrganization: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          {
            canCreate: boolean;
            currentCount: number;
            maxAllowed: number;
            planName: string;
            reason?: string;
          }
        >;
        searchOrganizations: FunctionReference<
          "query",
          "public",
          { limit?: number; query: string },
          Array<{
            _creationTime: number;
            _id: Id<"organizations">;
            allowSelfRegistration: boolean;
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: number;
            currentPeriodStart?: number;
            customDomain?: string;
            description?: string;
            isPublic: boolean;
            logo?: string;
            memberCount?: number;
            name: string;
            ownerId: Id<"users">;
            planId?: Id<"plans">;
            primaryColor?: string;
            slug: string;
            subscriptionId?: string;
            subscriptionStatus:
              | "active"
              | "trialing"
              | "past_due"
              | "canceled"
              | "unpaid";
            updatedAt: number;
            userRole?: "owner" | "admin" | "editor" | "viewer" | "student";
          }>
        >;
        getOrganizationMembers: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"userOrganizations">;
            invitedAt?: number;
            invitedBy?: Id<"users">;
            isActive: boolean;
            joinedAt: number;
            organizationId: Id<"organizations">;
            permissions?: Array<string>;
            role: "owner" | "admin" | "editor" | "viewer" | "student";
            updatedAt: number;
            user: {
              _id: Id<"users">;
              email: string;
              firstName?: string;
              lastName?: string;
              name?: string;
              username?: string;
            };
            userId: Id<"users">;
          }>
        >;
        getPendingInvitations: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"organizationInvitations">;
            acceptedAt?: number;
            acceptedBy?: Id<"users">;
            email: string;
            expiresAt: number;
            invitedBy: Id<"users">;
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
            status: "pending" | "accepted" | "expired" | "revoked";
            token: string;
          }>
        >;
        getInvitationByToken: FunctionReference<
          "query",
          "public",
          { token: string },
          null | {
            _creationTime: number;
            _id: Id<"organizationInvitations">;
            acceptedAt?: number;
            acceptedBy?: Id<"users">;
            email: string;
            expiresAt: number;
            invitedBy: Id<"users">;
            organizationId: Id<"organizations">;
            role: "admin" | "editor" | "viewer" | "student";
            status: "pending" | "accepted" | "expired" | "revoked";
            token: string;
          }
        >;
      };
      seed: {
        seedPlans: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          Array<Id<"plans">>
        >;
        assignFreePlanToUser: FunctionReference<
          "mutation",
          "public",
          { userId: Id<"users"> },
          null
        >;
        createDefaultOrganization: FunctionReference<
          "mutation",
          "public",
          { userId: Id<"users">; userName: string },
          Id<"organizations">
        >;
        updatePlan: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            displayName?: string;
            features?: Array<string>;
            isActive?: boolean;
            maxOrganizations?: number;
            planId: Id<"plans">;
            priceMonthly?: number;
            priceYearly?: number;
            sortOrder?: number;
          },
          null
        >;
      };
    };
    postTypes: {
      mutations: {
        initSystem: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        resetSystem: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        ensureDefaults: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        create: FunctionReference<
          "mutation",
          "public",
          {
            adminMenu?: {
              enabled: boolean;
              icon?: string;
              label?: string;
              menuId?: string;
              parent?: string;
              position?: number;
              slug?: string;
            };
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            includeTimestamps?: boolean;
            isPublic: boolean;
            metaBoxes?: Array<{
              description?: string;
              fieldKeys: Array<string>;
              id: string;
              location?: "main" | "sidebar";
              priority?: number;
              rendererKey?: string;
              title: string;
            }>;
            name: string;
            organizationId?: Id<"organizations">;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            slug: string;
            storageKind?: "posts" | "custom";
            storageTables?: Array<string>;
            supports?: {
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              attachments?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
          },
          any
        >;
        enableForOrganization: FunctionReference<
          "mutation",
          "public",
          {
            definition?: {
              adminMenu?: {
                enabled: boolean;
                icon?: string;
                label?: string;
                menuId?: string;
                parent?: string;
                position?: number;
                slug?: string;
              };
              description?: string;
              enableApi?: boolean;
              enableVersioning?: boolean;
              includeTimestamps?: boolean;
              isPublic: boolean;
              metaBoxes?: Array<{
                description?: string;
                fieldKeys: Array<string>;
                id: string;
                location?: "main" | "sidebar";
                priority?: number;
                rendererKey?: string;
                title: string;
              }>;
              name: string;
              rewrite?: {
                archiveSlug?: string;
                feeds?: boolean;
                hasArchive?: boolean;
                pages?: boolean;
                permalink?: { aliases?: Array<string>; canonical: string };
                singleSlug?: string;
                withFront?: boolean;
              };
              storageKind?: "posts" | "custom";
              storageTables?: Array<string>;
              supports?: {
                comments?: boolean;
                customFields?: boolean;
                editor?: boolean;
                excerpt?: boolean;
                attachments?: boolean;
                featuredImage?: boolean;
                postMeta?: boolean;
                revisions?: boolean;
                taxonomy?: boolean;
                title?: boolean;
              };
            };
            organizationId: Id<"organizations"> | "portal-root";
            slug: string;
          },
          any
        >;
        disableForOrganization: FunctionReference<
          "mutation",
          "public",
          { organizationId: Id<"organizations"> | "portal-root"; slug: string },
          any
        >;
        update: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              adminMenu?: {
                enabled: boolean;
                icon?: string;
                label?: string;
                menuId?: string;
                parent?: string;
                position?: number;
                slug?: string;
              };
              description?: string;
              enableApi?: boolean;
              enableVersioning?: boolean;
              includeTimestamps?: boolean;
              isPublic?: boolean;
              metaBoxes?: Array<{
                description?: string;
                fieldKeys: Array<string>;
                id: string;
                location?: "main" | "sidebar";
                priority?: number;
                rendererKey?: string;
                title: string;
              }>;
              name?: string;
              rewrite?: {
                archiveSlug?: string;
                feeds?: boolean;
                hasArchive?: boolean;
                pages?: boolean;
                permalink?: { aliases?: Array<string>; canonical: string };
                singleSlug?: string;
                withFront?: boolean;
              };
              slug?: string;
              storageKind?: "posts" | "custom";
              storageTables?: Array<string>;
              supports?: {
                comments?: boolean;
                customFields?: boolean;
                editor?: boolean;
                excerpt?: boolean;
                attachments?: boolean;
                featuredImage?: boolean;
                postMeta?: boolean;
                revisions?: boolean;
                taxonomy?: boolean;
                title?: boolean;
              };
            };
            id: Id<"postTypes">;
          },
          any
        >;
        remove: FunctionReference<
          "mutation",
          "public",
          { id: Id<"postTypes"> },
          any
        >;
        addField: FunctionReference<
          "mutation",
          "public",
          {
            field: {
              defaultValue?: any;
              description?: string;
              filterable?: boolean;
              isBuiltIn?: boolean;
              isSystem?: boolean;
              key: string;
              name: string;
              options?: any;
              order?: number;
              required?: boolean;
              searchable?: boolean;
              type: string;
              uiConfig?: any;
              validationRules?: any;
            };
            postTypeId: Id<"postTypes">;
          },
          any
        >;
        updateField: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              defaultValue?: any;
              description?: string;
              filterable?: boolean;
              key?: string;
              name?: string;
              options?: any;
              order?: number;
              required?: boolean;
              searchable?: boolean;
              type?: string;
              uiConfig?: any;
              validationRules?: any;
            };
            fieldId: Id<"postTypeFields">;
          },
          any
        >;
        removeField: FunctionReference<
          "mutation",
          "public",
          { fieldId: Id<"postTypeFields"> },
          any
        >;
        updateEntryCounts: FunctionReference<
          "mutation",
          "public",
          { slug: string },
          any
        >;
      };
      queries: {
        list: FunctionReference<
          "query",
          "public",
          { includeBuiltIn?: boolean; organizationId?: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"postTypes">;
            adminMenu?: {
              enabled: boolean;
              icon?: string;
              label?: string;
              menuId?: string;
              parent?: string;
              position?: number;
              slug?: string;
            };
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            includeTimestamps?: boolean;
            isBuiltIn: boolean;
            isPublic: boolean;
            metaBoxes?: Array<{
              description?: string;
              fieldKeys: Array<string>;
              id: string;
              location?: "main" | "sidebar";
              priority?: number;
              rendererKey?: string;
              title: string;
            }>;
            name: string;
            organizationId?: Id<"organizations"> | "portal-root";
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            slug: string;
            storageKind?: "posts" | "custom";
            storageTables?: Array<string>;
            supports?: {
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              attachments?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
            updatedAt?: number;
          }>
        >;
        get: FunctionReference<
          "query",
          "public",
          { id: Id<"postTypes">; organizationId?: Id<"organizations"> },
          {
            _creationTime: number;
            _id: Id<"postTypes">;
            adminMenu?: {
              enabled: boolean;
              icon?: string;
              label?: string;
              menuId?: string;
              parent?: string;
              position?: number;
              slug?: string;
            };
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            includeTimestamps?: boolean;
            isBuiltIn: boolean;
            isPublic: boolean;
            metaBoxes?: Array<{
              description?: string;
              fieldKeys: Array<string>;
              id: string;
              location?: "main" | "sidebar";
              priority?: number;
              rendererKey?: string;
              title: string;
            }>;
            name: string;
            organizationId?: Id<"organizations"> | "portal-root";
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            slug: string;
            storageKind?: "posts" | "custom";
            storageTables?: Array<string>;
            supports?: {
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              attachments?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
            updatedAt?: number;
          } | null
        >;
        getBySlug: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; slug: string },
          {
            _creationTime: number;
            _id: Id<"postTypes">;
            adminMenu?: {
              enabled: boolean;
              icon?: string;
              label?: string;
              menuId?: string;
              parent?: string;
              position?: number;
              slug?: string;
            };
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            includeTimestamps?: boolean;
            isBuiltIn: boolean;
            isPublic: boolean;
            metaBoxes?: Array<{
              description?: string;
              fieldKeys: Array<string>;
              id: string;
              location?: "main" | "sidebar";
              priority?: number;
              rendererKey?: string;
              title: string;
            }>;
            name: string;
            organizationId?: Id<"organizations"> | "portal-root";
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            slug: string;
            storageKind?: "posts" | "custom";
            storageTables?: Array<string>;
            supports?: {
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              attachments?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
            updatedAt?: number;
          } | null
        >;
        fieldsBySlug: FunctionReference<
          "query",
          "public",
          {
            includeSystem?: boolean;
            organizationId?: Id<"organizations">;
            slug: string;
          },
          Array<{
            _creationTime: number;
            _id: Id<"postTypeFields">;
            createdAt: number;
            createdBy?: Id<"users">;
            defaultValue?: any;
            description?: string;
            filterable?: boolean;
            isBuiltIn: boolean;
            isSystem: boolean;
            key: string;
            name: string;
            options?: any;
            order?: number;
            postTypeId: Id<"postTypes">;
            required: boolean;
            searchable?: boolean;
            type: string;
            uiConfig?: any;
            updatedAt?: number;
            validationRules?: any;
          }>
        >;
      };
    };
    taxonomies: {
      queries: {
        listTaxonomies: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"taxonomies">;
            builtIn: boolean;
            createdAt: number;
            description?: string;
            hierarchical: boolean;
            name: string;
            postTypeSlugs?: Array<string>;
            slug: string;
            termCollection: "categories" | "tags" | "custom";
            updatedAt?: number;
          }>
        >;
        getTaxonomyBySlug: FunctionReference<
          "query",
          "public",
          { slug: string },
          {
            _creationTime: number;
            _id: Id<"taxonomies">;
            builtIn: boolean;
            createdAt: number;
            description?: string;
            hierarchical: boolean;
            name: string;
            postTypeSlugs?: Array<string>;
            slug: string;
            termCollection: "categories" | "tags" | "custom";
            updatedAt?: number;
          } | null
        >;
        listTermsByTaxonomy: FunctionReference<
          "query",
          "public",
          { slug: string },
          Array<{
            _id: Id<"categories"> | Id<"tags"> | Id<"taxonomyTerms">;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            parentId?: Id<"categories"> | Id<"taxonomyTerms"> | Id<"tags">;
            slug: string;
            source: "categories" | "tags" | "custom";
            taxonomyId: Id<"taxonomies">;
          }>
        >;
      };
      mutations: {
        createTaxonomy: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            hierarchical: boolean;
            name: string;
            postTypeSlugs?: Array<string>;
            slug?: string;
          },
          any
        >;
        createTerm: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            name: string;
            parentId?: Id<"categories"> | Id<"taxonomyTerms"> | Id<"tags">;
            slug?: string;
            taxonomySlug: string;
          },
          any
        >;
        deleteTaxonomy: FunctionReference<
          "mutation",
          "public",
          { id: Id<"taxonomies"> },
          any
        >;
        deleteTerm: FunctionReference<
          "mutation",
          "public",
          {
            taxonomySlug: string;
            termId: Id<"categories"> | Id<"tags"> | Id<"taxonomyTerms">;
          },
          any
        >;
        ensureBuiltInTaxonomies: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        updateTaxonomy: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              description?: string;
              hierarchical?: boolean;
              name?: string;
              postTypeSlugs?: Array<string>;
              slug?: string;
            };
            id: Id<"taxonomies">;
          },
          any
        >;
        updateTerm: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              description?: string;
              name?: string;
              parentId?: Id<"categories"> | Id<"taxonomyTerms"> | Id<"tags">;
              slug?: string;
            };
            taxonomySlug: string;
            termId: Id<"categories"> | Id<"tags"> | Id<"taxonomyTerms">;
          },
          any
        >;
      };
    };
    users: {
      marketingTags: {
        index: {
          listMarketingTags: FunctionReference<
            "query",
            "public",
            Record<string, never>,
            Array<{
              _creationTime: number;
              _id: Id<"marketingTags">;
              category?: string;
              color?: string;
              createdAt?: number;
              createdBy?: Id<"users">;
              description?: string;
              isActive?: boolean;
              name: string;
              slug?: string;
            }>
          >;
          createMarketingTag: FunctionReference<
            "mutation",
            "public",
            {
              category?: string;
              color?: string;
              description?: string;
              isActive?: boolean;
              name: string;
              slug?: string;
            },
            Id<"marketingTags">
          >;
          assignMarketingTagToUser: FunctionReference<
            "mutation",
            "public",
            {
              assignedBy?: Id<"users">;
              expiresAt?: number;
              marketingTagId: Id<"marketingTags">;
              source?: string;
              userId: Id<"users">;
            },
            Id<"userMarketingTags">
          >;
          removeMarketingTagFromUser: FunctionReference<
            "mutation",
            "public",
            { marketingTagId: Id<"marketingTags">; userId: Id<"users"> },
            boolean
          >;
          getUserMarketingTags: FunctionReference<
            "query",
            "public",
            { userId: Id<"users"> },
            Array<{
              _id: Id<"userMarketingTags">;
              assignedAt: number;
              assignedBy?: Id<"users">;
              expiresAt?: number;
              marketingTag: {
                _creationTime: number;
                _id: Id<"marketingTags">;
                category?: string;
                color?: string;
                createdAt?: number;
                createdBy?: Id<"users">;
                description?: string;
                isActive?: boolean;
                name: string;
                slug?: string;
              };
              source?: string;
              userId: Id<"users">;
            }>
          >;
          userHasMarketingTags: FunctionReference<
            "query",
            "public",
            {
              requireAll?: boolean;
              tagSlugs: Array<string>;
              userId: Id<"users">;
            },
            {
              hasAccess: boolean;
              matchingTags: Array<string>;
              missingTags: Array<string>;
            }
          >;
        };
      };
      mutations: {
        makeCurrentUserAdmin: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        createOrGetUser: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
        updateUser: FunctionReference<
          "mutation",
          "public",
          {
            data: { email?: string; name?: string; role?: string };
            userId: Id<"users">;
          },
          any
        >;
        deleteUser: FunctionReference<
          "mutation",
          "public",
          { userId: Id<"users"> },
          any
        >;
        createSystemUserIfNeeded: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
      };
      queries: {
        getSystemUser: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getUserByClerkId: FunctionReference<
          "query",
          "public",
          { clerkId: string },
          null | {
            _creationTime: number;
            _id: Id<"users">;
            addresses?: Array<{
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            }>;
            email: string;
            image?: string;
            name?: string;
            role?: string;
            tokenIdentifier?: string;
            username?: string;
          }
        >;
        listUsers: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
        getMe: FunctionReference<"query", "public", Record<string, never>, any>;
        getUserByEmail: FunctionReference<
          "query",
          "public",
          { email: string },
          null | {
            _creationTime: number;
            _id: Id<"users">;
            addresses?: Array<{
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            }>;
            email: string;
            image?: string;
            name?: string;
            role?: string;
            tokenIdentifier?: string;
            username?: string;
          }
        >;
        getUserById: FunctionReference<
          "query",
          "public",
          { userId: Id<"users"> },
          null | {
            _creationTime: number;
            _id: Id<"users">;
            email: string;
            image?: string;
            name?: string;
            role?: string;
            tokenIdentifier?: string;
            username?: string;
          }
        >;
      };
    };
    crm: {
      queries: {
        getTags: FunctionReference<"query", "public", { userId?: string }, any>;
      };
      contacts: {
        mutations: {
          upsert: FunctionReference<
            "mutation",
            "public",
            {
              company?: string;
              email?: string;
              firstName?: string;
              fullName?: string;
              lastName?: string;
              metadata?: any;
              organizationId: Id<"organizations"> | "portal-root";
              phone?: string;
              tags?: Array<string>;
            },
            any
          >;
          update: FunctionReference<
            "mutation",
            "public",
            {
              company?: string;
              contactId: Id<"contacts">;
              email?: string;
              firstName?: string;
              fullName?: string;
              lastName?: string;
              metadata?: any;
              phone?: string;
              tags?: Array<string>;
            },
            any
          >;
          remove: FunctionReference<
            "mutation",
            "public",
            { contactId: Id<"contacts"> },
            any
          >;
        };
        queries: {
          list: FunctionReference<
            "query",
            "public",
            {
              limit?: number;
              organizationId: Id<"organizations"> | "portal-root";
              search?: string;
            },
            Array<{
              _creationTime: number;
              _id: Id<"contacts">;
              company?: string;
              createdAt: number;
              email?: string;
              firstName?: string;
              fullName?: string;
              lastName?: string;
              organizationId: Id<"organizations"> | "portal-root";
              phone?: string;
              tags?: Array<string>;
              updatedAt: number;
            }>
          >;
          get: FunctionReference<
            "query",
            "public",
            { contactId: Id<"contacts"> },
            {
              _creationTime: number;
              _id: Id<"contacts">;
              company?: string;
              createdAt: number;
              email?: string;
              firstName?: string;
              fullName?: string;
              lastName?: string;
              organizationId: Id<"organizations"> | "portal-root";
              phone?: string;
              tags?: Array<string>;
              updatedAt: number;
            } | null
          >;
          findByEmail: FunctionReference<
            "query",
            "public",
            {
              email: string;
              organizationId: Id<"organizations"> | "portal-root";
            },
            {
              _creationTime: number;
              _id: Id<"contacts">;
              company?: string;
              createdAt: number;
              email?: string;
              firstName?: string;
              fullName?: string;
              lastName?: string;
              organizationId: Id<"organizations"> | "portal-root";
              phone?: string;
              tags?: Array<string>;
              updatedAt: number;
            } | null
          >;
          getContacts: FunctionReference<
            "query",
            "public",
            {
              filters?: {
                customerType?:
                  | "lead"
                  | "prospect"
                  | "customer"
                  | "former-customer"
                  | "partner";
                leadStatus?:
                  | "new"
                  | "contacted"
                  | "qualified"
                  | "proposal"
                  | "negotiation"
                  | "won"
                  | "lost"
                  | "dormant";
                tags?: Array<string>;
              };
              paginationOpts: {
                cursor: string | null;
                endCursor?: string | null;
                id?: number;
                maximumBytesRead?: number;
                maximumRowsRead?: number;
                numItems: number;
              };
              search?: string;
              userId: string;
            },
            any
          >;
          exportContacts: FunctionReference<
            "query",
            "public",
            { userId?: string },
            any
          >;
        };
      };
    };
  };
  integrations: {
    connections: {
      internalConnections: {
        testCreateInternalConnections: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          { connectionsCreated: number; errors: Array<string> }
        >;
      };
      mutations: {
        create: FunctionReference<
          "mutation",
          "public",
          {
            config?: string;
            credentials: string;
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status?: string;
          },
          Id<"connections">
        >;
        upsertForOwner: FunctionReference<
          "mutation",
          "public",
          {
            config?: string;
            credentials: string;
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status?: string;
          },
          Id<"connections">
        >;
        update: FunctionReference<
          "mutation",
          "public",
          {
            config?: string;
            credentials?: string;
            id: Id<"connections">;
            name?: string;
            status?: string;
          },
          boolean
        >;
        test: FunctionReference<
          "mutation",
          "public",
          { credentials?: string; id?: Id<"connections">; nodeType?: string },
          { message: string; success: boolean }
        >;
        remove: FunctionReference<
          "mutation",
          "public",
          { id: Id<"connections"> },
          boolean
        >;
      };
      queries: {
        list: FunctionReference<
          "query",
          "public",
          {
            nodeType?: string;
            ownerId?: Id<"users"> | string;
            status?: string;
          },
          Array<{
            _creationTime: number;
            _id: Id<"connections">;
            config?: string;
            createdAt: number;
            lastCheckedAt?: number;
            lastError?: string;
            metadata?: {
              errorMessage?: string;
              lastUsed?: number;
              maskedCredentials?: Record<string, string>;
            };
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status: string;
            updatedAt: number;
          }>
        >;
        get: FunctionReference<
          "query",
          "public",
          { id: Id<"connections"> },
          {
            _creationTime: number;
            _id: Id<"connections">;
            config?: string;
            createdAt: number;
            lastCheckedAt?: number;
            lastError?: string;
            metadata?: {
              errorMessage?: string;
              lastUsed?: number;
              maskedCredentials?: Record<string, string>;
            };
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status: string;
            updatedAt: number;
          } | null
        >;
        listWithInternalNodeTypes: FunctionReference<
          "query",
          "public",
          { nodeType?: string; status?: string },
          Array<{
            _creationTime: number;
            _id: Id<"connections">;
            config?: string;
            createdAt: number;
            lastCheckedAt?: number;
            lastError?: string;
            metadata?: {
              errorMessage?: string;
              lastUsed?: number;
              maskedCredentials?: Record<string, string>;
            };
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status: string;
            updatedAt: number;
          }>
        >;
      };
      actions: {
        create: FunctionReference<
          "action",
          "public",
          {
            config?: string;
            credentials: string;
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status?: string;
          },
          Id<"connections">
        >;
        update: FunctionReference<
          "action",
          "public",
          {
            config?: string;
            credentials?: string;
            id: Id<"connections">;
            name?: string;
            status?: string;
          },
          boolean
        >;
        upsertForOwner: FunctionReference<
          "action",
          "public",
          {
            config?: string;
            credentials: string;
            name: string;
            nodeType: string;
            ownerId: Id<"users"> | string;
            status?: string;
          },
          Id<"connections">
        >;
      };
    };
    triggers: {
      orderEvents: {
        testOrderCreatedTrigger: FunctionReference<
          "action",
          "public",
          { mockOrderData?: any },
          {
            errors: Array<string>;
            success: boolean;
            testData: any;
            webhooksSent: number;
          }
        >;
      };
    };
    integrationNodes: {
      seed: {
        triggerSeeding: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          any
        >;
      };
      queries: {
        getIntegrationNodeByIdentifier: FunctionReference<
          "query",
          "public",
          { identifier: string },
          {
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          } | null
        >;
        getAllIntegrationNodes: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          }>
        >;
        getIntegrationNodesByCategory: FunctionReference<
          "query",
          "public",
          { category: string },
          Array<{
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          }>
        >;
        getIntegrationNodesByType: FunctionReference<
          "query",
          "public",
          { integrationType: string },
          Array<{
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          }>
        >;
        getActiveIntegrationNodes: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          }>
        >;
        getIntegrationNode: FunctionReference<
          "query",
          "public",
          { id: Id<"integrationNodes"> },
          {
            _creationTime: number;
            _id: Id<"integrationNodes">;
            category: string;
            configSchema: string;
            createdAt: number;
            deprecated?: boolean;
            description: string;
            identifier: string;
            inputSchema: string;
            integrationType: string;
            name: string;
            outputSchema: string;
            tags?: Array<string>;
            uiConfig?: string;
            updatedAt: number;
            version: string;
          } | null
        >;
      };
    };
  };
  plugins: {
    lms: {
      queries: {
        listCourses: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          Array<{
            _id: Id<"posts">;
            slug?: string;
            status?: string;
            title: string;
          }>
        >;
        getCourseStructureWithItems: FunctionReference<
          "query",
          "public",
          {
            courseId?: Id<"posts">;
            courseSlug?: string;
            organizationId?: Id<"organizations">;
          },
          {
            attachedLessons: Array<{
              _id: Id<"posts">;
              content?: string;
              excerpt?: string;
              order?: number;
              slug?: string;
              status?: string;
              title: string;
            }>;
            attachedQuizzes: Array<{
              _id: Id<"posts">;
              content?: string;
              excerpt?: string;
              isFinal?: boolean;
              lessonId?: Id<"posts">;
              order?: number;
              slug?: string;
              title: string;
              topicId?: Id<"posts">;
            }>;
            attachedTopics: Array<{
              _id: Id<"posts">;
              content?: string;
              excerpt?: string;
              lessonId?: Id<"posts">;
              order?: number;
              slug?: string;
              title: string;
            }>;
            course: {
              _id: Id<"posts">;
              courseStructure: Array<{ lessonId: Id<"posts"> }>;
              slug?: string;
              status?: string;
              title: string;
            };
          }
        >;
        getAvailableLessons: FunctionReference<
          "query",
          "public",
          { courseId: Id<"posts">; organizationId?: Id<"organizations"> },
          Array<{
            _id: Id<"posts">;
            content?: string;
            excerpt?: string;
            order?: number;
            slug?: string;
            status?: string;
            title: string;
          }>
        >;
        getAvailableTopics: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          Array<{
            _id: Id<"posts">;
            content?: string;
            excerpt?: string;
            lessonId?: Id<"posts">;
            order?: number;
            slug?: string;
            title: string;
          }>
        >;
        getAvailableQuizzes: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          Array<{
            _id: Id<"posts">;
            content?: string;
            excerpt?: string;
            isFinal?: boolean;
            lessonId?: Id<"posts">;
            order?: number;
            slug?: string;
            title: string;
            topicId?: Id<"posts">;
          }>
        >;
      };
      mutations: {
        addLessonToCourse: FunctionReference<
          "mutation",
          "public",
          { courseId: Id<"posts">; lessonId: Id<"posts"> },
          { success: boolean }
        >;
        removeLessonFromCourseStructure: FunctionReference<
          "mutation",
          "public",
          { courseId: Id<"posts">; lessonId: Id<"posts"> },
          { success: boolean }
        >;
        reorderLessonsInCourse: FunctionReference<
          "mutation",
          "public",
          { courseId: Id<"posts">; orderedLessonIds: Array<Id<"posts">> },
          { success: boolean }
        >;
        attachTopicToLesson: FunctionReference<
          "mutation",
          "public",
          { lessonId: Id<"posts">; order?: number; topicId: Id<"posts"> },
          { success: boolean }
        >;
        removeTopicFromLesson: FunctionReference<
          "mutation",
          "public",
          { topicId: Id<"posts"> },
          { success: boolean }
        >;
        reorderTopicsInLesson: FunctionReference<
          "mutation",
          "public",
          { lessonId: Id<"posts">; orderedTopicIds: Array<Id<"posts">> },
          { success: boolean }
        >;
        attachQuizToLesson: FunctionReference<
          "mutation",
          "public",
          {
            isFinal?: boolean;
            lessonId: Id<"posts">;
            order?: number;
            quizId: Id<"posts">;
            topicId?: Id<"posts">;
          },
          { success: boolean }
        >;
        removeQuizFromLesson: FunctionReference<
          "mutation",
          "public",
          { quizId: Id<"posts"> },
          { success: boolean }
        >;
        createLessonFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            courseId: Id<"posts">;
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            video: {
              description?: string;
              embedUrl?: string;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            };
          },
          { lessonId: Id<"posts"> }
        >;
        createTopicFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            lessonId: Id<"posts">;
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            video: {
              description?: string;
              embedUrl?: string;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            };
          },
          { topicId: Id<"posts"> }
        >;
        createQuizFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            targetLessonId?: Id<"posts">;
            targetTopicId?: Id<"posts">;
            video: {
              description?: string;
              embedUrl?: string;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            };
          },
          { quizId: Id<"posts"> }
        >;
      };
    };
    support: {
      queries: {
        getAgentPresence: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            sessionId: string;
          },
          { agentName?: string; status: "typing" | "idle"; updatedAt: number }
        >;
        getConversationMode: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            sessionId: string;
          },
          { mode: "agent" | "manual" }
        >;
        getEmailSettings: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations"> | "portal-root" },
          {
            allowEmailIntake: boolean;
            customDomain?: string;
            defaultAlias: string;
            dnsRecords?: Array<{ host: string; type: string; value: string }>;
            isCustomDomainConnected: boolean;
            lastSyncedAt?: number;
            resendDomainId?: string;
            verificationStatus:
              | "unverified"
              | "pending"
              | "verified"
              | "failed";
          }
        >;
        listConversations: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            organizationId: Id<"organizations"> | "portal-root";
          },
          Array<{
            agentThreadId?: string;
            assignedAgentId?: string;
            assignedAgentName?: string;
            contactEmail?: string;
            contactId?: Id<"contacts">;
            contactName?: string;
            firstAt: number;
            lastAt: number;
            lastMessage: string;
            lastRole: "user" | "assistant";
            mode?: "agent" | "manual";
            origin: "chat" | "email";
            sessionId: string;
            status?: "open" | "snoozed" | "closed";
            totalMessages: number;
          }>
        >;
        listHelpdeskArticles: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            organizationId: Id<"organizations"> | "portal-root";
            query?: string;
          },
          Array<{
            content: string;
            entryId: Id<"posts">;
            excerpt?: string;
            slug?: string;
            source?: string;
            tags?: Array<string>;
            title: string;
            type?: string;
            updatedAt: number;
          }>
        >;
        listMessages: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            sessionId: string;
          },
          Array<{
            _id: Id<"supportMessages">;
            agentName?: string;
            agentUserId?: string;
            contactEmail?: string;
            contactId?: Id<"contacts">;
            contactName?: string;
            content: string;
            createdAt: number;
            htmlBody?: string;
            messageType?: "chat" | "email_inbound" | "email_outbound";
            role: "user" | "assistant";
            subject?: string;
            textBody?: string;
          }>
        >;
        listRagSources: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations"> | "portal-root" },
          Array<{
            _id: Id<"supportRagSources">;
            createdAt: number;
            displayName?: string;
            fields: Array<"title" | "excerpt" | "content">;
            includeTags: boolean;
            isEnabled: boolean;
            lastIndexedAt?: number;
            metaFieldKeys?: Array<string>;
            postTypeSlug: string;
            sourceType: string;
            updatedAt: number;
          }>
        >;
        matchHelpdeskArticle: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            question: string;
          },
          {
            content: string;
            entryId: Id<"posts">;
            slug?: string;
            title: string;
          } | null
        >;
      };
      mutations: {
        recordMessage: FunctionReference<
          "mutation",
          "public",
          {
            contactEmail?: string;
            contactId?: Id<"contacts">;
            contactName?: string;
            content: string;
            htmlBody?: string;
            messageType?: "chat" | "email_inbound" | "email_outbound";
            organizationId: Id<"organizations"> | "portal-root";
            role: "user" | "assistant";
            sessionId: string;
            source?: "agent" | "admin" | "system";
            subject?: string;
            textBody?: string;
          },
          any
        >;
        setAgentPresence: FunctionReference<
          "mutation",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            sessionId: string;
            status: "typing" | "idle";
          },
          any
        >;
        setConversationMode: FunctionReference<
          "mutation",
          "public",
          {
            mode: "agent" | "manual";
            organizationId: Id<"organizations"> | "portal-root";
            sessionId: string;
          },
          any
        >;
        saveRagSourceConfig: FunctionReference<
          "mutation",
          "public",
          {
            displayName?: string;
            fields: Array<"title" | "excerpt" | "content">;
            includeTags?: boolean;
            isEnabled?: boolean;
            metaFieldKeys?: Array<string>;
            organizationId: Id<"organizations"> | "portal-root";
            postTypeSlug: string;
            sourceId?: Id<"supportRagSources">;
          },
          any
        >;
        deleteRagSourceConfig: FunctionReference<
          "mutation",
          "public",
          {
            organizationId: Id<"organizations"> | "portal-root";
            sourceId: Id<"supportRagSources">;
          },
          any
        >;
        saveEmailSettings: FunctionReference<
          "mutation",
          "public",
          {
            allowEmailIntake?: boolean;
            customDomain?: string | null;
            organizationId: Id<"organizations"> | "portal-root";
          },
          any
        >;
        beginDomainVerification: FunctionReference<
          "mutation",
          "public",
          {
            domain: string;
            organizationId: Id<"organizations"> | "portal-root";
          },
          any
        >;
      };
      agent: {
        generateAgentReply: FunctionReference<
          "action",
          "public",
          {
            contactEmail?: string;
            contactId?: Id<"contacts">;
            contactName?: string;
            organizationId: Id<"organizations"> | "portal-root";
            prompt: string;
            sessionId: string;
          },
          { text: string }
        >;
      };
      rag: {
        searchKnowledge: FunctionReference<
          "action",
          "public",
          {
            limit?: number;
            organizationId: Id<"organizations">;
            query: string;
          },
          Array<{
            content: string;
            slug?: string;
            source?: string;
            title: string;
          }>
        >;
      };
    };
    calendar: {
      events: {
        queries: {
          getEvent: FunctionReference<
            "query",
            "public",
            { eventId: Id<"posts"> },
            any
          >;
          searchEvents: FunctionReference<
            "query",
            "public",
            { limit?: number; searchTerm: string },
            any
          >;
          getCalendarEvents: FunctionReference<
            "query",
            "public",
            { calendarId: Id<"posts">; endDate: number; startDate: number },
            any
          >;
          getEventsInDateRange: FunctionReference<
            "query",
            "public",
            {
              calendarIds?: Array<Id<"posts">>;
              endDate: number;
              includeRecurrences?: boolean;
              paginationOpts?: {
                cursor: string | null;
                endCursor?: string | null;
                id?: number;
                maximumBytesRead?: number;
                maximumRowsRead?: number;
                numItems: number;
              };
              startDate: number;
            },
            any
          >;
          getCalendarViewEvents: FunctionReference<
            "query",
            "public",
            {
              calendarIds?: Array<Id<"posts">>;
              includeRecurrences?: boolean;
              viewDate: number;
              viewType: "day" | "week" | "month" | "year";
            },
            any
          >;
        };
        crud: {
          createEvent: FunctionReference<
            "mutation",
            "public",
            {
              allDay?: boolean;
              calendarId: Id<"posts">;
              color?: string;
              description?: string;
              endTime: number;
              location?: {
                address?: string;
                type: "virtual" | "physical" | "hybrid";
                url?: string;
              };
              recurrence?: {
                byDay?: Array<"MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU">;
                count?: number;
                frequency: "daily" | "weekly" | "monthly" | "yearly";
                interval?: number;
                until?: number;
              };
              slug?: string;
              startTime: number;
              timezone?: string;
              title: string;
              type:
                | "meeting"
                | "webinar"
                | "workshop"
                | "class"
                | "conference"
                | "social"
                | "deadline"
                | "reminder"
                | "other";
              visibility: "public" | "private" | "restricted";
            },
            any
          >;
          updateEvent: FunctionReference<
            "mutation",
            "public",
            {
              allDay?: boolean;
              calendarId?: Id<"posts">;
              color?: string | null;
              description?: string | null;
              endTime?: number;
              eventId: Id<"posts">;
              location?: {
                address?: string;
                type: "virtual" | "physical" | "hybrid";
                url?: string;
              } | null;
              recurrence?: {
                byDay?: Array<"MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU">;
                count?: number;
                frequency: "daily" | "weekly" | "monthly" | "yearly";
                interval?: number;
                until?: number;
              } | null;
              slug?: string;
              startTime?: number;
              timezone?: string | null;
              title?: string;
              type?:
                | "meeting"
                | "webinar"
                | "workshop"
                | "class"
                | "conference"
                | "social"
                | "deadline"
                | "reminder"
                | "other";
              visibility?: "public" | "private" | "restricted";
            },
            any
          >;
          deleteEvent: FunctionReference<
            "mutation",
            "public",
            { eventId: Id<"posts"> },
            any
          >;
        };
        orders: {
          linkCalendarEvent: FunctionReference<
            "mutation",
            "public",
            { eventId: Id<"posts">; orderId: Id<"orders"> },
            any
          >;
          unlinkCalendarEvent: FunctionReference<
            "mutation",
            "public",
            { orderId: Id<"orders"> },
            any
          >;
          getOrdersByCalendarEvent: FunctionReference<
            "mutation",
            "public",
            { eventId: Id<"posts"> },
            any
          >;
        };
      };
      crud: {
        createCalendar: FunctionReference<
          "mutation",
          "public",
          {
            color?: string;
            description?: string;
            isDefault?: boolean;
            isPublic?: boolean;
            name: string;
            organizationId?: Id<"organizations">;
            ownerId?: string;
            ownerType?: "user" | "group" | "course" | "organization";
            slug?: string;
          },
          any
        >;
        updateCalendar: FunctionReference<
          "mutation",
          "public",
          {
            calendarId: Id<"posts">;
            color?: string | null;
            description?: string | null;
            isDefault?: boolean;
            isPublic?: boolean;
            name?: string;
            ownerId?: string;
            ownerType?: "user" | "group" | "course" | "organization";
            slug?: string;
          },
          any
        >;
        deleteCalendar: FunctionReference<
          "mutation",
          "public",
          { calendarId: Id<"posts"> },
          any
        >;
      };
      queries: {
        getCalendars: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          any
        >;
        getCalendarById: FunctionReference<
          "query",
          "public",
          { calendarId: Id<"posts"> },
          any
        >;
        getCalendarForEvent: FunctionReference<
          "query",
          "public",
          { eventId: Id<"posts"> },
          any
        >;
        getEventById: FunctionReference<
          "query",
          "public",
          { eventId: Id<"posts"> },
          any
        >;
        getUserCalendars: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          any
        >;
      };
    };
    socialfeed: {
      mutations: {
        createPost: FunctionReference<
          "mutation",
          "public",
          {
            content: string;
            creatorId: Id<"users">;
            mediaUrls?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            visibility: "public" | "private" | "group";
          },
          Id<"feedItems">
        >;
        updatePost: FunctionReference<
          "mutation",
          "public",
          {
            content?: string;
            mediaUrls?: Array<string>;
            postId: Id<"feedItems">;
            userId: Id<"users">;
            visibility?: "public" | "private" | "group";
          },
          boolean
        >;
        deletePost: FunctionReference<
          "mutation",
          "public",
          { postId: Id<"feedItems">; userId: Id<"users"> },
          boolean
        >;
        shareContent: FunctionReference<
          "mutation",
          "public",
          {
            content?: string;
            creatorId: Id<"users">;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId: Id<"feedItems">;
            visibility: "public" | "private" | "group";
          },
          Id<"feedItems">
        >;
        addReaction: FunctionReference<
          "mutation",
          "public",
          {
            feedItemId: Id<"feedItems">;
            reactionType:
              | "like"
              | "love"
              | "celebrate"
              | "support"
              | "insightful"
              | "curious";
            userId: Id<"users">;
          },
          Id<"reactions">
        >;
        addComment: FunctionReference<
          "mutation",
          "public",
          {
            content: string;
            feedItemId: Id<"feedItems">;
            mediaUrls?: Array<string>;
            parentCommentId?: Id<"comments">;
            userId: Id<"users">;
          },
          Id<"comments">
        >;
        followTopic: FunctionReference<
          "mutation",
          "public",
          { topicId: Id<"hashtags">; userId: Id<"users"> },
          boolean
        >;
        unfollowTopic: FunctionReference<
          "mutation",
          "public",
          { topicId: Id<"hashtags">; userId: Id<"users"> },
          boolean
        >;
        createOrUpdateTopic: FunctionReference<
          "mutation",
          "public",
          {
            category?: string;
            coverImage?: string;
            description?: string;
            tag: string;
          },
          Id<"hashtags">
        >;
        markRecommendationAsSeen: FunctionReference<
          "mutation",
          "public",
          { contentId: Id<"feedItems">; userId: Id<"users"> },
          boolean
        >;
        markRecommendationAsInteracted: FunctionReference<
          "mutation",
          "public",
          {
            contentId: Id<"feedItems">;
            reaction?: "like" | "dislike" | "neutral";
            userId: Id<"users">;
          },
          boolean
        >;
        generateUserRecommendations: FunctionReference<
          "mutation",
          "public",
          { limit?: number; userId: Id<"users"> },
          boolean
        >;
        updatePostTrendingMetrics: FunctionReference<
          "mutation",
          "public",
          { contentId: Id<"feedItems"> },
          boolean
        >;
      };
      queries: {
        getUniversalFeed: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"feedItems">;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: Id<"users">; image?: string; name: string };
              creatorId: Id<"users">;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<Id<"users">>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: Id<"feedItems">;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          }
        >;
        getPersonalizedFeed: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            userId: Id<"users">;
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"feedItems">;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: Id<"users">; image?: string; name: string };
              creatorId: Id<"users">;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<Id<"users">>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: Id<"feedItems">;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          }
        >;
        getGroupFeed: FunctionReference<
          "query",
          "public",
          {
            groupId: Id<"posts">;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"feedItems">;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: Id<"users">; image?: string; name: string };
              creatorId: Id<"users">;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<Id<"users">>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: Id<"feedItems">;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          }
        >;
        getUserProfileFeed: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            profileId: Id<"users">;
            viewerId?: Id<"users">;
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"feedItems">;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: Id<"users">; image?: string; name: string };
              creatorId: Id<"users">;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<Id<"users">>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: Id<"feedItems">;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          }
        >;
        getFeedItem: FunctionReference<
          "query",
          "public",
          { feedItemId: Id<"feedItems"> },
          null | {
            _creationTime: number;
            _id: Id<"feedItems">;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: Id<"users">; image?: string; name: string };
            creatorId: Id<"users">;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<Id<"users">>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: Id<"feedItems">;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }
        >;
        getHashtagFeed: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tag: string;
          },
          {
            feedItems: {
              continueCursor: string | null;
              isDone: boolean;
              page: Array<{
                _creationTime: number;
                _id: Id<"feedItems">;
                commentsCount: number;
                content: string;
                contentType: "post" | "share" | "comment";
                creator: { _id: Id<"users">; image?: string; name: string };
                creatorId: Id<"users">;
                hashtags?: Array<string>;
                mediaUrls?: Array<string>;
                mentionedUserIds?: Array<Id<"users">>;
                mentions?: Array<string>;
                moduleId?: string;
                moduleType?: "blog" | "course" | "group" | "event";
                originalContentId?: Id<"feedItems">;
                reactionsCount: number;
                visibility: "public" | "private" | "group";
              }>;
            };
            hashtag: null | {
              _creationTime: number;
              _id: Id<"hashtags">;
              category?: string;
              coverImage?: string;
              description?: string;
              followerCount?: number;
              isBlocked?: boolean;
              isTopic?: boolean;
              lastUsed: number;
              relatedTags?: Array<string>;
              tag: string;
              usageCount: number;
            };
          }
        >;
        getComments: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            parentId: Id<"feedItems"> | Id<"posts">;
            parentType: "feedItem" | "post" | "download" | "helpdeskArticle";
            sortOrder?: "newest" | "oldest";
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"comments">;
              content: string;
              mediaUrls?: Array<string>;
              parentCommentId?: Id<"comments">;
              parentId: Id<"feedItems"> | Id<"posts">;
              parentType:
                | "feedItem"
                | "course"
                | "lesson"
                | "topic"
                | "quiz"
                | "post"
                | "download"
                | "helpdeskArticle";
              repliesCount: number;
              updatedAt?: number;
              user: { _id: Id<"users">; image?: string; name: string };
              userId: Id<"users">;
            }>;
          }
        >;
        getReplies: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            parentCommentId: Id<"comments">;
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"comments">;
              content: string;
              mediaUrls?: Array<string>;
              parentCommentId?: Id<"comments">;
              parentId: Id<"feedItems"> | Id<"posts">;
              parentType:
                | "feedItem"
                | "course"
                | "lesson"
                | "topic"
                | "quiz"
                | "post"
                | "download"
                | "helpdeskArticle";
              repliesCount: number;
              updatedAt?: number;
              user: { _id: Id<"users">; image?: string; name: string };
              userId: Id<"users">;
            }>;
          }
        >;
        searchUsersForMentions: FunctionReference<
          "query",
          "public",
          { limit?: number; query: string },
          Array<{ _id: Id<"users">; image?: string; name: string }>
        >;
        getRecommendedContent: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            userId: Id<"users">;
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"feedItems">;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: Id<"users">; image?: string; name: string };
              creatorId: Id<"users">;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<Id<"users">>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: Id<"feedItems">;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          }
        >;
        getTopics: FunctionReference<
          "query",
          "public",
          {
            category?: string;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            query?: string;
          },
          Array<{
            _creationTime: number;
            _id: Id<"hashtags">;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          }>
        >;
        getUserFollowedTopics: FunctionReference<
          "query",
          "public",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            userId: Id<"users">;
          },
          Array<{
            _creationTime: number;
            _id: Id<"hashtags">;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          }>
        >;
        getTopicSuggestions: FunctionReference<
          "query",
          "public",
          { limit?: number; userId: Id<"users"> },
          Array<{
            _creationTime: number;
            _id: Id<"hashtags">;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          }>
        >;
        getTopic: FunctionReference<
          "query",
          "public",
          { topicId: Id<"hashtags"> },
          {
            _creationTime: number;
            _id: Id<"hashtags">;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          } | null
        >;
        checkTopicFollow: FunctionReference<
          "query",
          "public",
          { topicId: Id<"hashtags">; userId: Id<"users"> },
          boolean
        >;
        getRecommendedHashtags: FunctionReference<
          "query",
          "public",
          { limit: number; userId: Id<"users"> },
          Array<{
            _creationTime: number;
            _id: Id<"hashtags">;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          }>
        >;
      };
    };
  };
  puckEditor: {
    queries: {
      getData: FunctionReference<
        "query",
        "public",
        {
          organizationId?: Id<"organizations">;
          pageIdentifier: string;
          postId?: Id<"posts">;
        },
        any
      >;
    };
    mutations: {
      updateData: FunctionReference<
        "mutation",
        "public",
        {
          data: string;
          organizationId?: Id<"organizations">;
          pageIdentifier: string;
          postId?: Id<"posts">;
          postTypeSlug?: string;
          title?: string;
        },
        any
      >;
    };
  };
  presence: {
    heartbeat: FunctionReference<
      "mutation",
      "public",
      { interval: number; roomId: string; sessionId: string; userId: string },
      any
    >;
    list: FunctionReference<
      "query",
      "public",
      { limit?: number; roomToken: string },
      any
    >;
    disconnect: FunctionReference<
      "mutation",
      "public",
      { sessionToken: string },
      any
    >;
    updateRoomUser: FunctionReference<
      "mutation",
      "public",
      { data?: any; roomId: string; userId: string },
      any
    >;
  };
  migrations: {
    portal: {
      migratePortalOrganizationIds: FunctionReference<
        "mutation",
        "public",
        Record<string, never>,
        any
      >;
    };
  };
  lms: {
    contentAccess: {
      queries: {
        getContentAccessRules: FunctionReference<
          "query",
          "public",
          {
            contentId: string;
            contentType:
              | "course"
              | "lesson"
              | "topic"
              | "download"
              | "product"
              | "quiz";
          },
          any
        >;
        checkContentAccess: FunctionReference<
          "query",
          "public",
          {
            contentId: string;
            contentType:
              | "course"
              | "lesson"
              | "topic"
              | "download"
              | "product"
              | "quiz";
            parentContentId?: string;
            parentContentType?: "course" | "lesson";
            userId: Id<"users">;
          },
          any
        >;
      };
      mutations: {
        saveContentAccessRules: FunctionReference<
          "mutation",
          "public",
          {
            contentId: string;
            contentType:
              | "course"
              | "lesson"
              | "topic"
              | "download"
              | "product"
              | "quiz";
            excludedTags: any;
            isActive?: boolean;
            isPublic?: boolean;
            priority?: number;
            requiredTags: any;
          },
          Id<"contentAccessRules">
        >;
        clearContentAccessRules: FunctionReference<
          "mutation",
          "public",
          {
            contentId: string;
            contentType:
              | "course"
              | "lesson"
              | "topic"
              | "download"
              | "product"
              | "quiz";
          },
          boolean
        >;
        logContentAccess: FunctionReference<
          "mutation",
          "public",
          {
            accessGranted: boolean;
            contentId: string;
            contentType:
              | "course"
              | "lesson"
              | "topic"
              | "download"
              | "product"
              | "quiz";
            reason?: string;
            userId: Id<"users">;
          },
          any
        >;
      };
    };
  };
};
export type InternalApiType = {};
