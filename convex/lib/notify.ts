import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** Insert an in-app notification. Nothing is sent outside the app. */
export async function pushNotification(
  ctx: MutationCtx,
  args: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    relatedUserId?: string;
    relatedVideoId?: Id<"videos">;
    relatedJobId?: Id<"jobPostings">;
  }
) {
  await ctx.db.insert("notifications", { ...args, isRead: false });
}
