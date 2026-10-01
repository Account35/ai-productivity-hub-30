import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type AiMessage = { role: "user" | "assistant"; content: string };

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the Lovable AI Gateway Responses API with streaming, accumulates the
 * streamed text server-side and returns the final answer.
 */
export async function callAi(instructions: string, messages: AiMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("The AI service is not configured.", 401);

  const gateway = createLovableAiGatewayRunIdFetch();
  const response = await gateway.fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    let message = "The AI service could not complete this request.";
    if (response.status === 429) message = "Too many requests right now. Please try again in a moment.";
    if (response.status === 402) message = "AI credits have run out for this workspace.";
    if (response.status === 403) message = "This AI request was not permitted.";
    try {
      const parsed = JSON.parse(detail);
      if (typeof parsed?.error?.message === "string") message = parsed.error.message;
      else if (typeof parsed?.message === "string") message = parsed.message;
    } catch {
      /* keep default message */
    }
    throw new AiError(message, response.status || 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let index: number;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);

      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }
        const type = event["type"];
        if (type === "response.output_text.delta" && typeof event["delta"] === "string") {
          text += event["delta"] as string;
        } else if (type === "error" || type === "response.failed") {
          const err = (event["error"] ?? event["response"]) as { message?: string } | undefined;
          throw new AiError(err?.message ?? "The AI response failed.", 500);
        }
      }
    }
  }

  const result = text.trim();
  if (!result) throw new AiError("The AI returned an empty response. Please try again.", 500);
  return result;
}
