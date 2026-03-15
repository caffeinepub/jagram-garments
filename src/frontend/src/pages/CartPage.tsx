import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CartItem, Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllProducts,
  useCart,
  usePlaceOrder,
  useRemoveFromCart,
  useUpdateCartItem,
} from "../hooks/useQueries";
import { formatPrice } from "../lib/formatters";

const SKELETON_KEYS = ["s1", "s2", "s3"];

export function CartPage() {
  const { data: cartItems = [], isLoading } = useCart();
  const { data: allProducts = [] } = useAllProducts();
  const removeFromCart = useRemoveFromCart();
  const updateCartItem = useUpdateCartItem();
  const placeOrder = usePlaceOrder();
  const { loginStatus, identity, login } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const [placingOrder, setPlacingOrder] = useState(false);

  const getProduct = (productId: bigint): Product | undefined =>
    allProducts.find((p) => p.id === productId);

  const cartTotal = cartItems.reduce((sum: bigint, item: CartItem) => {
    const product = getProduct(item.productId);
    if (!product) return sum;
    return sum + product.priceCents * item.quantity;
  }, BigInt(0));

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to place an order");
      login();
      return;
    }
    setPlacingOrder(true);
    try {
      const orderId = await placeOrder.mutateAsync();
      toast.success(`Order #${orderId} placed successfully! 🎉`);
    } catch {
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <main
        className="container mx-auto px-4 py-10"
        data-ocid="cart.loading_state"
      >
        <Skeleton className="h-10 w-40 mb-8" />
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={k} className="h-24 w-full mb-4 rounded-lg" />
        ))}
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground mb-8">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
          data-ocid="cart.empty_state"
        >
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground font-body mb-8">
            Add some beautiful garments to get started!
          </p>
          <Button
            asChild
            data-ocid="cart.shop_now.button"
            className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body"
          >
            <Link to="/products" search={{ category: undefined }}>
              Shop Now <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4" data-ocid="cart.list">
            <AnimatePresence>
              {cartItems.map((item: CartItem, idx: number) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    data-ocid={`cart.item.${idx + 1}`}
                    className="flex items-center gap-4 bg-card border border-border rounded-lg p-4"
                  >
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-2xl shrink-0">
                      {product.category === "men"
                        ? "👔"
                        : product.category === "women"
                          ? "👗"
                          : product.category === "kids"
                            ? "👕"
                            : "👜"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        to="/products/$id"
                        params={{ id: product.id.toString() }}
                      >
                        <h3 className="font-display font-semibold text-card-foreground hover:text-primary truncate transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground font-body">
                        Size: {item.size}
                      </p>
                      <p className="font-body font-bold text-primary mt-0.5">
                        {formatPrice(product.priceCents)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem.mutate({
                            productId: item.productId,
                            size: item.size,
                            quantity: BigInt(
                              Math.max(1, Number(item.quantity) - 1),
                            ),
                          })
                        }
                        data-ocid={`cart.qty_minus.button.${idx + 1}`}
                        className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors font-body"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-body font-semibold">
                        {item.quantity.toString()}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItem.mutate({
                            productId: item.productId,
                            size: item.size,
                            quantity: BigInt(Number(item.quantity) + 1),
                          })
                        }
                        data-ocid={`cart.qty_plus.button.${idx + 1}`}
                        className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors font-body"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-body font-bold text-foreground">
                        {formatPrice(product.priceCents * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart.mutate({
                            productId: item.productId,
                            size: item.size,
                          })
                        }
                        data-ocid={`cart.delete_button.${idx + 1}`}
                        className="text-destructive hover:text-destructive/80 transition-colors mt-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-card-foreground mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((item: CartItem) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="flex justify-between text-sm font-body"
                    >
                      <span className="text-muted-foreground truncate mr-2">
                        {product.name} × {item.quantity.toString()}
                      </span>
                      <span>
                        {formatPrice(product.priceCents * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-body font-bold text-lg text-foreground mb-6">
                <span>Total</span>
                <span className="text-primary">{formatPrice(cartTotal)}</span>
              </div>

              {!isLoggedIn ? (
                <Button
                  data-ocid="cart.login.button"
                  onClick={login}
                  className="w-full bg-gold text-forest-dark hover:bg-gold-light font-body font-semibold"
                >
                  Login to Place Order
                </Button>
              ) : (
                <Button
                  data-ocid="cart.place_order.button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || placeOrder.isPending}
                  className="w-full bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body font-semibold gap-2"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing
                      Order...
                    </>
                  ) : (
                    <>
                      Place Order <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                data-ocid="cart.continue_shopping.button"
                className="w-full mt-3 font-body"
              >
                <Link to="/products" search={{ category: undefined }}>
                  {" "}
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
