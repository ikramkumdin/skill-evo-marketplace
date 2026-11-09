"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SignInButtons } from "@/components/sign-in-buttons";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function CommentThread({ skillId }: { skillId: string }) {
  if (!isConvexConfigured) return null;
  return <Connected skillId={skillId as Id<"skills">} />;
}

type Comment = {
  _id: Id<"comments">;
  _creationTime: number;
  skillId: Id<"skills">;
  userId: Id<"users">;
  body: string;
  parentId: Id<"comments"> | null;
  authorHandle: string;
  authorAvatar: string | null;
  isOwn: boolean;
  isVerifiedUser: boolean;
};

function Connected({ skillId }: { skillId: Id<"skills"> }) {
  const comments = useQuery(api.comments.listComments, { skillId }) ?? [];
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  const topLevel = comments.filter((c) => !c.parentId);
  const byParent = (parentId: Id<"comments">) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div>
      <CommentForm
        skillId={skillId}
        parentId={undefined}
        isAuthenticated={isAuthenticated}
        onSignIn={() => signIn("github", { redirectTo: window.location.pathname })}
        placeholder="Share your thoughts..."
      />
      {topLevel.length > 0 && (
        <ul className="mt-6 space-y-4">
          {topLevel.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              replies={byParent(c._id)}
              isAuthenticated={isAuthenticated}
              onSignIn={() => signIn("github", { redirectTo: window.location.pathname })}
            />
          ))}
        </ul>
      )}
      {comments.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No comments yet. Be the first!</p>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  isAuthenticated,
  onSignIn,
}: {
  comment: Comment;
  replies: Comment[];
  isAuthenticated: boolean;
  onSignIn: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const deleteComment = useMutation(api.comments.deleteComment);
  const [pendingDelete, setPendingDelete] = useState<Id<"comments"> | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askDelete = (commentId: Id<"comments">) => {
    setPendingDelete(commentId);
    setError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteComment({ commentId: pendingDelete });
      setPendingDelete(null);
    } catch (err) {
      setError(friendlyConvexError(err, "Couldn't delete that comment."));
    } finally {
      setDeleting(false);
    }
  };

  const hasReplies = replies.length > 0;

  return (
    <li>
      <CommentBubble
        comment={comment}
        onDelete={comment.isOwn ? () => askDelete(comment._id) : undefined}
        deleting={deleting && pendingDelete === comment._id}
      />
      {pendingDelete === comment._id && (
        <DeleteConfirm
          hasReplies={hasReplies}
          replyCount={replies.length}
          busy={deleting}
          error={error}
          onCancel={() => { setPendingDelete(null); setError(null); }}
          onConfirm={confirmDelete}
        />
      )}
      {hasReplies && (
        <ul className="ml-8 mt-2 space-y-2 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
          {replies.map((r) => (
            <li key={r._id}>
              <CommentBubble
                comment={r}
                onDelete={r.isOwn ? () => askDelete(r._id) : undefined}
                deleting={deleting && pendingDelete === r._id}
              />
              {pendingDelete === r._id && (
                <DeleteConfirm
                  hasReplies={false}
                  replyCount={0}
                  busy={deleting}
                  error={error}
                  onCancel={() => { setPendingDelete(null); setError(null); }}
                  onConfirm={confirmDelete}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="ml-8 mt-1">
        {showReply ? (
          <CommentForm
            skillId={comment.skillId}
            parentId={comment._id}
            isAuthenticated={isAuthenticated}
            onSignIn={onSignIn}
            placeholder={`Reply to @${comment.authorHandle}...`}
            onSubmitted={() => setShowReply(false)}
            compact
          />
        ) : (
          <button
            onClick={() => {
              if (!isAuthenticated) { onSignIn(); return; }
              setShowReply(true);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Reply
          </button>
        )}
      </div>
    </li>
  );
}

function DeleteConfirm({
  hasReplies,
  replyCount,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  hasReplies: boolean;
  replyCount: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label="Delete this comment?"
      className="ml-10 mt-2 w-fit max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
    >
      <p className="font-medium">Delete this comment?</p>
      <p className="mt-1 opacity-90">
        {hasReplies
          ? `This comment has ${replyCount} ${replyCount === 1 ? "reply" : "replies"}. Deleting it hides them from view but doesn't remove them.`
          : "This can't be undone."}
      </p>
      {error && <p className="mt-2 font-mono text-[11px]">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="inline-flex h-7 items-center rounded bg-red-600 px-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex h-7 items-center rounded border border-red-300 px-2.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Convex server errors arrive as something like
//   "[CONVEX M(comments:addComment)] [Request ID: ...] Server Error"
// which leaks implementation detail and scares users. Pull the
// meaningful tail off, falling back to a provided default if we can't
// make sense of it.
function friendlyConvexError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const raw = err.message || fallback;
  // Common Convex prefixes we want to strip.
  const stripped = raw
    .replace(/^\[CONVEX [^\]]+\]\s*/i, "")
    .replace(/^\[Request ID:[^\]]+\]\s*/i, "")
    .trim();
  if (!stripped || /^server error\.?$/i.test(stripped)) return fallback;
  return stripped;
}

function CommentBubble({
  comment,
  onDelete,
  deleting,
}: {
  comment: Comment;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const initials = comment.authorHandle.slice(0, 2).toUpperCase();
  const age = formatAge(comment._creationTime);

  return (
    <div className="flex items-start gap-3">
      {comment.authorAvatar ? (
        <img
          src={comment.authorAvatar}
          alt={comment.authorHandle}
          className="h-7 w-7 rounded-full shrink-0 object-cover"
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0 dark:bg-indigo-900 dark:text-indigo-300">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            @{comment.authorHandle}
          </span>
          {comment.isVerifiedUser && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800">
              ✓ Verified User
            </span>
          )}
          <span className="text-[11px] text-zinc-400">{age}</span>
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-[11px] text-zinc-400 hover:text-red-500 disabled:opacity-50"
            >
              delete
            </button>
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-700 leading-relaxed dark:text-zinc-300 wrap-break-word">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

function CommentForm({
  skillId,
  parentId,
  isAuthenticated,
  onSignIn,
  placeholder,
  onSubmitted,
  compact,
}: {
  skillId: Id<"skills">;
  parentId?: Id<"comments">;
  isAuthenticated: boolean;
  onSignIn: () => void;
  placeholder: string;
  onSubmitted?: () => void;
  compact?: boolean;
}) {
  const addComment = useMutation(api.comments.addComment);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated) { onSignIn(); return; }
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addComment({ skillId, body: body.trim(), parentId });
      setBody("");
      onSubmitted?.();
    } catch (err) {
      setError(friendlyConvexError(err, "Couldn't post that comment."));
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="text-2xl mb-2">💬</p>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Sign in to join the conversation
        </p>
        <p className="mt-1 text-xs text-zinc-500 mb-4">
          Share your experience, ask questions, or leave feedback.
        </p>
        <div className="mx-auto max-w-xs">
          <SignInButtons size="sm" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-2" : ""}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950 resize-none"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {busy ? "Posting…" : "Post"}
        </button>
        {compact && (
          <button
            type="button"
            onClick={() => { setBody(""); onSubmitted?.(); }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Cancel
          </button>
        )}
        <span className="ml-auto text-[11px] text-zinc-400">{body.length}/2000</span>
      </div>
    </form>
  );
}

function formatAge(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
