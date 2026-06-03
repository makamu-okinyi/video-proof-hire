import { supabase } from './client';

/**
 * Calls Postgres RPC functions that aren't present in the generated `Database`
 * types (e.g. functions added by later migrations). Keeps call sites type-safe
 * for the return value without resorting to `any`.
 */
export interface RpcResult<T = unknown> {
  data: T;
  error: { message: string; code?: string } | null;
}

export function rpcCall<T = unknown>(
  fn: string,
  args?: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const call = supabase.rpc as unknown as (
    f: string,
    a?: Record<string, unknown>,
  ) => Promise<RpcResult<T>>;
  return call(fn, args);
}
