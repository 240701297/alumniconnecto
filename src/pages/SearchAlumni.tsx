import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, UserPlus, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SearchAlumni() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<any>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "alumni");
    const ids = roles?.map((r: any) => r.user_id) ?? [];
    if (ids.length === 0) { setList([]); return; }
    const { data } = await supabase.from("profiles").select("*").in("id", ids);
    setList(data ?? []);

    if (user) {
      const { data: rq } = await supabase.from("connection_requests").select("alumni_id,status").eq("student_id", user.id);
      const map: Record<string, string> = {};
      rq?.forEach((r: any) => { map[r.alumni_id] = r.status; });
      setRequests(map);
    }
  };
  useEffect(() => { load(); }, [user]);

  const filtered = list.filter((a) => {
    const q = query.toLowerCase();
    return !q || a.full_name?.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q) || a.job_title?.toLowerCase().includes(q);
  });

  const send = async () => {
    if (!user || !target) return;
    const { error } = await supabase.from("connection_requests").insert({
      student_id: user.id, alumni_id: target.id, message: msg,
    });
    if (error) return toast.error(error.message);
    toast.success("Mentorship request sent!");
    setTarget(null); setMsg("");
    load();
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-2">Find Alumni</h1>
      <p className="text-muted-foreground mb-6">Search and connect with mentors from our network.</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search by name, company or role..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-secondary text-sm">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Role</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Company</th>
                <th className="text-right p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No alumni match your search.</td></tr>
              ) : filtered.map((a) => {
                const status = requests[a.id];
                return (
                  <tr key={a.id} className="border-t hover:bg-secondary/50 transition-smooth">
                    <td className="p-4">
                      <p className="font-medium">{a.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{a.job_title} {a.company && `@ ${a.company}`}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{a.job_title || "—"}</td>
                    <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{a.company || "—"}</td>
                    <td className="p-4 text-right">
                      {status === "accepted" ? (
                        <span className="inline-flex items-center text-success text-sm gap-1"><CheckCircle className="w-4 h-4" />Connected</span>
                      ) : status === "pending" ? (
                        <span className="inline-flex items-center text-warning text-sm gap-1"><Clock className="w-4 h-4" />Pending</span>
                      ) : status === "rejected" ? (
                        <span className="text-muted-foreground text-sm">Declined</span>
                      ) : (
                        <Dialog open={target?.id === a.id} onOpenChange={(o) => !o && setTarget(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setTarget(a)}>
                              <UserPlus className="w-4 h-4 mr-1" />Request
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Send mentorship request to {a.full_name}</DialogTitle></DialogHeader>
                            <Textarea placeholder="Introduce yourself and what guidance you're looking for..." value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
                            <DialogFooter>
                              <Button onClick={send} className="gradient-primary">Send Request</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
