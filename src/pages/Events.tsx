import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Events() {
  const { role, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: "", description: "", event_date: "", location: "" });

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    setEvents(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("events").insert({ ...f, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Event created!");
    setF({ title: "", description: "", event_date: "", location: "" });
    setShowForm(false);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Upcoming gatherings and meetups.</p>
        </div>
        {role === "admin" && (
          <Button className="gradient-primary" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> New Event
          </Button>
        )}
      </div>

      {showForm && role === "admin" && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Create event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date & time</Label><Input type="datetime-local" required value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
              </div>
              <Button type="submit" className="gradient-primary">Publish</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No events yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {events.map((e) => (
            <Card key={e.id} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl gradient-primary flex flex-col items-center justify-center text-primary-foreground shrink-0">
                    <span className="text-xs font-medium">{new Date(e.event_date).toLocaleString("en", { month: "short" })}</span>
                    <span className="text-2xl font-bold leading-none">{new Date(e.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{e.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(e.event_date).toLocaleString()}</span>
                      {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
