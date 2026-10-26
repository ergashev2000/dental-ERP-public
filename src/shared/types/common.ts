export type ID = string;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
}
