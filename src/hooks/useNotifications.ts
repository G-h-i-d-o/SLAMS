import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { listRows } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export type Notification = {
  id: string;
  user_id: string;
  kind: "breach" | "system" | "info";
  title: string;
  body: string | null;
  metric_id: string | null;
  evaluation_id: string | null;
  is_read: boolean;
  created_at: string;
};

const QUERY_KEY = ["notifications"];

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listRows<Notification>("notifications"),
    enabled: !!user,
  });

    // Realtime: refresh list on new notifications for this user
  useEffect(() => {
    if (!user) return;

    // Unique name per mount avoids the StrictMode double-mount collision
    const channelName = `notifications-${user.id}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const rows = (listQ.data ?? []).slice().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const unreadCount = rows.filter((r) => !r.is_read).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = rows.filter((r) => !r.is_read).map((r) => r.id);
      if (!ids.length) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    rows,
    unreadCount,
    isLoading: listQ.isLoading,
    error: listQ.error,
    markRead,
    markAllRead,
  };
}