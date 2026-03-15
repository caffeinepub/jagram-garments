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
import { Progress } from "@/components/ui/progress";
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
import { Principal } from "@icp-sdk/core/principal";
import {
  ChevronDown,
  Edit2,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Category, OrderStatus, type Product, UserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddProduct,
  useAllOrders,
  useAllProducts,
  useAssignRole,
  useDeleteProduct,
  useIsAdmin,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";
import { useStorageUpload } from "../hooks/useStorageUpload";
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
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const {
    data: isAdmin,
    isLoading: checkingAdmin,
    refetch: refetchAdmin,
  } = useIsAdmin();
  const { data: products = [], isLoading: loadingProducts } = useAllProducts();
  const { data: orders = [], isLoading: loadingOrders } = useAllOrders();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();
  const assignRole = useAssignRole();
  const { uploadImage, isUploading, uploadProgress } = useStorageUpload();

  const [isClaiming, setIsClaiming] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id">>(emptyProduct);
  const [sizesInput, setSizesInput] = useState("S, M, L, XL");
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("10");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin management state
  const [principalId, setPrincipalId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.admin);
  const [roleAssignSuccess, setRoleAssignSuccess] = useState(false);
  const [roleAssignError, setRoleAssignError] = useState<string | null>(null);

  // Auto-claim admin if logged in but not yet admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && identity && actor) {
      setIsClaiming(true);
      (actor as any)
        .claimFirstAdmin()
        .then((claimed) => {
          if (claimed) {
            refetchAdmin();
          }
        })
        .catch(() => {})
        .finally(() => setIsClaiming(false));
    }
  }, [checkingAdmin, isAdmin, identity, actor, refetchAdmin]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setSizesInput("S, M, L, XL");
    setPriceInput("");
    setStockInput("10");
    setImagePreview(null);
    setUploadError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setSizesInput(product.sizes.join(", "));
    setPriceInput((Number(product.priceCents) / 100).toString());
    setStockInput(product.stockQuantity.toString());
    setImagePreview(product.imageUrl || null);
    setUploadError(null);
    setDialogOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const uploadedUrl = await uploadImage(file);
      setFormData((f) => ({ ...f, imageUrl: uploadedUrl }));
      setImagePreview(uploadedUrl);
      URL.revokeObjectURL(localUrl);
      toast.success("Photo upload ho gayi!");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Photo upload nahi ho saka, dobara try karein";
      console.error("Image upload error:", err);
      setImagePreview(null);
      setFormData((f) => ({ ...f, imageUrl: "" }));
      setUploadError(msg);
      URL.revokeObjectURL(localUrl);
      toast.error(msg);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadError(null);
    setFormData((f) => ({ ...f, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleAssignRole = async () => {
    setRoleAssignSuccess(false);
    setRoleAssignError(null);
    if (!principalId.trim()) {
      setRoleAssignError("Principal ID daalna zaroori hai");
      return;
    }
    try {
      const principal = Principal.fromText(principalId.trim());
      await assignRole.mutateAsync({ user: principal, role: selectedRole });
      setRoleAssignSuccess(true);
      setPrincipalId("");
      toast.success("Role assign ho gaya!");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Role assign nahi ho saka";
      setRoleAssignError(msg);
      toast.error(msg);
    }
  };

  if (checkingAdmin || isClaiming) {
    return (
      <main
        className="container mx-auto px-4 py-10"
        data-ocid="admin.loading_state"
      >
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-body text-muted-foreground">
            {isClaiming ? "Admin access check ho raha hai..." : "Loading..."}
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    const isLoggedIn = !!identity;
    return (
      <main
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="admin.error_state"
      >
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">
          {isLoggedIn ? "Admin Access Nahi Hai" : "Access Denied"}
        </h2>
        <p className="text-muted-foreground font-body mb-6">
          {isLoggedIn
            ? "Aapka account admin nahi hai. Pehle admin se request karein ya dobara try karein."
            : "Pehle login karein aur dobara try karein."}
        </p>
        <Button
          onClick={() => refetchAdmin()}
          variant="outline"
          data-ocid="admin.retry.button"
          className="font-body"
        >
          Dobara Check Karein
        </Button>
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
          <TabsTrigger
            value="admins"
            data-ocid="admin.admins.tab"
            className="font-body"
          >
            Admins
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
                className="max-w-lg max-h-[90vh] overflow-y-auto"
                data-ocid="admin.product.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Photo Upload */}
                  <div>
                    <Label className="font-body text-sm font-medium">
                      Product Photo
                    </Label>
                    <div className="mt-1">
                      {imagePreview ? (
                        <div className="relative w-full h-44 rounded-lg overflow-hidden border border-border">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-4">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                              <p className="text-white text-xs font-body">
                                Uploading... {uploadProgress}%
                              </p>
                              <Progress
                                value={uploadProgress}
                                className="w-full h-1.5"
                                data-ocid="admin.product_image.loading_state"
                              />
                            </div>
                          )}
                          {!isUploading && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                              aria-label="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-ocid="admin.product_image.dropzone"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full h-44 border-2 border-dashed border-border hover:border-primary rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ImagePlus className="w-8 h-8 text-muted-foreground" />
                          <span className="font-body text-sm text-muted-foreground">
                            Photo upload karne ke liye click karein
                          </span>
                          <span className="font-body text-xs text-muted-foreground">
                            JPG, PNG, WEBP supported
                          </span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        data-ocid="admin.product_image.upload_button"
                      />
                      {!imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          data-ocid="admin.product_image.upload_button"
                          className="mt-2 w-full font-body gap-2"
                        >
                          <ImagePlus className="w-4 h-4" />
                          Upload Photo
                        </Button>
                      )}
                      {uploadError && (
                        <p
                          className="mt-2 text-xs text-destructive font-body"
                          data-ocid="admin.product_image.error_state"
                        >
                          ⚠️ {uploadError}
                        </p>
                      )}
                    </div>
                  </div>

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
                    disabled={isSaving || isUploading}
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
                      Photo
                    </TableHead>
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
                      <TableCell>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImagePlus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

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

        {/* Admins Tab */}
        <TabsContent value="admins">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg"
          >
            <div className="flex items-center gap-2 mb-6">
              <UserCog className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Admin Management
              </h2>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card space-y-5">
              <div>
                <Label
                  htmlFor="principal-input"
                  className="font-body text-sm font-medium text-foreground"
                >
                  User ka Principal ID
                </Label>
                <Input
                  id="principal-input"
                  data-ocid="admin.assign_principal.input"
                  value={principalId}
                  onChange={(e) => {
                    setPrincipalId(e.target.value);
                    setRoleAssignSuccess(false);
                    setRoleAssignError(null);
                  }}
                  className="font-body mt-1.5"
                  placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                />
              </div>

              <div>
                <Label
                  htmlFor="role-select"
                  className="font-body text-sm font-medium text-foreground"
                >
                  Role Chunein
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as UserRole)}
                >
                  <SelectTrigger
                    id="role-select"
                    data-ocid="admin.assign_role.select"
                    className="font-body mt-1.5"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.admin} className="font-body">
                      Admin (poori access)
                    </SelectItem>
                    <SelectItem value={UserRole.user} className="font-body">
                      User (normal access)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {roleAssignSuccess && (
                <div
                  data-ocid="admin.assign_role.success_state"
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-body"
                >
                  ✅ Role successfully assign ho gaya!
                </div>
              )}

              {roleAssignError && (
                <div
                  data-ocid="admin.assign_role.error_state"
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 font-body"
                >
                  ⚠️ {roleAssignError}
                </div>
              )}

              <Button
                data-ocid="admin.assign_role.submit_button"
                onClick={handleAssignRole}
                disabled={assignRole.isPending}
                className="w-full bg-forest-DEFAULT hover:bg-forest-light text-primary-foreground font-body gap-2"
              >
                {assignRole.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCog className="w-4 h-4" />
                    Role Assign Karein
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 font-body">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                User ka Principal ID unhe apne profile ya login ke baad milega.
                Jab user app mein login kare, unhe apna Principal ID settings ya
                profile section mein milega.
              </span>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
