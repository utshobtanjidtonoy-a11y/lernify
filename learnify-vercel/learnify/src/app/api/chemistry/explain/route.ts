import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        // API key injected at request time via the Anthropic API infrastructure
        // when called from claude.ai artifacts — for standalone Netlify deployment,
        // add ANTHROPIC_API_KEY to environment variables
        ...(process.env.ANTHROPIC_API_KEY
          ? { "x-api-key": process.env.ANTHROPIC_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text =
      data.content
        ?.map((b: { type: string; text?: string }) =>
          b.type === "text" ? b.text : ""
        )
        .join("") ?? "";

    return NextResponse.json({ explanation: text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
