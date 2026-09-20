import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  timestamp,
  date,
  json,
} from "drizzle-orm/mysql-core";

// 1. Auth & Profiles
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  phone: varchar("phone", { length: 50 }),
  fullName: varchar("full_name", { length: 255 }),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 2. Pharmacy Products & Medicine Directory
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const genericInfo = mysqlTable("generic_info", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  genericName: varchar("generic_name", { length: 255 }).notNull().unique(),
  indication: text("indication"),
  dosage: text("dosage"),
  sideEffects: text("side_effects"),
  contraindications: text("contraindications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  strength: varchar("strength", { length: 100 }),
  dosageForm: varchar("dosage_form", { length: 100 }).default("Tablet"),
  manufacturer: varchar("manufacturer", { length: 150 }),
  categoryId: varchar("category_id", { length: 36 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
  mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0.00"),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).default("0.00"),
  stock: int("stock").default(0).notNull(),
  minStockAlert: int("min_stock_alert").default(10).notNull(),
  requiresPrescription: boolean("requires_prescription").default(false).notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const stockBatches = mysqlTable("stock_batches", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).default(""),
  batchNumber: varchar("batch_number", { length: 100 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  quantity: int("quantity").notNull(),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).notNull(),
  supplierId: varchar("supplier_id", { length: 36 }),
  poId: varchar("po_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAlerts = mysqlTable("stock_alerts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).default(""),
  batchId: varchar("batch_id", { length: 36 }),
  type: varchar("type", { length: 50 }).notNull(), // low_stock, expiring, expired
  ref: varchar("ref", { length: 150 }),
  detail: text("detail"),
  severity: varchar("severity", { length: 20 }).default("warning"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Orders & Prescriptions
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  customerId: varchar("customer_id", { length: 36 }),
  customerName: varchar("customer_name", { length: 150 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  deliveryAddress: text("delivery_address"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cod"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  paymentRef: varchar("payment_ref", { length: 150 }),
  prescriptionId: varchar("prescription_id", { length: 36 }),
  branchId: varchar("branch_id", { length: 36 }),
  trackingToken: varchar("tracking_token", { length: 100 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = mysqlTable("prescriptions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }),
  patientName: varchar("patient_name", { length: 150 }),
  phone: varchar("phone", { length: 50 }),
  imageUrl: text("image_url").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  notes: text("notes"),
  reviewNotes: text("review_notes"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refillReminders = mysqlTable("refill_reminders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  reminderDate: timestamp("reminder_date").notNull(),
  frequencyDays: int("frequency_days").default(30),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Doctors & Telehealth
export const doctors = mysqlTable("doctors", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  specialty: varchar("specialty", { length: 150 }).notNull(),
  degrees: varchar("degrees", { length: 255 }),
  hospital: varchar("hospital", { length: 150 }),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }).notNull(),
  availableDays: json("available_days"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  doctorId: varchar("doctor_id", { length: 36 }).notNull(),
  patientId: varchar("patient_id", { length: 36 }),
  patientName: varchar("patient_name", { length: 150 }).notNull(),
  patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  timeSlot: varchar("time_slot", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("confirmed").notNull(),
  consultationType: varchar("consultation_type", { length: 50 }).default("video"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  invoiceNo: varchar("invoice_no", { length: 100 }),
  refundStatus: varchar("refund_status", { length: 50 }).default("none").notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Diagnostics & Home Services
export const labTests = mysqlTable("lab_tests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  turnaroundTime: varchar("turnaround_time", { length: 100 }).default("24 hours"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diagnosticBookings = mysqlTable("diagnostic_bookings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  testId: varchar("test_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  bookingNo: varchar("booking_no", { length: 50 }),
  patientName: varchar("patient_name", { length: 150 }).notNull(),
  patientPhone: varchar("patient_phone", { length: 50 }).notNull(),
  sampleCollectionAddress: text("sample_collection_address"),
  bookingDate: timestamp("booking_date").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  reportUrl: text("report_url"),
  collectorName: varchar("collector_name", { length: 150 }).default(""),
  collectorPhone: varchar("collector_phone", { length: 50 }).default(""),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. POS & Sales in Pharmacy
export const posSales = mysqlTable("pos_sales", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  branchId: varchar("branch_id", { length: 36 }),
  cashierId: varchar("cashier_id", { length: 36 }),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paid: decimal("paid", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posSaleItems = mysqlTable("pos_sale_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: varchar("sale_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Accounting & Audit
export const chartAccounts = mysqlTable("chart_accounts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  balance: decimal("balance", { precision: 14, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = mysqlTable("journal_entries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const erpAuditLog = mysqlTable("erp_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  action: varchar("action", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  username: varchar("username", { length: 100 }),
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 100 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Loyalty
export const loyaltyAccounts = mysqlTable("loyalty_accounts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const loyaltyTransactions = mysqlTable("loyalty_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  points: int("points").notNull(),
  kind: varchar("kind", { length: 50 }).notNull(), // earn | redeem | adjust
  orderId: varchar("order_id", { length: 36 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Home services + delivery tracking
export const serviceRequests = mysqlTable("service_requests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestNo: varchar("request_no", { length: 50 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 }),
  serviceSlug: varchar("service_slug", { length: 100 }).notNull(),
  serviceName: varchar("service_name", { length: 255 }).default(""),
  patientName: varchar("patient_name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address"),
  area: varchar("area", { length: 150 }),
  scheduledDate: timestamp("scheduled_date"),
  slot: varchar("slot", { length: 50 }),
  duration: varchar("duration", { length: 50 }),
  note: text("note"),
  adminNote: text("admin_note"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  assigneeName: varchar("assignee_name", { length: 150 }).default(""),
  assigneePhone: varchar("assignee_phone", { length: 50 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveries = mysqlTable("deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  orderNo: varchar("order_no", { length: 100 }),
  userId: varchar("user_id", { length: 36 }),
  riderId: varchar("rider_id", { length: 36 }),
  status: varchar("status", { length: 50 }).default("assigned").notNull(),
  otp: varchar("otp", { length: 10 }),
  etaMinutes: int("eta_minutes"),
  lastLat: decimal("last_lat", { precision: 10, scale: 7 }),
  lastLng: decimal("last_lng", { precision: 10, scale: 7 }),
  lastSeenAt: timestamp("last_seen_at"),
  note: text("note"),
  publicToken: varchar("public_token", { length: 64 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  tokenRevoked: boolean("token_revoked").default(false).notNull(),
  tokenScope: varchar("token_scope", { length: 30 }).default("public"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 10. Offers, suppliers, procurement, expenses, media, settings, campaigns
export const offers = mysqlTable("offers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  discountPct: decimal("discount_pct", { precision: 5, scale: 2 }).default("0.00"),
  maxDiscount: decimal("max_discount", { precision: 12, scale: 2 }),
  minOrder: decimal("min_order", { precision: 12, scale: 2 }).default("0.00"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  poNumber: varchar("po_number", { length: 100 }).notNull().unique(),
  supplierId: varchar("supplier_id", { length: 36 }).notNull(),
  supplierName: varchar("supplier_name", { length: 150 }).default(""),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  expectedAt: date("expected_at", { mode: "string" }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  poId: varchar("po_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).default("").notNull(),
  qty: int("qty").default(0).notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0.00").notNull(),
  batchNo: varchar("batch_no", { length: 100 }).default(""),
  expiry: date("expiry", { mode: "string" }),
  receivedQty: int("received_qty").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  spentOn: timestamp("spent_on").defaultNow().notNull(),
  note: text("note"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const appSettings = mysqlTable("app_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  label: varchar("label", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).default("sms"),
  body: text("body"),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Support chat
export const supportConversations = mysqlTable("support_conversations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).default("Support"),
  status: varchar("status", { length: 50 }).default("open").notNull(),
  agentActive: boolean("agent_active").default(false).notNull(),
  agentName: varchar("agent_name", { length: 150 }),
  agentLastSeen: timestamp("agent_last_seen"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  unreadForAgent: int("unread_for_agent").default(0).notNull(),
  unreadForUser: int("unread_for_user").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportMessages = mysqlTable("support_messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: varchar("conversation_id", { length: 36 }).notNull(),
  sender: varchar("sender", { length: 20 }).notNull(), // user | ai | agent
  body: text("body").notNull(),
  agentName: varchar("agent_name", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Notifications + account medicines + Rx share/retention
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  kind: varchar("kind", { length: 50 }).default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  orderNo: varchar("order_no", { length: 100 }).default(""),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFavorites = mysqlTable("user_favorites", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  reminderConfig: json("reminder_config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRecentMedicines = mysqlTable("user_recent_medicines", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  lastViewedAt: timestamp("last_viewed_at").defaultNow().notNull(),
});

export const prescriptionShares = mysqlTable("prescription_shares", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  prescriptionId: varchar("prescription_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  scopes: json("scopes").$type<Record<string, boolean>>().default({}),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rxRetention = mysqlTable("rx_retention", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  days: int("days").default(0).notNull(),
  notifyEmail: boolean("notify_email").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 14. Delivery & Logistics
export const riders = mysqlTable("riders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).unique(),
  name: varchar("name", { length: 150 }).default("").notNull(),
  phone: varchar("phone", { length: 50 }).default("").notNull(),
  vehicle: varchar("vehicle", { length: 50 }).default("bike").notNull(),
  zone: varchar("zone", { length: 100 }).default("").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const deliveryZones = mysqlTable("delivery_zones", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).default("60.00").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const deliveryEvents = mysqlTable("delivery_events", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  deliveryId: varchar("delivery_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  note: text("note"),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lng: decimal("lng", { precision: 11, scale: 8 }),
  actor: varchar("actor", { length: 50 }).default("system").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryNotifications = mysqlTable("delivery_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  deliveryId: varchar("delivery_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Stock Operations & Adjustments
export const stockAdjustments = mysqlTable("stock_adjustments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  adjNo: varchar("adj_no", { length: 100 }).notNull().unique(),
  reason: varchar("reason", { length: 100 }).default("correction").notNull(),
  note: text("note"),
  status: varchar("status", { length: 50 }).default("applied").notNull(),
  branchId: varchar("branch_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const stockAdjustmentItems = mysqlTable("stock_adjustment_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  adjId: varchar("adj_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).default("").notNull(),
  changeQty: int("change_qty").default(0).notNull(),
  beforeQty: int("before_qty").default(0).notNull(),
  afterQty: int("after_qty").default(0).notNull(),
  note: text("note"),
});

export const stockCounts = mysqlTable("stock_counts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  countNo: varchar("count_no", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  note: text("note"),
  branchId: varchar("branch_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const stockCountItems = mysqlTable("stock_count_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  countId: varchar("count_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  systemQty: int("system_qty").default(0).notNull(),
  countedQty: int("counted_qty").default(0).notNull(),
  discrepancy: int("discrepancy").default(0).notNull(),
  note: text("note"),
});

export const stockTransferItems = mysqlTable("stock_transfer_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  transferId: varchar("transfer_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  quantity: int("quantity").default(0).notNull(),
  receivedQty: int("received_qty").default(0).notNull(),
  note: text("note"),
});

export const stockMovements = mysqlTable("stock_movements", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  branchId: varchar("branch_id", { length: 36 }),
  type: varchar("type", { length: 50 }).notNull(),
  quantity: int("quantity").notNull(),
  referenceId: varchar("reference_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 16. Telehealth, Doctor Reviews & Blackouts
export const doctorBlackouts = mysqlTable("doctor_blackouts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  doctorId: varchar("doctor_id", { length: 36 }).notNull(),
  day: date("day").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorReviews = mysqlTable("doctor_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  doctorId: varchar("doctor_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  rating: int("rating").default(5).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consultationMessages = mysqlTable("consultation_messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId: varchar("appointment_id", { length: 36 }).notNull(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  senderRole: varchar("sender_role", { length: 50 }).default("patient").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consultationMedia = mysqlTable("consultation_media", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId: varchar("appointment_id", { length: 36 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).default("image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consultationPrescriptions = mysqlTable("consultation_prescriptions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId: varchar("appointment_id", { length: 36 }).notNull(),
  prescriptionId: varchar("prescription_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. Returns, Reviews & Audits
export const orderReturns = mysqlTable("order_returns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  orderId: varchar("order_id", { length: 36 }).notNull(),
  orderNo: varchar("order_no", { length: 100 }).notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productReviews = mysqlTable("product_reviews", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  rating: int("rating").default(5).notNull(),
  comment: text("comment"),
  status: varchar("status", { length: 50 }).default("approved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const prescriptionAudit = mysqlTable("prescription_audit", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  prescriptionId: varchar("prescription_id", { length: 36 }).notNull(),
  actorId: varchar("actor_id", { length: 36 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productImageAudit = mysqlTable("product_image_audit", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const errorLogs = mysqlTable("error_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: varchar("source", { length: 100 }).notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  context: json("context"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. API Hub & Image Imports
export const apiEndpoints = mysqlTable("api_endpoints", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  method: varchar("method", { length: 10 }).default("GET").notNull(),
  url: text("url").notNull(),
  headers: json("headers"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const apiIntegrations = mysqlTable("api_integrations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: varchar("provider", { length: 100 }).notNull(),
  apiKey: text("api_key"),
  config: json("config"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const apiTestLogs = mysqlTable("api_test_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  endpointId: varchar("endpoint_id", { length: 36 }).notNull(),
  statusCode: int("status_code"),
  responseBody: text("response_body"),
  durationMs: int("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageAuditLog = mysqlTable("image_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageImportFailures = mysqlTable("image_import_failures", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: varchar("run_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }),
  error: text("error").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageImportRuns = mysqlTable("image_import_runs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  total: int("total").default(0).notNull(),
  successful: int("successful").default(0).notNull(),
  failed: int("failed").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("running").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const imageRevisions = mysqlTable("image_revisions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar("product_id", { length: 36 }).notNull(),
  imageUrl: text("image_url").notNull(),
  version: int("version").default(1).notNull(),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicineDirectory = mysqlTable("medicine_directory", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  en: varchar("en", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 150 }),
  generic: varchar("generic", { length: 255 }),
  strength: varchar("strength", { length: 100 }),
  form: varchar("form", { length: 100 }),
  pack: varchar("pack", { length: 6 }),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 12, scale: 2 }),
  rx: boolean("rx").default(false).notNull(),
  category: varchar("category", { length: 36 }),
  imageUrl: text("image_url"),
  company: varchar("company", { length: 150 }),
  grpBn: text("grp_bn"),
  grpEn: text("grp_en"),
});
