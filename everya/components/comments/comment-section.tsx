"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/everya/empty-state";
import { Surface } from "@/components/ui/surface";
import { formatUsername } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommentData {
  id: string;
  content: string;
  likeCount: number;
  createdAt: string;
  author: { id: string; username: string; name: string | null; image: string | null };
  replies?: CommentData[];
}

export function CommentSection({
  documentId,
  initialComments,
  currentUserId,
}: {
  documentId: string;
  initialComments: CommentData[];
  currentUserId?: string;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (parentId?: string) => {
    if (!content.trim() || !currentUserId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, content, parentId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not post your response. Try again.");
        return;
      }
      const comment = await res.json();
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c))
        );
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setContent("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!currentUserId) return;
    const res = await fetch("/api/comments/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setComments((prev) => updateLikeCount(prev, commentId, data.liked ? 1 : -1));
  };

  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section className="border-t border-border pt-10 mt-4" aria-label="Discussion">
      <h2 className="typo-section-title mb-6 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Discussion
        <span className="typo-meta font-normal">({total})</span>
      </h2>

      {currentUserId ? (
        <Surface variant="bordered" padding="md" className="mb-8">
          {replyTo && (
            <p className="typo-meta mb-3">
              Replying to a comment ·{" "}
              <button type="button" onClick={() => setReplyTo(null)} className="underline">Cancel</button>
            </p>
          )}
          <FormField id="comment-input" label={replyTo ? "Your reply" : "Add a response"} error={error}>
            <Textarea
              id="comment-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts (Markdown supported)…"
              rows={4}
              aria-invalid={!!error}
            />
          </FormField>
          <Button size="sm" className="mt-3" loading={submitting} disabled={!content.trim()} onClick={() => submit(replyTo || undefined)}>
            {replyTo ? "Post reply" : "Post response"}
          </Button>
        </Surface>
      ) : (
        <p className="typo-body-sm text-muted-foreground mb-8">
          <a href="/login" className="underline underline-offset-4">Sign in</a> to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <EmptyState
          title="No responses yet"
          description="Be the first to share your perspective on this article."
        />
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={() => setReplyTo(comment.id)}
              onLike={() => likeComment(comment.id)}
              onReplyLike={(id) => likeComment(id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function updateLikeCount(comments: CommentData[], id: string, delta: number): CommentData[] {
  return comments.map((c) => {
    if (c.id === id) return { ...c, likeCount: Math.max(0, c.likeCount + delta) };
    if (c.replies) return { ...c, replies: updateLikeCount(c.replies, id, delta) };
    return c;
  });
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onLike,
  onReplyLike,
  isReply = false,
}: {
  comment: CommentData;
  currentUserId?: string;
  onReply?: () => void;
  onLike: () => void;
  onReplyLike: (id: string) => void;
  isReply?: boolean;
}) {
  return (
    <article className={cn("group", isReply && "ml-6 sm:ml-10 pl-4 border-l-2 border-border")}>
      <div className="flex gap-3">
        <Avatar src={comment.author.image} name={comment.author.name || comment.author.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="typo-nav">{formatUsername(comment.author.username)}</span>
            <time className="typo-meta" dateTime={comment.createdAt}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <div className="typo-body-sm max-w-none [&_.article-body]:text-[0.9375rem] [&_.article-body]:leading-relaxed">
            <MarkdownRenderer content={comment.content} />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={onLike}
              disabled={!currentUserId}
              aria-label={`Like response (${comment.likeCount})`}
              className="inline-flex items-center gap-1 typo-meta hover:text-foreground disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likeCount > 0 && comment.likeCount}
            </button>
            {!isReply && currentUserId && (
              <button type="button" onClick={onReply} className="typo-meta hover:text-foreground min-h-[44px] px-2">
                Reply
              </button>
            )}
          </div>
          {comment.replies?.map((reply) => (
            <div key={reply.id} className="mt-4">
              <CommentItem
                comment={reply}
                currentUserId={currentUserId}
                onLike={() => onReplyLike(reply.id)}
                onReplyLike={onReplyLike}
                isReply
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
