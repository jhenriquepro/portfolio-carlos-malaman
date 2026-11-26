/* =========================================
   VIDEO-UTILS.JS — Validação, normalização e construção segura de URLs
========================================= */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_SHORTCODE_PATTERN = /^[A-Za-z0-9_-]{5,40}$/;
const TIKTOK_VIDEO_ID_PATTERN = /^\d{6,30}$/;

const ALLOWED_YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);

const ALLOWED_INSTAGRAM_HOSTS = new Set([
    'instagram.com',
    'www.instagram.com',
    'm.instagram.com',
]);

const ALLOWED_TIKTOK_HOSTS = new Set([
    'tiktok.com',
    'www.tiktok.com',
    'm.tiktok.com',
]);

const ALLOWED_THUMB_HOSTS = new Set([
    'i.ytimg.com',
    'img.youtube.com',
]);

const ALLOWED_TYPES = new Set(['portfolio', 'short']);
const ALLOWED_PLATFORMS = new Set(['youtube', 'instagram', 'tiktok']);

export const FALLBACK_THUMBNAIL_DATA_URI =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270">' +
        '<rect width="480" height="270" fill="#150E21"/>' +
        '<rect x="1" y="1" width="478" height="268" fill="none" stroke="#7134AD" stroke-opacity="0.35" stroke-width="2"/>' +
        '<circle cx="240" cy="135" r="34" fill="#7134AD" opacity="0.9"/>' +
        '<polygon points="230,119 260,135 230,151" fill="#F6F2FA"/>' +
        '</svg>'
    );

export function isValidYouTubeId(value) {
    return typeof value === 'string' && YOUTUBE_ID_PATTERN.test(value.trim());
}

export function isSafeHttpsUrl(rawUrl) {
    if (typeof rawUrl !== 'string') return false;
    const trimmed = rawUrl.trim();
    if (!trimmed || /[<>]/.test(trimmed)) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export function parseStartSeconds(rawValue) {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0) {
        return Math.min(86400, Math.floor(rawValue));
    }

    if (typeof rawValue !== 'string') return 0;
    const trimmed = rawValue.trim().toLowerCase();
    if (!trimmed) return 0;

    if (/^\d+s?$/.test(trimmed)) {
        return Math.min(86400, parseInt(trimmed, 10));
    }

    // Suporta formatos "3:19", "1:02:10"
    if (/^\d{1,2}(:\d{2}){1,2}$/.test(trimmed)) {
        const parts = trimmed.split(':').map((n) => parseInt(n, 10));
        const total = parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + parts[1];
        return Math.min(86400, total);
    }

    // Suporta formatos como "1h2m3s" ou "3m19s"
    const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return Math.min(86400, hours * 3600 + minutes * 60 + seconds);
}

export function parseDurationInput(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') return null;
    if (typeof rawValue === 'number') {
        return Number.isFinite(rawValue) && rawValue > 0 ? Math.min(86400, Math.floor(rawValue)) : null;
    }
    const parsed = parseStartSeconds(String(rawValue));
    return parsed > 0 ? parsed : null;
}

export function parseYouTubeUrl(rawUrl) {
    if (!isSafeHttpsUrl(rawUrl)) return null;

    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_YOUTUBE_HOSTS.has(host)) return null;

    let externalId = null;
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (host === 'youtu.be') {
        externalId = segments[0] || null;
    } else if (parsed.pathname === '/watch') {
        externalId = parsed.searchParams.get('v');
    } else if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') {
        externalId = segments[1] || null;
    }

    if (!isValidYouTubeId(externalId)) return null;

    const startParam = parsed.searchParams.get('start') ?? parsed.searchParams.get('t');
    const startSeconds = parseStartSeconds(startParam);

    return {
        platform: 'youtube',
        externalId,
        startSeconds,
        isShortUrl: segments[0] === 'shorts',
        embeddable: true,
        canonicalUrl: buildYouTubeWatchUrl(externalId, {
            startSeconds,
            type: segments[0] === 'shorts' ? 'short' : 'portfolio',
        }),
    };
}

export function parseVideoUrl(rawUrl) {
    const yt = parseYouTubeUrl(rawUrl);
    if (yt) return yt;

    if (!isSafeHttpsUrl(rawUrl)) return null;

    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    const host = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);

    // Instagram Reel / Post (link externo validado; sem embed garantido)
    if (ALLOWED_INSTAGRAM_HOSTS.has(host)) {
        const kind = segments[0];
        const code = segments[1];
        if ((kind === 'reel' || kind === 'reels' || kind === 'p') && code && INSTAGRAM_SHORTCODE_PATTERN.test(code)) {
            return {
                platform: 'instagram',
                externalId: code,
                startSeconds: 0,
                isShortUrl: true,
                embeddable: false,
                canonicalUrl: `https://www.instagram.com/${kind === 'p' ? 'p' : 'reel'}/${code}/`,
            };
        }
        return null;
    }

    // TikTok Video (link externo validado; sem embed garantido)
    if (ALLOWED_TIKTOK_HOSTS.has(host)) {
        const videoIdx = segments.indexOf('video');
        const videoId = videoIdx >= 0 ? segments[videoIdx + 1] : null;
        if (videoId && TIKTOK_VIDEO_ID_PATTERN.test(videoId)) {
            return {
                platform: 'tiktok',
                externalId: videoId,
                startSeconds: 0,
                isShortUrl: true,
                embeddable: false,
                canonicalUrl: parsed.origin + parsed.pathname,
            };
        }
        return null;
    }

    return null;
}

