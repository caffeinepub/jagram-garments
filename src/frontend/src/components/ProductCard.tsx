import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Category, type Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddToCart } from "../hooks/useQueries";
import { formatPrice } from "../lib/formatters";

const categoryEmoji: Record<Category, string> = {
  [Category.men]: "👔",
  [Category.women]: "👗",
  [Category.kids]: "👕",
  [Category.accessories]: "👜",
};

const categoryColor: Record<Category, string> = {
  [Category.men]: "bg-blue-100 text-blue-800",
  [Category.women]: "bg-pink-100 text-pink-800",
  [Category.kids]: "bg-yellow-100 text-yellow-800",
  [Category.accessories]: "bg-purple-100 text-purple-800",
};

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      return;
    }
    const defaultSize = product.sizes[0] || "Free Size";
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        size: defaultSize,
        quantity: BigInt(1),
      });
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group"
    >
      <Link to="/products/$id" params={{ id: product.id.toString() }}>
        <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-accent/40 transition-all duration-300 hover:shadow-gold">
          {/* Product image placeholder */}
          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-forest-light/10 to-forest-DEFAULT/5">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-6xl">
                {categoryEmoji[product.category]}
              </span>
              <span className="text-xs font-body font-medium text-muted-foreground uppercase tracking-widest">
                {product.category}
              </span>
            </div>
            {product.featured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-gold text-forest-dark text-[10px] font-bold px-2">
                  Featured
                </Badge>
              </div>
            )}
            {Number(product.stockQuantity) === 0 && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-sm font-body font-semibold text-muted-foreground">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display text-base font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] capitalize ${categoryColor[product.category]}`}
              >
                {product.category}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold text-primary">
                {formatPrice(product.priceCents)}
              </span>
              <Button
                size="sm"
                data-ocid="product.add_to_cart.button"
                onClick={handleAddToCart}
                disabled={
                  addToCart.isPending || Number(product.stockQuantity) === 0
                }
                className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>

            {product.sizes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {product.sizes.slice(0, 4).map((size) => (
                  <span
                    key={size}
                    className="text-[10px] font-body border border-border rounded px-1.5 py-0.5 text-muted-foreground"
                  >
                    {size}
                  </span>
                ))}
                {product.sizes.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{product.sizes.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
