"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  const submit = async (parentId?: string) => {
    if (!content.trim() || !currentUserId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, content, parentId }),
      });
      if (res.ok) {
        const comment = await res.json();
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
            )
          );
        } else {
          setComments((prev) => [comment, ...prev]);
        }
        setContent("");
        setReplyTo(null);
      }
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

  return (
    <section className="border-t border-border pt-8 mt-12">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Discussion
        <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h2>

      {currentUserId ? (
        <div className="mb-8 space-y-3">
          {replyTo && (
            <p className="text-xs text-muted-foreground">
              Replying to comment ·{" "}
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                Cancel
              </button>
            </p>
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment (Markdown supported)..."
            rows={3}
          />
          <Button size="sm" disabled={submitting || !content.trim()} onClick={() => submit(replyTo || undefined)}>
            {submitting ? "Posting..." : "Post comment"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-8">
          <a href="/login" className="underline underline-offset-2">Sign in</a> to join the discussion.
        </p>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={() => setReplyTo(comment.id)}
            onLike={() => likeComment(comment.id)}
            onReplyLike={(id) => likeComment(id)}
          />
        ))
        )}
      </div>
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
    <div className={cn("group", isReply && "ml-8 pl-4 border-l border-border")}>
      <div className="flex gap-3">
        <Avatar src={comment.author.image} name={comment.author.name || comment.author.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{formatUsername(comment.author.username)}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="text-sm prose-sm prose-neutral dark:prose-invert max-w-none">
            <MarkdownRenderer content={comment.content} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onLike}
              disabled={!currentUserId}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ThumbsUp className="h-3 w-3" />
              {comment.likeCount > 0 && comment.likeCount}
            </button>
            {!isReply && currentUserId && (
              <button type="button" onClick={onReply} className="text-xs text-muted-foreground hover:text-foreground">
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
    </div>
  );
}
