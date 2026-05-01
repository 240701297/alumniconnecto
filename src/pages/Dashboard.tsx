import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Megaphone, Inbox, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState({ users: 0, events: 0, announcements: 0, requests: 0, messages: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: u }, { count: e }, { count: a }, { data: ev }, { data: an }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*").order("event_date", { ascending: true }).limit(3),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
      ]);
      let req = 0, msg = 0;
      if (user) {
        const { count: rc } = await supabase.from("connection_requests").select("*", { count: "exact", head: true })
          .or(`student_id.eq.${user.id},alumni_id.eq.${user.id}`);
        const { count: mc } = await supabase.from("messages").select("*", { count: "exact", head: true })
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
        req = rc ?? 0; msg = mc ?? 0;
      }
      setStats({ users: u ?? 0, events: e ?? 0, announcements: a ?? 0, requests: req, messages: msg });
      setRecentEvents(ev ?? []);
      setRecentAnnouncements(an ?? []);
    })();
  }, [user]);

  const cards = role === "admin"
    ? [
        { label: "Total Users", value: stats.users, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Events", value: stats.events, icon: Calendar, color: "from-emerald-500 to-emerald-600" },
        { label: "Announcements", value: stats.announcements, icon: Megaphone, color: "from-amber-500 to-amber-600" },
      ]
    : role === "alumni"
    ? [
        { label: "Mentorship Requests", value: stats.requests, icon: Inbox, color: "from-blue-500 to-blue-600" },
        { label: "Upcoming Events", value: stats.events, icon: Calendar, color: "from-emerald-500 to-emerald-600" },
        { label: "Messages", value: stats.messages, icon: MessageSquare, color: "from-purple-500 to-purple-600" },
      ]
    : [
        { label: "Alumni Network", value: stats.users, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Events", value: stats.events, icon: Calendar, color: "from-emerald-500 to-emerald-600" },
        { label: "My Messages", value: stats.messages, icon: MessageSquare, color: "from-purple-500 to-purple-600" },
      ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your AlumniHub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{c.label}</p>
                  <p className="text-3xl font-bold mt-1">{c.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}>
                  <c.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Active community
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
            {recentEvents.map((e) => (
              <Link to="/events" key={e.id} className="block p-3 rounded-lg border hover:border-primary hover:bg-secondary/50 transition-smooth">
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()} · {e.location}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" />Latest Announcements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentAnnouncements.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="p-3 rounded-lg border">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
