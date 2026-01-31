 import Link from "next/link";
 
 import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
 import { Button } from "@acme/ui/button";
 
 export default function PlatformBillingOverviewPage() {
   return (
     <div className="grid gap-4 md:grid-cols-3">
       <Card>
         <CardHeader>
           <CardTitle>Orders</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <p className="text-muted-foreground text-sm">
             Review recent orders and payment status.
           </p>
           <Button asChild variant="outline">
             <Link href="/platform/billing/orders">View orders</Link>
           </Button>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle>Products</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <p className="text-muted-foreground text-sm">
             Manage product definitions for plans.
           </p>
           <Button asChild variant="outline">
             <Link href="/platform/billing/products">View products</Link>
           </Button>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle>Coupons</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <p className="text-muted-foreground text-sm">
             Create discounts and promotions.
           </p>
           <Button asChild variant="outline">
             <Link href="/platform/billing/coupons">View coupons</Link>
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 }
