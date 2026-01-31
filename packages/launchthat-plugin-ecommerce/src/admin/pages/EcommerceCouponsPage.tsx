 "use client";
 
 /* eslint-disable @typescript-eslint/no-unsafe-assignment */
 /* eslint-disable @typescript-eslint/no-unsafe-member-access */
 /* eslint-disable @typescript-eslint/no-unsafe-call */
 import * as React from "react";
 import { useMutation, useQuery } from "convex/react";
 import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
 
 import { Button } from "@acme/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
 import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
 import { EntityList } from "@acme/ui/entity-list/EntityList";
 import { Input } from "@acme/ui/input";
 import { Label } from "@acme/ui/label";
 import { Switch } from "@acme/ui/switch";
 import { toast } from "@acme/ui/toast";
 
 type CouponKind = "percent" | "fixed";
 
 type CouponRow = {
   _id: string;
   code: string;
   kind: CouponKind;
   amount: number;
   active: boolean;
   organizationId: string | null;
   createdAt?: number;
   updatedAt?: number;
 };
 
 const normalizeCouponCode = (value: string): string =>
   value.trim().toUpperCase().replace(/\s+/g, "");
 
 export function EcommerceCouponsPage(props: {
   organizationId?: string | null;
   listDiscountCodes: unknown;
   createDiscountCode: unknown;
   updateDiscountCode: unknown;
   deleteDiscountCode: unknown;
 }) {
   const organizationId =
     typeof props.organizationId === "string" ? props.organizationId : undefined;
   const listDiscountCodes = props.listDiscountCodes as any;
   const createDiscountCode = props.createDiscountCode as any;
   const updateDiscountCode = props.updateDiscountCode as any;
   const deleteDiscountCode = props.deleteDiscountCode as any;
 
   const coupons = useQuery(
     listDiscountCodes,
     {
       organizationId,
     },
   ) as CouponRow[] | undefined;
 
   const createCoupon = useMutation(createDiscountCode) as (args: any) => Promise<string>;
   const updateCoupon = useMutation(updateDiscountCode) as (args: any) => Promise<null>;
   const deleteCoupon = useMutation(deleteDiscountCode) as (args: any) => Promise<null>;
 
   const rows = React.useMemo(() => (Array.isArray(coupons) ? coupons : []), [coupons]);
 
   const columns = React.useMemo<ColumnDefinition<CouponRow>[]>(
     () => [
       {
         id: "code",
         header: "Code",
         accessorKey: "code",
         cell: (coupon: CouponRow) => (
           <div className="space-y-1">
             <div className="text-sm font-semibold">{coupon.code}</div>
             <div className="text-muted-foreground text-xs">
               {coupon.kind === "percent"
                 ? `${coupon.amount}% off`
                 : `${coupon.amount} off`}
             </div>
           </div>
         ),
         sortable: true,
       },
       {
         id: "active",
         header: "Active",
         accessorKey: "active",
         cell: (coupon: CouponRow) => (
           <Switch
             checked={coupon.active}
             onCheckedChange={(checked) => {
               void updateCoupon({ id: coupon._id, active: checked });
             }}
           />
         ),
       },
       {
         id: "updatedAt",
         header: "Updated",
         accessorKey: "updatedAt",
         cell: (coupon: CouponRow) =>
           coupon.updatedAt ? (
             <span className="text-sm">
               {new Date(coupon.updatedAt).toLocaleDateString()}
             </span>
           ) : (
             <span className="text-muted-foreground text-sm">—</span>
           ),
         sortable: true,
       },
     ],
     [updateCoupon],
   );
 
   const entityActions = React.useMemo<EntityAction<CouponRow>[]>(
     () => [
       {
         id: "delete",
         label: "Delete",
         variant: "outline",
         onClick: (coupon: CouponRow) => {
           const label = coupon.code ? coupon.code : "this coupon";
           if (!confirm(`Delete ${label}?`)) return;
           void deleteCoupon({ id: coupon._id });
         },
       },
     ],
     [deleteCoupon],
   );
 
   const [createOpen, setCreateOpen] = React.useState(false);
   const [draftCode, setDraftCode] = React.useState("");
   const [draftKind, setDraftKind] = React.useState<CouponKind>("percent");
   const [draftAmount, setDraftAmount] = React.useState("");
   const [isSaving, setIsSaving] = React.useState(false);
 
   const handleCreate = async () => {
     const code = normalizeCouponCode(draftCode);
     const amount = Number(draftAmount);
     if (!code) {
       toast.error("Enter a coupon code.");
       return;
     }
     if (!Number.isFinite(amount)) {
       toast.error("Enter a valid amount.");
       return;
     }
     if (draftKind === "percent" && (amount < 0 || amount > 100)) {
       toast.error("Percent must be between 0 and 100.");
       return;
     }
     if (draftKind === "fixed" && amount < 0) {
       toast.error("Fixed amount must be >= 0.");
       return;
     }
 
     setIsSaving(true);
     try {
       await createCoupon({
         organizationId,
         code,
         kind: draftKind,
         amount,
         active: true,
       });
       setDraftCode("");
       setDraftAmount("");
       toast.success("Coupon created.");
       setCreateOpen(false);
     } catch (err: unknown) {
       const message =
         err instanceof Error ? err.message : "Failed to create coupon.";
       toast.error(message);
     } finally {
       setIsSaving(false);
     }
   };
 
   return (
     <div className="space-y-6">
       <Card className="overflow-hidden">
         <CardHeader className="border-b p-4">
           <div className="flex items-center justify-between gap-3">
             <CardTitle className="text-base">Coupons</CardTitle>
             <Dialog open={createOpen} onOpenChange={setCreateOpen}>
               <Button type="button" onClick={() => setCreateOpen(true)}>
                 Add coupon
               </Button>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Create coupon</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="coupon-code">Code</Label>
                     <Input
                       id="coupon-code"
                       value={draftCode}
                       onChange={(e) => setDraftCode(e.currentTarget.value)}
                       placeholder="SAVE10"
                       autoCapitalize="characters"
                     />
                     <div className="text-muted-foreground text-xs">
                       Codes are stored normalized (uppercase, no spaces).
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="coupon-kind">Type</Label>
                     <select
                       id="coupon-kind"
                       className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                       value={draftKind}
                       onChange={(e) =>
                         setDraftKind(e.currentTarget.value as CouponKind)
                       }
                     >
                       <option value="percent">Percent</option>
                       <option value="fixed">Fixed amount</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="coupon-amount">
                       Amount {draftKind === "percent" ? "(0-100)" : "(currency)"}
                     </Label>
                     <Input
                       id="coupon-amount"
                       type="number"
                       inputMode="decimal"
                       value={draftAmount}
                       onChange={(e) => setDraftAmount(e.currentTarget.value)}
                       placeholder={draftKind === "percent" ? "10" : "25"}
                     />
                   </div>
                 </div>
                 <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                     Cancel
                   </Button>
                   <Button type="button" onClick={handleCreate} disabled={isSaving}>
                     Create
                   </Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
           </div>
         </CardHeader>
         <CardContent className="p-3">
           <EntityList<CouponRow>
             data={rows}
             columns={columns}
             isLoading={coupons === undefined}
             defaultViewMode="list"
             viewModes={["list"]}
             enableSearch={true}
             entityActions={entityActions}
             getRowId={(row) => row._id}
             emptyState={
               <div className="text-muted-foreground text-sm">No coupons yet.</div>
             }
           />
         </CardContent>
       </Card>
     </div>
   );
 }
