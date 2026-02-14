import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, MapPin, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const features = [
  { icon: Users, title: "Find Learning Partners", desc: "Match with students who teach what you want to learn" },
  { icon: BookOpen, title: "Exchange Skills", desc: "Trade knowledge instead of money — Python for Canva, and more" },
  { icon: MapPin, title: "Campus Map", desc: "See where your connections are on the SRM AP campus" },
  { icon: MessageCircle, title: "Real-Time Chat & Calls", desc: "Connect instantly with chat, audio, and video calls" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Skill Exchange" className="h-10 w-10" />
            <span className="text-xl font-bold text-primary">Skill Exchange</span>
          </div>
          <Link to="/auth">
            <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </nav>

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              Exchange Skills,{" "}
              <span className="text-primary">Not Money</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The exclusive skill exchange platform for SRM AP University students.
              Teach Python, learn Canva — find your perfect learning partner on campus.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Join Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Skill Exchange — SRM AP University</p>
      </footer>
    </div>
  );
}
