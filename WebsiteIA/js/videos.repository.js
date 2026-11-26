/* =========================================
   VIDEOS.REPOSITORY.JS — Camada de dados Firestore (público + admin)
   - Público: lê somente `published == true` (com listener em tempo real)
     ou fallback local somente leitura quando Firebase não está configurado.
   - Admin: leitura total (publicados + rascunhos), CRUD, reordenação atômica
     e importação inicial idempotente.
========================================= */

import { getFirestoreContext, isFirebaseConfigured } from './firebase.js';
import { normalizeVideoRecord, parseDurationInput, parseStartSeconds, parseVideoUrl } from './video-utils.js';
import { INITIAL_VIDEOS } from './videos.data.js';

const COLLECTION_NAME = 'videos';

function mapDocToVideo(docSnap) {
    const data = docSnap.data();
    return normalizeVideoRecord({
        id: docSnap.id,
        ...data,
    });
}

function buildValidatedWritePayload(input) {
    const type = input.type === 'short' ? 'short' : 'portfolio';
    const parsedUrl = parseVideoUrl(input.sourceUrl);
    if (!parsedUrl) {
        throw new Error('INVALID_VIDEO_URL');
    }

    const title = typeof input.title === 'string' ? input.title.trim().slice(0, 120) : '';
    if (!title) {
        throw new Error('INVALID_TITLE');
    }

    const fullTitle = typeof input.fullTitle === 'string' && input.fullTitle.trim()
        ? input.fullTitle.trim().slice(0, 180)
        : title;

    const badge = typeof input.badge === 'string' && input.badge.trim()
        ? input.badge.trim().slice(0, 30)
        : (parsedUrl.platform === 'instagram'
            ? 'Reel'
            : parsedUrl.platform === 'tiktok'
                ? 'TikTok'
                : type === 'short' ? 'Short' : 'YouTube');

    const tools = Array.isArray(input.tools)
        ? [...new Set(input.tools.map((s) => String(s).trim().slice(0, 40)).filter(Boolean))].slice(0, 8)
        : [];

    const startSeconds = parsedUrl.platform === 'youtube'
        ? parseStartSeconds(input.startSeconds ?? parsedUrl.startSeconds)
        : 0;

    const durationSeconds = parseDurationInput(input.durationSeconds);

    const sortOrder = Number.isFinite(Number(input.sortOrder))
        ? Math.max(0, Math.min(9999, Math.floor(Number(input.sortOrder))))
        : 100;

    return {
        type,
        platform: parsedUrl.platform,
        sourceUrl: parsedUrl.canonicalUrl || input.sourceUrl.trim(),
        externalId: parsedUrl.externalId,
        title,
        fullTitle,
        badge,
        durationSeconds,
        tools,
        featured: Boolean(input.featured),
        sortOrder,
        published: Boolean(input.published),
        startSeconds,
        thumbnailUrl: null,
    };
}

/**
 * Inscreve o site público nos vídeos publicados (`published == true`).
 * Quando Firebase não está configurado, entrega imediatamente o fallback local.
 * Retorna uma função `unsubscribe()`.
 */
export async function subscribePublishedVideos({ onData, onError }) {
    if (!isFirebaseConfigured()) {
        onData({ source: 'fallback', videos: INITIAL_VIDEOS });
        return () => {};
    }

    try {
        const { db, firestore } = await getFirestoreContext();
        const { collection, query, where, orderBy, onSnapshot } = firestore;

        const q = query(
            collection(db, COLLECTION_NAME),
            where('published', '==', true),
            orderBy('sortOrder', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const videos = snapshot.docs.map(mapDocToVideo).filter(Boolean);
                onData({ source: 'firestore', videos });
            },
            (err) => {
                if (typeof onError === 'function') onError(err);
            }
        );

        return unsubscribe;
    } catch (err) {
        if (typeof onError === 'function') onError(err);
        return () => {};
    }
}

/**
 * Admin: inscreve em TODOS os vídeos (publicados e rascunhos).
 */
export async function subscribeAllVideosAdmin({ onData, onError }) {
    const { db, firestore } = await getFirestoreContext();
    const { collection, query, orderBy, onSnapshot } = firestore;

    const q = query(collection(db, COLLECTION_NAME), orderBy('sortOrder', 'asc'));

    return onSnapshot(
        q,
        (snapshot) => {
            const videos = snapshot.docs.map(mapDocToVideo).filter(Boolean);
            onData(videos);
        },
        (err) => {
            if (typeof onError === 'function') onError(err);
        }
    );
}

