import { useMemo } from "react";
import Layout from "@/components/Layout";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useConnections, useUpdateConnection } from "@/hooks/useConnections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Connections() {
  const { data: profile } = useProfile();
  const { data: connections, isLoading } = useConnections();
  const { data: allProfiles } = useAllProfiles();
  const updateConnection = useUpdateConnection();

  const profileMap = useMemo(() => {
    const map = new Map<string, (typeof allProfiles extends (infer T)[] ? T : never)>();
    allProfiles?.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProfiles]);

  const categorized = useMemo(() => {
    if (!connections || !profile) return { pending: [], accepted: [], sent: [] };

    const seen = new Set<string>();
    const pending: typeof connections = [];
    const accepted: typeof connections = [];
    const sent: typeof connections = [];

    for (const c of connections) {
      const key = c.id;
      if (seen.has(key)) continue;
      seen.add(key);

      if (c.status === "accepted") accepted.push(c);
      else if (c.status === "pending" && c.receiver_id === profile.id) pending.push(c);
      else if (c.status === "pending" && c.requester_id === profile.id) sent.push(c);
    }

    return { pending, accepted, sent };
  }, [connections, profile]);

  const handleAction = async (id: string, status: "accepted" | "rejected") => {
    try {
      await updateConnection.mutateAsync({ id, status });
      toast.success(status === "accepted" ? "Connection accepted!" : "Connection rejected");
    } catch {
      toast.error("Failed to update connection");
    }
  };

  const getOtherProfile = (conn: (typeof connections)[0]) => {
    if (!profile) return null;
    const otherId = conn.requester_id === profile.id ? conn.receiver_id : conn.requester_id;
    return profileMap.get(otherId);
  };

  const ConnectionCard = ({ conn, type }: { conn: (typeof connections)[0]; type: string }) => {
    const other = getOtherProfile(conn);
    if (!other) return null;

    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <h3 className="font-semibold text-card-foreground">{other.full_name || "Student"}</h3>
            <p className="text-xs text-muted-foreground">
              {other.department} · {other.year_of_study}
            </p>
            <div className="mt-1">
              {type === "pending" && <Badge variant="secondary">Request Received</Badge>}
              {type === "sent" && <Badge variant="outline">Connection Sent</Badge>}
              {type === "accepted" && <Badge className="bg-primary/10 text-primary">Connected</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {type === "pending" && (
              <>
                <Button size="icon" variant="outline" onClick={() => handleAction(conn.id, "accepted")}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => handleAction(conn.id, "rejected")}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {type === "accepted" && (
              <Button size="sm" variant="outline" asChild>
                <Link to="/chat" className="gap-1">
                  <MessageCircle className="h-4 w-4" /> Chat
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Connections</h1>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending {categorized.pending.length > 0 && `(${categorized.pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Connected {categorized.accepted.length > 0 && `(${categorized.accepted.length})`}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent {categorized.sent.length > 0 && `(${categorized.sent.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {categorized.pending.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No pending requests</CardContent></Card>
            ) : (
              categorized.pending.map((c) => <ConnectionCard key={c.id} conn={c} type="pending" />)
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-3">
            {categorized.accepted.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No connections yet</CardContent></Card>
            ) : (
              categorized.accepted.map((c) => <ConnectionCard key={c.id} conn={c} type="accepted" />)
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-3">
            {categorized.sent.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No sent requests</CardContent></Card>
            ) : (
              categorized.sent.map((c) => <ConnectionCard key={c.id} conn={c} type="sent" />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
