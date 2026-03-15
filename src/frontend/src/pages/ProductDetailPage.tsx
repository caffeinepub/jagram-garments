import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Category } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddToCart, useProduct } from "../hooks/useQueries";
import { formatPrice } from "../lib/formatters";

const categoryEmoji: Record<Category, string> = {
  [Category.men]: "👔",
  [Category.women]: "👗",
  [Category.kids]: "👕",
  [Category.accessories]: "👜",
};

export function ProductDetailPage() {
  const { id } = useParams({ from: "/products/$id" });
  const productId = BigInt(id);
  const { data: product, isLoading } = useProduct(productId);
  const addToCart = useAddToCart();
  const { loginStatus, identity, login } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      login();
      return;
    }
    const size = selectedSize || product?.sizes[0] || "Free Size";
    try {
      await addToCart.mutateAsync({
        productId: BigInt(id),
        size,
        quantity: BigInt(quantity),
      });
      toast.success(`${product?.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  if (isLoading) {
    return (
      <main
        className="container mx-auto px-4 py-10"
        data-ocid="product_detail.loading_state"
      >
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="product_detail.error_state"
      >
        <span className="text-5xl block mb-4">😕</span>
        <h2 className="font-display text-2xl font-bold mb-4">
          Product not found
        </h2>
        <Button asChild data-ocid="product_detail.back.button">
          <Link to="/products" search={{ category: undefined }}>
            {" "}
            Back to Products
          </Link>
        </Button>
      </main>
    );
  }

  const inStock = Number(product.stockQuantity) > 0;
  const effectiveSize = selectedSize || (product.sizes[0] ?? null);

  return (
    <main className="container mx-auto px-4 py-10">
      <Link
        to="/products"
        search={{ category: undefined }}
        data-ocid="product_detail.back.link"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-body mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-xl overflow-hidden bg-gradient-to-br from-forest-light/10 to-forest-DEFAULT/5 border border-border h-80 md:h-[500px] flex flex-col items-center justify-center gap-4"
        >
          <span className="text-9xl">{categoryEmoji[product.category]}</span>
          <span className="text-sm font-body font-medium text-muted-foreground uppercase tracking-widest">
            {product.category}
          </span>
          {product.featured && (
            <Badge className="absolute top-4 left-4 bg-gold text-forest-dark font-bold">
              Featured
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="font-body font-semibold text-muted-foreground text-lg">
                Out of Stock
              </span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          <Badge variant="outline" className="w-fit capitalize mb-3 font-body">
            {product.category}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {product.name}
          </h1>
          <p className="font-display text-3xl font-bold text-primary mb-4">
            {formatPrice(product.priceCents)}
          </p>

          <p className="text-muted-foreground font-body leading-relaxed mb-6">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mb-6">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-body">
              {inStock ? (
                <span className="text-green-600 font-medium">
                  In Stock ({product.stockQuantity.toString()} units)
                </span>
              ) : (
                <span className="text-destructive font-medium">
                  Out of Stock
                </span>
              )}
            </span>
          </div>

          {product.sizes.length > 0 && (
            <div className="mb-6">
              <p className="font-body font-semibold text-foreground mb-3">
                Select Size:
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    data-ocid="product_detail.size.toggle"
                    className={`px-4 py-2 text-sm font-body border rounded-md transition-all ${
                      effectiveSize === size
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="font-body font-semibold text-foreground mb-3">
              Quantity:
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors font-body text-lg"
                data-ocid="product_detail.qty_minus.button"
              >
                −
              </button>
              <span className="w-10 text-center font-body font-semibold text-foreground text-lg">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors font-body text-lg"
                data-ocid="product_detail.qty_plus.button"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between font-body">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground text-lg">
                {formatPrice(
                  BigInt(Math.round(Number(product.priceCents) * quantity)),
                )}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || !inStock}
            data-ocid="product_detail.add_to_cart.button"
            className="w-full bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body font-semibold text-base gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            {addToCart.isPending ? "Adding..." : "Add to Cart"}
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
