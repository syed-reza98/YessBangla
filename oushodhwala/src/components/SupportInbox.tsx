"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Headset, Bot, Send, Loader2, User as UserIcon, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  addSupportMessageAction,
  listSupportConversationsAction,
  listSupportMessagesAction,
  markSupportReadAction,
  setSupportAgentAction,
} from "@/actions/support";

type Conv = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  agent_active: boolean;
  agent_name: string;
  agent_last_seen: string | null;
  last_message_at: string;
  unread_for_agent: number;
};
type Msg = { id: string; sender: "user" | "ai" | "agent"; body: string; agent_name: string; created_at: string };

const live = (c?: Conv | null) =>
  !!c?.agent_active && Date.now() - new Date(c.agent_last_seen ?? 0).getTime() < 5 * 60 * 1000;

export function SupportInbox() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const convs = useQuery({
    queryKey: ["support-convs"],
    refetchInterval: 8000,
    queryFn: async () => {
      const res = await listSupportConversationsAction();
      if (!res.ok) throw new Error(res.error);
      return (res.conversations ?? []) as Conv[];
    },
  });

  const active = convs.data?.find((c) => c.id === activeId) ?? null;

  const msgs = useQuery({
    queryKey: ["support-msgs", activeId],
    enabled: !!activeId,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await listSupportMessagesAction({ conversationId: activeId! });
      if (!res.ok) throw new Error(res.error);
      return (res.messages ?? []) as Msg[];
    },
  });

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs.data]);

  useEffect(() => {
    if (activeId) void markSupportReadAction({ conversationId: activeId, side: "agent" });
  }, [activeId, msgs.data]);

  const toggleTakeover = async (on: boolean) => {
    if (!activeId) return;
    await setSupportAgentAction({
      conversationId: activeId,
      active: on,
      agentName: profile?.name || "কাস্টমার কেয়ার",
    });
    await qc.invalidateQueries({ queryKey: ["support-convs"] });
  };

  const send = async () => {
    const body = reply.trim();
    if (!body || !activeId) return;
    setBusy(true);
    try {
      if (!live(active)) await toggleTakeover(true);
      await addSupportMessageAction({
        conversationId: activeId,
        sender: "agent",
        body,
        agentName: profile?.name || "কাস্টমার কেয়ার",
      });
      setReply("");
      await msgs.refetch();
      await qc.invalidateQueries({ queryKey: ["support-convs"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold">সাপোর্ট ইনবক্স</p>
          <button
            type="button"
            onClick={() => void qc.invalidateQueries({ queryKey: ["support-convs"] })}
            className="rounded-lg border border-border p-1.5"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {(convs.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-xs ${
                activeId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <span className="font-semibold">{c.title || "Support"}</span>
              {c.unread_for_agent > 0 && (
                <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {c.unread_for_agent}
                </span>
              )}
            </button>
          ))}
          {(convs.data ?? []).length === 0 && (
            <p className="p-2 text-[11px] text-muted-foreground">কোনো কথোপকথন নেই</p>
          )}
        </div>
      </div>

      <div className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
        {!active ? (
          <p className="m-auto text-sm text-muted-foreground">একটি কথোপকথন বেছে নিন</p>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Headset className="size-4 text-primary" />
                {active.title}
              </div>
              <button
                type="button"
                onClick={() => void toggleTakeover(!live(active))}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold"
              >
                {live(active) ? "রিলিজ" : "টেকওভার"}
              </button>
            </div>
            <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {(msgs.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender === "agent"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : m.sender === "ai"
                        ? "bg-muted"
                        : "bg-card border border-border"
                  }`}
                >
                  <p className="mb-0.5 flex items-center gap-1 text-[10px] opacity-70">
                    {m.sender === "ai" ? <Bot className="size-3" /> : m.sender === "agent" ? <Headset className="size-3" /> : <UserIcon className="size-3" />}
                    {m.sender}
                  </p>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="উত্তর লিখুন…"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                disabled={busy || !reply.trim()}
                onClick={() => void send()}
                className="rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
