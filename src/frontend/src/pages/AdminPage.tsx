import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Category, OrderStatus, type Product } from "../backend.d";
import {
  useAddProduct,
  useAllOrders,
  useAllProducts,
  useDeleteProduct,
  useIsAdmin,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";
import { formatDate, formatPrice } from "../lib/formatters";

const statusOptions = Object.values(OrderStatus);
const categoryOptions = Object.values(Category);

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.pending]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.confirmed]: "bg-blue-100 text-blue-800",
  [OrderStatus.shipped]: "bg-purple-100 text-purple-800",
  [OrderStatus.delivered]: "bg-green-100 text-green-800",
};

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  description: "",
  priceCents: BigInt(0),
  category: Category.men,
  sizes: ["S", "M", "L", "XL"],
  stockQuantity: BigInt(10),
  featured: false,
  imageUrl: "",
};

export function AdminPage() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: products = [], isLoading: loadingProducts } = useAllProducts();
  const { data: orders = [], isLoading: loadingOrders } = useAllOrders();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id">>(emptyProduct);
  const [sizesInput, setSizesInput] = useState("S, M, L, XL");
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("10");

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setSizesInput("S, M, L, XL");
    setPriceInput("");
    setStockInput("10");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setSizesInput(product.sizes.join(", "));
    setPriceInput((Number(product.priceCents) / 100).toString());
    setStockInput(product.stockQuantity.toString());
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const sizes = sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const priceCents = BigInt(
      Math.round(Number.parseFloat(priceInput || "0") * 100),
    );
    const stockQuantity = BigInt(Number.parseInt(stockInput || "0", 10));

    const productData = { ...formData, sizes, priceCents, stockQuantity };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          ...productData,
          id: editingProduct.id,
        });
        toast.success("Product updated!");
      } else {
        await addProduct.mutateAsync({ ...productData, id: BigInt(0) });
        toast.success("Product added!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (productId: bigint) => {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleStatusChange = async (orderId: bigint, status: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (checkingAdmin) {
    return (
      <main
        className="container mx-auto px-4 py-10"
        data-ocid="admin.loading_state"
      >
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="admin.error_state"
      >
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">
          Access Denied
        </h2>
        <p className="text-muted-foreground font-body">
          You don&apos;t have admin privileges.
        </p>
      </main>
    );
  }

  const isSaving = addProduct.isPending || updateProduct.isPending;

  return (
    <main className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="font-display text-4xl font-bold text-foreground">
          Admin Panel
        </h1>
      </motion.div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger
            value="products"
            data-ocid="admin.products.tab"
            className="font-body"
          >
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            data-ocid="admin.orders.tab"
            className="font-body"
          >
            Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Product Management
            </h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="admin.add_product.button"
                  onClick={openAddDialog}
                  className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-lg"
                data-ocid="admin.product.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="font-body text-sm font-medium">
                      Name
                    </Label>
                    <Input
                      data-ocid="admin.product_name.input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, name: e.target.value }))
                      }
                      className="font-body mt-1"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      data-ocid="admin.product_description.textarea"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      className="font-body mt-1"
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-body text-sm font-medium">
                        Price (₹)
                      </Label>
                      <Input
                        data-ocid="admin.product_price.input"
                        type="number"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="font-body mt-1"
                        placeholder="e.g. 999"
                      />
                    </div>
                    <div>
                      <Label className="font-body text-sm font-medium">
                        Stock
                      </Label>
                      <Input
                        data-ocid="admin.product_stock.input"
                        type="number"
                        value={stockInput}
                        onChange={(e) => setStockInput(e.target.value)}
                        className="font-body mt-1"
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-body text-sm font-medium">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, category: v as Category }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="admin.product_category.select"
                        className="font-body mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="font-body capitalize"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-body text-sm font-medium">
                      Sizes (comma-separated)
                    </Label>
                    <Input
                      data-ocid="admin.product_sizes.input"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      className="font-body mt-1"
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          featured: e.target.checked,
                        }))
                      }
                      data-ocid="admin.product_featured.checkbox"
                      className="w-4 h-4"
                    />
                    <Label htmlFor="featured" className="font-body text-sm">
                      Featured Product
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="admin.product_dialog.cancel_button"
                    className="font-body"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    data-ocid="admin.product_dialog.save_button"
                    className="bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                        Saving...
                      </>
                    ) : (
                      "Save Product"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingProducts ? (
            <Skeleton
              className="h-64 w-full rounded-lg"
              data-ocid="admin.products.loading_state"
            />
          ) : (
            <div
              className="border border-border rounded-lg overflow-hidden"
              data-ocid="admin.products.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-body font-semibold">
                      Name
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Category
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Price
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Stock
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Featured
                    </TableHead>
                    <TableHead className="font-body font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product, idx: number) => (
                    <TableRow
                      key={product.id.toString()}
                      data-ocid={`admin.products.row.${idx + 1}`}
                    >
                      <TableCell className="font-body font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="capitalize font-body text-xs"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body">
                        {formatPrice(product.priceCents)}
                      </TableCell>
                      <TableCell className="font-body">
                        {product.stockQuantity.toString()}
                      </TableCell>
                      <TableCell>
                        {product.featured && (
                          <Badge className="bg-gold text-forest-dark text-xs font-body">
                            Yes
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.product.edit_button.${idx + 1}`}
                            onClick={() => openEditDialog(product)}
                            className="font-body gap-1 h-8"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            data-ocid={`admin.product.delete_button.${idx + 1}`}
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteProduct.isPending}
                            className="font-body gap-1 h-8"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            All Orders
          </h2>
          {loadingOrders ? (
            <Skeleton
              className="h-64 w-full rounded-lg"
              data-ocid="admin.orders.loading_state"
            />
          ) : orders.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="admin.orders.empty_state"
            >
              <p className="text-muted-foreground font-body">No orders yet</p>
            </div>
          ) : (
            <div
              className="border border-border rounded-lg overflow-hidden"
              data-ocid="admin.orders.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-body font-semibold">
                      Order ID
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Date
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Items
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Total
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, idx) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`admin.orders.row.${idx + 1}`}
                    >
                      <TableCell className="font-body font-medium">
                        #{order.id.toString()}
                      </TableCell>
                      <TableCell className="font-body">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="font-body">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-body font-semibold text-primary">
                        {formatPrice(order.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(v) =>
                            handleStatusChange(order.id, v as OrderStatus)
                          }
                        >
                          <SelectTrigger
                            data-ocid={`admin.order.status.select.${idx + 1}`}
                            className={`h-8 w-36 text-xs font-body border-0 ${statusColors[order.status]} rounded-full`}
                          >
                            <SelectValue />
                            <ChevronDown className="w-3 h-3 opacity-70" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="font-body capitalize text-xs"
                              >
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
