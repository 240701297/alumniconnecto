import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, MapPin, Plus, ExternalLink, Building2, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function Jobs() {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [posters, setPosters] = useState<Record<string, any>>({});
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<any>(null);
  const [applyMsg, setApplyMsg] = useState("");

  const [form, setForm] = useState({ title: "", company: "", location: "", job_type: "full-time", description: "", apply_link: "" });

  const load = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setJobs(data ?? []);
    const ids = Array.from(new Set((data ?? []).map((j) => j.posted_by)));
    if (ids.length) {
      const { data: pf } = await supabase.from("profiles").select("id, full_name, company, job_title").in("id", ids);
      const map: Record<string, any> = {};
      pf?.forEach((p) => { map[p.id] = p; });
      setPosters(map);
    }
    if (user) {
      const { data: apps } = await supabase.from("job_applications").select("job_id").eq("student_id", user.id);
      setApplied(new Set((apps ?? []).map((a) => a.job_id)));
    }
  };
  useEffect(() => { load(); }, [user]);

  const post = async () => {
    if (!user) return;
    if (!form.title || !form.company) return toast.error("Title and company are required");
    const { error } = await supabase.from("jobs").insert({ ...form, posted_by: user.id });
    if (error) return toast.error(error.message);
    toast.success("Job posted!");
    setOpen(false);
    setForm({ title: "", company: "", location: "", job_type: "full-time", description: "", apply_link: "" });
    load();
  };

  const apply = async () => {
    if (!user || !target) return;
    const { error } = await supabase.from("job_applications").insert({
      job_id: target.id, student_id: user.id, message: applyMsg,
    });
    if (error) return toast.error(error.message);
    toast.success("Application sent!");
    setTarget(null); setApplyMsg("");
    load();
  };

  const filtered = jobs.filter((j) => {
    const q = query.toLowerCase();
    const okQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q);
    const okT = typeFilter === "all" || j.job_type === typeFilter;
    return okQ && okT;
  });

  const canPost = role === "alumni" || role === "admin";

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Jobs Board</h1>
          <p className="text-muted-foreground mt-1">Opportunities shared by AlumniHub members.</p>
        </div>
        {canPost && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gradient-primary"><Plus className="w-4 h-4 mr-1" />Post a Job</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Post a new opportunity</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Job title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Company *</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Apply link (optional)</Label><Input placeholder="https://..." value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={post} className="gradient-primary">Post Job</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Input className="md:col-span-2" placeholder="Search by title, company or location..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />No jobs match your filters yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((j) => {
            const poster = posters[j.posted_by];
            const isApplied = applied.has(j.id);
            return (
              <Card key={j.id} className="transition-smooth hover:shadow-elegant">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{j.title}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{j.company}</span>
                        {j.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{j.location}</span>}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0">{j.job_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {j.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{j.description}</p>}
                  {poster && <p className="text-xs text-muted-foreground mb-3">Posted by <span className="font-medium text-foreground">{poster.full_name}</span></p>}
                  <div className="flex gap-2">
                    {role === "student" && (
                      isApplied ? (
                        <Button size="sm" variant="outline" disabled><CheckCircle className="w-4 h-4 mr-1 text-success" />Applied</Button>
                      ) : (
                        <Dialog open={target?.id === j.id} onOpenChange={(o) => !o && setTarget(null)}>
                          <DialogTrigger asChild><Button size="sm" className="gradient-primary" onClick={() => setTarget(j)}><Send className="w-4 h-4 mr-1" />Apply</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Apply to {j.title}</DialogTitle></DialogHeader>
                            <Textarea rows={4} placeholder="Share why you're a good fit (optional)..." value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} />
                            <DialogFooter><Button onClick={apply} className="gradient-primary">Submit</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )
                    )}
                    {j.apply_link && <a href={j.apply_link} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">External link <ExternalLink className="w-3.5 h-3.5 ml-1" /></Button></a>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
