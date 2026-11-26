/* =========================================
   ADMIN/VIDEO-FORM.JS — Cadastro, edição, validação e prévia estática segura
========================================= */

import { SUGGESTED_TOOLS } from '../config.js';
import {
    buildYouTubeThumbnailUrl,
    FALLBACK_THUMBNAIL_DATA_URI,
    formatDuration,
    parseDurationInput,
    parseStartSeconds,
    parseVideoUrl,
} from '../video-utils.js';

export function initVideoForm({ onSubmit, onCancel, getLang }) {
    const form = document.getElementById('video-form');
    const heading = document.getElementById('form-heading');
    const btnCancel = document.getElementById('btn-cancel-edit');
    const btnSave = document.getElementById('btn-save-video');

    const fieldId = document.getElementById('field-id');
    const fieldUrl = document.getElementById('field-url');
    const fieldType = document.getElementById('field-type');
    const fieldOrder = document.getElementById('field-order');
    const fieldTitle = document.getElementById('field-title');
    const fieldDuration = document.getElementById('field-duration');
    const fieldStart = document.getElementById('field-start');
    const fieldCustomTools = document.getElementById('field-custom-tools');
    const fieldPublished = document.getElementById('field-published');
    const fieldFeatured = document.getElementById('field-featured');

    const errUrl = document.getElementById('err-url');
    const errTitle = document.getElementById('err-title');
    const formError = document.getElementById('form-error');
    const toolsContainer = document.getElementById('tools-checkboxes');
    const previewMount = document.getElementById('preview-card-mount');

    // Renderiza checkboxes de ferramentas sugeridas
    const renderToolCheckboxes = () => {
        toolsContainer.replaceChildren();
        SUGGESTED_TOOLS.forEach((toolName) => {
            const label = document.createElement('label');
            label.className = 'admin-tool-check';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = toolName;
            input.addEventListener('change', updatePreview);

            const text = document.createElement('span');
            text.textContent = toolName;

            label.append(input, text);
            toolsContainer.appendChild(label);
        });
    };

    const collectTools = () => {
        const checked = Array.from(toolsContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map((cb) => cb.value);
        const custom = fieldCustomTools.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        return [...new Set([...checked, ...custom])].slice(0, 8);
    };

    const setTools = (tools = []) => {
        const suggestedSet = new Set(SUGGESTED_TOOLS);
        const selectedSet = new Set(tools);
        toolsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            cb.checked = selectedSet.has(cb.value);
        });
        const extras = tools.filter((t) => !suggestedSet.has(t));
        fieldCustomTools.value = extras.join(', ');
    };

    // Prévia estática segura (nunca injeta iframe/script automático)
    const updatePreview = () => {
        const isPt = getLang() === 'pt';
        const parsed = parseVideoUrl(fieldUrl.value);
        const title = fieldTitle.value.trim() || (isPt ? 'Título do projeto' : 'Project title');
        const durSec = parseDurationInput(fieldDuration.value);
        const tools = collectTools();

        previewMount.replaceChildren();

        const thumb = document.createElement('img');
        thumb.className = 'admin-preview__thumb';
        thumb.alt = title;
        thumb.src = parsed?.platform === 'youtube'
            ? buildYouTubeThumbnailUrl(parsed.externalId, 'hqdefault')
            : FALLBACK_THUMBNAIL_DATA_URI;
        thumb.addEventListener('error', () => {
            if (thumb.src !== FALLBACK_THUMBNAIL_DATA_URI) {
                thumb.src = FALLBACK_THUMBNAIL_DATA_URI;
            }
        });

        const info = document.createElement('div');
        info.className = 'admin-preview__info';

        const titleEl = document.createElement('strong');
        titleEl.className = 'admin-preview__title';
        titleEl.textContent = title;

        const metaParts = [];
        metaParts.push(parsed ? parsed.platform.toUpperCase() : (isPt ? 'URL pendente' : 'Waiting URL'));
        if (durSec) metaParts.push(formatDuration(durSec));
        if (tools.length) metaParts.push(tools.slice(0, 3).join(' · '));

        const metaEl = document.createElement('span');
        metaEl.className = 'admin-preview__meta';
        metaEl.textContent = metaParts.join(' • ');

        info.append(titleEl, metaEl);
        previewMount.append(thumb, info);
    };

    const clearErrors = () => {
        errUrl.textContent = '';
        errTitle.textContent = '';
        formError.textContent = '';
        formError.hidden = true;
    };

    const resetForm = (nextOrder = 1, defaultType = 'portfolio') => {
        clearErrors();
        fieldId.value = '';
        fieldUrl.value = '';
        fieldType.value = defaultType;
        fieldOrder.value = String(nextOrder);
        fieldTitle.value = '';
        fieldDuration.value = '';
        fieldStart.value = '0';
        fieldPublished.checked = true;
        fieldFeatured.checked = false;
        setTools([]);

        const isPt = getLang() === 'pt';
        heading.textContent = isPt ? 'Adicionar Vídeo' : 'Add Video';
        btnCancel.hidden = true;
        updatePreview();
    };

    const loadVideoForEdit = (video) => {
        clearErrors();
        fieldId.value = video.id;
        fieldUrl.value = video.sourceUrl || video.watchUrl || '';
        fieldType.value = video.type;
        fieldOrder.value = String(video.sortOrder ?? 1);
        fieldTitle.value = video.title || '';
        fieldDuration.value = video.durationSeconds ? formatDuration(video.durationSeconds) : '';
        fieldStart.value = String(video.startSeconds ?? 0);
        fieldPublished.checked = Boolean(video.published);
        fieldFeatured.checked = Boolean(video.featured);
        setTools(video.tools || []);

        const isPt = getLang() === 'pt';
        heading.textContent = isPt ? 'Editar Vídeo' : 'Edit Video';
        btnCancel.hidden = false;
        updatePreview();
        fieldTitle.focus();
    };

    // Auto-preenche startSeconds e tipo quando colar URL de YouTube Shorts ou &t=
    fieldUrl.addEventListener('input', () => {
        errUrl.textContent = '';
        const parsed = parseVideoUrl(fieldUrl.value);
        if (parsed) {
            if (parsed.startSeconds > 0 && Number(fieldStart.value) === 0) {
                fieldStart.value = String(parsed.startSeconds);
            }
            if (parsed.isShortUrl && !fieldId.value) {
                fieldType.value = 'short';
            }
        }
        updatePreview();
    });

    fieldTitle.addEventListener('input', () => {
        errTitle.textContent = '';
        updatePreview();
    });
    fieldDuration.addEventListener('input', updatePreview);
    fieldCustomTools.addEventListener('input', updatePreview);

    btnCancel.addEventListener('click', () => {
        if (typeof onCancel === 'function') onCancel();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const isPt = getLang() === 'pt';
        const parsedUrl = parseVideoUrl(fieldUrl.value);
        const title = fieldTitle.value.trim();

        let valid = true;
        if (!parsedUrl) {
            errUrl.textContent = isPt
                ? 'URL inválida. Use um link HTTPS válido do YouTube, Instagram ou TikTok.'
                : 'Invalid URL. Use a valid HTTPS link from YouTube, Instagram, or TikTok.';
            valid = false;
        }
        if (!title) {
            errTitle.textContent = isPt ? 'Informe o título do projeto.' : 'Please enter a project title.';
            valid = false;
        }
        if (!valid) return;

        const payload = {
            type: fieldType.value === 'short' ? 'short' : 'portfolio',
            sourceUrl: fieldUrl.value.trim(),
            title,
            durationSeconds: parseDurationInput(fieldDuration.value),
            startSeconds: parseStartSeconds(fieldStart.value),
            tools: collectTools(),
            sortOrder: Math.max(0, Math.min(9999, parseInt(fieldOrder.value || '1', 10) || 1)),
            published: fieldPublished.checked,
            featured: fieldFeatured.checked,
        };

        btnSave.disabled = true;
        try {
            await onSubmit({ id: fieldId.value || null, payload });
        } catch (err) {
            formError.textContent = err?.message || (isPt ? 'Erro ao salvar vídeo.' : 'Could not save video.');
            formError.hidden = false;
        } finally {
            btnSave.disabled = false;
        }
    });

    renderToolCheckboxes();
    updatePreview();

    return {
        resetForm,
        loadVideoForEdit,
        updatePreview,
    };
}
