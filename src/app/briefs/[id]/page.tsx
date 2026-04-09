"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Loader2,
  Presentation,
  Download,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { InsightCardComponent } from "@/components/briefs/insight-card";
import { TrackFilter } from "@/components/briefs/track-filter";
import {
  apiClient,
  type BriefDetail,
  type InsightReportItem,
} from "@/lib/api-client";
import type { InsightCard, Track } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";
import Link from "next/link";

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params.id as string;

  const [brief, setBrief] = React.useState<BriefDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [trackFilter, setTrackFilter] = React.useState<Track>("all");
  const [feedbackLoading, setFeedbackLoading] = React.useState(false);

  async function loadBrief() {
    const res = await apiClient.getBrief(briefId);
    if (res.success) {
      setBrief(res.data);
    } else {
      toast.error("Failed to load brief");
    }
    setLoading(false);
  }

  React.useEffect(() => {
    loadBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefId]);

  // Poll while analyzing
  React.useEffect(() => {
    if (!brief) return;
    const isAnalyzing =
      brief.status === "analyzing" ||
      brief.status === "parsing" ||
      brief.reports?.some((r) => r.status === "generating");

    if (!isAnalyzing) return;

    const interval = setInterval(async () => {
      const res = await apiClient.getBrief(briefId);
      if (res.success) {
        setBrief(res.data);
        const stillProcessing =
          res.data.status === "analyzing" ||
          res.data.status === "parsing" ||
          res.data.reports?.some((r) => r.status === "generating");
        if (!stillProcessing) {
          clearInterval(interval);
          toast.success("Analysis complete!");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [brief, briefId]);

  async function handleAnalyze() {
    setAnalyzing(true);
    const res = await apiClient.analyzeBrief(briefId, {
      cardCount: 5,
      tracks: ["all"],
    });
    if (res.success) {
      toast.success("Analysis started!");
      await loadBrief();
    } else {
      toast.error("Failed to start analysis", {
        description: res.error.message,
      });
    }
    setAnalyzing(false);
  }

  async function handleFeedback(
    insightId: string,
    feedback: "positive" | "negative"
  ) {
    if (!brief?.reports?.length) return;
    setFeedbackLoading(true);
    const report = brief.reports[brief.reports.length - 1];
    const res = await apiClient.submitFeedback(
      briefId,
      report.id,
      insightId,
      feedback
    );
    if (res.success) {
      toast.success("Feedback submitted");
    }
    setFeedbackLoading(false);
  }

  // Parse latest report insights
  const latestReport = brief?.reports?.[brief.reports.length - 1];
  let insights: InsightCard[] = [];
  if (latestReport?.insights) {
    try {
      insights = JSON.parse(latestReport.insights);
    } catch {
      insights = [];
    }
  }

  const filteredInsights =
    trackFilter === "all"
      ? insights
      : insights.filter((i) => i.track === trackFilter);

  const hasAnalysis =
    latestReport?.status === "completed" && insights.length > 0;
  const isProcessing =
    brief?.status === "analyzing" ||
    brief?.status === "parsing" ||
    latestReport?.status === "generating";

  const canAnalyze =
    brief &&
    (brief.status === "uploaded" || brief.status === "parsed" || brief.status === "analyzed") &&
    !isProcessing;

  return (
    <>
      <Header
        title="Brief Detail"
        description={brief?.originalName ?? "Loading..."}
        onMobileMenuToggle={() => {}}
      >
        <Link href="/briefs">
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
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-52 rounded-lg" />
              ))}
            </div>
          </div>
        ) : !brief ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Brief not found.</p>
          </div>
        ) : (
          <>
            {/* Metadata Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{brief.originalName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(brief.fileSize)}
                        {brief.pageCount && ` \u00b7 ${brief.pageCount} pages`}
                        {" \u00b7 "}Uploaded {formatDate(brief.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canAnalyze && (
                      <Button
                        onClick={handleAnalyze}
                        loading={analyzing}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Analyze Brief
                      </Button>
                    )}
                    {hasAnalysis && (
                      <Link href={`/decks/new?briefId=${briefId}`}>
                        <Button variant="outline" className="gap-2">
                          <Presentation className="h-4 w-4" />
                          Generate Deck
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing state */}
            {isProcessing && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">Analyzing brief...</h3>
                  <p className="text-sm text-muted-foreground">
                    AI is extracting insights from your brief. This usually
                    takes 15-30 seconds.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {hasAnalysis && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Insights ({filteredInsights.length})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI-extracted insights from your brief
                      {latestReport?.processingMs && (
                        <> &middot; Generated in {(latestReport.processingMs / 1000).toFixed(1)}s</>
                      )}
                    </p>
                  </div>
                  <TrackFilter value={trackFilter} onChange={setTrackFilter} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInsights.map((insight, idx) => (
                    <div
                      key={insight.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <InsightCardComponent
                        insight={insight}
                        onFeedback={handleFeedback}
                        feedbackLoading={feedbackLoading}
                      />
                    </div>
                  ))}
                </div>

                {filteredInsights.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      No insights found for the &quot;{trackFilter}&quot; track.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* No analysis yet and not processing */}
            {!hasAnalysis && !isProcessing && brief.status !== "error" && (
              <div className="text-center py-16">
                <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Ready for analysis
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Click &quot;Analyze Brief&quot; to extract AI-powered insights from
                  this document.
                </p>
              </div>
            )}

            {/* Error state */}
            {brief.status === "error" && (
              <Card className="border-destructive/30">
                <CardContent className="p-6 text-center">
                  <p className="text-destructive font-medium mb-1">
                    Analysis failed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {brief.errorMessage ?? "An unexpected error occurred."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAnalyze}
                    loading={analyzing}
                  >
                    Retry Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}
