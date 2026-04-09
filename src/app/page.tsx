import Link from "next/link";
import { FileText, Presentation, ArrowRight, Sparkles, Shield, Zap, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090a] relative overflow-hidden">
      {/* Ambient glow — Linear-style radial */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#5e6ad2]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#5e6ad2]/4 rounded-full blur-[120px]" />
      </div>

      {/* Nav — minimal, precise */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#5e6ad2] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#f7f8f8]">STRATIQ</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-28 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[13px] text-[#8a8f98] mb-10 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-[#7170ff]" />
          AI-Powered Strategy Intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[72px] font-medium tracking-[-0.04em] leading-[1.0] mb-7 text-[#f7f8f8] animate-slide-up">
          Your brief is read.
          <br />
          <span className="text-gradient-accent">Your deck is ready.</span>
        </h1>

        <p className="text-[17px] text-[#8a8f98] max-w-xl mb-12 leading-relaxed animate-slide-up stagger-1" style={{ fontWeight: 400 }}>
          STRATIQ analyzes marketing briefs with AI precision and generates
          strategy decks in minutes. Built for agencies that move fast.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-24 animate-slide-up stagger-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md bg-[#5e6ad2] text-white font-medium text-[15px] hover:bg-[#6872d6] transition-all shadow-[0_0_0_1px_rgba(94,106,210,0.3),0_0_20px_rgba(94,106,210,0.15)]"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md bg-white/[0.02] border border-white/[0.08] text-[#d0d6e0] font-medium text-[15px] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
          >
            View Demo
          </Link>
        </div>

        {/* Feature Cards — glass surfaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
          <div className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-7 text-left hover:border-[#5e6ad2]/30 hover:bg-white/[0.03] transition-all duration-300 animate-slide-up stagger-3">
            <div className="w-10 h-10 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center mb-5 group-hover:bg-[#5e6ad2]/15 transition-colors">
              <FileText className="w-5 h-5 text-[#7170ff]" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#f7f8f8] mb-2.5 tracking-[-0.01em]">Brief Intelligence</h3>
            <p className="text-[15px] text-[#62666d] leading-relaxed">
              Upload any brief and get structured insights in seconds. AI extracts
              key themes across creative, events, digital, art, and strategy tracks.
            </p>
          </div>

          <div className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-7 text-left hover:border-[#5e6ad2]/30 hover:bg-white/[0.03] transition-all duration-300 animate-slide-up stagger-4">
            <div className="w-10 h-10 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center mb-5 group-hover:bg-[#5e6ad2]/15 transition-colors">
              <Presentation className="w-5 h-5 text-[#7170ff]" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#f7f8f8] mb-2.5 tracking-[-0.01em]">Deck Builder</h3>
            <p className="text-[15px] text-[#62666d] leading-relaxed">
              Transform insights into polished strategy decks. Choose from premium
              templates and download presentation-ready PPTX files.
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mt-16 animate-fade-in stagger-5">
          <div className="flex items-center gap-3 justify-center">
            <Shield className="w-4 h-4 text-[#27a644]" />
            <span className="text-[13px] text-[#62666d]">Zero Data Retention</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Clock className="w-4 h-4 text-[#7170ff]" />
            <span className="text-[13px] text-[#62666d]">7 hours → 28 minutes</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Sparkles className="w-4 h-4 text-[#7170ff]" />
            <span className="text-[13px] text-[#62666d]">NDA Compliant</span>
          </div>
        </div>
      </main>

      {/* Footer — minimal */}
      <footer className="relative z-10 text-center pb-8 pt-12 border-t border-white/[0.04]">
        <p className="text-[12px] text-[#62666d]">
          Powered by{" "}
          <a
            href="https://nodeops.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
          >
            NodeOps
          </a>
          {" "}&middot;{" "}
          Deployed on{" "}
          <a
            href="https://createos.nodeops.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
          >
            CreateOS
          </a>
        </p>
      </footer>
    </div>
  );
}
