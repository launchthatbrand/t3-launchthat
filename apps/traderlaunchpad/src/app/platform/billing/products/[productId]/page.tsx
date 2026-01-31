 "use client";
 
 import * as React from "react";
 import { useParams, useRouter } from "next/navigation";
 import { useMutation, useQuery } from "convex/react";
 import { api } from "@convex-config/_generated/api";
 
 import { Button } from "@acme/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
 import { Input } from "@acme/ui/input";
 import { Label } from "@acme/ui/label";
 import { Switch } from "@acme/ui/switch";
 import { Textarea } from "@acme/ui/textarea";
 import { toast } from "@acme/ui/toast";
 
 type ProductStatus = "published" | "draft" | "archived";
 type ProductType = "simple" | "external" | "grouped" | "simple_subscription";
 type StockStatus = "instock" | "outofstock" | "onbackorder";
 
 const parseNumberOrNull = (value: string): number | null => {
   const trimmed = value.trim();
   if (!trimmed) return null;
   const parsed = Number(trimmed);
   return Number.isFinite(parsed) ? parsed : null;
 };
 
 const parseIntegerOrNull = (value: string): number | null => {
   const parsed = parseNumberOrNull(value);
   return parsed === null ? null : Math.trunc(parsed);
 };
 
 const parseMoneyToCents = (value: string): number | null => {
   const parsed = parseNumberOrNull(value);
   if (parsed === null) return null;
   if (parsed < 0) return null;
   return Math.round(parsed * 100);
 };
 
 const normalizeStringOrNull = (value: string): string | null => {
   const trimmed = value.trim();
   return trimmed ? trimmed : null;
 };
 
 const serializeFeatureList = (value: string): string | null => {
   const rows = value
     .split("\n")
     .map((row) => row.trim())
     .filter(Boolean);
   return rows.length > 0 ? JSON.stringify(rows) : null;
 };
 
const buildMetaRecord = (
  entries: [string, unknown][],
): Record<string, string | number | boolean | null> => {
   const meta: Record<string, string | number | boolean | null> = {};
   for (const [key, value] of entries) {
     if (typeof value === "string") {
       meta[key] = value;
     } else if (typeof value === "number") {
       meta[key] = Number.isFinite(value) ? value : null;
     } else if (typeof value === "boolean") {
       meta[key] = value;
     } else if (value === null) {
       meta[key] = null;
     } else {
       meta[key] = null;
     }
   }
   return meta;
 };
 
