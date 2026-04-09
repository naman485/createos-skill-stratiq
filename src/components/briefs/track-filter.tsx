"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/types";

const TRACK_OPTIONS: { value: Track; label: string }[] = [
  { value: "all", label: "All" },
  { value: "creative", label: "Creative" },
  { value: "events", label: "Events" },
  { value: "art", label: "Art" },
  { value: "digital", label: "Digital" },
  { value: "strategy", label: "Strategy" },
];

interface TrackFilterProps {
  value: Track;
  onChange: (track: Track) => void;
}

export function TrackFilter({ value, onChange }: TrackFilterProps) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onChange(v as Track)}>
      <Tabs.List className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/50">
        {TRACK_OPTIONS.map((track) => (
          <Tabs.Trigger
            key={track.value}
            value={track.value}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            )}
          >
            {track.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
