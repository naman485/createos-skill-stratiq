"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Upload, Clock, FileStack } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/briefs/upload-dialog";
import { apiClient, type BriefListItem } from "@/lib/api-client";
import { formatDate, formatFileSize } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  uploaded: "secondary",
  parsing: "outline",
  parsed: "outline",
  analyzing: "outline",
  analyzed: "default",
  ready: "default",
  error: "destructive",
};

export default function BriefsPage() {
  const [briefs, setBriefs] = React.useState<BriefListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const res = await apiClient.listBriefs();
      if (res.success) {
        setBriefs(res.data);
      } else {
        toast.error("Failed to load briefs");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Header
        title="Briefs"
        description="Upload and analyze marketing briefs with AI."
        onMobileMenuToggle={() => {}}
      >
        <UploadDialog>
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Brief
          </Button>
        </UploadDialog>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : briefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileStack className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No briefs yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Upload your first marketing brief to get started with AI-powered
              analysis and insight extraction.
            </p>
            <UploadDialog>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Your First Brief
              </Button>
            </UploadDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map((brief) => (
              <Link key={brief.id} href={`/briefs/${brief.id}`}>
                <Card className="h-full hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={statusVariant[brief.status] ?? "secondary"}>
                        {brief.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {brief.originalName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(brief.fileSize)}
                        {brief.pageCount && ` \u00b7 ${brief.pageCount} pages`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(brief.createdAt)}
                      </div>
                      {brief._count?.reports != null && brief._count.reports > 0 && (
                        <span>
                          {brief._count.reports} report{brief._count.reports > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
