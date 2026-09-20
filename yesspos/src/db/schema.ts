import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  timestamp,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// 1. Core Users & Roles
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 100 }),
  fullName: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 50 }).default("customer").notNull(),
  branchId: varchar("branch_id", { length: 36 }),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const userRoles = mysqlTable("user_roles", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).default("MAIN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Catalog & Products
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }),
  nameBn: varchar("name_bn", { length: 150 }),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  imageUrl: text("image_url"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subcategories = mysqlTable("subcategories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: varchar("category_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brands = mysqlTable("brands", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }),
  nameBn: varchar("name_bn", { length: 150 }),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  nameBn: varchar("name_bn", { length: 255 }),
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  categoryId: varchar("category_id", { length: 36 }),
  brandId: varchar("brand_id", { length: 36 }),
  unit: varchar("unit", { length: 50 }).default("pcs"),
  packSize: varchar("pack_size", { length: 100 }),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
  mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0.00"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0.00"),
  stock: decimal("stock", { precision: 12, scale: 2 }).default("0.00").notNull(),
  lowStockAt: decimal("low_stock_at", { precision: 12, scale: 2 }),
  expiryDate: timestamp("expiry_date"),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productStock = mysqlTable("product_stock", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0.00").notNull(),
  minStockAlert: decimal("min_stock_alert", { precision: 12, scale: 2 }).default("5.00"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productSerials = mysqlTable("product_serials", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }),
  serialNumber: varchar("serial_number", { length: 150 }).notNull(),
  status: varchar("status", { length: 50 }).default("available"),
  saleId: varchar("sale_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productReviews = mysqlTable("product_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  customerId: varchar("customer_id", { length: 36 }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  status: varchar("status", { length: 50 }).default("pending"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Customers & Sales
export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  loyaltyPoints: int("loyalty_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  customerId: varchar("customer_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  cashierId: varchar("cashier_id", { length: 36 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  dueAmount: decimal("due_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  status: varchar("status", { length: 50 }).default("completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const saleItems = mysqlTable("sale_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  nameSnapshot: varchar("name_snapshot", { length: 255 }),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salePayments = mysqlTable("sale_payments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Procurement & Suppliers
export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  company: varchar("company", { length: 150 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  poNumber: varchar("po_number", { length: 100 }).notNull().unique(),
  supplierId: varchar("supplier_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  dueAmount: decimal("due_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  deliveryDate: timestamp("delivery_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  poId: varchar("po_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Accounting & Expenses
export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  accountNumber: varchar("account_number", { length: 100 }),
  bankName: varchar("bank_name", { length: 150 }),
  branch: varchar("branch", { length: 150 }),
  branchId: varchar("branch_id", { length: 36 }),
  openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const accountTransactions = mysqlTable("account_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: varchar("account_id", { length: 36 }),
  toAccountId: varchar("to_account_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  userId: varchar("user_id", { length: 36 }),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  txnDate: timestamp("txn_date").defaultNow().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const expenseCategories = mysqlTable("expense_categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }),
  nameBn: varchar("name_bn", { length: 150 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: varchar("category_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  accountId: varchar("account_id", { length: 36 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  spentOn: timestamp("spent_on"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  expenseDate: timestamp("expense_date").defaultNow().notNull(),
  reference: varchar("reference", { length: 100 }),
  note: text("note"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Delivery & Online Orders
export const deliveryAreas = mysqlTable("delivery_areas", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  city: varchar("city", { length: 100 }).default("Dhaka"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("60.00").notNull(),
  estimatedTime: varchar("estimated_time", { length: 100 }).default("2-4 hours"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliverySlots = mysqlTable("delivery_slots", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  areaId: varchar("area_id", { length: 36 }),
  startTime: varchar("start_time", { length: 20 }).notNull(),
  endTime: varchar("end_time", { length: 20 }).notNull(),
  maxOrders: int("max_orders").default(20).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryRiders = mysqlTable("delivery_riders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 50 }).default("bike"),
  nid: varchar("nid", { length: 100 }),
  branchId: varchar("branch_id", { length: 36 }),
  note: text("note"),
  currentLat: decimal("current_lat", { precision: 10, scale: 7 }),
  currentLng: decimal("current_lng", { precision: 10, scale: 7 }),
  locationUpdatedAt: timestamp("location_updated_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryOrders = mysqlTable("delivery_orders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNo: int("order_no").notNull().unique(),
  userId: varchar("user_id", { length: 36 }),
  saleId: varchar("sale_id", { length: 36 }),
  riderId: varchar("rider_id", { length: 36 }),
  areaId: varchar("area_id", { length: 36 }),
  slotId: varchar("slot_id", { length: 100 }),
  slotDate: varchar("slot_date", { length: 20 }),
  slot: varchar("slot", { length: 150 }),
  area: varchar("area", { length: 150 }),
  customerName: varchar("customer_name", { length: 150 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  deliveryAddress: text("delivery_address"),
  address: text("address"),
  note: text("note"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cod"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  couponCode: varchar("coupon_code", { length: 50 }),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0.00"),
  trackingCode: varchar("tracking_code", { length: 100 }),
  etaMinutes: int("eta_minutes"),
  branchId: varchar("branch_id", { length: 36 }),
  zoneId: varchar("zone_id", { length: 36 }),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const deliveryOrderItems = mysqlTable("delivery_order_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }),
  nameSnapshot: varchar("name_snapshot", { length: 255 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const deliveryFeedback = mysqlTable("delivery_feedback", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  orderNo: int("order_no"),
  phone: varchar("phone", { length: 50 }),
  kind: varchar("kind", { length: 50 }).notNull(), // confirm | issue
  message: text("message"),
  severity: varchar("severity", { length: 50 }).default("normal").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  escalated: boolean("escalated").default(false).notNull(),
  escalatedAt: timestamp("escalated_at"),
  dueAt: timestamp("due_at"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliverySlotCapacity = mysqlTable("delivery_slot_capacity", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slotId: varchar("slot_id", { length: 50 }).notNull().unique(),
  capacity: int("capacity").default(25).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const deliveryProofs = mysqlTable("delivery_proofs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  kind: varchar("kind", { length: 50 }).default("photo").notNull(),
  filePath: text("file_path").notNull(),
  receiverName: varchar("receiver_name", { length: 150 }),
  note: text("note"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  status: varchar("status", { length: 50 }).default("ok"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryOrderEvents = mysqlTable("delivery_order_events", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  note: text("note"),
  actorId: varchar("actor_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiSettings = mysqlTable("api_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  meta: json("meta").$type<Record<string, unknown>>().default({}),
  provider: varchar("provider", { length: 100 }),
  label: varchar("label", { length: 150 }),
  category: varchar("category", { length: 100 }),
  enabled: boolean("enabled").default(true),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  senderId: varchar("sender_id", { length: 100 }),
  extra: json("extra").$type<Record<string, unknown>>().default({}),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 7. Coupons & Loyalty
export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).default("percentage").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyRewards = mysqlTable("loyalty_rewards", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 150 }).notNull(),
  pointsRequired: int("points_required").notNull(),
  rewardType: varchar("reward_type", { length: 50 }).default("discount").notNull(),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyTransactions = mysqlTable("loyalty_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  saleId: varchar("sale_id", { length: 36 }),
  points: int("points").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. CMS & System
export const siteContent = mysqlTable("site_content", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  data: json("data"),
  groupName: varchar("group_name", { length: 100 }).default("general"),
  label: varchar("label", { length: 255 }).default(""),
  kind: varchar("kind", { length: 50 }).default("text"),
  valueBn: text("value_bn"),
  valueEn: text("value_en"),
  sortOrder: int("sort_order").default(0),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const mediaFiles = mysqlTable("media_files", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: int("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }),
  username: varchar("username", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 100 }),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Double-entry ledger + inventory ops (Phase 3 gaps)
export const ledgerAccounts = mysqlTable("ledger_accounts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }),
  nameBn: varchar("name_bn", { length: 150 }),
  type: varchar("type", { length: 50 }).notNull(), // asset, liability, equity, income, expense
  accountClass: varchar("class", { length: 50 }),
  parentId: varchar("parent_id", { length: 36 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = mysqlTable("journal_entries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryNumber: varchar("entry_number", { length: 100 }).notNull().unique(),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  memo: text("memo"),
  branchId: varchar("branch_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }),
  status: varchar("status", { length: 50 }).default("posted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalLines = mysqlTable("journal_lines", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: varchar("entry_id", { length: 36 }).notNull(),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0.00").notNull(),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0.00").notNull(),
  memo: text("memo"),
});

export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNo: varchar("invoice_no", { length: 100 }).notNull().unique(),
  supplierId: varchar("supplier_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  paid: decimal("paid", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: varchar("status", { length: 50 }).default("received").notNull(),
  purchasedOn: timestamp("purchased_on"),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseItems = mysqlTable("purchase_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseId: varchar("purchase_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const contacts = mysqlTable("contacts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  nameBn: varchar("name_bn", { length: 150 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  type: varchar("type", { length: 50 }).default("customer").notNull(),
  openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  loyaltyPoints: int("loyalty_points").default(0).notNull(),
  isMember: boolean("is_member").default(false).notNull(),
  memberSince: timestamp("member_since"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustments = mysqlTable("stock_adjustments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  quantityDelta: decimal("quantity_delta", { precision: 12, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseReturns = mysqlTable("purchase_returns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseId: varchar("purchase_id", { length: 36 }).notNull(),
  supplierId: varchar("supplier_id", { length: 36 }),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reason: text("reason"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseReturnItems = mysqlTable("purchase_return_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  returnId: varchar("return_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const saleReturns = mysqlTable("sale_returns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reason: text("reason"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleReturnItems = mysqlTable("sale_return_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  returnId: varchar("return_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  partyId: varchar("party_id", { length: 36 }),
  partyType: varchar("party_type", { length: 50 }).default("customer"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).default("cash"),
  reference: varchar("reference", { length: 150 }),
  direction: varchar("direction", { length: 20 }).default("in").notNull(), // in | out
  notes: text("notes"),
  branchId: varchar("branch_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockCounts = mysqlTable("stock_counts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  branchId: varchar("branch_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockCountItems = mysqlTable("stock_count_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  countId: varchar("count_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  systemQty: decimal("system_qty", { precision: 12, scale: 2 }).default("0.00").notNull(),
  countedQty: decimal("counted_qty", { precision: 12, scale: 2 }).default("0.00").notNull(),
});

export const stockTransfers = mysqlTable("stock_transfers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromBranchId: varchar("from_branch_id", { length: 36 }).notNull(),
  toBranchId: varchar("to_branch_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockTransferItems = mysqlTable("stock_transfer_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  transferId: varchar("transfer_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
});

export const customerAddresses = mysqlTable("customer_addresses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  label: varchar("label", { length: 100 }),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerNotifications = mysqlTable("customer_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }),
  orderId: varchar("order_id", { length: 36 }),
  orderNo: int("order_no"),
  customerName: varchar("customer_name", { length: 150 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  channel: varchar("channel", { length: 50 }).default("inapp").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isSent: boolean("is_sent").default(false).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  sentAt: timestamp("sent_at"),
  sendStatus: varchar("send_status", { length: 50 }).default("pending"),
  sendAttempts: int("send_attempts").default(0).notNull(),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userCarts = mysqlTable("user_carts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  lines: json("lines").$type<Array<{ id: string; qty: number; name_en?: string; name_bn?: string; price?: number }>>().default([]),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const deliveryZones = mysqlTable("delivery_zones", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }),
  nameBn: varchar("name_bn", { length: 150 }),
  fee: decimal("fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 12, scale: 2 }),
  minOrder: decimal("min_order", { precision: 12, scale: 2 }).default("0.00"),
  freeDeliveryAbove: decimal("free_delivery_above", { precision: 12, scale: 2 }),
  etaMinutes: int("eta_minutes"),
  sortOrder: int("sort_order").default(0),
  branchId: varchar("branch_id", { length: 36 }),
  isActive: boolean("is_active").default(true).notNull(),
});

export const promotions = mysqlTable("promotions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar("code", { length: 50 }),
  title: varchar("title", { length: 255 }),
  titleEn: varchar("title_en", { length: 255 }),
  titleBn: varchar("title_bn", { length: 255 }),
  body: text("body"),
  imageUrl: text("image_url"),
  discountPct: decimal("discount_pct", { precision: 5, scale: 2 }).default("0.00"),
  discountAmt: decimal("discount_amt", { precision: 12, scale: 2 }).default("0.00"),
  minOrder: decimal("min_order", { precision: 12, scale: 2 }).default("0.00"),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessSettings = mysqlTable("business_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }),
  value: text("value"),
  shopName: varchar("shop_name", { length: 150 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  currencySymbol: varchar("currency_symbol", { length: 10 }).default("৳"),
  defaultTaxPct: decimal("default_tax_pct", { precision: 5, scale: 2 }).default("0.00"),
  receiptFooter: text("receipt_footer"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const mediaAssets = mysqlTable("media_assets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: int("size").default(0),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
