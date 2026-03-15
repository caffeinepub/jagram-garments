import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Category, type Product } from "../backend.d";
import { ProductCard } from "../components/ProductCard";
import { useAllProducts } from "../hooks/useQueries";

const SKELETON_KEYS = ["ps1", "ps2", "ps3", "ps4", "ps5", "ps6", "ps7", "ps8"];

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: Category.men, label: "Men" },
  { value: Category.women, label: "Women" },
  { value: Category.kids, label: "Kids" },
  { value: Category.accessories, label: "Accessories" },
];

export function ProductsPage() {
  const search = useSearch({ from: "/products" }) as { category?: string };
  const [activeCategory, setActiveCategory] = useState<string>(
    search.category || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allProducts = [], isLoading } = useAllProducts();

  const filtered = allProducts.filter((p: Product) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Our Collection
        </h1>
        <p className="text-muted-foreground font-body mb-8">
          Discover garments crafted for every occasion
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="flex-1"
          >
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
              {CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  data-ocid={`products.${cat.value}.tab`}
                  className="font-body text-sm"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-ocid="products.search_input"
              className="pl-9 font-body"
            />
          </div>
        </div>

        {!isLoading && (
          <p className="text-sm text-muted-foreground font-body mb-6">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-ocid="products.loading_state"
          >
            {SKELETON_KEYS.map((k) => (
              <div
                key={k}
                className="rounded-lg overflow-hidden border border-border"
              >
                <Skeleton className="h-52 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-ocid="products.empty_state">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground font-body">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-ocid="products.list"
          >
            {filtered.map((product: Product, i: number) => (
              <ProductCard
                key={product.id.toString()}
                product={product}
                index={i}
              />
            ))}
          </div>
        )}
      </motion.div>
    </main>
  );
}