export async function createVideoAdmin(input) {
    const payload = buildValidatedWritePayload(input);
    const { db, firestore } = await getFirestoreContext();
    const { collection, addDoc, serverTimestamp } = firestore;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateVideoAdmin(videoId, input) {
    if (!videoId || typeof videoId !== 'string') throw new Error('INVALID_ID');
    const payload = buildValidatedWritePayload(input);
    const { db, firestore } = await getFirestoreContext();
    const { doc, updateDoc, serverTimestamp } = firestore;

    await updateDoc(doc(db, COLLECTION_NAME, videoId), {
        ...payload,
        updatedAt: serverTimestamp(),
    });
}

export async function patchVideoFlagsAdmin(videoId, partialFlags) {
    if (!videoId || typeof videoId !== 'string') throw new Error('INVALID_ID');
    const { db, firestore } = await getFirestoreContext();
    const { doc, updateDoc, serverTimestamp } = firestore;

    const allowed = {};
    if (typeof partialFlags.published === 'boolean') allowed.published = partialFlags.published;
    if (typeof partialFlags.featured === 'boolean') allowed.featured = partialFlags.featured;
    if (Number.isFinite(Number(partialFlags.sortOrder))) {
        allowed.sortOrder = Math.max(0, Math.min(9999, Math.floor(Number(partialFlags.sortOrder))));
    }

    await updateDoc(doc(db, COLLECTION_NAME, videoId), {
        ...allowed,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteVideoAdmin(videoId) {
    if (!videoId || typeof videoId !== 'string') throw new Error('INVALID_ID');
    const { db, firestore } = await getFirestoreContext();
    const { doc, deleteDoc } = firestore;
    await deleteDoc(doc(db, COLLECTION_NAME, videoId));
}

/**
 * Troca atomicamente a ordem (`sortOrder`) dentro da lista ordenada de um mesmo tipo,
 * normalizando `1..N` para evitar empates caso existam valores duplicados de `sortOrder`.
 */
export async function swapVideosOrderAdmin(siblingsInType, indexA, indexB) {
    if (!Array.isArray(siblingsInType)) return;
    if (indexA < 0 || indexB < 0 || indexA >= siblingsInType.length || indexB >= siblingsInType.length) return;
    if (indexA === indexB) return;

    const reordered = [...siblingsInType];
    [reordered[indexA], reordered[indexB]] = [reordered[indexB], reordered[indexA]];

    const { db, firestore } = await getFirestoreContext();
    const { doc, writeBatch, serverTimestamp } = firestore;

    const batch = writeBatch(db);
    let hasChanges = false;
    reordered.forEach((video, idx) => {
        const nextOrder = idx + 1;
        if (video.sortOrder !== nextOrder) {
            batch.update(doc(db, COLLECTION_NAME, video.id), {
                sortOrder: nextOrder,
                updatedAt: serverTimestamp(),
            });
            hasChanges = true;
        }
    });

    if (hasChanges) {
        await batch.commit();
    }
}

/**
 * Importação inicial IDEMPOTENTE dos 6 vídeos + 4 Shorts existentes.
 * Usa os IDs determinísticos de INITIAL_VIDEOS e grava apenas os documentos ausentes,
 * nunca duplicando nem sobrescrevendo documentos já existentes no Firestore.
 */
export async function importInitialVideosIdempotent() {
    const { db, firestore } = await getFirestoreContext();
    const { collection, getDocs, doc, writeBatch, serverTimestamp } = firestore;

    const existingSnap = await getDocs(collection(db, COLLECTION_NAME));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const existingExternalKeys = new Set(
        existingSnap.docs.map((d) => {
            const data = d.data();
            return `${data.type}:${data.externalId}`;
        })
    );

    const batch = writeBatch(db);
    let importedCount = 0;
    let skippedCount = 0;

    for (const raw of INITIAL_VIDEOS) {
        const key = `${raw.type}:${raw.externalId}`;
        if (existingIds.has(raw.id) || existingExternalKeys.has(key)) {
            skippedCount++;
            continue;
        }

        const payload = buildValidatedWritePayload(raw);
        batch.set(doc(db, COLLECTION_NAME, raw.id), {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        importedCount++;
    }

    if (importedCount > 0) {
        await batch.commit();
    }

    return { importedCount, skippedCount, total: INITIAL_VIDEOS.length };
}
