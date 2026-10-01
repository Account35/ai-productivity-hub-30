import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol>li]:list-decimal [&_strong]:font-semibold [&_ul]:space-y-1.5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function LoadingLines() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-muted"
          style={{ width: `${[95, 88, 70, 80][i]}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      {message}
    </p>
  );
}
