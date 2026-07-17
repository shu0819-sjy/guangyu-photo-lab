const lightTemplates = [
  { id: 'landscape', label: '风光', icon: '◒', note: '高对比空间层次', values: { exposure: 8, contrast: 18, highlights: -24, shadows: 20, whites: 8, blacks: -8 } },
  { id: 'portrait', label: '人像', icon: '◉', note: '柔和低对比柔光', values: { exposure: 10, contrast: -8, highlights: -18, shadows: 24, whites: 4, blacks: 5 } },
  { id: 'commercial', label: '商业', icon: '◇', note: '硬光高反差', values: { exposure: 4, contrast: 28, highlights: -12, shadows: -6, whites: 20, blacks: -18 } },
  { id: 'documentary', label: '纪实', icon: '▧', note: '低对比灰雾', values: { exposure: 6, contrast: -16, highlights: -20, shadows: 18, whites: -4, blacks: 12 } }
];

const lightDefaults = { exposure: 6, contrast: 12, highlights: -18, shadows: 16, whites: 4, blacks: -4, face: 12, sky: -8, vegetation: 10, architecture: 4, background: -6, outline: false };
const savedLight = readLightState();
const initialLightParams = { ...lightDefaults, ...(savedLight?.params || {}) };
const lightState = {
  template: savedLight?.template || 'landscape',
  activeRegion: 'face',
  params: initialLightParams,
  isSaving: false,
  savedAt: savedLight?.savedAt || ''
};

/**
 * 读取上一轮光影参数。
 * 入参：无。
 * 返回值：保存的光影状态或空值。
 * 边界情况：存储损坏、未登录或字段不完整时返回空值。
 */
function readLightState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return null;
  try {
    const raw = sessionStorage.getItem('photoLabLightState');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.params) return null;
    return parsed;
  } catch { return null; }
}

/**
 * 读取构图模块传来的图片预览样式。
 * 入参：无。
 * 返回值：压缩后的图片 Data URL。
 * 边界情况：没有上传图片或会话存储不可用时返回空字符串，保留默认占位图。
 */
function getPreviewImageStyle() {
  try {
    const dataUrl = sessionStorage.getItem('photoLabPreviewImage');
    return dataUrl?.startsWith('data:image/') ? dataUrl : '';
  } catch { return ''; }
}

/**
 * 将模块3页面挂载到应用根节点。
 * 入参：onBack 返回上一模块的导航回调。
 * 返回值：无。
 * 边界情况：应用根节点不存在时直接结束。
 */
