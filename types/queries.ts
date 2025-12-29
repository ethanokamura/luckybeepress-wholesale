import { ProductStatus } from "./products";
import { OrderStatus, PaymentStatus } from "./orders";

/** Pagination params */
export interface PaginationParams {
  limit: number;
  startAfter?: unknown;
}

/** Common filter for date ranges */
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

/** Product filters */
export interface ProductFilters extends DateRangeFilter {
  category?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

/** Order filters */
export interface OrderFilters extends DateRangeFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  search?: string; // order number or email
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
  lastDoc?: unknown; // for cursor-based pagination
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
