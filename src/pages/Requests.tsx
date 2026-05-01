import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function Requests() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("connection_requests").select("*").eq("alumni_id", user.id).order("created_at", { ascending: false });
    if (!data?.length) { setList([]); return; }
    const ids = data.map((r: any) => r.student_id);
    const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
    const merged = data.map((r: any) => ({ ...r, student: profs?.find((p: any) => p.id === r.student_id) }));
    setList(merged);
  };
  useEffect(() => { load(); }, [user]);

  const update = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("connection_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Request accepted!" : "Request declined");
    load();
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-2">Mentorship Requests</h1>
      <p className="text-muted-foreground mb-6">Students who'd like to connect with you.</p>

      {list.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No requests yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5 flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                    {r.student?.full_name?.[0]?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold">{r.student?.full_name || "Unknown student"}</p>
                    <Badge variant={r.status === "accepted" ? "default" : r.status === "pending" ? "secondary" : "outline"}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.student?.email}</p>
                  {r.message && <p className="text-sm mt-2 p-3 bg-secondary rounded-md">{r.message}</p>}
                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="gradient-primary" onClick={() => update(r.id, "accepted")}>
                        <Check className="w-4 h-4 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => update(r.id, "rejected")}>
                        <X className="w-4 h-4 mr-1" />Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