export function renderLightApp(onBack, onNext) {
  const app = document.querySelector('#app');
  if (!app) return;
  const previewImageStyle = getPreviewImageStyle();
  app.innerHTML = `
    <div class="light-shell" style="${previewImageStyle ? `--preview-image: url('${previewImageStyle}');` : ''}">
      <header class="light-topbar"><button class="light-brand" type="button" data-light-action="back"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></button><div class="light-title"><span>MODULE 03</span><strong>分层光影优化</strong></div><div class="light-top-actions"><span class="cloud-save-status" id="light-save-status"><i></i>${lightState.savedAt ? `已同步 · ${lightState.savedAt}` : '云端同步已开启'}</span><button class="light-help" type="button" data-light-action="help" aria-label="打开模块帮助">?</button><button class="light-avatar" type="button" aria-label="当前账号">林</button></div></header>
      <main class="light-workspace">
        <aside class="light-control-panel"><div class="light-panel-heading"><div><span class="light-kicker">A / GLOBAL LIGHT</span><h1>分层光影</h1><p>只调整明暗关系，不改变色彩与构图。</p></div><span class="light-badge">02</span></div>
          <section class="light-section"><div class="light-section-title"><strong>全局光影校准</strong><span>基础层次</span></div><div class="light-sliders">${renderLightSlider('exposure', '曝光', '恢复整体明暗')}${renderLightSlider('contrast', '对比度', '建立空间反差')}${renderLightSlider('highlights', '高光', '找回亮部细节')}${renderLightSlider('shadows', '阴影', '打开暗部层次')}${renderLightSlider('whites', '白色色阶', '控制最亮点')}${renderLightSlider('blacks', '黑色色阶', '稳住最暗点')}</div></section>
          <section class="light-section region-section"><div class="light-section-title"><strong>AI 分区光影</strong><span>免蒙版</span></div><div class="region-grid">${renderRegionButton('face', '人脸', '均匀提亮肌理', '◉')}${renderRegionButton('sky', '天空', '压暗找回云层', '◒')}${renderRegionButton('vegetation', '植被', '打开暗部细节', '♧')}${renderRegionButton('architecture', '建筑', '保持线条立体', '⌂')}${renderRegionButton('background', '背景', '轻微压暗主体', '○')}</div><div class="region-adjust"><div><strong id="region-label">人脸</strong><small id="region-note">均匀提亮肌理</small></div><output id="region-value">${formatValue(lightState.params.face)}</output><input id="region-slider" type="range" min="-40" max="40" value="${lightState.params.face}" aria-label="当前分区光影强度" /></div><label class="outline-toggle"><input id="outline-input" type="checkbox" ${lightState.params.outline ? 'checked' : ''} /><span class="fake-check">✓</span><span><strong>主体轮廓光</strong><small>轻微提亮边缘，增加立体感</small></span></label></section>
          <section class="light-section"><div class="light-section-title"><strong>题材光影模板</strong><span>一键套用</span></div><div class="template-grid">${lightTemplates.map((item) => `<button class="light-template ${lightState.template === item.id ? 'active' : ''}" type="button" data-template="${item.id}"><span>${item.icon}</span><strong>${item.label}</strong><small>${item.note}</small></button>`).join('')}</div></section>
          <div class="light-scope"><span>◈</span><p><strong>模块边界</strong><br />只处理画面明暗信息，结果将作为下一阶段调色模块输入。</p></div>
        </aside>
        <section class="light-preview-area"><div class="light-preview-heading"><div><span class="light-kicker">B / SPLIT PREVIEW</span><h2>实时分屏预览</h2></div><div class="preview-tools"><span id="light-template-label">${getTemplate(lightState.template).label} · ${getTemplate(lightState.template).note}</span><button type="button" class="light-reset" data-light-action="reset">↺ 重置光影</button></div></div><div class="split-preview"><div class="preview-pane original-pane"><div class="preview-label"><span>原图</span><small>INPUT</small></div><div class="preview-photo"></div><span class="preview-chip">构图已锁定</span></div><div class="preview-pane optimized-pane"><div class="preview-label"><span>光影优化后</span><small>OUTPUT</small></div><div class="preview-photo" id="optimized-photo"></div><span class="preview-chip optimized-chip">实时预览</span><div class="outline-light" id="outline-light"></div></div><div class="preview-divider"><span>左右对比</span></div></div><div class="preview-footer"><span><i></i>仅预览明暗变化 · 色彩与画质保持原样</span><span>同步状态：<strong id="preview-save-copy">${lightState.savedAt ? '已保存' : '待保存'}</strong></span></div></section>
      </main>
      <footer class="light-bottom"><div class="light-history"><button type="button" data-light-action="back">← 返回构图裁切</button><span>参数会自动保留，方便低分重修</span></div><div class="light-progress"><span>01 构图</span><i></i><strong>02 光影</strong><i></i><span>03 调色</span></div><button class="light-confirm" type="button" data-light-action="confirm"><span>✓</span>保存光影并进入调色 <b>→</b></button></footer><div class="light-toast" id="light-toast" role="status"></div>
    </div>`;
  bindLightEvents(onBack, onNext);
  updateLightPreview();
}

/**
 * 生成全局光影滑块。
 * 入参：key 参数键、label 中文名称、note 辅助说明。
 * 返回值：滑块 HTML 字符串。
 * 边界情况：参数不存在时使用默认值 0。
 */
function renderLightSlider(key, label, note) {
  const value = Number.isFinite(lightState.params[key]) ? lightState.params[key] : 0;
  return `<label class="light-slider-row"><span><strong>${label}</strong><small>${note}</small></span><output data-output="${key}">${formatValue(value)}</output><input type="range" min="-40" max="40" value="${value}" data-light-slider="${key}" aria-label="${label}" /></label>`;
}

/**
 * 生成 AI 光影分区按钮。
 * 入参：key 分区键、label 分区名称、note 分区说明、icon 简图字符。
 * 返回值：按钮 HTML 字符串。
 * 边界情况：无。
 */
function renderRegionButton(key, label, note, icon) {
  return `<button class="region-button ${lightState.activeRegion === key ? 'active' : ''}" type="button" data-region="${key}"><span>${icon}</span><strong>${label}</strong><small>${note}</small></button>`;
}

/**
 * 取得题材模板。
 * 入参：id 模板标识。
 * 返回值：模板对象。
 * 边界情况：找不到时返回风光模板。
 */
function getTemplate(id) {
  return lightTemplates.find((item) => item.id === id) || lightTemplates[0];
}

/**
 * 格式化光影参数数值。
 * 入参：value 光影数值。
 * 返回值：带正负号的显示文本。
 * 边界情况：非数字按 0 处理。
 */
