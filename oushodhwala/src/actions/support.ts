"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { supportConversations, supportMessages } from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function getOrCreateMySupportConversationAction(): Promise<
  ActionResult<{ conversation: Record<string, unknown> }>
> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [existing] = await db
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.userId, userId))
      .orderBy(desc(supportConversations.lastMessageAt))
      .limit(1);
    if (existing) {
      return {
        ok: true,
        conversation: {
          id: existing.id,
          user_id: existing.userId,
          title: existing.title,
          status: existing.status,
          agent_active: existing.agentActive,
          agent_name: existing.agentName,
          agent_last_seen: existing.agentLastSeen,
          last_message_at: existing.lastMessageAt,
          unread_for_agent: existing.unreadForAgent,
        },
      };
    }
    const id = crypto.randomUUID();
    await db.insert(supportConversations).values({
      id,
      userId,
      title: "Support",
      status: "open",
    });
    const [row] = await db
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.id, id))
      .limit(1);
    return {
      ok: true,
      conversation: {
        id: row!.id,
        user_id: row!.userId,
        title: row!.title,
        status: row!.status,
        agent_active: row!.agentActive,
        agent_name: row!.agentName,
        agent_last_seen: row!.agentLastSeen,
        last_message_at: row!.lastMessageAt,
        unread_for_agent: row!.unreadForAgent,
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Conversation failed",
      status: 500,
    };
  }
}

export async function listSupportMessagesAction(input: {
  conversationId: string;
}): Promise<ActionResult<{ messages: unknown[] }>> {
  try {
    await requireAuth();
    const rows = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.conversationId, input.conversationId))
      .orderBy(supportMessages.createdAt);
    return {
      ok: true,
      messages: rows.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        agent_name: m.agentName ?? "",
        created_at: m.createdAt,
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function addSupportMessageAction(input: {
  conversationId: string;
  sender: "user" | "ai" | "agent";
  body: string;
  agentName?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    if (!input.body?.trim()) {
      return { ok: false, error: "Empty message", status: 400 };
    }
    const id = crypto.randomUUID();
    await db.insert(supportMessages).values({
      id,
      conversationId: input.conversationId,
      sender: input.sender,
      body: input.body.trim(),
      agentName: input.agentName || null,
    });
    const unreadAgent = input.sender === "user" ? 1 : 0;
    const unreadUser = input.sender === "agent" || input.sender === "ai" ? 1 : 0;
    await db
      .update(supportConversations)
      .set({
        lastMessageAt: new Date(),
        unreadForAgent: sql`${supportConversations.unreadForAgent} + ${unreadAgent}`,
        unreadForUser: sql`${supportConversations.unreadForUser} + ${unreadUser}`,
      })
      .where(eq(supportConversations.id, input.conversationId));
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Send failed",
      status: 500,
    };
  }
}

export async function markSupportReadAction(input: {
  conversationId: string;
  side: "user" | "agent";
}): Promise<ActionResult> {
  try {
    await requireAuth();
    if (input.side === "agent") {
      await requireStaff();
      await db
        .update(supportConversations)
        .set({ unreadForAgent: 0 })
        .where(eq(supportConversations.id, input.conversationId));
    } else {
      await db
        .update(supportConversations)
        .set({ unreadForUser: 0 })
        .where(eq(supportConversations.id, input.conversationId));
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mark read failed",
      status: 500,
    };
  }
}

export async function setSupportAgentAction(input: {
  conversationId: string;
  active: boolean;
  agentName?: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db
      .update(supportConversations)
      .set({
        agentActive: input.active,
        agentName: input.agentName || null,
        agentLastSeen: new Date(),
      })
      .where(eq(supportConversations.id, input.conversationId));
    revalidatePath("/admin/support");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Agent update failed",
      status: 500,
    };
  }
}

export async function listSupportConversationsAction(): Promise<
  ActionResult<{ conversations: unknown[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(supportConversations)
      .orderBy(desc(supportConversations.lastMessageAt))
      .limit(80);
    return {
      ok: true,
      conversations: rows.map((c) => ({
        id: c.id,
        user_id: c.userId,
        title: c.title,
        status: c.status,
        agent_active: c.agentActive,
        agent_name: c.agentName,
        agent_last_seen: c.agentLastSeen,
        last_message_at: c.lastMessageAt,
        unread_for_agent: c.unreadForAgent,
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function isSupportAgentLiveAction(input: {
  conversationId: string;
}): Promise<ActionResult<{ live: boolean }>> {
  try {
    const [row] = await db
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.id, input.conversationId))
      .limit(1);
    if (!row?.agentActive) return { ok: true, live: false };
    const seen = row.agentLastSeen ? new Date(row.agentLastSeen).getTime() : 0;
    return { ok: true, live: Date.now() - seen < 5 * 60 * 1000 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Check failed",
      status: 500,
    };
  }
}
