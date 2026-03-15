import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { motion } from "motion/react";
import { type Order, OrderStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllProducts, useOrders } from "../hooks/useQueries";
import { formatDate, formatPrice } from "../lib/formatters";

const SKELETON_KEYS = ["os1", "os2", "os3"];

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.pending]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [OrderStatus.confirmed]: "bg-blue-100 text-blue-800 border-blue-200",
  [OrderStatus.shipped]: "bg-purple-100 text-purple-800 border-purple-200",
  [OrderStatus.delivered]: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons: Record<OrderStatus, string> = {
  [OrderStatus.pending]: "⏳",
  [OrderStatus.confirmed]: "✅",
  [OrderStatus.shipped]: "🚚",
  [OrderStatus.delivered]: "📦",
};

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: allProducts = [] } = useAllProducts();
  const { loginStatus, identity, login } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const getProductName = (productId: bigint) =>
    allProducts.find((p) => p.id === productId)?.name ??
    `Product #${productId}`;

  if (!isLoggedIn) {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">
          Login to view your orders
        </h2>
        <p className="text-muted-foreground font-body mb-6">
          Please login to see your order history
        </p>
        <Button
          data-ocid="orders.login.button"
          onClick={login}
          className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body"
        >
          Login
        </Button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main
        className="container mx-auto px-4 py-10"
        data-ocid="orders.loading_state"
      >
        <Skeleton className="h-10 w-48 mb-8" />
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={k} className="h-32 w-full mb-4 rounded-lg" />
        ))}
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground mb-8">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
          data-ocid="orders.empty_state"
        >
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            No orders yet
          </h2>
          <p className="text-muted-foreground font-body mb-8">
            Start shopping to see your orders here!
          </p>
          <Button
            asChild
            data-ocid="orders.shop_now.button"
            className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body"
          >
            <Link to="/products" search={{ category: undefined }}>
              {" "}
              Start Shopping
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4" data-ocid="orders.list">
          {orders.map((order: Order, idx: number) => (
            <motion.div
              key={order.id.toString()}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              data-ocid={`orders.item.${idx + 1}`}
              className="bg-card border border-border rounded-lg p-6 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-display font-bold text-card-foreground text-lg">
                    Order #{order.id.toString()}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`capitalize font-body font-medium border ${statusColors[order.status]}`}
                    variant="outline"
                  >
                    {statusIcons[order.status]} {order.status}
                  </Badge>
                  <span className="font-display font-bold text-primary text-lg">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Items ({order.items.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, i) => (
                    <span
                      key={`${item.productId}-${item.size}-${i}`}
                      className="text-sm font-body bg-muted px-3 py-1 rounded-full text-muted-foreground"
                    >
                      {getProductName(item.productId)} ({item.size}) ×{" "}
                      {item.quantity.toString()}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
