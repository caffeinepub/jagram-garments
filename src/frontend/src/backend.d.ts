import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: bigint;
    stockQuantity: bigint;
    featured: boolean;
    name: string;
    description: string;
    sizes: Array<string>;
    imageUrl: string;
    category: Category;
    priceCents: bigint;
}
export type Time = bigint;
export interface CartItem {
    size: string;
    productId: bigint;
    quantity: bigint;
}
export interface Order {
    id: bigint;
    status: OrderStatus;
    userId: Principal;
    createdAt: Time;
    items: Array<CartItem>;
    totalPrice: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
    address: string;
    phone: string;
}
export enum Category {
    men = "men",
    accessories = "accessories",
    kids = "kids",
    women = "women"
}
export enum OrderStatus {
    shipped = "shipped",
    pending = "pending",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<bigint>;
    addToCart(cartItem: CartItem): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    deleteProduct(productId: bigint): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getFeaturedProducts(): Promise<Array<Product>>;
    getOrder(orderId: bigint): Promise<Order | null>;
    getOrdersByUser(): Promise<Array<Order>>;
    getProduct(productId: bigint): Promise<Product | null>;
    getProductsByCategory(category: Category): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeSampleProducts(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(): Promise<bigint>;
    removeFromCart(productId: bigint, size: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCartItem(productId: bigint, size: string, quantity: bigint): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
