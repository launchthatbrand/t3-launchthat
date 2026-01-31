 "use client";
 
 import * as React from "react";
 import { useParams, useRouter } from "next/navigation";
 import { useMutation, useQuery } from "convex/react";
 import { api } from "@convex-config/_generated/api";
 
 import { Button } from "@acme/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
 import { Input } from "@acme/ui/input";
 import { Label } from "@acme/ui/label";
 import { Textarea } from "@acme/ui/textarea";
 import { toast } from "@acme/ui/toast";
 
 type OrderStatus = "unpaid" | "paid" | "failed";
 
 const parseNumberOrNull = (value: string): number | null => {
   const trimmed = value.trim();
   if (!trimmed) return null;
   const parsed = Number(trimmed);
   return Number.isFinite(parsed) ? parsed : null;
 };
 
 const normalizeStringOrNull = (value: string): string | null => {
   const trimmed = value.trim();
   return trimmed ? trimmed : null;
 };
 
 const metaArrayToRecord = (
   rows: Array<{ key: string; value: unknown }> | undefined,
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
 
 const getMetaNumber = (meta: Record<string, unknown>, key: string): string => {
   const value = meta[key];
   return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
 };
 
 export default function PlatformBillingOrderDetailPage() {
   const params = useParams();
   const router = useRouter();
   const orderId = typeof params.orderId === "string" ? params.orderId : "";
 
   const order = useQuery(api.platform.ecommerce.getOrderById, {
     id: orderId,
   }) as { _id: string; title?: string; status?: OrderStatus } | null | undefined;
   const metaRows = useQuery(api.platform.ecommerce.getOrderMeta, {
     postId: orderId,
   }) as Array<{ key: string; value: unknown }> | undefined;
 
   const updateOrder = useMutation(api.platform.ecommerce.updateOrder) as (args: any) => Promise<unknown>;
 
   const [isInitialized, setIsInitialized] = React.useState(false);
   const [title, setTitle] = React.useState("");
   const [status, setStatus] = React.useState<OrderStatus>("unpaid");
   const [customerEmail, setCustomerEmail] = React.useState("");
   const [assignedUserId, setAssignedUserId] = React.useState("");
   const [paymentMethodId, setPaymentMethodId] = React.useState("");
   const [paymentStatus, setPaymentStatus] = React.useState("");
   const [gateway, setGateway] = React.useState("");
   const [gatewayTransactionId, setGatewayTransactionId] = React.useState("");
   const [paymentResponseJson, setPaymentResponseJson] = React.useState("");
   const [notes, setNotes] = React.useState("");
   const [itemsJson, setItemsJson] = React.useState("");
   const [itemsSubtotal, setItemsSubtotal] = React.useState("");
   const [orderTotal, setOrderTotal] = React.useState("");
   const [currency, setCurrency] = React.useState("");
   const [couponCode, setCouponCode] = React.useState("");
   const [billingName, setBillingName] = React.useState("");
   const [billingEmail, setBillingEmail] = React.useState("");
   const [billingPhone, setBillingPhone] = React.useState("");
   const [billingAddress1, setBillingAddress1] = React.useState("");
   const [billingAddress2, setBillingAddress2] = React.useState("");
   const [billingCity, setBillingCity] = React.useState("");
   const [billingState, setBillingState] = React.useState("");
   const [billingPostcode, setBillingPostcode] = React.useState("");
   const [billingCountry, setBillingCountry] = React.useState("");
   const [shippingName, setShippingName] = React.useState("");
   const [shippingPhone, setShippingPhone] = React.useState("");
   const [shippingAddress1, setShippingAddress1] = React.useState("");
   const [shippingAddress2, setShippingAddress2] = React.useState("");
   const [shippingCity, setShippingCity] = React.useState("");
   const [shippingState, setShippingState] = React.useState("");
   const [shippingPostcode, setShippingPostcode] = React.useState("");
   const [shippingCountry, setShippingCountry] = React.useState("");
   const [saving, setSaving] = React.useState(false);
 
   React.useEffect(() => {
     if (isInitialized) return;
     if (!order || !metaRows) return;
     const meta = metaArrayToRecord(metaRows);
     setTitle(order.title ?? "");
     setStatus(order.status ?? "unpaid");
     setCustomerEmail(getMetaString(meta, "order.customerEmail"));
     setAssignedUserId(getMetaString(meta, "order.userId"));
     setPaymentMethodId(getMetaString(meta, "order.paymentMethodId"));
     setPaymentStatus(getMetaString(meta, "order.paymentStatus"));
     setGateway(getMetaString(meta, "order.gateway"));
     setGatewayTransactionId(getMetaString(meta, "order.gatewayTransactionId"));
     setPaymentResponseJson(getMetaString(meta, "order.paymentResponseJson"));
     setNotes(getMetaString(meta, "order.notes"));
     setItemsJson(getMetaString(meta, "order.itemsJson"));
     setItemsSubtotal(getMetaNumber(meta, "order.itemsSubtotal"));
     setOrderTotal(getMetaNumber(meta, "order.orderTotal"));
     setCurrency(getMetaString(meta, "order.currency"));
     setCouponCode(getMetaString(meta, "order.couponCode"));
     setBillingName(getMetaString(meta, "billing.name"));
     setBillingEmail(getMetaString(meta, "billing.email"));
     setBillingPhone(getMetaString(meta, "billing.phone"));
     setBillingAddress1(getMetaString(meta, "billing.address1"));
     setBillingAddress2(getMetaString(meta, "billing.address2"));
     setBillingCity(getMetaString(meta, "billing.city"));
     setBillingState(getMetaString(meta, "billing.state"));
     setBillingPostcode(getMetaString(meta, "billing.postcode"));
     setBillingCountry(getMetaString(meta, "billing.country"));
     setShippingName(getMetaString(meta, "shipping.name"));
     setShippingPhone(getMetaString(meta, "shipping.phone"));
     setShippingAddress1(getMetaString(meta, "shipping.address1"));
     setShippingAddress2(getMetaString(meta, "shipping.address2"));
     setShippingCity(getMetaString(meta, "shipping.city"));
     setShippingState(getMetaString(meta, "shipping.state"));
     setShippingPostcode(getMetaString(meta, "shipping.postcode"));
     setShippingCountry(getMetaString(meta, "shipping.country"));
     setIsInitialized(true);
   }, [isInitialized, order, metaRows]);
 
   const handleSave = async () => {
     if (!orderId) return;
     if (!title.trim()) {
       toast.error("Enter an order title.");
       return;
     }
     const meta: Record<string, string | number | boolean | null> = {
       "order.status": status,
       "order.customerEmail": normalizeStringOrNull(customerEmail),
       "order.userId": normalizeStringOrNull(assignedUserId),
       "order.paymentMethodId": normalizeStringOrNull(paymentMethodId),
       "order.paymentStatus": normalizeStringOrNull(paymentStatus),
       "order.gateway": normalizeStringOrNull(gateway),
       "order.gatewayTransactionId": normalizeStringOrNull(gatewayTransactionId),
       "order.paymentResponseJson": normalizeStringOrNull(paymentResponseJson),
       "order.notes": normalizeStringOrNull(notes),
       "order.itemsJson": normalizeStringOrNull(itemsJson),
       "order.itemsSubtotal": parseNumberOrNull(itemsSubtotal),
       "order.orderTotal": parseNumberOrNull(orderTotal),
       "order.currency": normalizeStringOrNull(currency),
       "order.couponCode": normalizeStringOrNull(couponCode),
       "billing.name": normalizeStringOrNull(billingName),
       "billing.email": normalizeStringOrNull(billingEmail),
       "billing.phone": normalizeStringOrNull(billingPhone),
       "billing.address1": normalizeStringOrNull(billingAddress1),
       "billing.address2": normalizeStringOrNull(billingAddress2),
       "billing.city": normalizeStringOrNull(billingCity),
       "billing.state": normalizeStringOrNull(billingState),
       "billing.postcode": normalizeStringOrNull(billingPostcode),
       "billing.country": normalizeStringOrNull(billingCountry),
       "shipping.name": normalizeStringOrNull(shippingName),
       "shipping.phone": normalizeStringOrNull(shippingPhone),
       "shipping.address1": normalizeStringOrNull(shippingAddress1),
       "shipping.address2": normalizeStringOrNull(shippingAddress2),
       "shipping.city": normalizeStringOrNull(shippingCity),
       "shipping.state": normalizeStringOrNull(shippingState),
       "shipping.postcode": normalizeStringOrNull(shippingPostcode),
       "shipping.country": normalizeStringOrNull(shippingCountry),
     };
 
     setSaving(true);
     try {
       await updateOrder({
         id: orderId,
         title,
         status,
         meta,
       });
       toast.success("Order updated.");
     } catch (err) {
       const message =
         err instanceof Error ? err.message : "Failed to update order.";
       toast.error(message);
     } finally {
       setSaving(false);
     }
   };
 
   if (order === undefined || metaRows === undefined) {
     return <div className="text-muted-foreground text-sm">Loading…</div>;
   }
 
   if (!order) {
     return (
       <div className="space-y-4">
         <div className="text-sm text-muted-foreground">Order not found.</div>
         <Button onClick={() => router.push("/platform/billing/orders")}>
           Back to orders
         </Button>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between gap-3">
         <div>
           <h1 className="text-xl font-semibold">Edit order</h1>
           <p className="text-muted-foreground text-sm">{orderId}</p>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.push("/platform/billing/orders")}>
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
               <Label htmlFor="order-title">Title</Label>
               <Input
                 id="order-title"
                 value={title}
                 onChange={(e) => setTitle(e.currentTarget.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="order-status">Status</Label>
               <select
                 id="order-status"
                 className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                 value={status}
                 onChange={(e) => setStatus(e.currentTarget.value as OrderStatus)}
               >
                 <option value="unpaid">Unpaid</option>
                 <option value="paid">Paid</option>
                 <option value="failed">Failed</option>
               </select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="order-customer-email">Customer email</Label>
               <Input
                 id="order-customer-email"
                 type="email"
                 value={customerEmail}
                 onChange={(e) => setCustomerEmail(e.currentTarget.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="order-assigned-user">Assigned user ID</Label>
               <Input
                 id="order-assigned-user"
                 value={assignedUserId}
                 onChange={(e) => setAssignedUserId(e.currentTarget.value)}
               />
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Payment</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="order-payment-method">Payment method</Label>
                 <Input
                   id="order-payment-method"
                   value={paymentMethodId}
                   onChange={(e) => setPaymentMethodId(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-payment-status">Payment status</Label>
                 <Input
                   id="order-payment-status"
                   value={paymentStatus}
                   onChange={(e) => setPaymentStatus(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-gateway">Gateway</Label>
                 <Input
                   id="order-gateway"
                   value={gateway}
                   onChange={(e) => setGateway(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-gateway-id">Gateway transaction ID</Label>
                 <Input
                   id="order-gateway-id"
                   value={gatewayTransactionId}
                   onChange={(e) => setGatewayTransactionId(e.currentTarget.value)}
                 />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="order-payment-response">Payment response JSON</Label>
               <Textarea
                 id="order-payment-response"
                 value={paymentResponseJson}
                 onChange={(e) => setPaymentResponseJson(e.currentTarget.value)}
                 rows={3}
               />
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Order totals</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="order-items-subtotal">Items subtotal</Label>
                 <Input
                   id="order-items-subtotal"
                   type="number"
                   inputMode="decimal"
                   value={itemsSubtotal}
                   onChange={(e) => setItemsSubtotal(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-total">Order total</Label>
                 <Input
                   id="order-total"
                   type="number"
                   inputMode="decimal"
                   value={orderTotal}
                   onChange={(e) => setOrderTotal(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-currency">Currency</Label>
                 <Input
                   id="order-currency"
                   value={currency}
                   onChange={(e) => setCurrency(e.currentTarget.value)}
                   placeholder="USD"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="order-coupon">Coupon code</Label>
                 <Input
                   id="order-coupon"
                   value={couponCode}
                   onChange={(e) => setCouponCode(e.currentTarget.value)}
                 />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="order-items-json">Items JSON</Label>
               <Textarea
                 id="order-items-json"
                 value={itemsJson}
                 onChange={(e) => setItemsJson(e.currentTarget.value)}
                 rows={4}
               />
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Billing</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="billing-name">Name</Label>
                 <Input
                   id="billing-name"
                   value={billingName}
                   onChange={(e) => setBillingName(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-email">Email</Label>
                 <Input
                   id="billing-email"
                   type="email"
                   value={billingEmail}
                   onChange={(e) => setBillingEmail(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-phone">Phone</Label>
                 <Input
                   id="billing-phone"
                   value={billingPhone}
                   onChange={(e) => setBillingPhone(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-address1">Address line 1</Label>
                 <Input
                   id="billing-address1"
                   value={billingAddress1}
                   onChange={(e) => setBillingAddress1(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-address2">Address line 2</Label>
                 <Input
                   id="billing-address2"
                   value={billingAddress2}
                   onChange={(e) => setBillingAddress2(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-city">City</Label>
                 <Input
                   id="billing-city"
                   value={billingCity}
                   onChange={(e) => setBillingCity(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-state">State</Label>
                 <Input
                   id="billing-state"
                   value={billingState}
                   onChange={(e) => setBillingState(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-postcode">Postcode</Label>
                 <Input
                   id="billing-postcode"
                   value={billingPostcode}
                   onChange={(e) => setBillingPostcode(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="billing-country">Country</Label>
                 <Input
                   id="billing-country"
                   value={billingCountry}
                   onChange={(e) => setBillingCountry(e.currentTarget.value)}
                 />
               </div>
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="text-sm font-semibold">Shipping</div>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="shipping-name">Name</Label>
                 <Input
                   id="shipping-name"
                   value={shippingName}
                   onChange={(e) => setShippingName(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-phone">Phone</Label>
                 <Input
                   id="shipping-phone"
                   value={shippingPhone}
                   onChange={(e) => setShippingPhone(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-address1">Address line 1</Label>
                 <Input
                   id="shipping-address1"
                   value={shippingAddress1}
                   onChange={(e) => setShippingAddress1(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-address2">Address line 2</Label>
                 <Input
                   id="shipping-address2"
                   value={shippingAddress2}
                   onChange={(e) => setShippingAddress2(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-city">City</Label>
                 <Input
                   id="shipping-city"
                   value={shippingCity}
                   onChange={(e) => setShippingCity(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-state">State</Label>
                 <Input
                   id="shipping-state"
                   value={shippingState}
                   onChange={(e) => setShippingState(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-postcode">Postcode</Label>
                 <Input
                   id="shipping-postcode"
                   value={shippingPostcode}
                   onChange={(e) => setShippingPostcode(e.currentTarget.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="shipping-country">Country</Label>
                 <Input
                   id="shipping-country"
                   value={shippingCountry}
                   onChange={(e) => setShippingCountry(e.currentTarget.value)}
                 />
               </div>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="order-notes">Notes</Label>
             <Textarea
               id="order-notes"
               value={notes}
               onChange={(e) => setNotes(e.currentTarget.value)}
               rows={3}
             />
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }
