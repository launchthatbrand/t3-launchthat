"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clipboard,
  Edit,
  MapPin,
  Package,
  RefreshCw,
  User,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { toast } from "@acme/ui/toast";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Unwrap params with React.use()
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId as string;

  // Fetch order details
  const order = useQuery(api.ecommerce.orders.getOrder, { orderId });
  const updateOrderStatus = useMutation(api.ecommerce.orders.updateOrderStatus);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus });
      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Format date with time
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "payment_failed":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "pending_fulfillment":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "processing":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "refunded":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Get next available statuses based on current status
  const getNextAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending_payment":
        return ["payment_failed", "pending_fulfillment"];
      case "pending_fulfillment":
        return ["processing", "cancelled"];
      case "processing":
        return ["shipped", "cancelled"];
      case "shipped":
        return ["delivered", "cancelled"];
      case "delivered":
        return ["completed"];
      default:
        return [];
    }
  };

  // Loading state
  if (!order) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-4 h-64 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Handle not found
  if (order === null) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="p-6 text-center">
              <h2 className="mb-2 text-xl font-semibold">Order Not Found</h2>
              <p className="text-muted-foreground">
                The order you are looking for does not exist or you do not have
                permission to view it.
              </p>
              <Button
                onClick={() => router.push("/admin/orders")}
                className="mt-4"
              >
                View All Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract cart items from the order's cart snapshot
  const orderItems = order.cartSnapshot?.items || [];

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Order #{order._id.substring(order._id.length - 8)}
          </h1>
          <p className="text-muted-foreground">
            <Calendar className="mr-1 inline-block h-4 w-4" />
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge
            className={getStatusBadgeColor(order.orderStatus)}
            variant="outline"
          >
            {order.orderStatus.replace(/_/g, " ")}
          </Badge>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Change the status of this order. This will update the
                  customer's order history.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium">Current Status:</p>
                  <Badge
                    className={getStatusBadgeColor(order.orderStatus)}
                    variant="outline"
                  >
                    {order.orderStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">New Status:</p>
                  <Select onValueChange={handleStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {getNextAvailableStatuses(order.orderStatus).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.email || "Guest Checkout"}</p>
            {order.userId && (
              <p className="mb-4 text-sm text-muted-foreground">
                Customer ID: {order.userId}
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full">
              <User className="mr-2 h-4 w-4" />
              View Customer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p>{order.shippingAddress.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress.city},{" "}
              {order.shippingAddress.stateOrProvince}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="mb-4">{order.shippingAddress.country}</p>
            <Button variant="outline" size="sm" className="w-full">
              <Clipboard className="mr-2 h-4 w-4" />
              Copy Address
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p>{order.orderStatus.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Payment</p>
                <p>{order.paymentDetails.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Method</p>
                <p>{order.paymentDetails.method}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Transaction ID</p>
                <p className="truncate">{order.paymentDetails.transactionId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Items purchased in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.productSnapshot.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.productSnapshot.sku}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.variationSnapshot ? (
                      <div>
                        <p>{item.variationSnapshot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variationSnapshot.attributes
                            .map((attr: any) => `${attr.name}: ${attr.value}`)
                            .join(", ")}
                        </p>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.price)}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>{formatPrice(order.subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping</p>
              <p>{formatPrice(order.shippingAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tax</p>
              <p>{formatPrice(order.taxAmount)}</p>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <p>Total</p>
              <p>{formatPrice(order.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
