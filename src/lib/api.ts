import { supabase } from "./supabase";

/** List rows from a table, optionally ordered. Throws on error. */
export async function listRows<T>(table: string, orderBy?: string): Promise<T[]> {
  let query = supabase.from(table).select("*");
  if (orderBy) query = query.order(orderBy);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

/** Insert one row. */
export async function insertRow<T extends Record<string, unknown>>(
  table: string,
  row: T
): Promise<T> {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
}

/** Update one row by id. */
export async function updateRow<T extends Record<string, unknown>>(
  table: string,
  id: string,
  patch: Partial<T>
): Promise<T> {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
}

/** Delete one row by id. */
export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}