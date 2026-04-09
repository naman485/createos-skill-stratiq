"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileText,
  Presentation,
  Lightbulb,
  Clock,
  Upload,
  Plus,
  ArrowRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type DashboardStats } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  uploaded: "secondary",
  parsing: "outline",
  parsed: "outline",
  analyzing: "outline",
  analyzed: "default",
  ready: "default",
  error: "destructive",
  generating: "outline",
  completed: "default",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const res = await apiClient.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      } else {
        toast.error("Failed to load dashboard data");
      }
      setLoading(false);
    }
    load();
  }, []);

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  const statCards = [
    {
      title: "Total Briefs",
      value: stats?.totalBriefs ?? 0,
      icon: FileText,
      color: "text-blue-400",
    },
    {
      title: "Insights Generated",
      value: stats?.totalInsights ?? 0,
      icon: Lightbulb,
      color: "text-yellow-400",
    },
    {
      title: "Total Decks",
      value: stats?.totalDecks ?? 0,
      icon: Presentation,
      color: "text-green-400",
    },
    {
      title: "Time Saved",
      value: `${stats?.timeSavedHours ?? 0}h`,
      icon: Clock,
      color: "text-purple-400",
    },
  ];

  return (
    <>
      <Header
        title={`Welcome back, ${userName}`}
        description="Here's what's happening with your strategy work."
        onMobileMenuToggle={() => {}}
      >
        <Link href="/briefs">
          <Button size="sm" variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Brief
          </Button>
        </Link>
        <Link href="/decks/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Deck
          </Button>
        </Link>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Briefs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Briefs</CardTitle>
                <Link href="/briefs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !stats?.recentBriefs?.length ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No briefs yet.
                  </p>
                  <Link href="/briefs" className="mt-2 inline-block">
                    <Button variant="link" size="sm">
                      Upload your first brief
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentBriefs.map((brief) => (
                    <Link
                      key={brief.id}
                      href={`/briefs/${brief.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {brief.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(brief.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          statusVariant[brief.status] ?? "secondary"
                        }
                      >
                        {brief.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Decks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Decks</CardTitle>
                <Link href="/decks">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !stats?.recentDecks?.length ? (
                <div className="text-center py-8">
                  <Presentation className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No decks yet.
                  </p>
                  <Link href="/decks/new" className="mt-2 inline-block">
                    <Button variant="link" size="sm">
                      Create your first deck
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Link
                        href={`/decks/${deck.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <Presentation className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                            {deck.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deck.slideCount} slides &middot;{" "}
                            {formatDate(deck.createdAt)}
                          </p>
                        </div>
                      </Link>
                      {deck.status === "completed" && deck.filePath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              await apiClient.downloadDeck(deck.id);
                              toast.success("Download started");
                            } catch {
                              toast.error("Download failed");
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
