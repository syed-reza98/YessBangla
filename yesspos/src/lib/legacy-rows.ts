/** Map Drizzle camelCase rows → snake_case shapes the UI already expects. */

export type Dict = Record<string, unknown>;

function iso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function productRow(r: Dict): Dict {
  const price = num(r.sellingPrice ?? r.price);
  const cost = num(r.costPrice ?? r.cost);
  return {
    id: r.id,
    name: r.name,
    name_en: r.nameEn ?? r.name,
    name_bn: r.nameBn ?? null,
    sku: r.sku ?? null,
    barcode: r.barcode ?? null,
    category_id: r.categoryId ?? null,
    brand_id: r.brandId ?? null,
    unit: r.unit ?? "pcs",
    pack_size: r.packSize ?? null,
    cost,
    cost_price: cost,
    price,
    selling_price: price,
    mrp: num(r.mrp),
    vat_rate: num(r.vatRate),
    stock: num(r.stock),
    low_stock_at: r.lowStockAt != null ? num(r.lowStockAt) : null,
    expiry_date: iso(r.expiryDate),
    image_url: r.imageUrl ?? null,
    description: r.description ?? null,
    is_active: r.isActive ?? true,
    created_at: iso(r.createdAt),
    updated_at: iso(r.updatedAt),
  };
}

export function categoryRow(r: Dict): Dict {
  const nameEn = (r.nameEn ?? r.name ?? "") as string;
  const nameBn = (r.nameBn ?? nameEn) as string;
  return {
    id: r.id,
    name: r.name ?? nameEn,
    name_en: nameEn,
    name_bn: nameBn,
    slug: r.slug,
    image_url: r.imageUrl ?? null,
    icon: r.icon ?? null,
    sort_order: num(r.sortOrder),
    is_active: r.isActive ?? true,
    created_at: iso(r.createdAt),
  };
}

export function brandRow(r: Dict): Dict {
  return {
    id: r.id,
    name: r.name,
    name_en: r.nameEn ?? r.name,
    name_bn: r.nameBn ?? null,
    slug: r.slug,
    logo_url: r.logoUrl ?? null,
    is_active: r.isActive ?? true,
    created_at: iso(r.createdAt),
  };
}

export function saleRow(r: Dict): Dict {
  const paid = num(r.paidAmount ?? r.paid);
  const due = num(r.dueAmount ?? r.due);
  return {
    id: r.id,
    invoice_no: r.invoiceNumber ?? r.invoiceNo ?? null,
    invoice_number: r.invoiceNumber ?? null,
    customer_id: r.customerId ?? null,
    contact_id: r.customerId ?? r.contactId ?? null,
    customer_name: r.customerName ?? null,
    branch_id: r.branchId ?? null,
    cashier_id: r.cashierId ?? null,
    subtotal: num(r.subtotal),
    discount: num(r.discount),
    tax: num(r.tax),
    total: num(r.total),
    paid,
    paid_amount: paid,
    due,
    due_amount: due,
    payment_method: r.paymentMethod ?? "cash",
    status: r.status,
    notes: r.notes ?? null,
    created_at: iso(r.createdAt),
    updated_at: iso(r.updatedAt),
  };
}

export function saleItemRow(r: Dict): Dict {
  const line = num(r.lineTotal ?? r.totalPrice);
  return {
    id: r.id,
    sale_id: r.saleId,
    product_id: r.productId,
    name_snapshot: r.nameSnapshot ?? null,
    quantity: num(r.quantity),
    unit_price: num(r.unitPrice),
    discount: num(r.discount),
    tax: num(r.tax),
    total_price: num(r.totalPrice),
    line_total: line,
    created_at: iso(r.createdAt),
  };
}

export function contactRow(r: Dict): Dict {
  return {
    id: r.id,
    name: r.name,
    name_bn: r.nameBn ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    address: r.address ?? null,
    type: r.type ?? "customer",
    opening_balance: num(r.openingBalance),
    loyalty_points: num(r.loyaltyPoints),
    is_member: r.isMember ?? false,
    member_since: iso(r.memberSince),
    is_active: r.isActive ?? true,
    created_at: iso(r.createdAt),
  };
}

export function branchRow(r: Dict): Dict {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    address: r.address ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    is_active: r.isActive ?? true,
    created_at: iso(r.createdAt),
  };
}

export function settingsRow(r: Dict): Dict {
  return {
    id: r.id,
    key: r.key ?? null,
    value: r.value ?? null,
    shop_name: r.shopName ?? null,
    address: r.address ?? null,
    phone: r.phone ?? null,
    currency_symbol: r.currencySymbol ?? "৳",
    default_tax_pct: num(r.defaultTaxPct),
    receipt_footer: r.receiptFooter ?? null,
    updated_at: iso(r.updatedAt),
  };
}

export function money(n: number | undefined | null, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}