export function buildYouTubeThumbnailUrl(externalId, quality = 'hqdefault') {
    if (!isValidYouTubeId(externalId)) return FALLBACK_THUMBNAIL_DATA_URI;
    const allowedQualities = new Set(['mqdefault', 'hqdefault', 'sddefault', 'maxresdefault']);
    const safeQuality = allowedQualities.has(quality) ? quality : 'hqdefault';
    return `https://i.ytimg.com/vi/${externalId}/${safeQuality}.jpg`;
}

export function buildYouTubeEmbedUrl(externalId, { startSeconds = 0, autoplay = true } = {}) {
    if (!isValidYouTubeId(externalId)) return null;

    const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
    });

    if (autoplay) {
        params.set('autoplay', '1');
    }

    const safeStart = parseStartSeconds(startSeconds);
    if (safeStart > 0) {
        params.set('start', String(safeStart));
    }

    return `https://www.youtube-nocookie.com/embed/${externalId}?${params.toString()}`;
}

export function buildYouTubeWatchUrl(externalId, { startSeconds = 0, type = 'portfolio' } = {}) {
    if (!isValidYouTubeId(externalId)) return null;

    const safeStart = parseStartSeconds(startSeconds);
    if (type === 'short' && safeStart === 0) {
        return `https://www.youtube.com/shorts/${externalId}`;
    }

    const params = new URLSearchParams({ v: externalId });
    if (safeStart > 0) {
        params.set('t', `${safeStart}s`);
    }
    return `https://www.youtube.com/watch?${params.toString()}`;
}

function sanitizeOptionalThumbnailUrl(rawUrl) {
    if (!isSafeHttpsUrl(rawUrl)) return null;
    try {
        const parsed = new URL(rawUrl.trim());
        if (!ALLOWED_THUMB_HOSTS.has(parsed.hostname.toLowerCase())) return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

export function formatDuration(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
        return '';
    }
    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
}

function getDefaultBadge(platform, type) {
    if (platform === 'instagram') return 'Reel';
    if (platform === 'tiktok') return 'TikTok';
    return type === 'short' ? 'Short' : 'YouTube';
}

export function normalizeVideoRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const type = ALLOWED_TYPES.has(raw.type) ? raw.type : null;
    if (!type) return null;

    const parsedUrl = parseVideoUrl(raw.sourceUrl);
    const platform = parsedUrl?.platform || (ALLOWED_PLATFORMS.has(raw.platform) ? raw.platform : 'youtube');

    let externalId = parsedUrl?.externalId || null;
    if (!externalId && platform === 'youtube' && isValidYouTubeId(raw.externalId)) {
        externalId = raw.externalId.trim();
    }
    if (!externalId) return null;

    const startSeconds = platform === 'youtube'
        ? Math.max(parseStartSeconds(raw.startSeconds), parsedUrl?.startSeconds || 0)
        : 0;

    const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 120) : '';
    if (!title) return null;

    const fullTitle = typeof raw.fullTitle === 'string' && raw.fullTitle.trim()
        ? raw.fullTitle.trim().slice(0, 180)
        : title;

    const badge = typeof raw.badge === 'string' && raw.badge.trim()
        ? raw.badge.trim().slice(0, 30)
        : getDefaultBadge(platform, type);

    const tools = Array.isArray(raw.tools)
        ? raw.tools
            .filter((item) => typeof item === 'string' && item.trim())
            .map((item) => item.trim().slice(0, 40))
            .slice(0, 8)
        : [];

    const customThumb = sanitizeOptionalThumbnailUrl(raw.thumbnailUrl);
    const thumbnailUrl = customThumb
        || (platform === 'youtube' ? buildYouTubeThumbnailUrl(externalId, 'hqdefault') : FALLBACK_THUMBNAIL_DATA_URI);

    const watchUrl = platform === 'youtube'
        ? buildYouTubeWatchUrl(externalId, { startSeconds, type })
        : (parsedUrl?.canonicalUrl || null);

    const embeddable = platform === 'youtube';

    return Object.freeze({
        id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `${type}-${externalId}`,
        type,
        platform,
        sourceUrl: watchUrl || raw.sourceUrl,
        externalId,
        title,
        fullTitle,
        badge,
        startSeconds,
        durationSeconds: parseDurationInput(raw.durationSeconds),
        tools,
        featured: Boolean(raw.featured),
        sortOrder: typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder)
            ? Math.max(0, Math.min(9999, Math.floor(raw.sortOrder)))
            : 999,
        published: raw.published !== false,
        embeddable,
        thumbnailUrl,
        watchUrl,
    });
}

export function getPublishedVideosByType(records, type) {
    if (!Array.isArray(records)) return [];
    return records
        .map(normalizeVideoRecord)
        .filter((video) => video && video.published && video.type === type)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}
