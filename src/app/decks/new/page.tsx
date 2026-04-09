"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Presentation,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, type BriefListItem } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Sleek dark theme with electric blue accents. Premium and professional.",
    colors: ["#0f172a", "#4361ee", "#f8fafc"],
  },
  {
    id: "clean-light",
    name: "Clean Light",
    description: "Minimal white design with soft shadows. Clean and elegant.",
    colors: ["#ffffff", "#4361ee", "#64748b"],
  },
  {
    id: "bold-color",
    name: "Bold Color",
    description: "Vibrant gradients and bold typography. Creative and energetic.",
    colors: ["#7c3aed", "#f43f5e", "#fbbf24"],
  },
];

const STEPS = ["Select Brief", "Choose Template", "Configure"];

export default function NewDeckPage() {
  return (
    <React.Suspense fallback={<div />}>
      <NewDeckPageContent />
    </React.Suspense>
  );
}

function NewDeckPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBriefId = searchParams.get("briefId");

  const [step, setStep] = React.useState(preselectedBriefId ? 1 : 0);
  const [briefs, setBriefs] = React.useState<BriefListItem[]>([]);
  const [loadingBriefs, setLoadingBriefs] = React.useState(true);
  const [selectedBriefId, setSelectedBriefId] = React.useState(
    preselectedBriefId ?? ""
  );
  const [selectedTemplate, setSelectedTemplate] = React.useState("modern-dark");
  const [title, setTitle] = React.useState("");
  const [slideCount, setSlideCount] = React.useState(15);
  const [generating, setGenerating] = React.useState(false);
  const [genStatus, setGenStatus] = React.useState("");

  React.useEffect(() => {
    async function load() {
      const res = await apiClient.listBriefs();
      if (res.success) {
        const analyzed = res.data.filter(
          (b) => b.status === "analyzed" || b.status === "parsed"
        );
        setBriefs(analyzed);

        if (preselectedBriefId) {
          const found = analyzed.find((b) => b.id === preselectedBriefId);
          if (found) {
            setTitle(`Strategy Deck - ${found.originalName.replace(/\.[^.]+$/, "")}`);
          }
        }
      }
      setLoadingBriefs(false);
    }
    load();
  }, [preselectedBriefId]);

  function canProceed(): boolean {
    if (step === 0) return !!selectedBriefId;
    if (step === 1) return !!selectedTemplate;
    if (step === 2) return title.trim().length > 0 && slideCount >= 10 && slideCount <= 25;
    return false;
  }

  function handleNext() {
    if (step === 0 && !title) {
      const brief = briefs.find((b) => b.id === selectedBriefId);
      if (brief) {
        setTitle(
          `Strategy Deck - ${brief.originalName.replace(/\.[^.]+$/, "")}`
        );
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  async function handleGenerate() {
    if (!canProceed()) return;
    setGenerating(true);
    setGenStatus("Planning deck structure...");

    const timer1 = setTimeout(() => setGenStatus("Generating slides..."), 3000);
    const timer2 = setTimeout(
      () => setGenStatus("Building presentation..."),
      8000
    );

    try {
      const res = await apiClient.generateDeck({
        briefId: selectedBriefId,
        template: selectedTemplate,
        title: title.trim(),
        slideCount,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.success) {
        toast.success("Deck generated!");
        router.push(`/decks/${res.data.id}`);
      } else {
        toast.error("Generation failed", { description: res.error.message });
      }
    } catch {
      clearTimeout(timer1);
      clearTimeout(timer2);
      toast.error("Generation failed unexpectedly");
    } finally {
      setGenerating(false);
      setGenStatus("");
    }
  }

  return (
    <>
      <Header
        title="Create New Deck"
        description="Generate a strategy presentation from your brief insights."
        onMobileMenuToggle={() => {}}
      >
        <Link href="/decks">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-8">
        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, idx) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    idx < step
                      ? "bg-primary text-primary-foreground"
                      : idx === step
                        ? "bg-primary/20 text-primary border border-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {idx < step ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm hidden sm:inline",
                    idx === step
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px",
                    idx < step ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Select Brief */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Select a Brief</h2>
              <p className="text-sm text-muted-foreground">
                Choose an analyzed brief to generate your deck from.
              </p>
            </div>

            {loadingBriefs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : briefs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No analyzed briefs available. Upload and analyze a brief
                    first.
                  </p>
                  <Link href="/briefs">
                    <Button variant="outline">Go to Briefs</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {briefs.map((brief) => (
                  <Card
                    key={brief.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedBriefId === brief.id
                        ? "border-primary ring-1 ring-primary"
                        : "hover:border-muted-foreground/30"
                    )}
                    onClick={() => setSelectedBriefId(brief.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedBriefId === brief.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selectedBriefId === brief.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {brief.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {brief.pageCount} pages &middot; {brief._count?.reports ?? 0} reports
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Choose Template</h2>
              <p className="text-sm text-muted-foreground">
                Select a visual style for your strategy deck.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTemplate === tpl.id
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setSelectedTemplate(tpl.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Color preview */}
                    <div className="flex gap-1">
                      {tpl.colors.map((color, i) => (
                        <div
                          key={i}
                          className="h-16 flex-1 rounded-md border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tpl.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Configure Deck</h2>
              <p className="text-sm text-muted-foreground">
                Set the title and slide count for your presentation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Deck Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 Strategy Presentation"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideCount">
                  Slide Count: {slideCount}
                </Label>
                <input
                  id="slideCount"
                  type="range"
                  min={10}
                  max={25}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 slides</span>
                  <span>25 slides</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">Summary</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Brief:{" "}
                    {briefs.find((b) => b.id === selectedBriefId)?.originalName}
                  </p>
                  <p>
                    Template:{" "}
                    {TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                  </p>
                  <p>Slides: {slideCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generation overlay */}
        {generating && (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <h3 className="font-semibold mb-1">Generating your deck...</h3>
              <p className="text-sm text-muted-foreground">{genStatus}</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!generating && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-1"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!canProceed() || generating}
                loading={generating}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Deck
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
