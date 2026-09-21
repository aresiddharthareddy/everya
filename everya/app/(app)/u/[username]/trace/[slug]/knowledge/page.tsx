import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { getTraceByPath, traceHref, traceDocumentHref, assertCanViewTrace } from "@/services/traces";
import { getTraceKnowledge } from "@/services/knowledge";
import { linkTypeLabel } from "@/services/document-links";
import { KnowledgeNav } from "@/components/navigation/knowledge-nav";
import { formatUsername } from "@/lib/utils";

export default async function TraceKnowledgePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { username, slug } = await params;
  const { doc: selectedSlug } = await searchParams;
  const session = await getServerSession();
  const trace = await getTraceByPath(username, slug);
  if (!trace || !(await assertCanViewTrace(trace, session?.user.id))) notFound();

  const knowledge = await getTraceKnowledge(trace.id, session?.user.id);
  if (!knowledge) notFound();

  const basePath = traceHref(trace);
  const selected = selectedSlug
    ? knowledge.documents.find((d) => d.slug === selectedSlug)
    : knowledge.documents[0];
  const selectedEdges = selected
    ? knowledge.edges.filter((e) => e.fromId === selected.id || e.toId === selected.id)
    : [];

  return (
    <div className="page-container py-page max-w-4xl">
      <KnowledgeNav
        items={[
          { label: formatUsername(trace.owner.username), href: `/u/${trace.owner.username}` },
          { label: trace.name, href: basePath },
          { label: "Knowledge" },
        ]}
      />
      <header className="mb-8">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to trace
        </Link>
        <h1 className="font-serif text-3xl tracking-tight flex items-center gap-2">
          <GitBranch className="h-7 w-7" strokeWidth={1.5} /> Knowledge map
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{trace.name} — documents and relationships</p>
      </header>

      {knowledge.publication && (
        <p className="text-sm mb-6">
          Publication: <Link href={knowledge.publication.href} className="underline">{knowledge.publication.name}</Link>
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Documents</h2>
          <div className="surface-bordered divide-y divide-border">
            {knowledge.documents.map((d) => (
              <Link
                key={d.id}
                href={`${basePath}/knowledge?doc=${d.slug}`}
                className={`block px-4 py-3 text-sm hover:bg-muted/40 ${selected?.slug === d.slug ? "bg-muted/30 font-medium" : ""}`}
              >
                {d.title}
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {selected ? `Connections · ${selected.title}` : "Connections"}
          </h2>
          {selectedEdges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No relationships for this document.</p>
          ) : (
            <div className="surface-bordered divide-y divide-border">
              {selectedEdges.map((e) => {
                const otherId = e.fromId === selected!.id ? e.toId : e.fromId;
                const other = knowledge.documents.find((d) => d.id === otherId);
                const otherSlug = other?.slug;
                return (
                  <Link
                    key={e.id}
                    href={otherSlug ? traceDocumentHref(trace, otherSlug) : basePath}
                    className="block px-4 py-3 text-sm hover:bg-muted/40"
                  >
                    <span className="text-muted-foreground">{linkTypeLabel(e.type)} →</span> {e.fromId === selected!.id ? e.toTitle : e.fromTitle}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {knowledge.relatedTraces.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Related traces</h2>
          <div className="flex flex-wrap gap-2">
            {knowledge.relatedTraces.map((t) => (
              <Link key={t.id} href={t.href} className="chip px-4 py-2 text-sm border rounded-full hover:bg-muted/40">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
