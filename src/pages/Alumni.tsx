import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap } from "lucide-react";

export default function Alumni() {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "alumni");
      const ids = roles?.map((r: any) => r.user_id) ?? [];
      if (ids.length === 0) { setList([]); return; }
      const { data } = await supabase.from("profiles").select("*").in("id", ids);
      setList(data ?? []);
    })();
  }, []);

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-2">Alumni Directory</h1>
      <p className="text-muted-foreground mb-6">All registered alumni in our network.</p>
      {list.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No alumni registered yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => (
            <Card key={a.id} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                      {a.full_name?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                </div>
                {a.job_title && (
                  <p className="text-sm flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Briefcase className="w-3.5 h-3.5" /> {a.job_title}{a.company && ` @ ${a.company}`}
                  </p>
                )}
                {a.graduation_year && (
                  <Badge variant="secondary" className="mt-2"><GraduationCap className="w-3 h-3 mr-1" />Class of {a.graduation_year}</Badge>
                )}
                {a.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{a.bio}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
