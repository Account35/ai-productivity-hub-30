import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ErrorNote, LoadingLines, Markdown } from "@/components/ai-output";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runResearch } from "@/lib/ai.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Workplace AI" },
      {
        name: "description",
        content: "Turn a topic, article or link into a summary, key insights and clear recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant | Workplace AI" },
      {
        property: "og:description",
        content: "Turn a topic, article or link into a summary, key insights and clear recommendations.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [input, setInput] = useState("");
  const research = useServerFn(runResearch);
  const mutation = useMutation({
    mutationFn: (value: string) => research({ data: { input: value } as never }),
  });

  return (
    <AppShell
      title="AI Research Assistant"
      description="Paste a topic, an article, or a link. You get a summary, the key insights and recommendations you can act on."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) mutation.mutate(input.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="topic">Topic, article text, or URL</Label>
              <Textarea
                id="topic"
                rows={8}
                placeholder="e.g. How hybrid work policies affect team productivity — or paste an article or link."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending || !input.trim()}>
              <Search className="size-4" />
              {mutation.isPending ? "Analysing…" : "Run research"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-semibold tracking-tight text-card-foreground">Results</h2>
          <div className="mt-5">
            {mutation.isPending && <LoadingLines />}
            {!mutation.isPending && mutation.isError && (
              <ErrorNote message={(mutation.error as Error).message} />
            )}
            {!mutation.isPending && !mutation.isError && !mutation.data && (
              <p className="text-sm text-muted-foreground">
                Summary, key insights and recommendations will appear here.
              </p>
            )}
            {!mutation.isPending && mutation.data && <Markdown>{mutation.data.text}</Markdown>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
