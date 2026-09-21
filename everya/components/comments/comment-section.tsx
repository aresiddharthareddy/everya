"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Flag, MessageSquare, ThumbsUp, Trash2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/everya/empty-state";
import { ErrorState } from "@/components/everya/error-state";
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

function removeComment(comments: CommentData[], id: string): CommentData[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeComment(c.replies, id) : c.replies,
    }));
}

export function CommentSection({
  documentId,
  initialComments,
  currentUserId,
  canModerate = false,
}: {
  documentId: string;
  initialComments: CommentData[];
  currentUserId?: string;
  canModerate?: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reported, setReported] = useState<Set<string>>(new Set());

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

  const deleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete comment. Try again.");
      return;
    }
    setComments((prev) => removeComment(prev, commentId));
  };

  const reportComment = async (commentId: string) => {
    const reason = window.prompt("Why are you reporting this comment?");
    if (!reason?.trim()) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: commentId, reason: reason.trim() }),
    });
    if (!res.ok) {
      setError("Could not submit report. Try again.");
      return;
    }
    setReported((prev) => new Set(prev).add(commentId));
  };

  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section id="discussion" className="border-t border-border pt-10 mt-4 scroll-mt-20" aria-label="Discussion">
      <h2 className="typo-section-title mb-6 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
        Discussion
        <span className="typo-meta font-normal">({total})</span>
      </h2>

      {currentUserId ? (
        <Surface variant="bordered" padding="md" className="mb-8 sticky bottom-4 z-10 sm:static sm:z-auto bg-background/95 backdrop-blur-sm sm:backdrop-blur-none">
          {replyTo && (
            <p className="typo-meta mb-3">
              Replying to a comment ·{" "}
              <button type="button" onClick={() => setReplyTo(null)} className="underline min-h-[44px]">
                Cancel
              </button>
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
              className="min-h-[88px] text-base sm:text-sm"
            />
          </FormField>
          <Button
            size="sm"
            className="mt-3 min-h-[44px]"
            loading={submitting}
            disabled={!content.trim()}
            onClick={() => submit(replyTo || undefined)}
          >
            {replyTo ? "Post reply" : "Post response"}
          </Button>
        </Surface>
      ) : (
        <Surface variant="bordered" padding="md" className="mb-8 text-center sm:text-left">
          <p className="typo-body-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4 font-medium text-foreground">
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        </Surface>
      )}

      {error && !submitting && comments.length > 0 && (
        <div className="mb-6">
          <ErrorState
            title="Action failed"
            message={error}
            onRetry={() => setError("")}
            retryLabel="Dismiss"
          />
        </div>
      )}

      {comments.length === 0 ? (
        <EmptyState
          title="No responses yet"
          description={
            currentUserId
              ? "Be the first to share your perspective on this article."
              : "Sign in to start the conversation."
          }
        />
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              canModerate={canModerate}
              reported={reported.has(comment.id)}
              onReply={() => {
                setReplyTo(comment.id);
                document.getElementById("comment-input")?.focus();
              }}
              onLike={() => likeComment(comment.id)}
              onDelete={() => deleteComment(comment.id)}
              onReport={() => reportComment(comment.id)}
              onReplyLike={(id) => likeComment(id)}
              onReplyDelete={deleteComment}
              onReplyReport={reportComment}
              reportedReplies={reported}
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
  canModerate,
  reported,
  onReply,
  onLike,
  onDelete,
  onReport,
  onReplyLike,
  onReplyDelete,
  onReplyReport,
  reportedReplies,
  isReply = false,
}: {
  comment: CommentData;
  currentUserId?: string;
  canModerate: boolean;
  reported?: boolean;
  onReply?: () => void;
  onLike: () => void;
  onDelete: () => void;
  onReport: () => void;
  onReplyLike: (id: string) => void;
  onReplyDelete: (id: string) => void;
  onReplyReport: (id: string) => void;
  reportedReplies?: Set<string>;
  isReply?: boolean;
}) {
  const isOwn = currentUserId === comment.author.id;
  const canDelete = currentUserId && (isOwn || canModerate);

  return (
    <article className={cn("group", isReply && "ml-2 sm:ml-10 pl-3 sm:pl-4 border-l-2 border-border")}>
      <div className="flex gap-3">
        <Avatar src={comment.author.image} name={comment.author.name || comment.author.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link href={`/u/${comment.author.username}`} className="typo-nav hover:underline">
              {formatUsername(comment.author.username)}
            </Link>
            <time className="typo-meta" dateTime={comment.createdAt}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <div className="typo-body-sm max-w-none break-words [&_.article-body]:text-[0.9375rem] [&_.article-body]:leading-relaxed">
            <MarkdownRenderer content={comment.content} />
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-3 mt-3">
            <button
              type="button"
              onClick={onLike}
              disabled={!currentUserId}
              aria-label={`Like response (${comment.likeCount})`}
              className="inline-flex items-center gap-1 typo-meta hover:text-foreground disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center px-2"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likeCount > 0 && comment.likeCount}
            </button>
            {!isReply && currentUserId && (
              <button
                type="button"
                onClick={onReply}
                className="typo-meta hover:text-foreground min-h-[44px] px-3"
              >
                Reply
              </button>
            )}
            {currentUserId && !reported && (
              <button
                type="button"
                onClick={onReport}
                className="inline-flex items-center gap-1 typo-meta hover:text-foreground min-h-[44px] px-3"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            )}
            {reported && <span className="typo-meta text-muted-foreground px-3">Reported</span>}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 typo-meta text-destructive hover:text-destructive min-h-[44px] px-3"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isOwn ? "Delete" : "Remove"}
              </button>
            )}
          </div>
          {comment.replies?.map((reply) => (
            <div key={reply.id} className="mt-4">
              <CommentItem
                comment={reply}
                currentUserId={currentUserId}
                canModerate={canModerate}
                reported={reportedReplies?.has(reply.id)}
                onLike={() => onReplyLike(reply.id)}
                onDelete={() => onReplyDelete(reply.id)}
                onReport={() => onReplyReport(reply.id)}
                onReplyLike={onReplyLike}
                onReplyDelete={onReplyDelete}
                onReplyReport={onReplyReport}
                reportedReplies={reportedReplies}
                isReply
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
