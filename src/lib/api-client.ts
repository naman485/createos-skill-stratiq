import type { ApiResponse, InsightCard, Slide, Track } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

export interface BriefListItem {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { reports: number };
}

export interface BriefDetail extends BriefListItem {
  textContent: string | null;
  errorMessage: string | null;
  reports: InsightReportItem[];
}

export interface InsightReportItem {
  id: string;
  briefId: string;
  insights: string; // JSON string of InsightCard[]
  trackFilter: string | null;
  cardCount: number;
  status: string;
  processingMs: number | null;
  createdAt: string;
}

export interface DeckListItem {
  id: string;
  title: string;
  templateId: string;
  status: string;
  filePath: string | null;
  processingMs: number | null;
  slideCount: number;
  createdAt: string;
  briefId: string | null;
}

export interface DeckDetail extends DeckListItem {
  slides: string; // JSON string of Slide[]
  reportId: string | null;
}

export interface DashboardStats {
  totalBriefs: number;
  totalInsights: number;
  totalDecks: number;
  timeSavedHours: number;
  recentBriefs: BriefListItem[];
  recentDecks: DeckListItem[];
}

// ---------------------------------------------------------------------------
// Generic fetch wrapper
// ---------------------------------------------------------------------------

class ApiClient {
  private baseUrl = "";

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const json = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: {
            code: json?.error?.code ?? "REQUEST_FAILED",
            message:
              json?.error?.message ??
              `Request failed with status ${res.status}`,
          },
        };
      }

      return json as ApiResponse<T>;
    } catch (err) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            err instanceof Error ? err.message : "Network request failed",
        },
      };
    }
  }

  // -------------------------------------------------------------------------
  // Briefs
  // -------------------------------------------------------------------------

  async uploadBrief(file: File): Promise<ApiResponse<BriefDetail>> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/briefs/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: {
            code: json?.error?.code ?? "UPLOAD_FAILED",
            message: json?.error?.message ?? "File upload failed",
          },
        };
      }
      return json;
    } catch (err) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            err instanceof Error ? err.message : "Upload request failed",
        },
      };
    }
  }

  async listBriefs(): Promise<ApiResponse<BriefListItem[]>> {
    return this.request<BriefListItem[]>("/api/briefs");
  }

  async getBrief(id: string): Promise<ApiResponse<BriefDetail>> {
    return this.request<BriefDetail>(`/api/briefs/${id}`);
  }

  async analyzeBrief(
    id: string,
    options: { cardCount?: number; tracks?: Track[] } = {}
  ): Promise<ApiResponse<InsightReportItem>> {
    return this.request<InsightReportItem>(`/api/briefs/${id}/analyze`, {
      method: "POST",
      body: JSON.stringify({
        cardCount: options.cardCount ?? 5,
        tracks: options.tracks ?? ["all"],
      }),
    });
  }

  async submitFeedback(
    briefId: string,
    reportId: string,
    insightId: string,
    feedback: "positive" | "negative"
  ): Promise<ApiResponse<{ updated: boolean }>> {
    return this.request(`/api/briefs/${briefId}/reports/${reportId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ insightId, feedback }),
    });
  }

  // -------------------------------------------------------------------------
  // Decks
  // -------------------------------------------------------------------------

  async generateDeck(options: {
    briefId: string;
    reportId?: string;
    template: string;
    title: string;
    slideCount: number;
  }): Promise<ApiResponse<DeckDetail>> {
    return this.request<DeckDetail>("/api/decks/generate", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async listDecks(): Promise<ApiResponse<DeckListItem[]>> {
    return this.request<DeckListItem[]>("/api/decks");
  }

  async getDeck(id: string): Promise<ApiResponse<DeckDetail>> {
    return this.request<DeckDetail>(`/api/decks/${id}`);
  }

  async downloadDeck(id: string): Promise<void> {
    const res = await fetch(`/api/decks/${id}/download`);
    if (!res.ok) {
      throw new Error("Download failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deck-${id}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async updateSlide(
    deckId: string,
    slideIdx: number,
    data: Partial<Slide>
  ): Promise<ApiResponse<DeckDetail>> {
    return this.request<DeckDetail>(`/api/decks/${deckId}/slides/${slideIdx}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>("/api/dashboard");
  }
}

export const apiClient = new ApiClient();
