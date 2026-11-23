/* =========================================
   VIDEO-UTILS.JS — Validação, normalização e construção segura de URLs
========================================= */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const ALLOWED_YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);

const ALLOWED_THUMB_HOSTS = new Set([
    'i.ytimg.com',
    'img.youtube.com',
]);

const ALLOWED_TYPES = new Set(['portfolio', 'short']);
const ALLOWED_PLATFORMS = new Set(['youtube']);

export const FALLBACK_THUMBNAIL_DATA_URI =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270">' +
        '<rect width="480" height="270" fill="#171738"/>' +
        '<circle cx="240" cy="135" r="34" fill="#3423A6" opacity="0.85"/>' +
        '<polygon points="230,119 260,135 230,151" fill="#DFF3E4"/>' +
        '</svg>'
    );

export function isValidYouTubeId(value) {
    return typeof value === 'string' && YOUTUBE_ID_PATTERN.test(value.trim());
}

export function parseStartSeconds(rawValue) {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0) {
        return Math.floor(rawValue);
    }

    if (typeof rawValue !== 'string') return 0;
    const trimmed = rawValue.trim().toLowerCase();
    if (!trimmed) return 0;

    if (/^\d+s?$/.test(trimmed)) {
        return parseInt(trimmed, 10);
    }

    // Suporta formatos como "1h2m3s" ou "3m19s"
    const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

export function parseYouTubeUrl(rawUrl) {
    if (typeof rawUrl !== 'string') return null;

    const trimmed = rawUrl.trim();
    // Rejeita HTML arbitrário ou tags embutidas
    if (!trimmed || /[<>]/.test(trimmed)) return null;

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'https:') return null;

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
    };
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
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
    try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== 'https:') return null;
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

export function normalizeVideoRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const type = ALLOWED_TYPES.has(raw.type) ? raw.type : null;
    const platform = ALLOWED_PLATFORMS.has(raw.platform) ? raw.platform : 'youtube';
    if (!type) return null;

    const parsedUrl = parseYouTubeUrl(raw.sourceUrl);
    const externalId = parsedUrl?.externalId || (isValidYouTubeId(raw.externalId) ? raw.externalId.trim() : null);
    if (!externalId) return null;

    const startSeconds = Math.max(
        parseStartSeconds(raw.startSeconds),
        parsedUrl?.startSeconds || 0
    );

    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) return null;

    const fullTitle = typeof raw.fullTitle === 'string' && raw.fullTitle.trim()
        ? raw.fullTitle.trim()
        : title;

    const badge = typeof raw.badge === 'string' && raw.badge.trim()
        ? raw.badge.trim()
        : (type === 'short' ? 'Short' : 'YouTube');

    const tools = Array.isArray(raw.tools)
        ? raw.tools.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
        : [];

    const customThumb = sanitizeOptionalThumbnailUrl(raw.thumbnailUrl);

    return Object.freeze({
        id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `${type}-${externalId}`,
        type,
        platform,
        externalId,
        title,
        fullTitle,
        badge,
        startSeconds,
        durationSeconds: typeof raw.durationSeconds === 'number' && raw.durationSeconds > 0
            ? Math.floor(raw.durationSeconds)
            : null,
        tools,
        featured: Boolean(raw.featured),
        sortOrder: typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder) ? raw.sortOrder : 999,
        published: raw.published !== false,
        thumbnailUrl: customThumb || buildYouTubeThumbnailUrl(externalId, 'hqdefault'),
        watchUrl: buildYouTubeWatchUrl(externalId, { startSeconds, type }),
    });
}

export function getPublishedVideosByType(records, type) {
    if (!Array.isArray(records)) return [];
    return records
        .map(normalizeVideoRecord)
        .filter((video) => video && video.published && video.type === type)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}
