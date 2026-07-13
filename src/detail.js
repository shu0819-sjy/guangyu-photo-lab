const detailDefaults = { noise: 24, sharpness: 38, blemish: 12, noiseEnabled: true, sharpnessEnabled: true, blemishEnabled: false, batchOptions: { exposure: true, whiteBalance: true, contrast: true, tone: true, vignette: true } };
const savedDetail = readDetailState();
const detailState = {
  tab: 'single',
  params: { ...detailDefaults, ...(savedDetail?.params || {}), batchOptions: { ...detailDefaults.batchOptions, ...(savedDetail?.params?.batchOptions || {}) } },
  files: [],
  reference: null,
  isBatching: false,
  savedAt: savedDetail?.savedAt || ''
};

/**
 * 读取画质与批量参数存档。
 * 入参：无。
 * 返回值：历史状态或空值。
 * 边界情况：未登录或存储内容损坏时返回空值。
 */
function readDetailState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return null;
  try {
    const raw = sessionStorage.getItem('photoLabDetailState');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

/**
 * 挂载画质修复与批量统一页面。
 * 入参：onBack 返回模块4，onNext 进入评分模块的回调。
 * 返回值：无。
 * 边界情况：应用根节点不存在时停止挂载。
 */
export function renderDetailApp(onBack, onNext) {
  const app = document.querySelector('#app');
  if (!app) return;
  app.innerHTML = `
    <div class="detail-shell"><header class="detail-topbar"><button class="detail-brand" type="button" data-detail-action="back"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></button><div class="detail-title"><span>MODULE 05</span><strong>画质细节修复 + 批量组图统一</strong></div><div class="detail-actions"><span class="detail-save-status" id="detail-save-status"><i></i>${detailState.savedAt ? `已同步 · ${detailState.savedAt}` : '云端同步已开启'}</span><button class="detail-help" type="button" data-detail-action="help" aria-label="打开画质帮助">?</button><button class="detail-avatar" type="button" aria-label="当前账号">林</button></div></header><main class="detail-workspace"><div class="detail-tabs" role="tablist"><button class="detail-tab single-tab ${detailState.tab === 'single' ? 'active' : ''}" type="button" data-detail-tab="single" role="tab" aria-selected="${detailState.tab === 'single'}"><span>◌</span><strong>单张画质修复</strong><small>细节、噪点与瑕疵</small></button><button class="detail-tab batch-tab ${detailState.tab === 'batch' ? 'active' : ''}" type="button" data-detail-tab="batch" role="tab" aria-selected="${detailState.tab === 'batch'}"><span>▦</span><strong>批量组图统一</strong><small>整套作品风格一致</small></button></div>${detailState.tab === 'single' ? renderSingleView() : renderBatchView()}</main><footer class="detail-bottom"><div class="detail-history"><button type="button" data-detail-action="back">← 返回专业色彩</button><span>所有细节参数会自动保留</span></div><div class="detail-progress"><span>01 构图</span><i></i><span>02 光影</span><i></i><span>03 调色</span><i></i><strong>04 画质</strong></div><button class="detail-confirm" type="button" data-detail-action="confirm"><span>✓</span>${detailState.tab === 'single' ? '保存画质并进入 AI 评分' : '统一组图并进入 AI 评分'} <b>→</b></button></footer><div class="detail-toast" id="detail-toast" role="status"></div></div>`;
  bindDetailEvents(onBack, onNext);
}

/**
 * 生成单张画质修复视图。
 * 入参：无。
 * 返回值：单张视图 HTML 字符串。
 * 边界情况：无。
 */
function renderSingleView() {
  return `<section class="single-detail-view"><aside class="detail-side-panel"><div class="detail-heading"><span class="detail-kicker">A / DETAIL RESTORE</span><h1>细节修复</h1><p>只优化细节，不重构画面基础关系。</p></div><div class="detail-control-group"><div class="detail-control-title"><strong>智能降噪</strong><span class="toggle-pill ${detailState.params.noiseEnabled ? 'on' : ''}" data-detail-toggle="noiseEnabled"><i></i></span></div><small>暗光颗粒柔和处理，主体保持清晰</small><div class="detail-range"><output>${formatDetailValue(detailState.params.noise)}</output><input type="range" min="0" max="70" value="${detailState.params.noise}" data-detail-slider="noise" aria-label="智能降噪强度" /></div></div><div class="detail-control-group"><div class="detail-control-title"><strong>分区精准锐化</strong><span class="toggle-pill ${detailState.params.sharpnessEnabled ? 'on' : ''}" data-detail-toggle="sharpnessEnabled"><i></i></span></div><small>人眼、发丝、建筑轮廓与纹理优先</small><div class="detail-range"><output>${formatDetailValue(detailState.params.sharpness)}</output><input type="range" min="0" max="80" value="${detailState.params.sharpness}" data-detail-slider="sharpness" aria-label="分区锐化强度" /></div></div><div class="detail-control-group"><div class="detail-control-title"><strong>无痕瑕疵消除</strong><span class="toggle-pill ${detailState.params.blemishEnabled ? 'on' : ''}" data-detail-toggle="blemishEnabled"><i></i></span></div><small>污点、痘印与多余杂物克制消除</small><div class="detail-range"><output>${formatDetailValue(detailState.params.blemish)}</output><input type="range" min="0" max="60" value="${detailState.params.blemish}" data-detail-slider="blemish" aria-label="瑕疵消除强度" /></div></div><div class="detail-boundary"><span>◈</span><p><strong>处理边界</strong><br />保持原生肌理，不做过度磨皮或塑料化锐化。</p></div></aside><section class="detail-preview-area"><div class="detail-preview-heading"><div><span class="detail-kicker">B / DETAIL PREVIEW</span><h2>细节对比预览</h2></div><span class="detail-preview-note">画面基础光影与色彩已锁定</span></div><div class="detail-split"><div class="detail-photo detail-original"><span>原图 · INPUT</span></div><div class="detail-photo detail-output" id="detail-output"><span>修复后 · OUTPUT</span><div class="detail-focus-ring"></div></div><div class="detail-split-line"><span>对比</span></div></div><div class="detail-preview-footer"><span><i></i>仅处理细节质量 · 构图 / 光影 / 色彩保持原样</span><span>主体细节已锁定</span></div></section></section>`;
}

/**
 * 生成批量组图统一视图。
 * 入参：无。
 * 返回值：批量视图 HTML 字符串。
 * 边界情况：无图片时显示上传空状态。
 */
function renderBatchView() {
  return `<section class="batch-detail-view"><div class="batch-header"><div><span class="detail-kicker">A / SERIES MATCH</span><h1>批量组图统一</h1><p>上传同系列作品与一张参考成片，统一整套视觉风格。</p></div><span class="batch-count" id="batch-count">${detailState.files.length} 张作品</span></div><div class="batch-upload-grid"><label class="batch-upload-main" for="batch-input"><input id="batch-input" type="file" accept="image/jpeg,image/png,image/webp" multiple /><span class="batch-upload-icon">＋</span><strong>批量上传组图</strong><small>支持手机多选 · 可上传数十张同系列作品</small></label><label class="reference-upload" for="reference-input"><input id="reference-input" type="file" accept="image/jpeg,image/png,image/webp" /><span class="reference-thumb" id="reference-thumb">◌</span><span><strong>${detailState.reference ? detailState.reference.name : '上传参考成片'}</strong><small>${detailState.reference ? '已载入满意成片' : '用一张满意作品统一风格'}</small></span><b>＋</b></label></div><div class="batch-options"><div class="batch-options-heading"><strong>同步参考成片参数</strong><span>AI 自动对齐</span></div><div class="batch-option-list">${renderBatchOption('exposure', '曝光')}${renderBatchOption('whiteBalance', '白平衡')}${renderBatchOption('contrast', '对比度')}${renderBatchOption('tone', '色调')}${renderBatchOption('vignette', '暗角')}</div></div><div class="batch-gallery-heading"><div><span class="detail-kicker">B / SERIES GALLERY</span><h2>组图预览</h2></div><span>按原始顺序排列</span></div><div class="batch-gallery" id="batch-gallery">${renderBatchGallery()}</div><button class="batch-unify" type="button" data-detail-action="unify"><span>✦</span>一键统一整套风格 <b>→</b></button></section>`;
}

/**
 * 生成批量同步选项。
 * 入参：key 选项键，label 显示名称。
 * 返回值：选项 HTML 字符串。
 * 边界情况：无。
 */
function renderBatchOption(key, label) {
  return `<label class="batch-option"><input type="checkbox" data-batch-option="${key}" ${detailState.params.batchOptions[key] ? 'checked' : ''} /><span>✓</span>${label}</label>`;
}

/**
 * 生成批量缩略图网格。
 * 入参：无。
 * 返回值：缩略图 HTML 字符串。
 * 边界情况：无上传文件时显示引导空状态。
 */
function renderBatchGallery() {
  if (!detailState.files.length) return '<div class="batch-empty"><span>▧</span><strong>等待上传组图</strong><small>上传后将在这里预览整套作品</small></div>';
  return detailState.files.map((file, index) => `<div class="batch-item"><img src="${file.url}" alt="第 ${index + 1} 张组图" /><span>${String(index + 1).padStart(2, '0')}</span></div>`).join('');
}

/**
 * 格式化画质参数。
 * 入参：value 参数值。
 * 返回值：百分比显示文本。
 * 边界情况：无效值按 0 显示。
 */
function formatDetailValue(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safeValue}%`;
}

/**
 * 保存画质与批量参数。
 * 入参：无。
 * 返回值：无。
 * 边界情况：未登录时不写入存储。
 */
function saveDetailState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return;
  detailState.savedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  sessionStorage.setItem('photoLabDetailState', JSON.stringify({ params: detailState.params, savedAt: detailState.savedAt }));
  const status = document.querySelector('#detail-save-status');
  if (status) status.innerHTML = `<i></i>已同步 · ${detailState.savedAt}`;
}

/**
 * 显示画质模块提示。
 * 入参：message 中文提示。
 * 返回值：无。
 * 边界情况：提示节点不存在时忽略。
 */
function showDetailToast(message) {
  const toast = document.querySelector('#detail-toast');
  if (!(toast instanceof HTMLElement)) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2300);
}

/**
 * 绑定模块5事件。
 * 入参：onBack 返回回调，onNext 下一模块回调。
 * 返回值：无。
 * 边界情况：只处理当前页面控件。
 */
function bindDetailEvents(onBack, onNext) {
  document.querySelectorAll('[data-detail-tab]').forEach((node) => node.addEventListener('click', () => { const tab = node.getAttribute('data-detail-tab'); if (!tab) return; detailState.tab = tab; renderDetailApp(onBack, onNext); }));
  document.querySelectorAll('[data-detail-slider]').forEach((node) => node.addEventListener('input', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; const key = input.getAttribute('data-detail-slider'); if (!key) return; detailState.params[key] = Number(input.value); const output = input.parentElement?.querySelector('output'); if (output) output.textContent = formatDetailValue(input.value); updateDetailPreview(); saveDetailState(); }));
  document.querySelectorAll('[data-detail-toggle]').forEach((node) => node.addEventListener('click', () => { const key = node.getAttribute('data-detail-toggle'); if (!key) return; detailState.params[key] = !detailState.params[key]; node.classList.toggle('on', detailState.params[key]); updateDetailPreview(); saveDetailState(); }));
  document.querySelectorAll('[data-batch-option]').forEach((node) => node.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; const key = input.getAttribute('data-batch-option'); if (!key) return; detailState.params.batchOptions[key] = input.checked; saveDetailState(); }));
  document.querySelector('#batch-input')?.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement) || !input.files) return; detailState.files.forEach((file) => URL.revokeObjectURL(file.url)); detailState.files = Array.from(input.files).filter((file) => file.type.startsWith('image/')).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })); renderDetailApp(onBack, onNext); showDetailToast(`已载入 ${detailState.files.length} 张组图`); });
  document.querySelector('#reference-input')?.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return; if (detailState.reference) URL.revokeObjectURL(detailState.reference.url); detailState.reference = { name: input.files[0].name, url: URL.createObjectURL(input.files[0]) }; renderDetailApp(onBack, onNext); showDetailToast('参考成片已载入'); });
  document.querySelectorAll('[data-detail-action]').forEach((node) => node.addEventListener('click', () => { const action = node.getAttribute('data-detail-action'); if (action === 'back') { onBack(); return; } if (action === 'help') { showDetailToast('单张页优化细节，批量页统一整套作品风格'); return; } if (action === 'unify') { if (!detailState.files.length || !detailState.reference) { showDetailToast('请先上传组图和参考成片'); return; } detailState.isBatching = true; saveDetailState(); showDetailToast('正在同步整套作品的参考风格'); window.setTimeout(() => { detailState.isBatching = false; renderDetailApp(onBack, onNext); showDetailToast('组图风格已统一'); }, 900); return; } if (action === 'confirm') { saveDetailState(); if (onNext) onNext(); } }));
  updateDetailPreview();
}

/**
 * 根据单张参数更新预览效果。
 * 入参：无。
 * 返回值：无。
 * 边界情况：批量页面没有单张预览节点时不做操作。
 */
function updateDetailPreview() {
  const output = document.querySelector('#detail-output');
  if (!(output instanceof HTMLElement)) return;
  const blur = detailState.params.noiseEnabled ? Math.max(0, 0.55 - detailState.params.noise / 180) : 0;
  output.style.filter = `blur(${blur}px)`;
  output.classList.toggle('detail-sharp', detailState.params.sharpnessEnabled && detailState.params.sharpness > 20);
  output.classList.toggle('detail-clean', detailState.params.blemishEnabled && detailState.params.blemish > 10);
}
