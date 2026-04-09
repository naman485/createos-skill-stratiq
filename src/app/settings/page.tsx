"use client";

import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <>
      <Header
        title="Settings"
        description="Manage your account settings."
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={session?.user?.name ?? ""}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={session?.user?.email ?? ""}
                readOnly
                className="bg-muted/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About STRATIQ</CardTitle>
            <CardDescription>
              AI-powered brief intelligence and deck generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Version 1.0.0</p>
              <p>Powered by NodeOps</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
