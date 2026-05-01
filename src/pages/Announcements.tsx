import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Announcements() {
  const { role, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: "", content: "" });

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ ...f, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Posted!");
    setF({ title: "", content: "" });
    setShowForm(false);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Updates from the alumni office.</p>
        </div>
        {role === "admin" && (
          <Button className="gradient-primary" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        )}
      </div>

      {showForm && role === "admin" && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New announcement</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Content</Label><Textarea required rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></div>
              <Button type="submit" className="gradient-primary">Publish</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="transition-smooth hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold">{a.title}</h3>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
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
