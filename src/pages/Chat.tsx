import { useState, useEffect, useRef, useMemo } from "react";
import Layout from "@/components/Layout";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, MessageCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;

export default function Chat() {
  const { data: profile } = useProfile();
  const { data: connections } = useConnections();
  const { data: allProfiles } = useAllProfiles();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [calling, setCalling] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const acceptedConnections = useMemo(() => {
    if (!connections || !profile) return [];
    return connections.filter((c) => c.status === "accepted");
  }, [connections, profile]);

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    allProfiles?.forEach((p) => map.set(p.id, p.full_name || "Student"));
    return map;
  }, [allProfiles]);

  const getOtherId = (conn: (typeof acceptedConnections)[0]) => {
    if (!profile) return "";
    return conn.requester_id === profile.id ? conn.receiver_id : conn.requester_id;
  };

  // Fetch messages
  useEffect(() => {
    if (!selectedConnection) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", selectedConnection)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedConnection}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${selectedConnection}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConnection]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection || !profile) return;
    await supabase.from("messages").insert({
      connection_id: selectedConnection,
      sender_id: profile.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar */}
        <Card className="w-72 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-3.5rem)]">
            <div className="space-y-1 px-3 pb-3">
              {acceptedConnections.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No connections yet</p>
              )}
              {acceptedConnections.map((conn) => {
                const otherId = getOtherId(conn);
                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedConnection(conn.id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      selectedConnection === conn.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">{profileMap.get(otherId) || "Student"}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat area */}
        <Card className="flex flex-1 flex-col">
          {selectedConnection ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                <CardTitle className="text-base">
                  {(() => {
                    const conn = acceptedConnections.find((c) => c.id === selectedConnection);
                    if (!conn) return "Chat";
                    return profileMap.get(getOtherId(conn)) || "Student";
                  })()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => setCalling(!calling)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setCalling(!calling)}>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {calling && (
                <div className="border-b bg-primary/5 p-4 text-center">
                  <p className="mb-2 text-sm font-medium text-primary">📞 Call in progress...</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    WebRTC calls require peer-to-peer connection setup.
                  </p>
                  <Button size="sm" variant="destructive" onClick={() => setCalling(false)}>
                    End Call
                  </Button>
                </div>
              )}

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          msg.sender_id === profile?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.content}
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEnd} />
                </div>
              </ScrollArea>

              <div className="border-t p-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="icon" type="submit">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}
