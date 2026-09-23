/** Envelope returned by the API's paginated list endpoints. */
export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function mapPaginado<A, B>(p: Paginado<A>, fn: (a: A) => B): Paginado<B> {
  return { ...p, items: p.items.map(fn) };
}
