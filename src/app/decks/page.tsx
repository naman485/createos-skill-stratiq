"use client";

import * as React from "react";
import Link from "next/link";
import {
  Presentation,
  Plus,
  Download,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type DeckListItem } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

const templateLabels: Record<string, string> = {
  "modern-dark": "Modern Dark",
  "clean-light": "Clean Light",
  "bold-color": "Bold Color",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  generating: "outline",
  completed: "default",
  error: "destructive",
};

export default function DecksPage() {
  const [decks, setDecks] = React.useState<DeckListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const res = await apiClient.listDecks();
      if (res.success) {
        setDecks(res.data);
      } else {
        toast.error("Failed to load decks");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Header
        title="Decks"
        description="Generate and download strategy presentations."
        onMobileMenuToggle={() => {}}
      >
        <Link href="/decks/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Deck
          </Button>
        </Link>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Presentation className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No decks yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Generate your first strategy deck from analyzed brief insights.
            </p>
            <Link href="/decks/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Deck
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card
                key={deck.id}
                className="group hover:border-primary/20 transition-all duration-200"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Presentation className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={statusVariant[deck.status] ?? "secondary"}>
                      {deck.status}
                    </Badge>
                  </div>

                  <div>
                    <Link href={`/decks/${deck.id}`}>
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors cursor-pointer">
                        {deck.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {templateLabels[deck.templateId] ?? deck.templateId}
                      {" \u00b7 "}
                      {deck.slideCount} slides
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(deck.createdAt)}
                    </div>
                    {deck.status === "completed" && deck.filePath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={async () => {
                          try {
                            await apiClient.downloadDeck(deck.id);
                            toast.success("Download started");
                          } catch {
                            toast.error("Download failed");
                          }
                        }}
                      >
                        <Download className="h-3 w-3" />
                        PPTX
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
