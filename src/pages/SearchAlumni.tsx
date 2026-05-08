import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, CheckCircle, Clock, Sparkles, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";

export default function SearchAlumni() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [companyF, setCompanyF] = useState("");
  const [yearF, setYearF] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<any>(null);
  const [msg, setMsg] = useState("");

  // smart match
  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState("");
  const [industry, setIndustry] = useState("");
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

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
    const okQ = !q || a.full_name?.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q) || a.job_title?.toLowerCase().includes(q) || a.bio?.toLowerCase().includes(q);
    const okC = !companyF || a.company?.toLowerCase().includes(companyF.toLowerCase());
    const okY = !yearF || String(a.graduation_year || "").includes(yearF);
    return okQ && okC && okY;
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

  const runMatch = async () => {
    if (!goals.trim()) return toast.error("Please describe your goals");
    setMatching(true);
    setMatches([]);
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/match-alumni`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, interests, industry }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Match failed");
      setMatches(j.matches || []);
      if ((j.matches || []).length === 0) toast.info("No strong matches found — try broader filters.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMatching(false);
    }
  };

  const renderActionCell = (a: any) => {
    const status = requests[a.id];
    if (status === "accepted") return <span className="inline-flex items-center text-success text-sm gap-1"><CheckCircle className="w-4 h-4" />Connected</span>;
    if (status === "pending") return <span className="inline-flex items-center text-warning text-sm gap-1"><Clock className="w-4 h-4" />Pending</span>;
    if (status === "rejected") return <span className="text-muted-foreground text-sm">Declined</span>;
    return (
      <Dialog open={target?.id === a.id} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" onClick={() => setTarget(a)}>
            <UserPlus className="w-4 h-4 mr-1" />Connect
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Send mentorship request to {a.full_name}</DialogTitle></DialogHeader>
          <Textarea placeholder="Introduce yourself and what guidance you're looking for..." value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
          <DialogFooter><Button onClick={send} className="gradient-primary">Send Request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-2">Smart Alumni Connect</h1>
      <p className="text-muted-foreground mb-6">AI-powered matching plus advanced filters to find the perfect mentor.</p>

      <Tabs defaultValue="smart">
        <TabsList className="mb-6">
          <TabsTrigger value="smart"><Sparkles className="w-4 h-4 mr-1.5" />Smart Match (AI)</TabsTrigger>
          <TabsTrigger value="browse"><Filter className="w-4 h-4 mr-1.5" />Browse & Filter</TabsTrigger>
        </TabsList>

        <TabsContent value="smart">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Tell us what you're looking for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Your goals *</Label><Textarea rows={2} placeholder="e.g. Break into product management at a tech company within 1 year" value={goals} onChange={(e) => setGoals(e.target.value)} /></div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Interests / skills</Label><Input placeholder="e.g. AI, design systems, fintech" value={interests} onChange={(e) => setInterests(e.target.value)} /></div>
                <div><Label>Preferred industry</Label><Input placeholder="e.g. SaaS, healthcare, finance" value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
              </div>
              <Button onClick={runMatch} disabled={matching} className="gradient-primary">
                {matching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finding matches...</> : <><Sparkles className="w-4 h-4 mr-2" />Find My Mentors</>}
              </Button>
            </CardContent>
          </Card>

          {matches.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {matches.map((a, i) => (
                <Card key={a.id} className="transition-smooth hover:shadow-elegant">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{a.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{a.role}{a.company && ` @ ${a.company}`}</p>
                      </div>
                      <Badge className="gradient-primary text-primary-foreground border-0">#{i + 1} match</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-primary/5 border-l-2 border-primary rounded p-2 mb-3 text-sm">
                      <span className="font-medium text-primary">Why: </span>{a.reason}
                    </div>
                    {renderActionCell({ id: a.id, full_name: a.name })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse">
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search by name, role, bio..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Input placeholder="Filter by company" value={companyF} onChange={(e) => setCompanyF(e.target.value)} />
            <Input className="md:col-span-3" placeholder="Filter by graduation year (e.g. 2020)" value={yearF} onChange={(e) => setYearF(e.target.value)} />
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-secondary text-sm">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Role</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Company</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Year</th>
                    <th className="text-right p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No alumni match your filters.</td></tr>
                  ) : filtered.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-secondary/50 transition-smooth">
                      <td className="p-4">
                        <p className="font-medium">{a.full_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{a.job_title} {a.company && `@ ${a.company}`}</p>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{a.job_title || "—"}</td>
                      <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{a.company || "—"}</td>
                      <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{a.graduation_year || "—"}</td>
                      <td className="p-4 text-right">{renderActionCell(a)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
