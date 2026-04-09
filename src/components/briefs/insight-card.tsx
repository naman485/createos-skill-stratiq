"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { InsightCard as InsightCardType, Track } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: InsightCardType;
  onFeedback?: (insightId: string, feedback: "positive" | "negative") => void;
  feedbackLoading?: boolean;
}

const trackVariant: Record<Track, "creative" | "events" | "art" | "digital" | "strategy" | "all"> = {
  creative: "creative",
  events: "events",
  art: "art",
  digital: "digital",
  strategy: "strategy",
  all: "all",
};

export function InsightCardComponent({
  insight,
  onFeedback,
  feedbackLoading,
}: InsightCardProps) {
  const [localFeedback, setLocalFeedback] = React.useState<
    "positive" | "negative" | null
  >(insight.feedback === "positive" || insight.feedback === "negative" ? insight.feedback : null);

  function handleFeedback(type: "positive" | "negative") {
    if (feedbackLoading) return;
    setLocalFeedback(type);
    onFeedback?.(insight.id, type);
  }

  return (
    <Card className="group hover:border-primary/20 transition-all duration-200">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold leading-snug flex-1">
            {insight.title}
          </h4>
          <Badge variant={trackVariant[insight.track]}>
            {insight.track}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {insight.summary}
        </p>

        {/* Page reference */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span>{insight.pageReference}</span>
        </div>

        {/* Confidence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className="text-xs font-medium">{insight.confidence}%</span>
          </div>
          <Progress value={insight.confidence} className="h-1.5" />
        </div>

        {/* Feedback */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              localFeedback === "positive" && "text-green-400 bg-green-500/10"
            )}
            onClick={() => handleFeedback("positive")}
            disabled={feedbackLoading}
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              localFeedback === "negative" && "text-red-400 bg-red-500/10"
            )}
            onClick={() => handleFeedback("negative")}
            disabled={feedbackLoading}
          >
            <ThumbsDown className="h-3 w-3" />
            Not useful
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