const metaArrayToRecord = (
  rows: { key: string; value: unknown }[] | undefined,
): Record<string, unknown> => {
   if (!Array.isArray(rows)) return {};
   const record: Record<string, unknown> = {};
   for (const row of rows) {
     record[row.key] = row.value;
   }
   return record;
 };
 
 const getMetaString = (meta: Record<string, unknown>, key: string): string => {
   const value = meta[key];
   if (typeof value === "string") return value;
   if (typeof value === "number") return String(value);
   return "";
 };
 
 const getMetaBoolean = (meta: Record<string, unknown>, key: string): boolean => {
   return meta[key] === true;
 };
 
 const getMetaNumber = (meta: Record<string, unknown>, key: string): string => {
   const value = meta[key];
   return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
 };
 
 const parseFeatureLines = (meta: Record<string, unknown>): string => {
   const raw = meta["product.features"];
   if (typeof raw !== "string") return "";
   try {
     const parsed = JSON.parse(raw) as unknown;
     if (Array.isArray(parsed)) {
       return parsed.map((v) => String(v ?? "").trim()).filter(Boolean).join("\n");
     }
   } catch {
     return "";
   }
   return "";
 };
 
 export default function PlatformBillingProductDetailPage() {
   const params = useParams();
   const router = useRouter();
   const productId = typeof params.productId === "string" ? params.productId : "";
 
  const commerceApi = (
    api as unknown as {
      platform: {
        ecommerce: {
          getProductById: unknown;
          getProductMeta: unknown;
          updateProduct: unknown;
        };
      };
    }
  ).platform.ecommerce;
  const product = useQuery(commerceApi.getProductById, {
    id: productId,
  }) as { _id: string; title?: string; status?: ProductStatus } | null | undefined;
  const metaRows = useQuery(commerceApi.getProductMeta, {
    postId: productId,
  }) as { key: string; value: unknown }[] | undefined;

  const updateProduct = useMutation(commerceApi.updateProduct) as (args: {
    id: string;
    title?: string;
    status?: ProductStatus;
    meta?: Record<string, string | number | boolean | null>;
  }) => Promise<unknown>;
 
   const [isInitialized, setIsInitialized] = React.useState(false);
   const [title, setTitle] = React.useState("");
   const [status, setStatus] = React.useState<ProductStatus>("draft");
   const [productType, setProductType] = React.useState<ProductType>("simple");
   const [isVirtual, setIsVirtual] = React.useState(false);
   const [requiresAccount, setRequiresAccount] = React.useState(false);
   const [regularPrice, setRegularPrice] = React.useState("");
   const [salePrice, setSalePrice] = React.useState("");
   const [saleStartAt, setSaleStartAt] = React.useState("");
   const [saleEndAt, setSaleEndAt] = React.useState("");
   const [subscriptionAmountMonthly, setSubscriptionAmountMonthly] = React.useState("");
   const [subscriptionSetupFee, setSubscriptionSetupFee] = React.useState("");
   const [subscriptionTrialDays, setSubscriptionTrialDays] = React.useState("");
   const [sku, setSku] = React.useState("");
   const [stockStatus, setStockStatus] = React.useState<StockStatus>("instock");
   const [manageStock, setManageStock] = React.useState(false);
   const [stockQuantity, setStockQuantity] = React.useState("");
   const [weight, setWeight] = React.useState("");
   const [length, setLength] = React.useState("");
   const [width, setWidth] = React.useState("");
   const [height, setHeight] = React.useState("");
   const [upsells, setUpsells] = React.useState("");
   const [crossSells, setCrossSells] = React.useState("");
   const [attributesJson, setAttributesJson] = React.useState("");
   const [featuresText, setFeaturesText] = React.useState("");
   const [purchaseNote, setPurchaseNote] = React.useState("");
   const [enableReviews, setEnableReviews] = React.useState(false);
   const [menuOrder, setMenuOrder] = React.useState("");
   const [saving, setSaving] = React.useState(false);
 
   React.useEffect(() => {
     if (isInitialized) return;
     if (!product || !metaRows) return;
     const meta = metaArrayToRecord(metaRows);
     setTitle(product.title ?? "");
     setStatus(product.status ?? "draft");
    const type = getMetaString(meta, "product.type");
    setProductType(
      ["simple", "external", "grouped", "simple_subscription"].includes(type)
        ? (type as ProductType)
        : "simple",
    );
     setIsVirtual(getMetaBoolean(meta, "product.isVirtual"));
     setRequiresAccount(getMetaBoolean(meta, "product.requireAccount"));
     setRegularPrice(getMetaNumber(meta, "product.regularPrice"));
     setSalePrice(getMetaNumber(meta, "product.salePrice"));
     setSaleStartAt(getMetaString(meta, "product.saleStartAt"));
     setSaleEndAt(getMetaString(meta, "product.saleEndAt"));
     const subscriptionAmountCents = getMetaNumber(
       meta,
       "product.subscription.amountMonthly",
     );
     setSubscriptionAmountMonthly(
       subscriptionAmountCents
         ? (Number(subscriptionAmountCents) / 100).toFixed(2)
         : "",
     );
     const subscriptionSetupCents = getMetaNumber(
       meta,
       "product.subscription.setupFee",
     );
     setSubscriptionSetupFee(
       subscriptionSetupCents
         ? (Number(subscriptionSetupCents) / 100).toFixed(2)
         : "",
     );
     setSubscriptionTrialDays(getMetaNumber(meta, "product.subscription.trialDays"));
     setSku(getMetaString(meta, "product.sku"));
     const storedStock = getMetaString(meta, "product.stockStatus") as StockStatus;
     setStockStatus(
       ["instock", "outofstock", "onbackorder"].includes(storedStock)
         ? storedStock
         : "instock",
     );
     setManageStock(getMetaBoolean(meta, "product.manageStock"));
     setStockQuantity(getMetaNumber(meta, "product.stockQuantity"));
     setWeight(getMetaNumber(meta, "product.weight"));
     setLength(getMetaNumber(meta, "product.length"));
     setWidth(getMetaNumber(meta, "product.width"));
     setHeight(getMetaNumber(meta, "product.height"));
     setUpsells(getMetaString(meta, "product.upsells"));
     setCrossSells(getMetaString(meta, "product.crossSells"));
     setAttributesJson(getMetaString(meta, "product.attributesJson"));
     setFeaturesText(parseFeatureLines(meta));
     setPurchaseNote(getMetaString(meta, "product.purchaseNote"));
     setEnableReviews(getMetaBoolean(meta, "product.enableReviews"));
     setMenuOrder(getMetaNumber(meta, "product.menuOrder"));
     setIsInitialized(true);
   }, [isInitialized, product, metaRows]);
 
   const handleSave = async () => {
     if (!productId) return;
     if (!title.trim()) {
       toast.error("Enter a product title.");
       return;
     }
     const meta = buildMetaRecord([
       ["product.type", productType],
       ["product.isVirtual", isVirtual],
       ["product.requireAccount", requiresAccount],
       ["product.regularPrice", parseNumberOrNull(regularPrice)],
       ["product.salePrice", parseNumberOrNull(salePrice)],
       ["product.saleStartAt", normalizeStringOrNull(saleStartAt)],
       ["product.saleEndAt", normalizeStringOrNull(saleEndAt)],
       ["product.subscription.amountMonthly", parseMoneyToCents(subscriptionAmountMonthly)],
       ["product.subscription.setupFee", parseMoneyToCents(subscriptionSetupFee)],
       ["product.subscription.trialDays", parseIntegerOrNull(subscriptionTrialDays)],
       [
         "product.subscription.interval",
         productType === "simple_subscription" ? "month" : null,
       ],
       ["product.sku", normalizeStringOrNull(sku)],
       ["product.stockStatus", stockStatus],
       ["product.manageStock", manageStock],
       ["product.stockQuantity", parseIntegerOrNull(stockQuantity)],
       ["product.weight", parseNumberOrNull(weight)],
       ["product.length", parseNumberOrNull(length)],
       ["product.width", parseNumberOrNull(width)],
       ["product.height", parseNumberOrNull(height)],
       ["product.upsells", normalizeStringOrNull(upsells)],
       ["product.crossSells", normalizeStringOrNull(crossSells)],
       ["product.attributesJson", normalizeStringOrNull(attributesJson)],
       ["product.features", serializeFeatureList(featuresText)],
       ["product.purchaseNote", normalizeStringOrNull(purchaseNote)],
       ["product.enableReviews", enableReviews],
       ["product.menuOrder", parseIntegerOrNull(menuOrder)],
     ]);
 
     setSaving(true);
     try {
       await updateProduct({
         id: productId,
         title,
         status,
         meta,
       });
       toast.success("Product updated.");
     } catch (err) {
       const message =
         err instanceof Error ? err.message : "Failed to update product.";
       toast.error(message);
     } finally {
       setSaving(false);
     }
   };
 
   if (product === undefined || metaRows === undefined) {
     return <div className="text-muted-foreground text-sm">Loading…</div>;
   }
 
   if (!product) {
     return (
       <div className="space-y-4">
         <div className="text-sm text-muted-foreground">Product not found.</div>
         <Button onClick={() => router.push("/platform/billing/products")}>
           Back to products
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-xl font-semibold">Edit product</h1>
           <p className="text-muted-foreground text-sm">{productId}</p>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.push("/platform/billing/products")}>
             Back
           </Button>
           <Button onClick={handleSave} disabled={saving}>
             Save changes
           </Button>
         </div>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Details</CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="product-title">Title</Label>
               <Input
                 id="product-title"
                 value={title}
                 onChange={(e) => setTitle(e.currentTarget.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="product-status">Status</Label>
               <select
                 id="product-status"
                 className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                 value={status}
                 onChange={(e) => setStatus(e.currentTarget.value as ProductStatus)}
               >
                 <option value="published">Published</option>
                 <option value="draft">Draft</option>
                 <option value="archived">Archived</option>
               </select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="product-type">Product type</Label>
               <select
                 id="product-type"
                 className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                 value={productType}
                 onChange={(e) => setProductType(e.currentTarget.value as ProductType)}
               >
                 <option value="simple">Simple product</option>
                 <option value="simple_subscription">Simple subscription</option>
                 <option value="external">External / affiliate</option>
                 <option value="grouped">Grouped product</option>
               </select>
             </div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                 <Label htmlFor="product-virtual" className="text-sm">
                   Virtual product
                 </Label>
                 <Switch
                   id="product-virtual"
                   checked={isVirtual}
                   onCheckedChange={setIsVirtual}
                 />
               </div>
               <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                 <Label htmlFor="product-requires-account" className="text-sm">
                   Require account
                 </Label>
                 <Switch
                   id="product-requires-account"
                   checked={requiresAccount}
                   onCheckedChange={setRequiresAccount}
                 />
               </div>
             </div>
           </div>
 
           {productType === "simple_subscription" ? (
             <div className="space-y-4">
               <div className="text-sm font-semibold">Subscription pricing</div>
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label htmlFor="product-subscription-amount">
                     Amount per month ($)
                   </Label>
                   <Input
                     id="product-subscription-amount"
                     type="number"
                     inputMode="decimal"
                     step="0.01"
                     value={subscriptionAmountMonthly}
                     onChange={(e) =>
                       setSubscriptionAmountMonthly(e.currentTarget.value)
                     }
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="product-subscription-setup">
                     Setup fee ($)
                   </Label>
                   <Input
                     id="product-subscription-setup"
                     type="number"
                     inputMode="decimal"
                     step="0.01"
                     value={subscriptionSetupFee}
                     onChange={(e) => setSubscriptionSetupFee(e.currentTarget.value)}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-subscription-trial">Trial days</Label>
                 <Input
                   id="product-subscription-trial"
                   type="number"
                   inputMode="numeric"
                   value={subscriptionTrialDays}
                   onChange={(e) => setSubscriptionTrialDays(e.currentTarget.value)}
                 />
               </div>
             </div>
           ) : (
             <div className="space-y-4">
               <div className="text-sm font-semibold">Pricing</div>
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label htmlFor="product-regular-price">Regular price ($)</Label>
                   <Input
                     id="product-regular-price"
                     type="number"
                     inputMode="decimal"
                     step="0.01"
                     value={regularPrice}
                     onChange={(e) => setRegularPrice(e.currentTarget.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="product-sale-price">Sale price ($)</Label>
                   <Input
                     id="product-sale-price"
                     type="number"
                     inputMode="decimal"
                     step="0.01"
                     value={salePrice}
                     onChange={(e) => setSalePrice(e.currentTarget.value)}
                   />
                 </div>
               </div>
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label htmlFor="product-sale-start">Sale schedule (start)</Label>
                   <Input
                     id="product-sale-start"
                     type="datetime-local"
                     value={saleStartAt}
                     onChange={(e) => setSaleStartAt(e.currentTarget.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="product-sale-end">Sale schedule (end)</Label>
                   <Input
                     id="product-sale-end"
                     type="datetime-local"
                     value={saleEndAt}
                     onChange={(e) => setSaleEndAt(e.currentTarget.value)}
                   />
                 </div>
               </div>
             </div>
           )}
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Inventory</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="product-sku">SKU</Label>
                 <Input
                   id="product-sku"
                   value={sku}
                   onChange={(e) => setSku(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-stock-status">Stock status</Label>
                 <select
                   id="product-stock-status"
                   className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                   value={stockStatus}
                   onChange={(e) => setStockStatus(e.currentTarget.value as StockStatus)}
                 >
                   <option value="instock">In stock</option>
                   <option value="outofstock">Out of stock</option>
                   <option value="onbackorder">On backorder</option>
                 </select>
               </div>
             </div>
             <div className="flex items-center justify-between gap-3 rounded-md border p-3">
               <Label htmlFor="product-manage-stock" className="text-sm">
                 Manage stock
               </Label>
               <Switch
                 id="product-manage-stock"
                 checked={manageStock}
                 onCheckedChange={setManageStock}
               />
             </div>
             {manageStock ? (
               <div className="space-y-2">
                 <Label htmlFor="product-stock-quantity">Stock quantity</Label>
                 <Input
                   id="product-stock-quantity"
                   type="number"
                   inputMode="numeric"
                   value={stockQuantity}
                   onChange={(e) => setStockQuantity(e.currentTarget.value)}
                 />
               </div>
             ) : null}
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Shipping</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="product-weight">Weight</Label>
                 <Input
                   id="product-weight"
                   type="number"
                   inputMode="decimal"
                   value={weight}
                   onChange={(e) => setWeight(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-length">Length</Label>
                 <Input
                   id="product-length"
                   type="number"
                   inputMode="decimal"
                   value={length}
                   onChange={(e) => setLength(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-width">Width</Label>
                 <Input
                   id="product-width"
                   type="number"
                   inputMode="decimal"
                   value={width}
                   onChange={(e) => setWidth(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-height">Height</Label>
                 <Input
                   id="product-height"
                   type="number"
                   inputMode="decimal"
                   value={height}
                   onChange={(e) => setHeight(e.currentTarget.value)}
                 />
               </div>
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Upsells & cross-sells</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="product-upsells">Upsells</Label>
                 <Input
                   id="product-upsells"
                   value={upsells}
                   onChange={(e) => setUpsells(e.currentTarget.value)}
                   placeholder="Comma-separated product IDs"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="product-cross-sells">Cross-sells</Label>
                 <Input
                   id="product-cross-sells"
                   value={crossSells}
                   onChange={(e) => setCrossSells(e.currentTarget.value)}
                   placeholder="Comma-separated product IDs"
                 />
               </div>
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Attributes & features</div>
             <div className="space-y-2">
               <Label htmlFor="product-attributes-json">Attributes JSON</Label>
               <Textarea
                 id="product-attributes-json"
                 value={attributesJson}
                 onChange={(e) => setAttributesJson(e.currentTarget.value)}
                 rows={3}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="product-features">Features (one per line)</Label>
               <Textarea
                 id="product-features"
                 value={featuresText}
                 onChange={(e) => setFeaturesText(e.currentTarget.value)}
                 rows={4}
               />
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Notes & reviews</div>
             <div className="space-y-2">
               <Label htmlFor="product-purchase-note">Purchase note</Label>
               <Textarea
                 id="product-purchase-note"
                 value={purchaseNote}
                 onChange={(e) => setPurchaseNote(e.currentTarget.value)}
                 rows={3}
               />
             </div>
             <div className="flex items-center justify-between gap-3 rounded-md border p-3">
               <Label htmlFor="product-enable-reviews" className="text-sm">
                 Enable reviews
               </Label>
               <Switch
                 id="product-enable-reviews"
                 checked={enableReviews}
                 onCheckedChange={setEnableReviews}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="product-menu-order">Menu order</Label>
               <Input
                 id="product-menu-order"
                 type="number"
                 inputMode="numeric"
                 value={menuOrder}
                 onChange={(e) => setMenuOrder(e.currentTarget.value)}
               />
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }
