import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Tables } from "@/integrations/supabase/types";

export type Connection = Tables<"connections">;

export const useConnections = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["connections", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
      if (error) throw error;
      return data as Connection[];
    },
    enabled: !!profile,
  });
};

export const useSendConnection = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      if (!profile) throw new Error("No profile");
      // Check existing
      const { data: existing } = await supabase
        .from("connections")
        .select("id")
        .or(
          `and(requester_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${profile.id})`
        );
      if (existing && existing.length > 0) throw new Error("Connection already exists");

      const { data, error } = await supabase
        .from("connections")
        .insert({ requester_id: profile.id, receiver_id: receiverId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
};

export const useUpdateConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { data, error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
};

export const useConnectionStatus = (targetProfileId: string | undefined) => {
  const { data: connections } = useConnections();
  const { data: profile } = useProfile();

  if (!connections || !profile || !targetProfileId) return null;

  const conn = connections.find(
    (c) =>
      (c.requester_id === profile.id && c.receiver_id === targetProfileId) ||
      (c.requester_id === targetProfileId && c.receiver_id === profile.id)
  );

  if (!conn) return { status: "none" as const, connection: null };
  return { status: conn.status, connection: conn, isSender: conn.requester_id === profile.id };
};
