"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Presentation,
  Loader2,
  Clock,
  Layers,
  Image,
  Type,
  BarChart3,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiClient, type DeckDetail } from "@/lib/api-client";
import type { Slide, SlideType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const templateLabels: Record<string, string> = {
  "modern-dark": "Modern Dark",
  "clean-light": "Clean Light",
  "bold-color": "Bold Color",
};

const slideTypeIcons: Record<SlideType, React.ElementType> = {
  title: Star,
  insight: Type,
  data: BarChart3,
  "case-study": Image,
  closing: Star,
};

const slideTypeColors: Record<SlideType, string> = {
  title: "bg-primary/15 text-primary",
  insight: "bg-blue-500/15 text-blue-400",
  data: "bg-green-500/15 text-green-400",
  "case-study": "bg-purple-500/15 text-purple-400",
  closing: "bg-orange-500/15 text-orange-400",
};

export default function DeckDetailPage() {
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = React.useState<DeckDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function loadDeck() {
    const res = await apiClient.getDeck(deckId);
    if (res.success) {
      setDeck(res.data);
    } else {
      toast.error("Failed to load deck");
    }
    setLoading(false);
  }

  React.useEffect(() => {
    loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Poll while deck is being generated
  React.useEffect(() => {
    if (!deck) return;
    const isInProgress =
      deck.status === "planning" ||
      deck.status === "rendering" ||
      deck.status === "generating";
    if (!isInProgress) return;

    const interval = setInterval(async () => {
      const res = await apiClient.getDeck(deckId);
      if (res.success) {
        setDeck(res.data);
        const stillInProgress =
          res.data.status === "planning" ||
          res.data.status === "rendering" ||
          res.data.status === "generating";
        if (!stillInProgress) {
          clearInterval(interval);
          if (res.data.status === "ready" || res.data.status === "completed") {
            toast.success("Deck generation complete!");
          } else if (res.data.status === "error") {
            toast.error("Deck generation failed");
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [deck, deckId]);

  let slides: Slide[] = [];
  if (deck?.slides) {
    if (Array.isArray(deck.slides)) {
      slides = deck.slides;
    } else if (typeof deck.slides === 'string') {
      try {
        slides = JSON.parse(deck.slides);
      } catch {
        slides = [];
      }
    }
  }

  return (
    <>
      <Header
        title="Deck Detail"
        description={deck?.title ?? "Loading..."}
        onMobileMenuToggle={() => {}}
      >
        <Link href="/decks">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          </div>
        ) : !deck ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Deck not found.</p>
          </div>
        ) : (
          <>
            {/* Metadata */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Presentation className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{deck.title}</h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>
                          {templateLabels[deck.templateId] ?? deck.templateId}
                        </span>
                        <span>&middot;</span>
                        <span>{deck.slideCount} slides</span>
                        <span>&middot;</span>
                        <span>{formatDate(deck.createdAt)}</span>
                        {deck.processingMs && (
                          <>
                            <span>&middot;</span>
                            <span>
                              {(deck.processingMs / 1000).toFixed(1)}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {(deck.status === "ready" || deck.status === "completed") && deck.filePath && (
                    <Button
                      className="gap-2"
                      onClick={async () => {
                        try {
                          await apiClient.downloadDeck(deck.id);
                          toast.success("Download started");
                        } catch {
                          toast.error("Download failed");
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download PPTX
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generating state */}
            {(deck.status === "generating" ||
              deck.status === "planning" ||
              deck.status === "rendering") && (
              <Card className="border-primary/20">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">
                    {deck.status === "planning"
                      ? "Planning slide structure..."
                      : deck.status === "rendering"
                        ? "Rendering PPTX file..."
                        : "Generating your deck..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI is building your slides. This usually takes 30-60 seconds.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error state */}
            {deck.status === "error" && (
              <Card className="border-destructive/30">
                <CardContent className="p-6 text-center">
                  <p className="text-destructive font-medium mb-1">
                    Generation failed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Something went wrong while generating this deck. Please try
                    creating a new one.
                  </p>
                  <Link href="/decks/new" className="mt-4 inline-block">
                    <Button variant="outline">Create New Deck</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Slides */}
            {(deck.status === "ready" || deck.status === "completed") && slides.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Slides ({slides.length})
                </h3>
                <div className="space-y-3">
                  {slides.map((slide, idx) => {
                    const Icon =
                      slideTypeIcons[slide.type] ?? Type;
                    const colorClass =
                      slideTypeColors[slide.type] ?? "bg-muted text-muted-foreground";

                    return (
                      <Card
                        key={idx}
                        className="hover:border-primary/10 transition-colors"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start gap-4">
                            {/* Slide number */}
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold">
                                  {slide.title}
                                </h4>
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {slide.type}
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {slide.content}
                              </p>

                              {slide.sourceAttribution && (
                                <p className="text-xs text-muted-foreground/70">
                                  Source: {slide.sourceAttribution}
                                </p>
                              )}

                              {slide.dataPoints && slide.dataPoints.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {slide.dataPoints.map((dp, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                                    >
                                      <span className="font-medium">
                                        {dp.label}:
                                      </span>{" "}
                                      {dp.value}
                                      {dp.unit && ` ${dp.unit}`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
