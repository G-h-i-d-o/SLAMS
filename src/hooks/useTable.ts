import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRows, insertRow, updateRow, deleteRow } from "../lib/api";

export function useTable<T extends { id: string }>(table: string, orderBy?: string) {
  return useQuery<T[]>({
    queryKey: [table],
    queryFn: () => listRows<T>(table, orderBy),
  });
}

export function useMutateTable<T extends { id: string }>(table: string) {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (row: Record<string, unknown>) =>
      insertRow(table, row) as Promise<T>,
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      updateRow(table, id, patch) as Promise<T>,
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });

  return { create, update, remove };
}