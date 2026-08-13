import { createClient } from "@/lib/supabase/server";

export type Profile = {
  dailyGoalSessions: number;
  timezone: string | null;
  weeklyInsightsOptIn: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  dailyGoalSessions: 4,
  timezone: null,
  weeklyInsightsOptIn: false,
};

/**
 * Reads the profile, creating it if it is missing.
 *
 * The `on_auth_user_created` trigger normally makes the row, but creating a
 * trigger on `auth.users` needs an owner role that `supabase db push` may not
 * have — so the migration tolerates that trigger failing and this is the real
 * guarantee. Without a profile row there is no `daily_goal_sessions`, and
 * "3 of your 4" has no 4.
 *
 * Never throws: a missing profile falls back to defaults rather than taking a
 * page down over a counter denominator.
 */
export async function ensureProfile(userId: string): Promise<Profile> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("profiles")
      .select("daily_goal_sessions, timezone, weekly_insights_opt_in")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      return {
        dailyGoalSessions: data.daily_goal_sessions,
        timezone: data.timezone,
        weeklyInsightsOptIn: data.weekly_insights_opt_in,
      };
    }

    // Idempotent: concurrent first loads race, and losing that race is fine.
    await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

    return DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}
