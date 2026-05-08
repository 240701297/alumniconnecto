import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Briefcase, Target, Users, BookOpen, Rocket, MessageCircle, Award, Send, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const mentorTips = [
  { icon: Target, title: "Define your goals", text: "Before reaching out, get clear on what you want — career advice, technical guidance, or networking. Specific asks get specific answers." },
  { icon: MessageCircle, title: "Write a thoughtful intro", text: "When you send a request, mention why you chose this alumni and what 1–2 questions you'd love their take on." },
  { icon: Users, title: "Build relationships, not transactions", text: "Mentorship is a two-way street. Share what you're learning, send updates, and offer help where you can." },
  { icon: Award, title: "Respect their time", text: "Come to every meeting with an agenda. Follow through on advice and report back on your progress." },
];

const jobTips = [
  { icon: Briefcase, title: "Polish your portfolio first", text: "Recruiters look at portfolios in under 30 seconds. Lead with your best 2–3 projects, not all of them." },
  { icon: Rocket, title: "Apply with intention", text: "10 great applications beat 100 generic ones. Customize your resume and write a real cover note for each role." },
  { icon: BookOpen, title: "Practice the fundamentals", text: "For tech roles: data structures, system design, and one language deeply. For business roles: case interviews and storytelling." },
  { icon: Lightbulb, title: "Use referrals — politely", text: "After 1–2 great conversations with an alumni, it's okay to ask if they'd be open to referring you. Make it easy: send your resume + the JD link." },
];

type Msg = { role: "user" | "assistant"; content: string };

function CareerChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AI career advisor. Ask me about resumes, interviews, choosing a career path, internships, or how to network with alumni. What's on your mind?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/career-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Error ${res.status}`);
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const d = t.slice(5).trim();
          if (d === "[DONE]") continue;
          try {
            const j = JSON.parse(d);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Chat failed");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="gradient-hero p-5 text-primary-foreground flex items-center gap-3">
        <Sparkles className="w-6 h-6" />
        <div>
          <h3 className="font-bold">AI Career Advisor</h3>
          <p className="text-xs text-primary-foreground/80">Powered by Lovable AI · Always on</p>
        </div>
      </div>
      <div className="h-[420px] overflow-y-auto p-4 space-y-3 bg-secondary/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
              {m.content || <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start"><div className="bg-card border rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin" /></div></div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about resumes, interviews, career paths..."
          disabled={busy}
        />
        <Button onClick={send} disabled={busy || !input.trim()} className="gradient-primary">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default function Mentorship() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mentorship & Career Hub</h1>
        <p className="text-muted-foreground mt-1">AI guidance, professional strategies, and your alumni network — all in one place.</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList className="mb-6">
          <TabsTrigger value="chat"><Sparkles className="w-4 h-4 mr-1.5" />AI Advisor</TabsTrigger>
          <TabsTrigger value="mentorship"><Users className="w-4 h-4 mr-1.5" />Mentorship</TabsTrigger>
          <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-1.5" />Job Search</TabsTrigger>
        </TabsList>

        <TabsContent value="chat"><CareerChat /></TabsContent>

        <TabsContent value="mentorship">
          <Card className="mb-6 overflow-hidden">
            <div className="gradient-hero p-6 text-primary-foreground">
              <h2 className="text-xl font-bold mb-2">Ready to find your mentor?</h2>
              <p className="text-primary-foreground/80 mb-4 text-sm">Use Smart Match to find the best-fit alumni for your goals.</p>
              <Link to="/search"><Button size="lg" variant="secondary">Find Alumni →</Button></Link>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {mentorTips.map((t) => (
              <Card key={t.title} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><t.icon className="w-5 h-5 text-primary" /></div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{t.text}</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="mb-6 overflow-hidden">
            <div className="gradient-hero p-6 text-primary-foreground">
              <h2 className="text-xl font-bold mb-2">Browse alumni-posted opportunities</h2>
              <p className="text-primary-foreground/80 mb-4 text-sm">Real jobs and internships posted by AlumniHub members.</p>
              <Link to="/jobs"><Button size="lg" variant="secondary">View Jobs Board →</Button></Link>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {jobTips.map((t) => (
              <Card key={t.title} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2"><t.icon className="w-5 h-5 text-accent" /></div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{t.text}</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
