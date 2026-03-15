import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Category } from "../backend.d";
import { ProductCard } from "../components/ProductCard";
import {
  useAllProducts,
  useFeaturedProducts,
  useInitializeSampleProducts,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"];

const TRUST_ITEMS = [
  {
    icon: "🚚",
    title: "Free Shipping",
    desc: "On orders above ₹999",
    key: "shipping",
  },
  {
    icon: "↩️",
    title: "Easy Returns",
    desc: "7-day return policy",
    key: "returns",
  },
  {
    icon: "✅",
    title: "Genuine Quality",
    desc: "100% authentic products",
    key: "quality",
  },
  {
    icon: "🔒",
    title: "Secure Payments",
    desc: "Safe & encrypted",
    key: "secure",
  },
];

const categories = [
  {
    key: Category.men,
    label: "Men",
    emoji: "👔",
    desc: "Kurtas, shirts & more",
    image: "/assets/generated/category-men.dim_600x400.jpg",
    color: "from-blue-900/60",
  },
  {
    key: Category.women,
    label: "Women",
    emoji: "👗",
    desc: "Salwars, sarees & more",
    image: "/assets/generated/category-women.dim_600x400.jpg",
    color: "from-pink-900/60",
  },
  {
    key: Category.kids,
    label: "Kids",
    emoji: "👕",
    desc: "Festive & casual wear",
    image: "/assets/generated/category-kids.dim_600x400.jpg",
    color: "from-yellow-900/60",
  },
  {
    key: Category.accessories,
    label: "Accessories",
    emoji: "👜",
    desc: "Dupattas, stoles & more",
    image: "/assets/generated/category-accessories.dim_600x400.jpg",
    color: "from-purple-900/60",
  },
];

export function HomePage() {
  const { data: featured = [], isLoading: loadingFeatured } =
    useFeaturedProducts();
  const { data: allProducts = [], isLoading: loadingAll } = useAllProducts();
  const initSamples = useInitializeSampleProducts();

  const isLoading = loadingFeatured || loadingAll;
  const initMutate = initSamples.mutate;
  const initPending = initSamples.isPending;
  const initSuccess = initSamples.isSuccess;

  useEffect(() => {
    if (
      !isLoading &&
      allProducts.length === 0 &&
      !initPending &&
      !initSuccess
    ) {
      initMutate();
    }
  }, [isLoading, allProducts.length, initPending, initSuccess, initMutate]);

  return (
    <main>
      <section
        className="relative min-h-[500px] flex items-center overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-banner.dim_1200x500.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/90 via-forest-dark/60 to-transparent" />
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold font-body text-sm font-semibold tracking-widest uppercase">
                New Collection 2026
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
              Quality Garments
              <br />
              <span className="text-gold">for Every Occasion</span>
            </h1>
            <p className="text-white/80 font-body text-lg mb-8 leading-relaxed">
              Discover the finest ethnic and contemporary fashion at Jagram
              Garments. Crafted with love, worn with pride.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                data-ocid="hero.shop_now.button"
                className="bg-gold hover:bg-gold-light text-forest-dark font-body font-bold text-base px-8"
              >
                <Link to="/products" search={{ category: undefined }}>
                  Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                data-ocid="hero.view_collections.button"
                className="border-white/40 text-white hover:bg-white/10 font-body font-medium"
              >
                <Link to="/products" search={{ category: undefined }}>
                  {" "}
                  View Collections
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground font-body">
            Find exactly what you&apos;re looking for
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                to="/products"
                search={{ category: cat.key }}
                data-ocid={`category.${cat.key}.link`}
                className="group block relative rounded-xl overflow-hidden h-44 md:h-56 cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <h3 className="font-display font-bold text-white text-lg">
                    {cat.label}
                  </h3>
                  <p className="text-white/70 text-xs font-body">{cat.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-16 fabric-texture">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Collection
              </h2>
              <p className="text-muted-foreground font-body">
                Handpicked styles for the season
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              data-ocid="featured.view_all.button"
              className="hidden sm:flex border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-body"
            >
              <Link to="/products" search={{ category: undefined }}>
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              data-ocid="featured.loading_state"
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
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16" data-ocid="featured.empty_state">
              <p className="text-muted-foreground font-body">
                Loading products...
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              data-ocid="featured.list"
            >
              {featured.slice(0, 4).map((product, i) => (
                <ProductCard
                  key={product.id.toString()}
                  product={product}
                  index={i}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Button
              asChild
              variant="outline"
              data-ocid="featured.view_all_mobile.button"
              className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-body"
            >
              <Link to="/products" search={{ category: undefined }}>
                {" "}
                View All Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 p-4"
            >
              <span className="text-3xl">{item.icon}</span>
              <h4 className="font-body font-semibold text-foreground">
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground font-body">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
