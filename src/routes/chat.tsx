import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ErrorNote, Markdown } from "@/components/ai-output";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatReply } from "@/lib/ai.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Workplace Chatbot | Workplace AI" },
      {
        name: "description",
        content: "Ask the AI assistant anything about meetings, planning, writing and day-to-day work.",
      },
      { property: "og:title", content: "Workplace Chatbot | Workplace AI" },
      {
        property: "og:description",
        content: "Ask the AI assistant anything about meetings, planning, writing and day-to-day work.",
      },
    ],
  }),
  component: ChatPage,
});

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  "Help me prepare an agenda for a 30-minute team stand-up.",
  "How do I politely decline a meeting invite from a senior colleague?",
  "Suggest a way to prioritise five competing deadlines this week.",
];

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const reply = useServerFn(chatReply);
  const mutation = useMutation({
    mutationFn: (history: Message[]) => reply({ data: { messages: history } as never }),
    onSuccess: (result) => setMessages((prev) => [...prev, { role: "assistant", content: result.text }]),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mutation.isPending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    const history: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    mutation.mutate(history);
  };

  return (
    <AppShell
      title="Workplace Chatbot"
      description="A conversational assistant for everyday work questions — writing, meetings, planning and prioritisation."
    >
      <div className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card shadow-card">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" />
                Ask anything work-related, or start with one of these:
              </div>
              <div className="grid gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
                    : "max-w-[90%] rounded-xl rounded-bl-sm bg-muted px-4 py-3"
                }
              >
                {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          )}
          {mutation.isError && <ErrorNote message={(mutation.error as Error).message} />}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-end gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about meetings, emails, planning…"
            className="max-h-40 min-h-11 resize-none"
          />
          <Button type="submit" size="icon" className="size-11 shrink-0" disabled={mutation.isPending || !input.trim()}>
            <SendHorizonal className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
