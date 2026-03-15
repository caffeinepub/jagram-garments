import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import List "mo:core/List";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextProductId = 1;
  var nextOrderId = 1;

  public type Category = {
    #men;
    #women;
    #kids;
    #accessories;
  };

  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    priceCents : Nat;
    category : Category;
    sizes : [Text];
    imageUrl : Text;
    stockQuantity : Nat;
    featured : Bool;
  };

  public type CartItem = {
    productId : Nat;
    size : Text;
    quantity : Nat;
  };

  public type OrderStatus = {
    #pending;
    #confirmed;
    #shipped;
    #delivered;
  };

  public type Order = {
    id : Nat;
    userId : Principal;
    items : [CartItem];
    totalPrice : Nat;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  // Storage
  let products = Map.empty<Nat, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // First admin claim: if no admin exists yet, the caller becomes admin
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    if (caller.isAnonymous()) { return false };
    if (accessControlState.adminAssigned) { return false };
    // No admin yet -- make this caller admin
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    return true;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Management
  public shared ({ caller }) func addProduct(product : Product) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    let newProduct = {
      product with id = nextProductId;
    };

    products.add(nextProductId, newProduct);
    nextProductId += 1;
    newProduct.id;
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    if (not products.containsKey(product.id)) {
      Runtime.trap("Product not found");
    };

    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    if (not products.containsKey(productId)) {
      Runtime.trap("Product not found");
    };

    products.remove(productId);
  };

  public query ({ caller }) func getProduct(productId : Nat) : async ?Product {
    products.get(productId);
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProductsByCategory(category : Category) : async [Product] {
    products.values().toArray().filter(
      func(p) {
        p.category == category;
      }
    ).sort();
  };

  public query ({ caller }) func getFeaturedProducts() : async [Product] {
    products.values().toArray().filter(
      func(p) {
        p.featured;
      }
    ).sort();
  };

  // Shopping Cart
  public shared ({ caller }) func addToCart(cartItem : CartItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    let currentCart = switch (carts.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };

    currentCart.add(cartItem);
    carts.add(caller, currentCart);
  };

  public shared ({ caller }) func removeFromCart(productId : Nat, size : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove items from cart");
    };

    switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) {
        let filteredCart = cart.filter(
          func(item) {
            not (item.productId == productId and item.size == size);
          }
        );
        carts.add(caller, filteredCart);
      };
    };
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, size : Text, _quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cart items");
    };

    switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) {
        let updatedCart = cart.filter(
          func(item) {
            not (item.productId == productId and item.size == size);
          }
        );
        carts.add(caller, updatedCart);
      };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };

    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };

    carts.remove(caller);
  };

  // Orders
  public shared ({ caller }) func placeOrder() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cartItems = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) { cart.toArray() };
    };

    if (cartItems.size() == 0) {
      Runtime.trap("Cart is empty");
    };

    // Calculate total price
    var totalPrice = 0;
    for (item in cartItems.values()) {
      switch (products.get(item.productId)) {
        case (null) { Runtime.trap("Product not found: " # Nat.toText(item.productId)) };
        case (?product) {
          totalPrice += product.priceCents * item.quantity;
        };
      };
    };

    let newOrder = {
      id = nextOrderId;
      userId = caller;
      items = cartItems;
      totalPrice;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(nextOrderId, newOrder);
    nextOrderId += 1;

    // Clear cart
    carts.remove(caller);

    newOrder.id;
  };

  public query ({ caller }) func getOrder(orderId : Nat) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        if (order.userId == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?order;
        } else { null };
      };
    };
  };

  public query ({ caller }) func getOrdersByUser() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    orders.values().toArray().filter(
      func(order) {
        order.userId == caller;
      }
    );
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Sample products (seed data)
  public shared ({ caller }) func initializeSampleProducts() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can initialize sample products");
    };

    let sampleProducts : [Product] = [
      {
        id = 0;
        name = "Men's T-Shirt";
        description = "Comfortable cotton t-shirt for men";
        priceCents = 1999;
        category = #men;
        sizes = ["S", "M", "L", "XL"];
        imageUrl = "https://example.com/mens-tshirt.jpg";
        stockQuantity = 100;
        featured = true;
      },
      {
        id = 0;
        name = "Women's Dress";
        description = "Elegant summer dress for women";
        priceCents = 4999;
        category = #women;
        sizes = ["XS", "S", "M", "L"];
        imageUrl = "https://example.com/womens-dress.jpg";
        stockQuantity = 50;
        featured = true;
      },
      {
        id = 0;
        name = "Kids' Jeans";
        description = "Durable jeans for kids";
        priceCents = 2999;
        category = #kids;
        sizes = ["2T", "3T", "4T", "5T"];
        imageUrl = "https://example.com/kids-jeans.jpg";
        stockQuantity = 80;
        featured = false;
      },
      {
        id = 0;
        name = "Men's Hoodie";
        description = "Warm hoodie for men";
        priceCents = 3999;
        category = #men;
        sizes = ["M", "L", "XL"];
        imageUrl = "https://example.com/mens-hoodie.jpg";
        stockQuantity = 60;
        featured = true;
      },
      {
        id = 0;
        name = "Women's Blouse";
        description = "Stylish blouse for women";
        priceCents = 2799;
        category = #women;
        sizes = ["S", "M", "L"];
        imageUrl = "https://example.com/womens-blouse.jpg";
        stockQuantity = 70;
        featured = false;
      },
      {
        id = 0;
        name = "Kids' T-Shirt";
        description = "Colorful t-shirt for kids";
        priceCents = 1299;
        category = #kids;
        sizes = ["XS", "S", "M"];
        imageUrl = "https://example.com/kids-tshirt.jpg";
        stockQuantity = 90;
        featured = false;
      },
      {
        id = 0;
        name = "Unisex Cap";
        description = "Trendy cap for all ages";
        priceCents = 1599;
        category = #accessories;
        sizes = ["One Size"];
        imageUrl = "https://example.com/unisex-cap.jpg";
        stockQuantity = 120;
        featured = true;
      },
      {
        id = 0;
        name = "Men's Shorts";
        description = "Comfortable shorts for men";
        priceCents = 2499;
        category = #men;
        sizes = ["M", "L", "XL"];
        imageUrl = "https://example.com/mens-shorts.jpg";
        stockQuantity = 75;
        featured = false;
      },
      {
        id = 0;
        name = "Women's Skirt";
        description = "Beautiful skirt for women";
        priceCents = 3499;
        category = #women;
        sizes = ["S", "M", "L"];
        imageUrl = "https://example.com/womens-skirt.jpg";
        stockQuantity = 65;
        featured = false;
      },
    ];

    for (product in sampleProducts.values()) {
      let newProduct = {
        product with id = nextProductId;
      };
      products.add(nextProductId, newProduct);
      nextProductId += 1;
    };
  };
};
