"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CommentSectionProps {
  resourceId: string;
  resourceType: string;
}

export default function CommentSection({
  resourceId,
  resourceType,
}: CommentSectionProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useSWR(
    `/api/comments?resourceId=${resourceId}`,
    fetcher
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ content: text, resourceId, resourceType }),
    });

    setText("");
    setIsSubmitting(false);
    mutate(`/api/comments?resourceId=${resourceId}`);
  };

  if (isLoading)
    return (
      <div className="p-4 text-zinc-500 text-sm">Loading discussion...</div>
    );

  return (
    <div className="mt-2">
      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          className="flex-grow p-3 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none"
          placeholder="Ask a question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          disabled={isSubmitting || !text.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 text-sm font-bold"
        >
          Post
        </button>
      </form>

      {/* List */}
      <div className="space-y-4">
        {data?.comments?.map((comment: any) => (
          <div
            key={comment.id}
            className="flex gap-3 animate-in fade-in slide-in-from-bottom-2"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
              {comment.profiles?.avatar_url ? (
                <img
                  src={comment.profiles.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                  {comment.profiles?.display_name?.[0] || "?"}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="bg-zinc-800/50 p-3 rounded-lg rounded-tl-none border border-zinc-800 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-400 block">
                  {comment.profiles?.display_name}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-zinc-300">{comment.content}</p>
            </div>
          </div>
        ))}
        {data?.comments?.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-8 italic">
            No comments yet.
          </div>
        )}
      </div>
    </div>
  );
}
