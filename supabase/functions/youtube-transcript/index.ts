const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchTranscript(videoId: string): Promise<string> {
  // Fetch the video page to get caption track info
  const pageRes = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }
  );

  const html = await pageRes.text();

  // Extract captions JSON from the page
  const captionMatch = html.match(
    /"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"videoDetails"/s
  );

  if (!captionMatch) {
    throw new Error("No captions available for this video");
  }

  let captionsData;
  try {
    captionsData = JSON.parse(captionMatch[1]);
  } catch {
    throw new Error("Failed to parse captions data");
  }

  const tracks =
    captionsData?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    throw new Error("No caption tracks found");
  }

  // Prefer English, fall back to first track
  const englishTrack =
    tracks.find(
      (t: { languageCode: string }) =>
        t.languageCode === "en" || t.languageCode?.startsWith("en")
    ) || tracks[0];

  const captionUrl = englishTrack.baseUrl;

  // Fetch the caption XML
  const captionRes = await fetch(captionUrl);
  const captionXml = await captionRes.text();

  // Parse XML and extract text
  const textSegments: string[] = [];
  const regex = /<text[^>]*>(.*?)<\/text>/gs;
  let match;

  while ((match = regex.exec(captionXml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, " ")
      .trim();
    if (text) textSegments.push(text);
  }

  if (textSegments.length === 0) {
    throw new Error("No transcript text found");
  }

  return textSegments.join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const transcript = await fetchTranscript(videoId);

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch transcript";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
