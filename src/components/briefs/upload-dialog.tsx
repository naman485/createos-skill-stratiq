"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileUp, X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api-client";
import { formatFileSize } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadDialogProps {
  children: React.ReactNode;
}

export function UploadDialog({ children }: UploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Only PDF and DOCX files are supported.";
    }
    if (f.size > MAX_SIZE) {
      return "File must be under 10MB.";
    }
    return null;
  }

  function handleFileSelect(f: File) {
    const error = validateFile(f);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(20);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 85));
    }, 500);

    try {
      const res = await apiClient.uploadBrief(file);
      clearInterval(interval);
      setProgress(100);

      if (res.success) {
        toast.success("Brief uploaded successfully!");
        setTimeout(() => {
          setOpen(false);
          setFile(null);
          setProgress(0);
          router.push(`/briefs/${res.data.id}`);
          router.refresh();
        }, 500);
      } else {
        toast.error("Upload failed", {
          description: res.error.message,
        });
        setProgress(0);
      }
    } catch {
      clearInterval(interval);
      toast.error("Upload failed unexpectedly");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setProgress(0);
    setUploading(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Brief</DialogTitle>
          <DialogDescription>
            Upload a PDF or DOCX marketing brief for AI analysis.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}
            `}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag and drop your brief here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse. PDF or DOCX, max 10MB.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!uploading && (
                <button
                  onClick={reset}
                  className="p-1 rounded hover:bg-accent"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground text-center">
                  {progress < 100 ? "Uploading..." : "Processing..."}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={uploading}
              loading={uploading}
              className="w-full gap-2"
            >
              <FileUp className="h-4 w-4" />
              Upload Brief
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
