import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [p, setP] = useState({ full_name: "", company: "", job_title: "", graduation_year: "", bio: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setP({
        full_name: data.full_name || "",
        company: data.company || "",
        job_title: data.job_title || "",
        graduation_year: data.graduation_year?.toString() || "",
        bio: data.bio || "",
      });
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: p.full_name,
      company: p.company,
      job_title: p.job_title,
      graduation_year: p.graduation_year ? parseInt(p.graduation_year) : null,
      bio: p.bio,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated!");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground mb-6">Update your details so students can find and connect with you.</p>
        <Card>
          <CardHeader>
            <CardTitle>Profile information</CardTitle>
            <CardDescription>This info is visible to other members.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label>Full name</Label>
                <Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Company</Label>
                  <Input value={p.company} onChange={(e) => setP({ ...p, company: e.target.value })} />
                </div>
                <div>
                  <Label>Job title</Label>
                  <Input value={p.job_title} onChange={(e) => setP({ ...p, job_title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Graduation year</Label>
                <Input type="number" value={p.graduation_year} onChange={(e) => setP({ ...p, graduation_year: e.target.value })} />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea rows={4} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
              </div>
              <Button disabled={busy} className="gradient-primary">{busy ? "Saving..." : "Save changes"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
