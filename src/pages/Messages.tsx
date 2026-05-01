import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Load contacts: profiles user has messaged or shares an accepted request with, plus all alumni for students
  const loadContacts = async () => {
    if (!user) return;
    const { data: msgs } = await supabase.from("messages").select("sender_id,recipient_id")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    const ids = new Set<string>();
    msgs?.forEach((m: any) => {
      if (m.sender_id !== user.id) ids.add(m.sender_id);
      if (m.recipient_id !== user.id) ids.add(m.recipient_id);
    });
    // also include accepted connections
    const { data: conns } = await supabase.from("connection_requests").select("student_id,alumni_id,status")
      .or(`student_id.eq.${user.id},alumni_id.eq.${user.id}`).eq("status", "accepted");
    conns?.forEach((c: any) => {
      const other = c.student_id === user.id ? c.alumni_id : c.student_id;
      ids.add(other);
    });
    if (ids.size === 0) { setContacts([]); return; }
    const { data: profs } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
    setContacts(profs ?? []);
  };

  const loadThread = async (otherId: string) => {
    if (!user) return;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setThread(data ?? []);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => { loadContacts(); }, [user]);
  useEffect(() => { if (active) loadThread(active.id); }, [active]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("messages-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m: any = payload.new;
        if (active && (m.sender_id === active.id || m.recipient_id === active.id)) {
          setThread((t) => [...t, m]);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
        loadContacts();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active || !text.trim()) return;
    const content = text;
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, recipient_id: active.id, content });
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr] h-[600px]">
          <div className="border-r overflow-y-auto">
            <div className="p-3 border-b font-semibold text-sm">Conversations</div>
            {contacts.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No conversations yet. Send a mentorship request first.</p>
            ) : contacts.map((c) => (
              <button key={c.id} onClick={() => setActive(c)}
                className={cn("w-full text-left p-3 flex items-center gap-3 border-b hover:bg-secondary transition-smooth",
                  active?.id === c.id && "bg-secondary")}>
                <Avatar className="w-10 h-10"><AvatarFallback className="gradient-primary text-primary-foreground">{c.full_name?.[0]?.toUpperCase() || "?"}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.full_name || c.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.job_title || "Member"}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-6 text-center">
                Select a conversation to start chatting
              </div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar className="w-10 h-10"><AvatarFallback className="gradient-primary text-primary-foreground">{active.full_name?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-semibold">{active.full_name}</p>
                    <p className="text-xs text-muted-foreground">{active.email}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-secondary/30">
                  {thread.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</p>}
                  {thread.map((m) => (
                    <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                        m.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm")}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <form onSubmit={send} className="p-3 border-t flex gap-2">
                  <Input placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
                  <Button type="submit" className="gradient-primary"><Send className="w-4 h-4" /></Button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
