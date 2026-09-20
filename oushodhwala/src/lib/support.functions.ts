"use server";

/**
 * Compatibility re-exports — prefer importing from `@/actions/ask-support` in new code.
 * Kept so any leftover createServerFn-style imports resolve to real Server Actions.
 */
export {
  askSupportAIAction as askSupportAI,
  askSupportGuestAction as askSupportGuest,
} from "@/actions/ask-support";
