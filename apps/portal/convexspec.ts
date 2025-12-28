import { type FunctionReference, anyApi } from "convex/server";
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
          { orderNumber: string; recordId: Id<"orders"> }
        >;
        deleteOrder: FunctionReference<
          "mutation",
          "public",
          { orderId: Id<"orders"> },
          any
        >;
        updateOrder: FunctionReference<
          "mutation",
          "public",
          {
            adminNotes?: string;
            billingAddress: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
            company?: string;
            couponCode?: string;
            createdAt?: number;
            differentShippingAddress?: boolean;
            discount?: number;
            email: string;
            firstName: string;
            id: Id<"orders">;
            lastName: string;
            lineItems: Array<{
              id: string;
              lineTotal: number;
              price: number;
              productId: Id<"products">;
              productSnapshot: {
                description: string;
                imageUrl?: string;
                name: string;
                price: number;
              };
              quantity: number;
              variantId?: Id<"productVariants">;
              variantSnapshot?: {
                attributes: any;
                name: string;
                price: number;
              };
            }>;
            notes?: string;
            paymentMethod:
              | "credit_card"
              | "paypal"
              | "apple_pay"
              | "google_pay"
              | "bank_transfer"
              | "crypto"
              | "other";
            paymentStatus?:
              | "pending"
              | "processing"
              | "paid"
              | "failed"
              | "refunded"
              | "partially_refunded";
            phone?: string;
            shipping?: number;
            shippingAddress: {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              country: string;
              fullName: string;
              phoneNumber?: string;
              postalCode: string;
              stateOrProvince: string;
            };
            shippingDetails?: {
              cost: number;
              description: string;
              method: string;
            } | null;
            status?:
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
            tax?: number;
            userId?: Id<"users">;
          },
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
        getStoreBalance: FunctionReference<
          "query",
          "public",
          { storeId?: string },
          {
            _creationTime: number;
            _id: Id<"storeBalances">;
            availableBalance: number;
            currency: string;
            lastUpdated: number;
            paymentProcessor: string;
            pendingBalance: number;
            processorAccountId?: string;
            storeId?: string;
            storeName?: string;
            totalBalance: number;
            updatedBy?: Id<"users">;
          } | null
        >;
        listStoreBalances: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          Array<{
            _creationTime: number;
            _id: Id<"storeBalances">;
            availableBalance: number;
            currency: string;
            lastUpdated: number;
            paymentProcessor: string;
            pendingBalance: number;
            processorAccountId?: string;
            storeId?: string;
            storeName?: string;
            totalBalance: number;
            updatedBy?: Id<"users">;
          }>
        >;
        getTransfers: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            status?:
              | "pending"
              | "in_transit"
              | "completed"
              | "failed"
              | "cancelled"
              | "reversed";
          },
          Array<{
            _creationTime: number;
            _id: Id<"transfers">;
            amount: number;
            bankAccountId: Id<"bankAccounts">;
            completedAt?: number;
            currency: string;
            description?: string;
            expectedArrival?: number;
            failureReason?: string;
            fees?: number;
            initiatedAt: number;
            initiatedBy: Id<"users">;
            notes?: string;
            paymentProcessor: string;
            processorTransferId?: string;
            status:
              | "pending"
              | "in_transit"
              | "completed"
              | "failed"
              | "cancelled"
              | "reversed";
            transferId: string;
          }>
        >;
        getBankAccounts: FunctionReference<
          "query",
          "public",
          {
            status?:
              | "pending_verification"
              | "verified"
              | "failed_verification"
              | "disabled";
          },
          Array<{
            _creationTime: number;
            _id: Id<"bankAccounts">;
            accountName: string;
            accountNumber: string;
            accountType: "checking" | "savings";
            address: {
              city: string;
              country: string;
              postalCode: string;
              state: string;
              street1: string;
              street2?: string;
            };
            bankName: string;
            createdAt: number;
            createdBy: Id<"users">;
            isDefault: boolean;
            paymentProcessor: string;
            providerAccountId?: string;
            routingNumber: string;
            status:
              | "pending_verification"
              | "verified"
              | "failed_verification"
              | "disabled";
            updatedAt: number;
          }>
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
          {
            availableBalance: number;
            currency: string;
            paymentProcessor: string;
            pendingBalance: number;
            processorAccountId?: string;
            storeBalanceId?: Id<"storeBalances">;
            storeId?: string;
            storeName?: string;
          },
          any
        >;
        deleteBankAccount: FunctionReference<
          "mutation",
          "public",
          { bankAccountId: Id<"bankAccounts"> },
          any
        >;
        deleteStoreBalance: FunctionReference<
          "mutation",
          "public",
          { storeBalanceId: Id<"storeBalances"> },
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
        createChargeback: FunctionReference<
          "mutation",
          "public",
          {
            amount: number;
            chargebackFee: number;
            currency: string;
            customerInfo: { customerId?: string; email: string; name: string };
            internalNotes?: string;
            orderId: Id<"orders">;
            processorName: string;
            reasonCode: string;
            reasonDescription: string;
            transactionId?: string;
          },
          any
        >;
        updateChargebackDetails: FunctionReference<
          "mutation",
          "public",
          {
            amount?: number;
            chargebackFee?: number;
            chargebackId: Id<"chargebacks">;
            currency?: string;
            disputeDeadline?: number;
            internalNotes?: string;
            processorName?: string;
            reasonCode?: string;
            reasonDescription?: string;
            refundAmount?: number;
          },
          any
        >;
        deleteChargeback: FunctionReference<
          "mutation",
          "public",
          { id: Id<"chargebacks"> },
          null
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
          {
            amount: number;
            bankAccountId: Id<"bankAccounts">;
            currency: string;
            description?: string;
            expectedArrival?: number;
            fees?: number;
            notes?: string;
          },
          any
        >;
        updateTransferStatus: FunctionReference<
          "mutation",
          "public",
          {
            failureReason?: string;
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
        updateTransferDetails: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            expectedArrival?: number;
            fees?: number;
            notes?: string;
            transferId: Id<"transfers">;
          },
          any
        >;
        deleteTransfer: FunctionReference<
          "mutation",
          "public",
          { transferId: Id<"transfers"> },
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
        getTransferDetails: FunctionReference<
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
    coupons: {
      mutations: {
        createCoupon: FunctionReference<
          "mutation",
          "public",
          {
            applicableCategoryIds?: Array<Id<"productCategories">>;
            applicableProductIds?: Array<Id<"products">>;
            code: string;
            description?: string;
            discountType: "percentage" | "fixed_amount";
            discountValue: number;
            endDate?: number;
            excludeCategoryIds?: Array<Id<"productCategories">>;
            excludeProductIds?: Array<Id<"products">>;
            isAutomatic?: boolean;
            isEnabled?: boolean;
            isStackable?: boolean;
            maximumSpend?: number;
            minimumSpend?: number;
            startDate?: number;
            usageLimit?: number;
            usageLimitPerUser?: number;
          },
          any
        >;
        updateCoupon: FunctionReference<
          "mutation",
          "public",
          {
            applicableCategoryIds?: Array<Id<"productCategories">>;
            applicableProductIds?: Array<Id<"products">>;
            code?: string;
            couponId: Id<"coupons">;
            description?: string;
            discountType: "percentage" | "fixed_amount";
            discountValue: number;
            endDate?: number;
            excludeCategoryIds?: Array<Id<"productCategories">>;
            excludeProductIds?: Array<Id<"products">>;
            isAutomatic?: boolean;
            isEnabled?: boolean;
            isStackable?: boolean;
            maximumSpend?: number;
            minimumSpend?: number;
            startDate?: number;
            usageLimit?: number;
            usageLimitPerUser?: number;
          },
          any
        >;
        incrementCouponUsage: FunctionReference<
          "mutation",
          "public",
          { couponId: Id<"coupons"> },
          any
        >;
        deleteCoupon: FunctionReference<
          "mutation",
          "public",
          { couponId: Id<"coupons"> },
          any
        >;
      };
      queries: {
        listCoupons: FunctionReference<
          "query",
          "public",
          { includeDisabled?: boolean; search?: string },
          Array<{
            _creationTime: number;
            _id: Id<"coupons">;
            applicableCategoryIds?: Array<Id<"productCategories">>;
            applicableProductIds?: Array<Id<"products">>;
            code: string;
            createdAt: number;
            description?: string;
            discountType: "percentage" | "fixed_amount";
            discountValue: number;
            endDate?: number;
            excludeCategoryIds?: Array<Id<"productCategories">>;
            excludeProductIds?: Array<Id<"products">>;
            isAutomatic?: boolean;
            isEnabled: boolean;
            isStackable?: boolean;
            maximumSpend?: number;
            minimumSpend?: number;
            startDate?: number;
            timesUsed: number;
            updatedAt: number;
            usageLimit?: number;
            usageLimitPerUser?: number;
          }>
        >;
        getCouponById: FunctionReference<
          "query",
          "public",
          { id: Id<"coupons"> },
          {
            _creationTime: number;
            _id: Id<"coupons">;
            applicableCategoryIds?: Array<Id<"productCategories">>;
            applicableProductIds?: Array<Id<"products">>;
            code: string;
            createdAt: number;
            description?: string;
            discountType: "percentage" | "fixed_amount";
            discountValue: number;
            endDate?: number;
            excludeCategoryIds?: Array<Id<"productCategories">>;
            excludeProductIds?: Array<Id<"products">>;
            isAutomatic?: boolean;
            isEnabled: boolean;
            isStackable?: boolean;
            maximumSpend?: number;
            minimumSpend?: number;
            startDate?: number;
            timesUsed: number;
            updatedAt: number;
            usageLimit?: number;
            usageLimitPerUser?: number;
          } | null
        >;
        getCouponByCode: FunctionReference<
          "query",
          "public",
          { code: string },
          {
            _creationTime: number;
            _id: Id<"coupons">;
            applicableCategoryIds?: Array<Id<"productCategories">>;
            applicableProductIds?: Array<Id<"products">>;
            code: string;
            createdAt: number;
            description?: string;
            discountType: "percentage" | "fixed_amount";
            discountValue: number;
            endDate?: number;
            excludeCategoryIds?: Array<Id<"productCategories">>;
            excludeProductIds?: Array<Id<"products">>;
            isAutomatic?: boolean;
            isEnabled: boolean;
            isStackable?: boolean;
            maximumSpend?: number;
            minimumSpend?: number;
            startDate?: number;
            timesUsed: number;
            updatedAt: number;
            usageLimit?: number;
            usageLimitPerUser?: number;
          } | null
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
        { orgId: Id<"organizations">; userId: Id<"users"> },
        number
      >;
      createNotification: FunctionReference<
        "mutation",
        "public",
        {
          actionData?: Record<string, string>;
          actionUrl?: string;
          content?: string;
          eventKey?: string;
          expiresAt?: number;
          message?: string;
          orgId?: Id<"organizations">;
          relatedId?: Id<"groupInvitations">;
          sourceOrderId?: Id<"transactions">;
          sourceUserId?: Id<"users">;
          title: string;
          type?: string;
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
        { orgId: Id<"organizations">; userId: Id<"users"> },
        number
      >;
      batchCreateNotifications: FunctionReference<
        "mutation",
        "public",
        {
          actionData?: Record<string, string>;
          actionUrl?: string;
          content?: string;
          eventKey?: string;
          expiresAt?: number;
          message?: string;
          orgId?: Id<"organizations">;
          relatedId?: Id<"groupInvitations">;
          sourceOrderId?: Id<"transactions">;
          sourceUserId?: Id<"users">;
          title: string;
          type?: string;
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
      getUnreadCountByClerkIdAndOrgId: FunctionReference<
        "query",
        "public",
        { clerkId: string; orgId?: Id<"organizations"> },
        number
      >;
      listLatestByClerkIdAndOrgId: FunctionReference<
        "query",
        "public",
        { clerkId: string; limit?: number; orgId?: Id<"organizations"> },
        Array<any>
      >;
      paginateByClerkIdAndOrgId: FunctionReference<
        "query",
        "public",
        {
          clerkId: string;
          filters?: { eventKey?: string };
          orgId?: Id<"organizations">;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        { continueCursor: string | null; isDone: boolean; page: Array<any> }
      >;
    };
    settings: {
      getOrgDefaults: FunctionReference<
        "query",
        "public",
        { orgId: Id<"organizations"> },
        { inAppDefaults: Record<string, boolean> }
      >;
      setOrgDefaults: FunctionReference<
        "mutation",
        "public",
        {
          actorUserId: Id<"users">;
          inAppDefaults: Record<string, boolean>;
          orgId: Id<"organizations">;
        },
        null
      >;
      getUserEventPrefs: FunctionReference<
        "query",
        "public",
        { orgId: Id<"organizations">; userId: Id<"users"> },
        { inAppEnabled: Record<string, boolean> }
      >;
      setUserEventPrefs: FunctionReference<
        "mutation",
        "public",
        {
          inAppEnabled: Record<string, boolean>;
          orgId: Id<"organizations">;
          userId: Id<"users">;
        },
        null
      >;
      listSubscriptions: FunctionReference<
        "query",
        "public",
        { eventKey?: string; orgId: Id<"organizations">; userId: Id<"users"> },
        Array<{
          _creationTime: number;
          _id: Id<"notificationSubscriptions">;
          enabled: boolean;
          eventKey: string;
          orgId: Id<"organizations">;
          scopeId: string | null;
          scopeKind: string;
          userId: Id<"users">;
        }>
      >;
      upsertSubscription: FunctionReference<
        "mutation",
        "public",
        {
          enabled: boolean;
          eventKey: string;
          orgId: Id<"organizations">;
          scopeId: string | null;
          scopeKind: string;
          userId: Id<"users">;
        },
        Id<"notificationSubscriptions">
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
      refreshVimeoLibrary: FunctionReference<
        "action",
        "public",
        { ownerId: Id<"organizations"> | Id<"users"> | string },
        {
          finishedAt: number;
          pagesFetched: number;
          startedAt: number;
          syncedCount: number;
        }
      >;
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
      fetchTranscript: FunctionReference<
        "action",
        "public",
        { ownerId: Id<"organizations"> | string; videoId: string },
        {
          rawVtt: string;
          track: {
            id: string;
            label?: string;
            language?: string;
            type?: string;
          };
          transcript: string;
        }
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
      upsertVideosPage: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: Id<"connections">;
          now: number;
          videos: Array<{
            description?: string;
            embedUrl: string;
            publishedAt: number;
            thumbnailUrl?: string;
            title: string;
            videoId: string;
          }>;
        },
        { inserted: number; updated: number }
      >;
      startVimeoSync: FunctionReference<
        "mutation",
        "public",
        { organizationId: Id<"organizations">; restart?: boolean },
        { connectionId: Id<"connections">; workflowId: string }
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
        {
          organizationId: Id<"organizations">;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          search?: string;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _id: Id<"vimeoVideos">;
            description?: string;
            embedUrl: string;
            publishedAt: number;
            thumbnailUrl?: string;
            title: string;
            videoId: string;
          }>;
        }
      >;
      getVideoByExternalId: FunctionReference<
        "query",
        "public",
        { connectionId: Id<"connections">; videoId: string },
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
    syncState: {
      getVimeoSyncStatus: FunctionReference<
        "query",
        "public",
        { organizationId: Id<"organizations"> },
        null | {
          _id: Id<"vimeoSyncState">;
          connectionId: Id<"connections">;
          finishedAt?: number;
          lastError?: string;
          nextPage: number;
          pagesFetched: number;
          perPage: number;
          startedAt?: number;
          status: "idle" | "running" | "error" | "done";
          syncedCount: number;
          updatedAt: number;
          workflowId?: string;
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
          orgId?: Id<"organizations">;
          type?: "store" | "site";
        },
        any
      >;
      getByType: FunctionReference<
        "query",
        "public",
        { orgId?: Id<"organizations">; type?: "store" | "site" },
        any
      >;
      getStoreOptions: FunctionReference<
        "query",
        "public",
        { orgId?: Id<"organizations"> },
        any
      >;
      set: FunctionReference<
        "mutation",
        "public",
        {
          metaKey: string;
          metaValue: any;
          orgId?: Id<"organizations">;
          type?: "store" | "site";
        },
        any
      >;
      setBatch: FunctionReference<
        "mutation",
        "public",
        {
          options: Array<{ metaKey: string; metaValue: any }>;
          orgId?: Id<"organizations">;
          type?: "store" | "site";
        },
        any
      >;
      remove: FunctionReference<
        "mutation",
        "public",
        {
          metaKey: string;
          orgId?: Id<"organizations">;
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
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
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
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
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
              status?: string;
            };
            organizationId?: Id<"organizations">;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "public",
          {
            id: string;
            organizationId?: Id<"organizations">;
            postTypeSlug?: string;
          },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "public",
          {
            organizationId?: Id<"organizations">;
            postId: string;
            postTypeSlug?: string;
          },
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
      postMeta: {
        getPostMeta: FunctionReference<
          "query",
          "public",
          {
            organizationId?: Id<"organizations">;
            postId: string;
            postTypeSlug?: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            key: string;
            postId: string;
            updatedAt?: number;
            value?: string | number | boolean | null;
          }>
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
            organizationId?: Id<"organizations">;
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
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            storageId: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
            title?: string;
          },
          {
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            status: "draft" | "published";
            storageId: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
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
            externalUrl?: string;
            height?: number;
            mimeType?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
            title?: string;
            url?: string;
            width?: number;
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
            externalUrl?: string;
            height?: number;
            mimeType?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
            title?: string;
            url?: string;
            width?: number;
          }
        >;
        getStorageMetadata: FunctionReference<
          "query",
          "public",
          { storageId: Id<"_storage"> },
          any
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
            externalUrl?: string;
            height?: number;
            mimeType?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
            title?: string;
            url?: string;
            width?: number;
          }
        >;
        listMediaItemsWithUrl: FunctionReference<
          "query",
          "public",
          {
            organizationId?: Id<"organizations">;
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
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
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
              externalUrl?: string;
              height?: number;
              mimeType?: string;
              organizationId?: Id<"organizations">;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
              title?: string;
              uploadedAt?: number;
              url?: string;
              width?: number;
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
              externalUrl?: string;
              height?: number;
              mimeType?: string;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
              title?: string;
              url?: string;
              width?: number;
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
              externalUrl?: string;
              height?: number;
              mimeType?: string;
              status?: "draft" | "published";
              storageId?: Id<"_storage">;
              taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
              title?: string;
              url?: string;
              width?: number;
            }>;
          }
        >;
        searchMedia: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            searchTerm: string;
            status?: "draft" | "published";
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
          },
          Array<{
            _creationTime: number;
            _id: Id<"mediaItems">;
            alt?: string;
            caption?: string;
            categories?: Array<string>;
            externalUrl?: string;
            height?: number;
            mimeType?: string;
            status?: "draft" | "published";
            storageId?: Id<"_storage">;
            taxonomyTermIds?: Array<Id<"taxonomyTerms">>;
            title?: string;
            url?: string;
            width?: number;
          }>
        >;
      };
      meta: {
        listMediaItemMeta: FunctionReference<
          "query",
          "public",
          {
            mediaItemId: Id<"mediaItems">;
            organizationId: Id<"organizations">;
          },
          Array<{
            _creationTime: number;
            _id: Id<"mediaItemsMeta">;
            createdAt: number;
            key: string;
            mediaItemId: Id<"mediaItems">;
            organizationId: Id<"organizations">;
            updatedAt?: number;
            value?: string | number | boolean | null;
          }>
        >;
        upsertMediaItemMeta: FunctionReference<
          "mutation",
          "public",
          {
            mediaItemId: Id<"mediaItems">;
            meta: Record<string, string | number | boolean | null>;
            organizationId: Id<"organizations">;
          },
          null
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
            logo?: string | null;
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
            customDomainLastError?: string;
            customDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            customDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            customDomainUpdatedAt?: number;
            customDomainVerifiedAt?: number;
            description?: string;
            emailDomain?: string;
            emailDomainLastError?: string;
            emailDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            emailDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            emailDomainUpdatedAt?: number;
            emailDomainVerifiedAt?: number;
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
            customDomainLastError?: string;
            customDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            customDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            customDomainUpdatedAt?: number;
            customDomainVerifiedAt?: number;
            description?: string;
            emailDomain?: string;
            emailDomainLastError?: string;
            emailDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            emailDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            emailDomainUpdatedAt?: number;
            emailDomainVerifiedAt?: number;
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
        getByCustomDomain: FunctionReference<
          "query",
          "public",
          { hostname: string },
          {
            _creationTime: number;
            _id: Id<"organizations">;
            allowSelfRegistration: boolean;
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: number;
            currentPeriodStart?: number;
            customDomain?: string;
            customDomainLastError?: string;
            customDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            customDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            customDomainUpdatedAt?: number;
            customDomainVerifiedAt?: number;
            description?: string;
            emailDomain?: string;
            emailDomainLastError?: string;
            emailDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            emailDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            emailDomainUpdatedAt?: number;
            emailDomainVerifiedAt?: number;
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
            customDomainLastError?: string;
            customDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            customDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            customDomainUpdatedAt?: number;
            customDomainVerifiedAt?: number;
            description?: string;
            emailDomain?: string;
            emailDomainLastError?: string;
            emailDomainRecords?: Array<{
              name: string;
              type: string;
              value: string;
            }>;
            emailDomainStatus?:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            emailDomainUpdatedAt?: number;
            emailDomainVerifiedAt?: number;
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
      domains: {
        startCustomDomainSetup: FunctionReference<
          "action",
          "public",
          { domain: string; organizationId: Id<"organizations"> },
          {
            customDomain: string;
            records: Array<{ name: string; type: string; value: string }>;
            status: "unconfigured" | "pending" | "verified" | "error";
          }
        >;
        verifyCustomDomain: FunctionReference<
          "action",
          "public",
          { organizationId: Id<"organizations"> },
          {
            customDomain: string;
            records: Array<{ name: string; type: string; value: string }>;
            status: "unconfigured" | "pending" | "verified" | "error";
          }
        >;
      };
      emailDomains: {
        syncEmailDomainFromCustomDomain: FunctionReference<
          "action",
          "public",
          { organizationId: Id<"organizations"> },
          {
            emailDomain: string | null;
            lastError?: string;
            records: Array<{ name: string; type: string; value: string }>;
            status: "unconfigured" | "pending" | "verified" | "error";
            updatedAt: number;
          }
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
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
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
              pageTemplateSlug?: string;
              rewrite?: {
                archiveSlug?: string;
                feeds?: boolean;
                hasArchive?: boolean;
                pages?: boolean;
                permalink?: { aliases?: Array<string>; canonical: string };
                singleSlug?: string;
                withFront?: boolean;
              };
              storageKind?: "posts" | "custom" | "component";
              storageTables?: Array<string>;
              supports?: {
                attachments?: boolean;
                comments?: boolean;
                customFields?: boolean;
                editor?: boolean;
                excerpt?: boolean;
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
              frontendVisibility?: {
                disabledSingleSlotIds?: Array<string>;
                showComments?: boolean;
                showCustomFields?: boolean;
              };
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
              pageTemplateSlug?: string;
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
              storageKind?: "posts" | "custom" | "component";
              storageTables?: Array<string>;
              supports?: {
                attachments?: boolean;
                comments?: boolean;
                customFields?: boolean;
                editor?: boolean;
                excerpt?: boolean;
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
        backfillRewriteKeys: FunctionReference<
          "mutation",
          "public",
          { organizationId?: Id<"organizations"> },
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
            archiveSlugKey?: string;
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            frontendVisibility?: {
              disabledSingleSlotIds?: Array<string>;
              showComments?: boolean;
              showCustomFields?: boolean;
            };
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
            pageTemplateSlug?: string;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            singleSlugKey?: string;
            slug: string;
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
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
            archiveSlugKey?: string;
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            frontendVisibility?: {
              disabledSingleSlotIds?: Array<string>;
              showComments?: boolean;
              showCustomFields?: boolean;
            };
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
            pageTemplateSlug?: string;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            singleSlugKey?: string;
            slug: string;
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
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
            archiveSlugKey?: string;
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            frontendVisibility?: {
              disabledSingleSlotIds?: Array<string>;
              showComments?: boolean;
              showCustomFields?: boolean;
            };
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
            pageTemplateSlug?: string;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            singleSlugKey?: string;
            slug: string;
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
            updatedAt?: number;
          } | null
        >;
        getBySingleSlugKey: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; singleSlugKey: string },
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
            archiveSlugKey?: string;
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            frontendVisibility?: {
              disabledSingleSlotIds?: Array<string>;
              showComments?: boolean;
              showCustomFields?: boolean;
            };
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
            pageTemplateSlug?: string;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            singleSlugKey?: string;
            slug: string;
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
              featuredImage?: boolean;
              postMeta?: boolean;
              revisions?: boolean;
              taxonomy?: boolean;
              title?: boolean;
            };
            updatedAt?: number;
          } | null
        >;
        getByArchiveSlugKey: FunctionReference<
          "query",
          "public",
          { archiveSlugKey: string; organizationId?: Id<"organizations"> },
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
            archiveSlugKey?: string;
            createdAt: number;
            createdBy?: Id<"users">;
            description?: string;
            enableApi?: boolean;
            enableVersioning?: boolean;
            enabledOrganizationIds?: Array<Id<"organizations"> | "portal-root">;
            entryCount?: number;
            fieldCount?: number;
            frontendVisibility?: {
              disabledSingleSlotIds?: Array<string>;
              showComments?: boolean;
              showCustomFields?: boolean;
            };
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
            pageTemplateSlug?: string;
            rewrite?: {
              archiveSlug?: string;
              feeds?: boolean;
              hasArchive?: boolean;
              pages?: boolean;
              permalink?: { aliases?: Array<string>; canonical: string };
              singleSlug?: string;
              withFront?: boolean;
            };
            singleSlugKey?: string;
            slug: string;
            storageKind?: "posts" | "custom" | "component";
            storageTables?: Array<string>;
            supports?: {
              attachments?: boolean;
              comments?: boolean;
              customFields?: boolean;
              editor?: boolean;
              excerpt?: boolean;
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
          { organizationId?: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"taxonomies">;
            builtIn: boolean;
            createdAt: number;
            description?: string;
            hierarchical: boolean;
            name: string;
            organizationId?: Id<"organizations">;
            postTypeSlugs?: Array<string>;
            slug: string;
            updatedAt?: number;
          }>
        >;
        getTaxonomyBySlug: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; slug: string },
          {
            _creationTime: number;
            _id: Id<"taxonomies">;
            builtIn: boolean;
            createdAt: number;
            description?: string;
            hierarchical: boolean;
            name: string;
            organizationId?: Id<"organizations">;
            postTypeSlugs?: Array<string>;
            slug: string;
            updatedAt?: number;
          } | null
        >;
        listTermsByTaxonomy: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations">;
            postTypeSlug?: string;
            taxonomySlug: string;
          },
          Array<{
            _creationTime: number;
            _id: Id<"taxonomyTerms">;
            createdAt: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            organizationId: Id<"organizations">;
            parentId?: Id<"taxonomyTerms">;
            postTypeSlugs?: Array<string>;
            slug: string;
            taxonomyId: Id<"taxonomies">;
            updatedAt?: number;
          }>
        >;
        getTermBySlug: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations">;
            taxonomySlug: string;
            termSlug: string;
          },
          {
            _creationTime: number;
            _id: Id<"taxonomyTerms">;
            createdAt: number;
            description?: string;
            metadata?: Record<string, string | number | boolean>;
            name: string;
            organizationId: Id<"organizations">;
            parentId?: Id<"taxonomyTerms">;
            postTypeSlugs?: Array<string>;
            slug: string;
            taxonomyId: Id<"taxonomies">;
            updatedAt?: number;
          } | null
        >;
        listObjectTerms: FunctionReference<
          "query",
          "public",
          { objectId: string; organizationId: Id<"organizations"> },
          Array<Id<"taxonomyTerms">>
        >;
        listObjectsByTerm: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations">;
            postTypeSlug?: string;
            termId: Id<"taxonomyTerms">;
          },
          Array<string>
        >;
        listAssignmentsByTerm: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations">; termId: Id<"taxonomyTerms"> },
          Array<{ objectId: string; postTypeSlug: string }>
        >;
        listObjectTermBadges: FunctionReference<
          "query",
          "public",
          {
            objectId: string;
            organizationId: Id<"organizations">;
            postTypeSlug?: string;
          },
          Array<{
            taxonomyName: string;
            taxonomySlug: string;
            termId: Id<"taxonomyTerms">;
            termName: string;
            termSlug: string;
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
            organizationId: Id<"organizations">;
            postTypeSlugs?: Array<string>;
            slug?: string;
          },
          Id<"taxonomies">
        >;
        createTerm: FunctionReference<
          "mutation",
          "public",
          {
            description?: string;
            name: string;
            organizationId: Id<"organizations">;
            parentId?: Id<"taxonomyTerms">;
            postTypeSlugs?: Array<string>;
            slug?: string;
            taxonomySlug: string;
          },
          Id<"taxonomyTerms">
        >;
        deleteTaxonomy: FunctionReference<
          "mutation",
          "public",
          { id: Id<"taxonomies">; organizationId: Id<"organizations"> },
          boolean
        >;
        deleteTerm: FunctionReference<
          "mutation",
          "public",
          {
            organizationId: Id<"organizations">;
            taxonomySlug: string;
            termId: Id<"taxonomyTerms">;
          },
          boolean
        >;
        ensureBuiltInTaxonomies: FunctionReference<
          "mutation",
          "public",
          Record<string, never>,
          Array<string>
        >;
        setObjectTerms: FunctionReference<
          "mutation",
          "public",
          {
            objectId: string;
            organizationId: Id<"organizations">;
            postTypeSlug: string;
            termIds: Array<Id<"taxonomyTerms">>;
          },
          null
        >;
        setTermMeta: FunctionReference<
          "mutation",
          "public",
          {
            key: string;
            organizationId: Id<"organizations">;
            termId: Id<"taxonomyTerms">;
            value?: string | number | boolean | null;
          },
          Id<"taxonomyMeta">
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
            organizationId: Id<"organizations">;
          },
          Id<"taxonomies">
        >;
        updateTerm: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              description?: string;
              name?: string;
              parentId?: Id<"taxonomyTerms">;
              postTypeSlugs?: Array<string>;
              slug?: string;
            };
            organizationId: Id<"organizations">;
            taxonomySlug: string;
            termId: Id<"taxonomyTerms">;
          },
          Id<"taxonomyTerms">
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
    auditLog: {
      queries: {
        getAuditLogStats: FunctionReference<
          "query",
          "public",
          { endDate?: number; startDate?: number },
          {
            entriesByCategory: {
              authentication: number;
              authorization: number;
              data_access: number;
              data_modification: number;
              ecommerce: number;
              navigation: number;
              security: number;
              system: number;
            };
            entriesBySeverity: {
              critical: number;
              error: number;
              info: number;
              warning: number;
            };
            successRate: number;
            totalEntries: number;
            uniqueUsers: number;
          }
        >;
      };
    };
    downloads: {
      queries: {
        getDownloadBySlug: FunctionReference<
          "query",
          "public",
          { organizationId: Id<"organizations">; slug: string },
          null | {
            download: {
              _creationTime: number;
              _id: Id<"downloads">;
              access: { kind: "public" | "gated" };
              content?: string;
              createdAt: number;
              description?: string;
              downloadCountTotal: number;
              mediaItemId: Id<"mediaItems">;
              organizationId: Id<"organizations">;
              r2Key?: string;
              slug: string;
              source: { kind: "mediaItem" };
              status: "draft" | "published";
              title: string;
              updatedAt?: number;
            };
            media: {
              _id: Id<"mediaItems">;
              mimeType?: string;
              title?: string;
              url?: string;
            };
          }
        >;
        getDownloadById: FunctionReference<
          "query",
          "public",
          { downloadId: Id<"downloads">; organizationId: Id<"organizations"> },
          null | {
            download: {
              _creationTime: number;
              _id: Id<"downloads">;
              access: { kind: "public" | "gated" };
              content?: string;
              createdAt: number;
              description?: string;
              downloadCountTotal: number;
              mediaItemId: Id<"mediaItems">;
              organizationId: Id<"organizations">;
              r2Key?: string;
              slug: string;
              source: { kind: "mediaItem" };
              status: "draft" | "published";
              title: string;
              updatedAt?: number;
            };
            media: null | {
              _id: Id<"mediaItems">;
              mimeType?: string;
              title?: string;
              url?: string;
            };
          }
        >;
        listDownloads: FunctionReference<
          "query",
          "public",
          {
            organizationId: Id<"organizations">;
            status?: "draft" | "published";
          },
          Array<{
            _creationTime: number;
            _id: Id<"downloads">;
            access: { kind: "public" | "gated" };
            content?: string;
            createdAt: number;
            description?: string;
            downloadCountTotal: number;
            mediaItemId: Id<"mediaItems">;
            organizationId: Id<"organizations">;
            r2Key?: string;
            slug: string;
            source: { kind: "mediaItem" };
            status: "draft" | "published";
            title: string;
            updatedAt?: number;
          }>
        >;
      };
      mutations: {
        createDownloadFromMediaItem: FunctionReference<
          "mutation",
          "public",
          {
            accessKind?: "public" | "gated";
            content?: string;
            description?: string;
            mediaItemId: Id<"mediaItems">;
            organizationId: Id<"organizations">;
            slug?: string;
            title?: string;
          },
          Id<"downloads">
        >;
        updateDownload: FunctionReference<
          "mutation",
          "public",
          {
            data: {
              accessKind?: "public" | "gated";
              content?: string;
              description?: string;
              mediaItemId?: Id<"mediaItems">;
              slug?: string;
              status?: "draft" | "published";
              title?: string;
            };
            downloadId: Id<"downloads">;
            organizationId: Id<"organizations">;
          },
          null
        >;
        requestDownloadUrl: FunctionReference<
          "mutation",
          "public",
          {
            downloadId: Id<"downloads">;
            expiresInSeconds?: number;
            organizationId: Id<"organizations">;
          },
          string
        >;
      };
      actions: {
        publishDownload: FunctionReference<
          "action",
          "public",
          { downloadId: Id<"downloads">; organizationId: Id<"organizations"> },
          { downloadId: Id<"downloads">; r2Key: string }
        >;
      };
      meta: {
        listDownloadMeta: FunctionReference<
          "query",
          "public",
          { downloadId: Id<"downloads">; organizationId: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"downloadsMeta">;
            createdAt: number;
            downloadId: Id<"downloads">;
            key: string;
            organizationId: Id<"organizations">;
            updatedAt?: number;
            value?: string | number | boolean | null;
          }>
        >;
        upsertDownloadMeta: FunctionReference<
          "mutation",
          "public",
          {
            downloadId: Id<"downloads">;
            meta: Record<string, string | number | boolean | null>;
            organizationId: Id<"organizations">;
          },
          null
        >;
      };
    };
    emails: {
      service: {
        getProviderStatus: FunctionReference<
          "query",
          "public",
          Record<string, never>,
          { resendConfigured: boolean }
        >;
        getSettings: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations"> },
          {
            _creationTime: number;
            _id: Id<"emailSettings">;
            createdAt: number;
            designKey?: "clean" | "bold" | "minimal";
            enabled: boolean;
            fromEmail: string;
            fromLocalPart: string;
            fromMode: "portal" | "custom";
            fromName: string;
            orgId: Id<"organizations">;
            provider: "resend";
            replyToEmail?: string;
            updatedAt: number;
            updatedBy?: Id<"users">;
          } | null
        >;
        listTemplates: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations"> },
          Array<{
            _creationTime: number;
            _id: Id<"emailTemplates">;
            copyOverrides?: Record<string, string>;
            createdAt: number;
            designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
            markdownBody?: string;
            orgId: Id<"organizations">;
            subject?: string;
            subjectOverride?: string;
            templateKey: string;
            updatedAt: number;
            updatedBy?: Id<"users">;
          }>
        >;
        listTemplateCatalog: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations"> },
          Array<{
            designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
            hasOverride: boolean;
            subject: string;
            templateId?: Id<"emailTemplates">;
            templateKey: string;
            title: string;
            updatedAt?: number;
          }>
        >;
        resetTemplateOverride: FunctionReference<
          "mutation",
          "public",
          { orgId?: Id<"organizations">; templateId: Id<"emailTemplates"> },
          null
        >;
        getTemplateById: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations">; templateId: Id<"emailTemplates"> },
          {
            _id: Id<"emailTemplates">;
            copyOverrides?: Record<string, string>;
            createdAt: number;
            designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
            subjectOverride?: string;
            templateKey: string;
            updatedAt: number;
          } | null
        >;
        getTemplateEditorById: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations">; templateId: Id<"emailTemplates"> },
          {
            definition: {
              copySchema: Array<{
                description?: string;
                key: string;
                kind?: "singleLine" | "multiLine" | "url";
                label: string;
                maxLength?: number;
                multiline?: boolean;
                placeholder?: string;
              }>;
              defaultCopy: Record<string, string>;
              defaultSubject: string;
              templateKey: string;
              title: string;
            };
            orgDesignKey: "clean" | "bold" | "minimal";
            template: {
              _id: Id<"emailTemplates">;
              copyOverrides?: Record<string, string>;
              createdAt: number;
              designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
              subjectOverride?: string;
              templateKey: string;
              updatedAt: number;
            };
          }
        >;
        ensureTemplateOverrideForKey: FunctionReference<
          "mutation",
          "public",
          { orgId?: Id<"organizations">; templateKey: string },
          Id<"emailTemplates">
        >;
        listOutbox: FunctionReference<
          "query",
          "public",
          {
            orgId?: Id<"organizations">;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            status?: "queued" | "sent" | "failed";
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: Id<"emailOutbox">;
              createdAt: number;
              error?: string;
              fromEmail: string;
              fromName: string;
              htmlBody: string;
              orgId: Id<"organizations">;
              providerMessageId?: string;
              replyToEmail?: string;
              sentAt?: number;
              status: "queued" | "sent" | "failed";
              subject: string;
              templateKey?: string;
              textBody: string;
              to: string;
            }>;
          }
        >;
        updateSettings: FunctionReference<
          "mutation",
          "public",
          {
            designKey?: "clean" | "bold" | "minimal";
            enabled: boolean;
            fromLocalPart: string;
            fromMode: "portal" | "custom";
            fromName: string;
            orgId?: Id<"organizations">;
            replyToEmail?: string;
          },
          Id<"emailSettings">
        >;
        upsertTemplate: FunctionReference<
          "mutation",
          "public",
          {
            copyOverrides?: Record<string, string>;
            designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
            orgId?: Id<"organizations">;
            subjectOverride?: string;
            templateKey: string;
          },
          Id<"emailTemplates">
        >;
        migrateLegacyMarkdownTemplatesForOrg: FunctionReference<
          "mutation",
          "public",
          { orgId?: Id<"organizations"> },
          { migratedCount: number }
        >;
        sendTransactionalEmail: FunctionReference<
          "mutation",
          "public",
          {
            orgId?: Id<"organizations">;
            templateKey: string;
            to: string;
            variables?: Record<string, string>;
          },
          Id<"emailOutbox">
        >;
        sendTestEmail: FunctionReference<
          "mutation",
          "public",
          { orgId?: Id<"organizations">; to: string },
          Id<"emailOutbox">
        >;
        getSenderOptions: FunctionReference<
          "query",
          "public",
          { orgId?: Id<"organizations"> },
          {
            canUseCustomDomain: boolean;
            customDomain: string | null;
            customDomainStatus:
              | "unconfigured"
              | "pending"
              | "verified"
              | "error";
            portalDomain: string;
          }
        >;
      };
      reactEmailRender: {
        previewTemplateById: FunctionReference<
          "action",
          "public",
          {
            orgId?: Id<"organizations">;
            templateId: Id<"emailTemplates">;
            variables?: Record<string, string>;
          },
          {
            copyUsed: Record<string, string>;
            designKey: "clean" | "bold" | "minimal";
            html: string;
            subject: string;
            subjectTemplateUsed: string;
            text: string;
            warnings: Array<string>;
          }
        >;
        previewTemplateByIdWithOverrides: FunctionReference<
          "action",
          "public",
          {
            orgId?: Id<"organizations">;
            overrides: {
              copyOverrides?: Record<string, string>;
              designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
              subjectOverride?: string;
            };
            templateId: Id<"emailTemplates">;
            variables?: Record<string, string>;
          },
          {
            copyUsed: Record<string, string>;
            designKey: "clean" | "bold" | "minimal";
            html: string;
            subject: string;
            subjectTemplateUsed: string;
            text: string;
            warnings: Array<string>;
          }
        >;
        sendTransactionalEmail: FunctionReference<
          "action",
          "public",
          {
            orgId?: Id<"organizations">;
            templateKey: string;
            to: string;
            variables?: Record<string, string>;
          },
          Id<"emailOutbox">
        >;
        sendTestEmail: FunctionReference<
          "action",
          "public",
          { orgId?: Id<"organizations">; to: string },
          Id<"emailOutbox">
        >;
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
          Array<{ _id: string; slug?: string; status?: string; title: string }>
        >;
        listCertificates: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations"> },
          Array<{
            _id: string;
            content?: string;
            excerpt?: string;
            slug?: string;
            status?: string;
            title: string;
          }>
        >;
        listCompletedCoursesForCertificateViewer: FunctionReference<
          "query",
          "public",
          { certificateId: string; organizationId?: Id<"organizations"> },
          null | Array<{
            completedAt: number;
            courseId: string;
            courseSlug?: string;
            courseTitle: string;
          }>
        >;
        getCertificateViewerContext: FunctionReference<
          "query",
          "public",
          {
            certificateId: string;
            courseId: string;
            organizationId?: Id<"organizations">;
          },
          null | {
            certificateId: string;
            completionDate: string;
            courseTitle: string;
            organizationName?: string;
            userName: string;
          }
        >;
        getCourseStructureWithItems: FunctionReference<
          "query",
          "public",
          {
            courseId?: string;
            courseSlug?: string;
            organizationId?: Id<"organizations">;
          },
          {
            attachedCertificates: Array<{
              _id: string;
              content?: string;
              excerpt?: string;
              slug?: string;
              status?: string;
              title: string;
            }>;
            attachedLessons: Array<{
              _id: string;
              certificateId?: string;
              content?: string;
              excerpt?: string;
              firstAttachmentUrl?: string;
              order?: number;
              slug?: string;
              status?: string;
              title: string;
            }>;
            attachedQuizzes: Array<{
              _id: string;
              content?: string;
              excerpt?: string;
              firstAttachmentUrl?: string;
              isFinal?: boolean;
              lessonId?: string;
              order?: number;
              slug?: string;
              title: string;
              topicId?: string;
            }>;
            attachedTopics: Array<{
              _id: string;
              certificateId?: string;
              content?: string;
              excerpt?: string;
              firstAttachmentUrl?: string;
              lessonId?: string;
              order?: number;
              slug?: string;
              title: string;
            }>;
            course: {
              _id: string;
              certificateId?: string;
              courseStructure: Array<{ lessonId: string }>;
              firstAttachmentUrl?: string;
              organizationId?: Id<"organizations">;
              slug?: string;
              status?: string;
              title: string;
            };
          }
        >;
        getCourseProgressForViewer: FunctionReference<
          "query",
          "public",
          { courseId: string; organizationId?: Id<"organizations"> },
          {
            completedAt?: number;
            completedLessonIds: Array<string>;
            completedTopicIds: Array<string>;
            courseId: string;
            lastAccessedAt?: number;
            lastAccessedId?: string;
            lastAccessedType?: "lesson" | "topic";
            startedAt?: number;
            updatedAt?: number;
            userId: Id<"users">;
          } | null
        >;
        getBadgeSummariesForPost: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; postId: string },
          Array<{
            badgeId: string;
            firstAttachmentUrl?: string;
            slug?: string;
            title: string;
          }>
        >;
        getAvailableLessons: FunctionReference<
          "query",
          "public",
          { courseId: string; organizationId?: Id<"organizations"> },
          Array<{
            _id: string;
            certificateId?: string;
            content?: string;
            excerpt?: string;
            firstAttachmentUrl?: string;
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
            _id: string;
            certificateId?: string;
            content?: string;
            excerpt?: string;
            firstAttachmentUrl?: string;
            lessonId?: string;
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
            _id: string;
            content?: string;
            excerpt?: string;
            firstAttachmentUrl?: string;
            isFinal?: boolean;
            lessonId?: string;
            order?: number;
            slug?: string;
            title: string;
            topicId?: string;
          }>
        >;
        getQuizBuilderState: FunctionReference<
          "query",
          "public",
          { organizationId?: Id<"organizations">; quizId: string },
          {
            questions: Array<{
              _id: string;
              answerText?: string | null;
              correctOptionIds: Array<string>;
              options: Array<{ id: string; label: string }>;
              order: number;
              prompt: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
              quizId: string;
              title: string;
            }>;
            quiz: {
              _id: string;
              slug?: string;
              status?: string;
              title: string;
            };
          }
        >;
        getQuizAttemptsForViewer: FunctionReference<
          "query",
          "public",
          { quizId: string },
          Array<{
            _id: string;
            completedAt: number;
            correctCount: number;
            durationMs?: number;
            gradedQuestions: number;
            scorePercent: number;
            totalQuestions: number;
          }>
        >;
      };
      mutations: {
        setCourseCertificate: FunctionReference<
          "mutation",
          "public",
          { certificateId?: string | null; courseId: string },
          { success: boolean }
        >;
        setLessonCertificate: FunctionReference<
          "mutation",
          "public",
          { certificateId?: string | null; lessonId: string },
          { success: boolean }
        >;
        setTopicCertificate: FunctionReference<
          "mutation",
          "public",
          { certificateId?: string | null; topicId: string },
          { success: boolean }
        >;
        ensureQuizQuestionPostType: FunctionReference<
          "mutation",
          "public",
          { organizationId?: Id<"organizations"> },
          { success: boolean }
        >;
        addLessonToCourse: FunctionReference<
          "mutation",
          "public",
          { courseId: string; lessonId: string },
          { success: boolean }
        >;
        removeLessonFromCourseStructure: FunctionReference<
          "mutation",
          "public",
          { courseId: string; lessonId: string },
          { success: boolean }
        >;
        reorderLessonsInCourse: FunctionReference<
          "mutation",
          "public",
          { courseId: string; orderedLessonIds: Array<string> },
          { success: boolean }
        >;
        attachTopicToLesson: FunctionReference<
          "mutation",
          "public",
          { lessonId: string; order?: number; topicId: string },
          { success: boolean }
        >;
        removeTopicFromLesson: FunctionReference<
          "mutation",
          "public",
          { topicId: string },
          { success: boolean }
        >;
        reorderTopicsInLesson: FunctionReference<
          "mutation",
          "public",
          { lessonId: string; orderedTopicIds: Array<string> },
          { success: boolean }
        >;
        attachQuizToLesson: FunctionReference<
          "mutation",
          "public",
          {
            isFinal?: boolean;
            lessonId: string;
            order?: number;
            quizId: string;
            topicId?: string;
          },
          { success: boolean }
        >;
        removeQuizFromLesson: FunctionReference<
          "mutation",
          "public",
          { quizId: string },
          { success: boolean }
        >;
        attachFinalQuizToCourse: FunctionReference<
          "mutation",
          "public",
          { courseId: string; order?: number; quizId: string },
          { success: boolean }
        >;
        removeFinalQuizFromCourse: FunctionReference<
          "mutation",
          "public",
          { quizId: string },
          { success: boolean }
        >;
        createLessonFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            courseId: string;
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
          { lessonId: string }
        >;
        createTopicFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            lessonId: string;
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
          { topicId: string }
        >;
        createQuizFromVimeo: FunctionReference<
          "mutation",
          "public",
          {
            organizationId?: Id<"organizations">;
            status?: "draft" | "published";
            targetLessonId?: string;
            targetTopicId?: string;
            video: {
              description?: string;
              embedUrl?: string;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            };
          },
          { quizId: string }
        >;
        createQuizQuestion: FunctionReference<
          "mutation",
          "public",
          {
            organizationId?: Id<"organizations">;
            question: {
              answerText?: string | null;
              correctOptionIds?: Array<string>;
              options?: Array<{ id: string; label: string }>;
              prompt: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
            };
            quizId: string;
          },
          {
            question: {
              _id: string;
              answerText?: string | null;
              correctOptionIds: Array<string>;
              options: Array<{ id: string; label: string }>;
              order: number;
              prompt: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
              quizId: string;
              title: string;
            };
          }
        >;
        updateQuizQuestion: FunctionReference<
          "mutation",
          "public",
          {
            question: {
              answerText?: string | null;
              correctOptionIds?: Array<string>;
              options?: Array<{ id: string; label: string }>;
              prompt: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
            };
            questionId: string;
            quizId: string;
          },
          {
            question: {
              _id: string;
              answerText?: string | null;
              correctOptionIds: Array<string>;
              options: Array<{ id: string; label: string }>;
              order: number;
              prompt: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
              quizId: string;
              title: string;
            };
          }
        >;
        deleteQuizQuestion: FunctionReference<
          "mutation",
          "public",
          { questionId: string; quizId: string },
          { success: boolean }
        >;
        reorderQuizQuestions: FunctionReference<
          "mutation",
          "public",
          { orderedQuestionIds: Array<string>; quizId: string },
          { success: boolean }
        >;
        submitQuizAttempt: FunctionReference<
          "mutation",
          "public",
          {
            courseId?: string;
            durationMs?: number;
            lessonId?: string;
            quizId: string;
            responses: Array<{
              answerText?: string;
              questionId: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
              selectedOptionIds?: Array<string>;
            }>;
          },
          {
            attempt: {
              _id: string;
              completedAt: number;
              correctCount: number;
              durationMs?: number;
              gradedQuestions: number;
              scorePercent: number;
              totalQuestions: number;
            };
          }
        >;
        setLessonCompletionStatus: FunctionReference<
          "mutation",
          "public",
          { completed: boolean; courseId?: string; lessonId: string },
          { completedLessonIds: Array<string> }
        >;
        setTopicCompletionStatus: FunctionReference<
          "mutation",
          "public",
          {
            completed: boolean;
            courseId?: string;
            lessonId?: string;
            topicId: string;
          },
          { completedTopicIds: Array<string> }
        >;
      };
      actions: {
        generateQuizFromTranscript: FunctionReference<
          "action",
          "public",
          {
            lessonId: Id<"posts">;
            organizationId: Id<"organizations">;
            questionCount?: number;
          },
          {
            builderUrl: string;
            questionCount: number;
            quizId: Id<"posts">;
            quizTitle: string;
          }
        >;
        generateCertificatePdf: FunctionReference<
          "action",
          "public",
          {
            certificateId: string;
            context?: Record<string, string>;
            organizationId?: string;
            templateOverride?: any;
          },
          ArrayBuffer
        >;
        createVideoThumbnailAttachment: FunctionReference<
          "action",
          "public",
          { organizationId?: Id<"organizations">; sourceUrl: string },
          {
            height?: number;
            mediaItemId: Id<"mediaItems">;
            mimeType?: string;
            title?: string;
            url: string;
            width?: number;
          }
        >;
      };
      posts: {
        queries: {
          getAllPosts: FunctionReference<
            "query",
            "public",
            {
              filters?: {
                authorId?: string;
                category?: string;
                limit?: number;
                postTypeSlug?: string;
                status?: "published" | "draft" | "archived";
              };
              organizationId?: string;
            },
            any
          >;
          getPostById: FunctionReference<
            "query",
            "public",
            { id: string; organizationId?: string },
            any
          >;
          getPostBySlug: FunctionReference<
            "query",
            "public",
            { organizationId?: string; slug: string },
            any
          >;
          getPostMeta: FunctionReference<
            "query",
            "public",
            { organizationId?: string; postId: string },
            any
          >;
          searchPosts: FunctionReference<
            "query",
            "public",
            {
              limit?: number;
              organizationId?: string;
              postTypeSlug?: string;
              searchTerm: string;
            },
            any
          >;
          getPostTags: FunctionReference<
            "query",
            "public",
            { organizationId?: string; postTypeSlug?: string },
            any
          >;
          getPostCategories: FunctionReference<
            "query",
            "public",
            { organizationId?: string; postTypeSlug?: string },
            any
          >;
        };
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
              organizationId?: string;
              postTypeSlug: string;
              slug: string;
              status: "published" | "draft" | "archived";
              tags?: Array<string>;
              title: string;
            },
            string
          >;
          updatePost: FunctionReference<
            "mutation",
            "public",
            {
              category?: string;
              content?: string;
              excerpt?: string;
              featuredImage?: string;
              id: string;
              meta?: Record<string, string | number | boolean | null>;
              slug?: string;
              status?: "published" | "draft" | "archived";
              tags?: Array<string>;
              title?: string;
            },
            string
          >;
          deletePost: FunctionReference<
            "mutation",
            "public",
            { id: string },
            null
          >;
          updatePostStatus: FunctionReference<
            "mutation",
            "public",
            { id: string; status: "published" | "draft" | "archived" },
            string
          >;
          bulkUpdatePostStatus: FunctionReference<
            "mutation",
            "public",
            { ids: Array<string>; status: "published" | "draft" | "archived" },
            Array<string>
          >;
        };
      };
    };
    support: {
      queries: {
        listSupportPosts: FunctionReference<
          "query",
          "public",
          {
            filters?: {
              limit?: number;
              parentId?: Id<"posts">;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId: string;
          },
          any
        >;
        getSupportPostById: FunctionReference<
          "query",
          "public",
          { id: Id<"posts">; organizationId?: string },
          any
        >;
        getSupportPostMeta: FunctionReference<
          "query",
          "public",
          { organizationId?: string; postId: Id<"posts"> },
          any
        >;
        listConversations: FunctionReference<
          "query",
          "public",
          { limit?: number; organizationId: string },
          Array<{
            agentThreadId?: string;
            assignedAgentId?: string;
            assignedAgentName?: string;
            contactEmail?: string;
            contactId?: string;
            contactName?: string;
            firstAt?: number;
            lastAt?: number;
            lastMessage?: string;
            lastRole?: "user" | "assistant";
            mode?: "agent" | "manual";
            origin?: "chat" | "email";
            postId: string;
            sessionId: string;
            status?: "open" | "snoozed" | "closed";
            totalMessages?: number;
          }>
        >;
        listMessages: FunctionReference<
          "query",
          "public",
          { organizationId: string; sessionId: string },
          Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            agentUserId?: string;
            attachments?: Array<string>;
            contactEmail?: string;
            contactId?: string;
            contactName?: string;
            content: string;
            createdAt: number;
            emailMessageId?: string;
            htmlBody?: string;
            inReplyToId?: string;
            messageType?: "chat" | "email_inbound" | "email_outbound";
            organizationId: string;
            role: "user" | "assistant";
            sessionId: string;
            source?: "agent" | "admin" | "system";
            subject?: string;
            textBody?: string;
          }>
        >;
        getAgentPresence: FunctionReference<
          "query",
          "public",
          { organizationId: string; sessionId: string },
          {
            _creationTime: number;
            _id: string;
            agentName?: string;
            agentUserId?: string;
            organizationId: string;
            sessionId: string;
            status?: "typing" | "idle";
            updatedAt?: number;
          } | null
        >;
        getConversationMode: FunctionReference<
          "query",
          "public",
          { organizationId: string; sessionId: string },
          "agent" | "manual"
        >;
        listHelpdeskArticles: FunctionReference<
          "query",
          "public",
          { limit?: number; organizationId: string },
          any
        >;
        getHelpdeskArticleById: FunctionReference<
          "query",
          "public",
          { id: string; organizationId: string },
          any
        >;
        listRagSources: FunctionReference<
          "query",
          "public",
          { organizationId: string },
          any
        >;
        getEmailSettings: FunctionReference<
          "query",
          "public",
          { organizationId: string },
          any
        >;
        getSupportOption: FunctionReference<
          "query",
          "public",
          { key: string; organizationId: string },
          string | number | boolean | null
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
      mutations: {
        createSupportPost: FunctionReference<
          "mutation",
          "public",
          {
            authorId?: string;
            content?: string;
            excerpt?: string;
            meta?: Array<{
              key: string;
              value?: string | number | boolean | null;
            }>;
            organizationId: string;
            parentId?: Id<"posts">;
            parentTypeSlug?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          any
        >;
        updateSupportPost: FunctionReference<
          "mutation",
          "public",
          {
            authorId?: string;
            content?: string;
            excerpt?: string;
            id: Id<"posts">;
            meta?: Array<{
              key: string;
              value?: string | number | boolean | null;
            }>;
            organizationId: string;
            parentId?: Id<"posts">;
            parentTypeSlug?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          any
        >;
        upsertSupportPostMeta: FunctionReference<
          "mutation",
          "public",
          {
            entries: Array<{
              key: string;
              value?: string | number | boolean | null;
            }>;
            organizationId: string;
            postId: Id<"posts">;
          },
          any
        >;
        recordMessage: FunctionReference<
          "mutation",
          "public",
          {
            contactEmail?: string;
            contactId?: string;
            contactName?: string;
            content: string;
            htmlBody?: string;
            messageType?: "chat" | "email_inbound" | "email_outbound";
            organizationId: string;
            role: "user" | "assistant";
            sessionId: string;
            source?: "agent" | "admin" | "system";
            subject?: string;
            textBody?: string;
          },
          null
        >;
        setAgentPresence: FunctionReference<
          "mutation",
          "public",
          {
            agentName?: string;
            agentUserId: string;
            organizationId: string;
            sessionId: string;
            status: "typing" | "idle";
          },
          null
        >;
        setConversationMode: FunctionReference<
          "mutation",
          "public",
          {
            mode: "agent" | "manual";
            organizationId: string;
            sessionId: string;
          },
          null
        >;
        saveEmailSettings: FunctionReference<
          "mutation",
          "public",
          {
            allowEmailIntake?: boolean;
            customDomain?: string | null;
            defaultAlias?: string;
            organizationId: string;
          },
          any
        >;
        beginDomainVerification: FunctionReference<
          "mutation",
          "public",
          { customDomain: string; organizationId: string },
          any
        >;
        saveRagSourceConfig: FunctionReference<
          "mutation",
          "public",
          {
            additionalMetaKeys?: string;
            displayName?: string;
            fields?: Array<string>;
            includeTags?: boolean;
            isEnabled?: boolean;
            metaFieldKeys?: Array<string>;
            organizationId: string;
            postTypeSlug: string;
            sourceId?: Id<"posts">;
          },
          any
        >;
        deleteRagSourceConfig: FunctionReference<
          "mutation",
          "public",
          { organizationId: string; sourceId: Id<"posts"> },
          any
        >;
      };
      options: {
        getSupportOption: FunctionReference<
          "query",
          "public",
          { key: string; organizationId: string },
          string | number | boolean | null
        >;
        saveSupportOption: FunctionReference<
          "mutation",
          "public",
          {
            key: string;
            organizationId: string;
            value?: string | number | boolean | null;
          },
          null
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
          any
        >;
        updatePost: FunctionReference<
          "mutation",
          "public",
          {
            content?: string;
            mediaUrls?: Array<string>;
            postId: string;
            userId: Id<"users">;
            visibility?: "public" | "private" | "group";
          },
          any
        >;
        deletePost: FunctionReference<
          "mutation",
          "public",
          { postId: string; userId: Id<"users"> },
          any
        >;
        shareContent: FunctionReference<
          "mutation",
          "public",
          {
            content?: string;
            creatorId: Id<"users">;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId: string;
            visibility: "public" | "private" | "group";
          },
          any
        >;
        addReaction: FunctionReference<
          "mutation",
          "public",
          {
            feedItemId: string;
            reactionType:
              | "like"
              | "love"
              | "celebrate"
              | "support"
              | "insightful"
              | "curious";
            userId: Id<"users">;
          },
          any
        >;
        addComment: FunctionReference<
          "mutation",
          "public",
          {
            content: string;
            feedItemId?: string;
            mediaUrls?: Array<string>;
            parentCommentId?: string;
            parentId?: string;
            parentType?:
              | "feedItem"
              | "course"
              | "lesson"
              | "topic"
              | "quiz"
              | "post"
              | "download"
              | "helpdeskArticle";
          },
          any
        >;
        updateComment: FunctionReference<
          "mutation",
          "public",
          { commentId: string; content: string },
          any
        >;
        deleteComment: FunctionReference<
          "mutation",
          "public",
          { commentId: string },
          any
        >;
        followTopic: FunctionReference<
          "mutation",
          "public",
          { topicId: string; userId: Id<"users"> },
          any
        >;
        unfollowTopic: FunctionReference<
          "mutation",
          "public",
          { topicId: string; userId: Id<"users"> },
          any
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
          any
        >;
        markRecommendationAsSeen: FunctionReference<
          "mutation",
          "public",
          { contentId: string; userId: Id<"users"> },
          any
        >;
        markRecommendationAsInteracted: FunctionReference<
          "mutation",
          "public",
          {
            contentId: string;
            reaction?: "like" | "dislike" | "neutral";
            userId: Id<"users">;
          },
          any
        >;
        generateUserRecommendations: FunctionReference<
          "mutation",
          "public",
          { limit?: number; userId: Id<"users"> },
          any
        >;
        updatePostTrendingMetrics: FunctionReference<
          "mutation",
          "public",
          { contentId: string },
          any
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
          any
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
          any
        >;
        getGroupFeed: FunctionReference<
          "query",
          "public",
          {
            groupId: string;
            paginationOpts: {
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
          any
        >;
        getFeedItem: FunctionReference<
          "query",
          "public",
          { feedItemId: string },
          any
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
          any
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
            parentId: string;
            parentType: "feedItem" | "post" | "download" | "helpdeskArticle";
            sortOrder?: "newest" | "oldest";
          },
          any
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
            parentCommentId: string;
          },
          any
        >;
        getCommentThreadForParent: FunctionReference<
          "query",
          "public",
          {
            parentId: string;
            parentType:
              | "feedItem"
              | "course"
              | "lesson"
              | "topic"
              | "quiz"
              | "post"
              | "download"
              | "helpdeskArticle";
          },
          any
        >;
        searchUsersForMentions: FunctionReference<
          "query",
          "public",
          { limit?: number; query: string },
          any
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
          any
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
          any
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
          any
        >;
        getTopicSuggestions: FunctionReference<
          "query",
          "public",
          { limit?: number; userId: Id<"users"> },
          any
        >;
        getTopic: FunctionReference<
          "query",
          "public",
          { topicId: string },
          any
        >;
        checkTopicFollow: FunctionReference<
          "query",
          "public",
          { topicId: string; userId: Id<"users"> },
          any
        >;
        getRecommendedHashtags: FunctionReference<
          "query",
          "public",
          { limit: number; userId: Id<"users"> },
          any
        >;
      };
    };
    commerce: {
      queries: {
        getAllPosts: FunctionReference<
          "query",
          "public",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId?: string;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "public",
          { id: string; organizationId?: string },
          any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "public",
          { organizationId?: string; slug: string },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "public",
          { organizationId?: string; postId: string },
          any
        >;
        searchPosts: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            organizationId?: string;
            postTypeSlug?: string;
            searchTerm: string;
          },
          any
        >;
        getPostTags: FunctionReference<
          "query",
          "public",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
        getPostCategories: FunctionReference<
          "query",
          "public",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
      };
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
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          string
        >;
        updatePost: FunctionReference<
          "mutation",
          "public",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            id: string;
            meta?: Record<string, string | number | boolean | null>;
            slug?: string;
            status?: "published" | "draft" | "archived";
            tags?: Array<string>;
            title?: string;
          },
          string
        >;
        deletePost: FunctionReference<
          "mutation",
          "public",
          { id: string },
          null
        >;
        updatePostStatus: FunctionReference<
          "mutation",
          "public",
          { id: string; status: "published" | "draft" | "archived" },
          string
        >;
        bulkUpdatePostStatus: FunctionReference<
          "mutation",
          "public",
          { ids: Array<string>; status: "published" | "draft" | "archived" },
          Array<string>
        >;
      };
    };
    entity: {
      queries: {
        readEntity: FunctionReference<
          "query",
          "public",
          { id: string; organizationId?: string; postTypeSlug: string },
          any
        >;
        listEntities: FunctionReference<
          "query",
          "public",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              slug?: string;
              status?: string;
            };
            organizationId?: string;
            postTypeSlug: string;
          },
          any
        >;
      };
      mutations: {
        saveEntity: FunctionReference<
          "mutation",
          "public",
          { data: any; postTypeSlug: string },
          any
        >;
        updateEntity: FunctionReference<
          "mutation",
          "public",
          { data: any; id: string; postTypeSlug: string },
          any
        >;
        deleteEntity: FunctionReference<
          "mutation",
          "public",
          { id: string; postTypeSlug: string },
          any
        >;
      };
    };
    disclaimers: {
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
              organizationId?: string;
              postTypeSlug: string;
              slug: string;
              status: "published" | "draft" | "archived";
              tags?: Array<string>;
              title: string;
            },
            string
          >;
          updatePost: FunctionReference<
            "mutation",
            "public",
            {
              category?: string;
              content?: string;
              excerpt?: string;
              featuredImage?: string;
              id: string;
              meta?: Record<string, string | number | boolean | null>;
              slug?: string;
              status?: "published" | "draft" | "archived";
              tags?: Array<string>;
              title?: string;
            },
            string
          >;
          deletePost: FunctionReference<
            "mutation",
            "public",
            { id: string },
            null
          >;
        };
        queries: {
          getAllPosts: FunctionReference<
            "query",
            "public",
            {
              filters?: {
                authorId?: string;
                category?: string;
                limit?: number;
                postTypeSlug?: string;
                status?: "published" | "draft" | "archived";
              };
              organizationId?: string;
            },
            any
          >;
          getPostById: FunctionReference<
            "query",
            "public",
            { id: string; organizationId?: string },
            any
          >;
          getPostBySlug: FunctionReference<
            "query",
            "public",
            { organizationId?: string; slug: string },
            any
          >;
          getPostMeta: FunctionReference<
            "query",
            "public",
            { organizationId?: string; postId: string },
            any
          >;
        };
      };
      mutations: {
        upsertDisclaimerTemplateMeta: FunctionReference<
          "mutation",
          "public",
          {
            builderTemplateJson?: string;
            consentText?: string;
            description?: string;
            organizationId?: string;
            pdfFileId?: Id<"_storage">;
            postId: string;
          },
          string
        >;
        createManualIssue: FunctionReference<
          "mutation",
          "public",
          {
            organizationId?: string;
            recipientEmail: string;
            recipientName?: string;
            recipientUserId?: string;
            templatePostId: string;
          },
          { issueId: string; token: string }
        >;
        createManualIssueFromPost: FunctionReference<
          "mutation",
          "public",
          {
            issuePostId: string;
            organizationId?: string;
            recipientEmail: string;
            recipientName?: string;
            recipientUserId?: string;
            templatePostId: string;
          },
          { issueId: string; token: string }
        >;
        resendIssue: FunctionReference<
          "mutation",
          "public",
          { issueId: string; organizationId?: string },
          {
            issueId: string;
            recipientEmail: string;
            recipientUserId?: string;
            templatePostId: string;
            token: string;
          }
        >;
      };
      queries: {
        listDisclaimerTemplates: FunctionReference<
          "query",
          "public",
          { organizationId?: string },
          any
        >;
        listIssues: FunctionReference<
          "query",
          "public",
          {
            limit?: number;
            organizationId?: string;
            status?: "incomplete" | "complete";
          },
          any
        >;
        getSigningContext: FunctionReference<
          "query",
          "public",
          { issueId: string; tokenHash: string },
          any
        >;
        getSigningContextDebug: FunctionReference<
          "query",
          "public",
          { issueId: string; tokenHash: string },
          any
        >;
        getLatestSignatureForIssue: FunctionReference<
          "query",
          "public",
          { issueId: string; organizationId?: string },
          any
        >;
        getSigningReceipt: FunctionReference<
          "query",
          "public",
          { issueId: string; tokenHash: string },
          any
        >;
        getTemplateBuilderContext: FunctionReference<
          "query",
          "public",
          { organizationId?: string; templatePostId: string },
          any
        >;
      };
      actions: {
        importTemplatePdfAndAttach: FunctionReference<
          "action",
          "public",
          {
            consentText?: string;
            description?: string;
            orgId?: string;
            sourceUrl: string;
            templatePostId: string;
          },
          any
        >;
        issueDisclaimerAndSendEmail: FunctionReference<
          "action",
          "public",
          {
            clientOrigin?: string;
            issuePostId?: string;
            orgId?: string;
            recipientEmail: string;
            recipientName?: string;
            recipientUserId?: string;
            templatePostId: string;
          },
          any
        >;
        resendDisclaimerAndSendEmail: FunctionReference<
          "action",
          "public",
          { clientOrigin?: string; issueId: string; orgId?: string },
          any
        >;
        submitSignature: FunctionReference<
          "action",
          "public",
          {
            consentText: string;
            fieldSignatures?: Array<{
              fieldId: string;
              signatureDataUrl: string;
            }>;
            issueId: string;
            signatureDataUrl?: string;
            signedEmail: string;
            signedName: string;
            tokenHash: string;
            userAgent?: string;
          },
          any
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
            excludedTags: { mode: "all" | "some"; tagIds: Array<string> };
            isActive?: boolean;
            isPublic?: boolean;
            priority?: number;
            requiredTags: { mode: "all" | "some"; tagIds: Array<string> };
          },
          any
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
          any
        >;
      };
    };
  };
};
export type InternalApiType = {};
