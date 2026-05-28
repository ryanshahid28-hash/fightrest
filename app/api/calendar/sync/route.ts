import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Google Calendar Sync API
 *
 * POST: Creates a Google Calendar event from a Fight Club task.
 * Body: { title, date, time, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, date, time, description } = body;

    if (!title || !date || !time) {
      return NextResponse.json({ error: "Missing required fields: title, date, time" }, { status: 400 });
    }

    // Get user and their Google token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("google_calendar_token")
      .eq("user_id", user.id)
      .single();

    const token = prefs?.google_calendar_token as { access_token: string; refresh_token: string; expires_at: number } | null;

    if (!token?.access_token) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 403 });
    }

    // Check if token is expired and refresh if needed
    let accessToken = token.access_token;
    if (token.expires_at && Date.now() > token.expires_at) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        // Update stored token
        await supabase.from("user_preferences").update({
          google_calendar_token: {
            ...token,
            access_token: accessToken,
            expires_at: Date.now() + (refreshData.expires_in * 1000),
          },
        }).eq("user_id", user.id);
      }
    }

    // Create Google Calendar event
    const [hours, minutes] = time.split(":").map(Number);
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // +30 min

    const event = {
      summary: `🥊 ${title}`,
      description: description || `Fight Club Task — ${title}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 15 }],
      },
    };

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const calData = await calRes.json();

    if (!calRes.ok) {
      console.error("Google Calendar API error:", calData);
      return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, eventId: calData.id, link: calData.htmlLink });
  } catch (err) {
    console.error("Calendar sync error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
