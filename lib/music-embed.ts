/**
 * Music Embed Utilities
 *
 * Parses Spotify, Apple Music, YouTube, and SoundCloud URLs
 * and returns iframe embed URLs for inline playback.
 */

export interface EmbedResult {
  provider: "spotify" | "apple" | "youtube" | "soundcloud";
  embedUrl: string;
}

/**
 * Parse a music URL and return embed information.
 * Returns null if the URL doesn't match any known provider.
 */
export function parseEmbedUrl(url: string): EmbedResult | null {
  if (!url) return null;

  const trimmed = url.trim();

  // ── Spotify ────────────────────────────────────
  // https://open.spotify.com/track/xyz
  // https://open.spotify.com/playlist/xyz
  // https://open.spotify.com/album/xyz
  const spotifyMatch = trimmed.match(
    /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/
  );
  if (spotifyMatch) {
    const [, type, id] = spotifyMatch;
    return {
      provider: "spotify",
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  // ── Apple Music ────────────────────────────────
  // https://music.apple.com/us/album/xyz/123?i=456
  // https://music.apple.com/us/playlist/xyz/pl.abc
  const appleMatch = trimmed.match(
    /music\.apple\.com\/([a-z]{2})\/(album|playlist|song)\/([^?]+)/
  );
  if (appleMatch) {
    const [, country, type, pathPart] = appleMatch;
    return {
      provider: "apple",
      embedUrl: `https://embed.music.apple.com/${country}/${type}/${pathPart}`,
    };
  }

  // ── YouTube ────────────────────────────────────
  // https://www.youtube.com/watch?v=xyz
  // https://youtu.be/xyz
  // https://youtube.com/shorts/xyz
  // https://music.youtube.com/watch?v=xyz
  let youtubeId: string | null = null;

  const ytLong = trimmed.match(/(?:youtube\.com|music\.youtube\.com)\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (ytLong) youtubeId = ytLong[1];

  if (!youtubeId) {
    const ytShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (ytShort) youtubeId = ytShort[1];
  }

  if (!youtubeId) {
    const ytShorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (ytShorts) youtubeId = ytShorts[1];
  }

  if (youtubeId) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  // ── SoundCloud ─────────────────────────────────
  // https://soundcloud.com/artist/track
  const soundcloudMatch = trimmed.match(/soundcloud\.com\/[^/]+\/[^/]+/);
  if (soundcloudMatch) {
    return {
      provider: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23ec4899&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`,
    };
  }

  return null;
}

/**
 * Get the embed iframe height for a provider.
 */
export function getEmbedHeight(provider: EmbedResult["provider"]): number {
  switch (provider) {
    case "spotify":
      return 152;
    case "apple":
      return 175;
    case "youtube":
      return 200;
    case "soundcloud":
      return 166;
    default:
      return 152;
  }
}
