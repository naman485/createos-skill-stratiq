import Link from "next/link";
import { FileText, Presentation, ArrowRight, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">STRATIQ</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-16 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground mb-8 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-primary" />
          AI-Powered Strategy Intelligence
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-slide-up">
          Your brief is read.
          <br />
          <span className="text-primary">Your deck is ready.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up stagger-1">
          STRATIQ analyzes marketing briefs with AI precision and generates
          strategy decks in minutes. Built for agencies that move fast.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 animate-slide-up stagger-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-border text-foreground font-medium text-base hover:bg-accent transition-colors"
          >
            View Demo
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="group relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 text-left hover:border-primary/30 transition-all duration-300 animate-slide-up stagger-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Brief Intelligence</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload any brief and get structured insights in seconds. AI extracts
              key themes across creative, events, digital, art, and strategy tracks.
            </p>
          </div>

          <div className="group relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 text-left hover:border-primary/30 transition-all duration-300 animate-slide-up stagger-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <Presentation className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Deck Builder</h3>
            <p className="text-muted-foreground leading-relaxed">
              Transform insights into polished strategy decks. Choose from premium
              templates and download presentation-ready PPTX files.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 pt-16">
        <p className="text-sm text-muted-foreground/60">
          Powered by{" "}
          <a
            href="https://nodeops.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            NodeOps
          </a>
        </p>
      </footer>
    </div>
  );
}
