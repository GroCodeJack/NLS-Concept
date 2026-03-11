export interface Product {
  brand: string;
  model: string;
  img_url: string;
  url: string;
  price: string;
  condition: string;
  parent_model: boolean;
  new_price: string | null;
  new_url: string | null;
  used_price: string | null;
  used_url: string | null;
  attrs: Record<string, string>;
}

export interface AppliedFilter {
  label: string;
  value: string;
}

export interface SearchResult {
  products: Product[];
  generated_url: string;
  total_count: number | null;
  applied_filters: AppliedFilter[];
  next_page_url: string | null;
  no_results: boolean;
  potential_clubtype_mismatch: boolean;
  intended_club_type: string | null;
}

export interface LoadMoreResult {
  products: Product[];
  next_page_url: string | null;
}