function formatValue(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safeValue > 0 ? '+' : ''}${safeValue}`;
}

/**
 * 更新两个预览窗的明暗效果和界面数值。
 * 入参：无。
 * 返回值：无。
 * 边界情况：预览节点不存在时不操作 DOM。
 */
function updateLightPreview() {
  const output = document.querySelector('#optimized-photo');
  const outline = document.querySelector('#outline-light');
  if (output instanceof HTMLElement) {
    const brightness = 1 + (lightState.params.exposure + lightState.params.shadows * .18 + lightState.params.highlights * .05) / 100;
    const contrast = 1 + lightState.params.contrast / 100;
    output.style.filter = `brightness(${Math.max(.65, Math.min(1.35, brightness))}) contrast(${Math.max(.72, Math.min(1.45, contrast))})`;
  }
  if (outline instanceof HTMLElement) outline.classList.toggle('visible', lightState.params.outline);
  document.querySelectorAll('[data-output]').forEach((node) => { const key = node.getAttribute('data-output'); if (key) node.textContent = formatValue(lightState.params[key]); });
  const regionSlider = document.querySelector('#region-slider');
  const regionValue = document.querySelector('#region-value');
  if (regionSlider instanceof HTMLInputElement) regionSlider.value = String(lightState.params[lightState.activeRegion]);
  if (regionValue) regionValue.textContent = formatValue(lightState.params[lightState.activeRegion]);
  const templateLabel = document.querySelector('#light-template-label');
  if (templateLabel) { const template = getTemplate(lightState.template); templateLabel.textContent = `${template.label} · ${template.note}`; }
}

/**
 * 将当前光影参数保存到登录会话。
 * 入参：无。
 * 返回值：无。
 * 边界情况：未登录时不写入云端模拟存储。
 */
function saveLightState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return;
  const savedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  lightState.savedAt = savedAt;
  sessionStorage.setItem('photoLabLightState', JSON.stringify({ template: lightState.template, params: lightState.params, savedAt }));
  const status = document.querySelector('#light-save-status');
  const copy = document.querySelector('#preview-save-copy');
  if (status) status.innerHTML = `<i></i>已同步 · ${savedAt}`;
  if (copy) copy.textContent = '已保存';
}

/**
 * 显示模块3短提示。
 * 入参：message 中文提示。
 * 返回值：无。
 * 边界情况：提示节点不存在时忽略。
 */
function showLightToast(message) {
  const toast = document.querySelector('#light-toast');
  if (!(toast instanceof HTMLElement)) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2300);
}

/**
 * 绑定模块3全部交互事件。
 * 入参：onBack 返回模块2的回调。
 * 返回值：无。
 * 边界情况：重复挂载时只绑定当前页面节点，不污染其他模块。
 */
function bindLightEvents(onBack, onNext) {
  document.querySelectorAll('[data-light-slider]').forEach((node) => node.addEventListener('input', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; const key = input.getAttribute('data-light-slider'); if (!key) return; lightState.params[key] = Number(input.value); updateLightPreview(); saveLightState(); }));
  document.querySelectorAll('[data-region]').forEach((node) => node.addEventListener('click', () => { const key = node.getAttribute('data-region'); if (!key) return; lightState.activeRegion = key; document.querySelectorAll('[data-region]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-region') === key)); const label = node.querySelector('strong')?.textContent || '当前分区'; const note = node.querySelector('small')?.textContent || '局部光影'; const regionLabel = document.querySelector('#region-label'); const regionNote = document.querySelector('#region-note'); if (regionLabel) regionLabel.textContent = label; if (regionNote) regionNote.textContent = note; updateLightPreview(); }));
  document.querySelectorAll('[data-template]').forEach((node) => node.addEventListener('click', () => { const id = node.getAttribute('data-template'); const template = getTemplate(id); lightState.template = template.id; lightState.params = { ...lightState.params, ...template.values }; document.querySelectorAll('[data-template]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-template') === template.id)); updateLightPreview(); saveLightState(); showLightToast(`已加载${template.label}光影模板`); }));
  document.querySelector('#region-slider')?.addEventListener('input', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; lightState.params[lightState.activeRegion] = Number(input.value); updateLightPreview(); saveLightState(); });
  document.querySelector('#outline-input')?.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; lightState.params.outline = input.checked; updateLightPreview(); saveLightState(); });
  document.querySelectorAll('[data-light-action]').forEach((node) => node.addEventListener('click', () => { const action = node.getAttribute('data-light-action'); if (action === 'back') { onBack(); return; } if (action === 'reset') { lightState.template = 'landscape'; lightState.params = { ...lightDefaults }; document.querySelectorAll('[data-template]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-template') === lightState.template)); updateLightPreview(); saveLightState(); showLightToast('已重置全部光影参数'); return; } if (action === 'help') showLightToast('滑块只改变明暗，分区按钮用于局部光影微调'); if (action === 'confirm') { saveLightState(); if (onNext) onNext(); } }));
}
