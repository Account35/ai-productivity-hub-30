import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.object({
  recipient: z.string().max(200).optional().default(""),
  subject: z.string().max(300).optional().default(""),
  tone: z.enum(["formal", "friendly", "persuasive"]),
  details: z.string().min(1).max(4000),
});

const researchSchema = z.object({
  input: z.string().min(1).max(12000),
});

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1)
    .max(40),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    const { callAi, AiError } = await import("./ai/gateway.server.ts");
    const instructions = [
      "You are an expert workplace communication assistant.",
      "Write a complete, ready-to-send professional email based on the user's brief.",
      `Use a ${data.tone} tone throughout.`,
      "Return plain text only: a 'Subject:' line, then the email body with a greeting, clear paragraphs and a sign-off.",
      "Do not add commentary, options or markdown code fences. Keep it under 300 words.",
    ].join(" ");

    const brief = [
      data.recipient ? `Recipient: ${data.recipient}` : null,
      data.subject ? `Desired subject / purpose: ${data.subject}` : null,
      `What the email must say: ${data.details}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      return { text: await callAi(instructions, [{ role: "user", content: brief }]) };
    } catch (error) {
      throw new Error(error instanceof AiError ? error.message : "The email could not be generated.");
    }
  });

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => researchSchema.parse(data))
  .handler(async ({ data }) => {
    const { callAi, AiError } = await import("./ai/gateway.server.ts");
    const instructions = [
      "You are a workplace research analyst.",
      "The user gives you a topic, pasted article text, or a URL.",
      "If it is a URL you cannot open, reason from what the URL and your knowledge indicate and state that assumption in one short line.",
      "Respond in markdown with exactly these three sections, in order:",
      "## Summary (one tight paragraph), ## Key Insights (4-6 bullets), ## Recommendations (3-5 actionable bullets).",
      "Be specific and concise. No preamble before the first heading.",
    ].join(" ");

    try {
      return { text: await callAi(instructions, [{ role: "user", content: data.input }]) };
    } catch (error) {
      throw new Error(error instanceof AiError ? error.message : "The research could not be completed.");
    }
  });

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data }) => {
    const { callAi, AiError } = await import("./ai/gateway.server.ts");
    const instructions = [
      "You are a helpful workplace productivity assistant for an office professional.",
      "Help with writing, meetings, planning, prioritisation, workplace communication and general work questions.",
      "Be concise and practical. Use short markdown lists where they help.",
      "Decline politely if a request is unrelated to work or asks for harmful or confidential-sensitive handling.",
    ].join(" ");

    try {
      return { text: await callAi(instructions, data.messages) };
    } catch (error) {
      throw new Error(error instanceof AiError ? error.message : "The assistant could not reply.");
    }
  });
