import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Briefcase, Target, Users, BookOpen, Rocket, MessageCircle, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

export default function Mentorship() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mentorship & Job Guidelines</h1>
        <p className="text-muted-foreground mt-1">Smart strategies to make the most of our alumni network.</p>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="gradient-hero p-8 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Ready to find your mentor?</h2>
          <p className="text-primary-foreground/80 mb-4">Browse our alumni directory and send a personalized request today.</p>
          <Link to="/search"><Button size="lg" variant="secondary">Find Alumni →</Button></Link>
        </div>
      </Card>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Mentorship guidelines</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {mentorTips.map((t) => (
          <Card key={t.title} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{t.text}</p></CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />Job search guidelines</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {jobTips.map((t) => (
          <Card key={t.title} className="transition-smooth hover:shadow-elegant hover:-translate-y-1">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                <t.icon className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{t.text}</p></CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
