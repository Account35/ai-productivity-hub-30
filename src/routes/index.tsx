import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Check, Wand2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ErrorNote, LoadingLines } from "@/components/ai-output";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      {
        name: "description",
        content: "Draft formal, friendly or persuasive workplace emails with AI and edit them before sending.",
      },
      { property: "og:title", content: "Smart Email Generator | Workplace AI" },
      {
        property: "og:description",
        content: "Draft formal, friendly or persuasive workplace emails with AI and edit them before sending.",
      },
    ],
  }),
  component: EmailPage,
});

const tones = [
  { id: "formal", label: "Formal", hint: "Polished and business-appropriate" },
  { id: "friendly", label: "Friendly", hint: "Warm and approachable" },
  { id: "persuasive", label: "Persuasive", hint: "Confident and convincing" },
] as const;

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]["id"]>("formal");
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useServerFn(generateEmail);
  const mutation = useMutation({
    mutationFn: (vars: { recipient: string; subject: string; tone: string; details: string }) =>
      generate({ data: vars as never }),
    onSuccess: (result) => setDraft(result.text),
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <AppShell
      title="Smart Email Generator"
      description="Describe what you need to say. The assistant writes a complete draft in your chosen tone, which you can edit before sending."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display text-sm font-semibold tracking-tight text-card-foreground">Email brief</h2>
          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!details.trim()) return;
              mutation.mutate({ recipient, subject, tone, details });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  placeholder="e.g. Head of Operations"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Purpose or subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Project deadline extension"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    aria-pressed={tone === t.id}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      tone === t.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug opacity-70">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">What should the email say?</Label>
              <Textarea
                id="details"
                rows={7}
                placeholder="Ask the client for a two-week extension on the audit report, apologise for the delay and propose a new delivery date."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending || !details.trim()}>
              <Wand2 className="size-4" />
              {mutation.isPending ? "Generating…" : "Generate email"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold tracking-tight text-card-foreground">
              Generated draft
            </h2>
            {draft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(draft);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>

          <div className="mt-5">
            {mutation.isPending && <LoadingLines />}
            {!mutation.isPending && mutation.isError && (
              <ErrorNote message={(mutation.error as Error).message} />
            )}
            {!mutation.isPending && !mutation.isError && !draft && (
              <p className="text-sm text-muted-foreground">
                Your AI-written email will appear here and stays fully editable.
              </p>
            )}
            {!mutation.isPending && draft && (
              <Textarea
                rows={18}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="font-sans text-sm leading-relaxed"
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
