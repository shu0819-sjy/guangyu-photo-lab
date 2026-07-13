const colorPresets = [
  { id: 'landscape', label: '风光大师', note: '蓝青天空 · 温润绿植', icon: '◒', filter: 'hue-rotate(-8deg) saturate(1.08)' },
  { id: 'portrait', label: '人像写真', note: '柔和暖调 · 肤色通透', icon: '◉', filter: 'sepia(.12) saturate(1.05) hue-rotate(-5deg)' },
  { id: 'film', label: '纪实胶片', note: '低饱和 · 灰雾质感', icon: '▧', filter: 'sepia(.18) saturate(.78) hue-rotate(6deg)' },
  { id: 'commercial', label: '商业时尚', note: '高对比撞色 · 高级单色', icon: '◇', filter: 'saturate(1.16) hue-rotate(12deg)' },
  { id: 'mono', label: '黑白大师', note: '分层灰度 · 轻微暗角', icon: '◐', filter: 'grayscale(1)' }
];

const channels = [
  { id: 'red', label: '红', tone: '#d48787' },
  { id: 'orange', label: '橙', tone: '#e5a26f' },
  { id: 'yellow', label: '黄', tone: '#d7bd72' },
  { id: 'green', label: '绿', tone: '#88af8e' },
  { id: 'cyan', label: '青', tone: '#76b4b4' },
  { id: 'blue', label: '蓝', tone: '#809dcc' },
  { id: 'purple', label: '紫', tone: '#ab8dc0' }
];

const colorDefaults = { temperature: 2, tint: 0, vibrance: 14, saturation: 2, skinProtect: true, channel: {} };
channels.forEach((channel) => { colorDefaults.channel[channel.id] = { hue: 0, saturation: 0, lightness: 0 }; });
const savedColor = readColorState();
const colorState = {
  preset: savedColor?.preset || 'landscape',
  activeChannel: 'orange',
  params: normalizeColorParams(savedColor?.params),
  savedAt: savedColor?.savedAt || ''
};

/**
 * 读取账号的历史调色参数。
 * 入参：无。
 * 返回值：历史调色状态或空值。
 * 边界情况：未登录、存储损坏时返回空值。
 */
function readColorState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return null;
  try {
    const raw = sessionStorage.getItem('photoLabColorState');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

/**
 * 合并默认调色参数，保证重修存档字段完整。
 * 入参：savedParams 历史调色参数。
 * 返回值：完整调色参数对象。
 * 边界情况：历史参数缺失时使用默认值。
 */
function normalizeColorParams(savedParams) {
  const params = { ...colorDefaults, ...(savedParams || {}), channel: {} };
  channels.forEach((channel) => { params.channel[channel.id] = { ...colorDefaults.channel[channel.id], ...(savedParams?.channel?.[channel.id] || {}) }; });
  return params;
}

/**
 * 挂载专业色彩调色页面。
 * 入参：onBack 返回模块3的回调，onNext 进入下一模块的回调。
 * 返回值：无。
 * 边界情况：应用根节点不存在时停止挂载。
 */
export function renderColorApp(onBack, onNext) {
  const app = document.querySelector('#app');
  if (!app) return;
  app.innerHTML = `
    <div class="color-shell"><header class="color-topbar"><button class="color-brand" type="button" data-color-action="back"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></button><div class="color-title"><span>MODULE 04</span><strong>专业色彩调色大师库</strong></div><div class="color-actions"><span class="color-save-status" id="color-save-status"><i></i>${colorState.savedAt ? `已同步 · ${colorState.savedAt}` : '云端同步已开启'}</span><button class="color-help" type="button" data-color-action="help" aria-label="打开调色帮助">?</button><button class="color-avatar" type="button" aria-label="当前账号">林</button></div></header>
      <main class="color-workspace"><aside class="color-panel"><div class="color-panel-heading"><div><span class="color-kicker">A / COLOR LAB</span><h1>色彩大师库</h1><p>只调整色彩关系，不改变明暗与构图。</p></div><span class="color-badge">04</span></div><section class="color-section"><div class="color-section-title"><strong>基础色彩校正</strong><span>自然优先</span></div><div class="color-basic-sliders">${renderColorSlider('temperature', '白平衡', '修复偏黄 / 偏蓝')}${renderColorSlider('tint', '色调', '修复偏绿 / 偏紫')}${renderColorSlider('vibrance', '自然饱和度', '优先保护肤色')}${renderColorSlider('saturation', '全局饱和度', '克制整体色彩')}</div><label class="skin-toggle"><input id="skin-protect" type="checkbox" ${colorState.params.skinProtect ? 'checked' : ''} /><span class="skin-check">✓</span><span><strong>肤色保护</strong><small>环境色调整不影响人脸肤色</small></span><em>推荐</em></label></section><section class="color-section channel-section"><div class="color-section-title"><strong>七通道精细调色</strong><span>HSL</span></div><div class="channel-list">${channels.map((channel) => `<button class="channel-button ${colorState.activeChannel === channel.id ? 'active' : ''}" type="button" data-channel="${channel.id}"><span style="background:${channel.tone}"></span><strong>${channel.label}</strong></button>`).join('')}</div><div class="channel-detail"><div class="channel-detail-title"><span class="channel-swatch" id="channel-swatch"></span><div><strong id="channel-name">橙色通道 · 肤色专用</strong><small>调整当前色彩范围的色相、饱和度与明度</small></div></div>${renderChannelSlider('hue', '色相')}${renderChannelSlider('saturation', '饱和度')}${renderChannelSlider('lightness', '明度')}</div></section><div class="color-scope"><span>◈</span><p><strong>模块边界</strong><br />仅修改色彩参数，光影、构图和画质保持不变。</p></div></aside><section class="color-main"><div class="color-main-heading"><div><span class="color-kicker">B / COLOR PREVIEW</span><h2>实时色彩预览</h2></div><div class="color-tools"><span id="color-preset-label">${getPreset(colorState.preset).label}</span><button class="color-reset" type="button" data-color-action="reset">↺ 重置色调</button></div></div><div class="color-preview"><div class="color-photo" id="color-photo"></div><div class="color-preview-overlay"><div><span>MODULE 04</span><strong>COLOR / ${getPreset(colorState.preset).label.toUpperCase()}</strong></div><span class="color-live"><i></i>实时预览</span></div><div class="skin-guard" id="skin-guard"><span>◉</span> 肤色保护已开启</div></div><div class="color-preview-footer"><span><i></i>仅预览色彩变化 · 明暗与画质保持原样</span><span>同步状态：<strong id="color-preview-save">${colorState.savedAt ? '已保存' : '待保存'}</strong></span></div><section class="preset-section"><div class="color-section-title"><strong>五位摄影大师风格</strong><span>成熟色调预设</span></div><div class="preset-grid">${colorPresets.map((preset) => `<button class="preset-card ${colorState.preset === preset.id ? 'active' : ''}" type="button" data-preset="${preset.id}"><span class="preset-image preset-${preset.id}"><i>${preset.icon}</i></span><strong>${preset.label}</strong><small>${preset.note}</small></button>`).join('')}</div></section></section></main><footer class="color-bottom"><div class="color-history"><button type="button" data-color-action="back">← 返回分层光影</button><span>参数会自动保留，方便低分重修</span></div><div class="color-progress"><span>01 构图</span><i></i><span>02 光影</span><i></i><strong>03 调色</strong><i></i><span>04 画质</span></div><button class="color-confirm" type="button" data-color-action="confirm"><span>✓</span>保存调色并进入画质修复 <b>→</b></button></footer><div class="color-toast" id="color-toast" role="status"></div></div>`;
  bindColorEvents(onBack, onNext);
  updateColorPreview();
}

/**
 * 生成基础色彩滑块。
 * 入参：key 参数键、label 名称、note 说明。
 * 返回值：滑块 HTML 字符串。
 * 边界情况：无。
 */
function renderColorSlider(key, label, note) {
  return `<label class="color-slider-row"><span><strong>${label}</strong><small>${note}</small></span><output data-color-output="${key}">${formatColorValue(colorState.params[key])}</output><input type="range" min="-40" max="40" value="${colorState.params[key]}" data-color-slider="${key}" aria-label="${label}" /></label>`;
}

/**
 * 生成通道 HSL 滑块。
 * 入参：key 通道参数键，label 中文名称。
 * 返回值：滑块 HTML 字符串。
 * 边界情况：当前通道参数不存在时按 0 渲染。
 */
function renderChannelSlider(key, label) {
  const value = colorState.params.channel[colorState.activeChannel]?.[key] || 0;
  return `<label class="channel-slider-row"><span>${label}</span><output data-channel-output="${key}">${formatColorValue(value)}</output><input type="range" min="-40" max="40" value="${value}" data-channel-slider="${key}" aria-label="当前通道${label}" /></label>`;
}

/**
 * 根据预设 id 找到色调预设。
 * 入参：id 预设标识。
 * 返回值：预设对象。
 * 边界情况：找不到时返回风光大师预设。
 */
function getPreset(id) {
  return colorPresets.find((preset) => preset.id === id) || colorPresets[0];
}

/**
 * 格式化调色数值。
 * 入参：value 数值。
 * 返回值：带正负号的显示文本。
 * 边界情况：无效值按 0 显示。
 */
function formatColorValue(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safeValue > 0 ? '+' : ''}${safeValue}`;
}

/**
 * 更新色彩预览和当前通道控制。
 * 入参：无。
 * 返回值：无。
 * 边界情况：预览节点不存在时直接结束。
 */
function updateColorPreview() {
  const photo = document.querySelector('#color-photo');
  if (!(photo instanceof HTMLElement)) return;
  const preset = getPreset(colorState.preset);
  const temperature = colorState.params.temperature * .35;
  const tint = colorState.params.tint * .25;
  const saturation = 1 + (colorState.params.vibrance * .012) + (colorState.params.saturation * .008);
  photo.style.filter = `${preset.filter} hue-rotate(${temperature + tint}deg) saturate(${Math.max(.65, Math.min(1.35, saturation))})`;
  photo.classList.toggle('mono-preview', colorState.preset === 'mono');
  document.querySelectorAll('[data-color-output]').forEach((node) => { const key = node.getAttribute('data-color-output'); if (key) node.textContent = formatColorValue(colorState.params[key]); });
  document.querySelectorAll('[data-channel-output]').forEach((node) => { const key = node.getAttribute('data-channel-output'); if (key) node.textContent = formatColorValue(colorState.params.channel[colorState.activeChannel][key]); });
  const guard = document.querySelector('#skin-guard');
  if (guard) guard.classList.toggle('hidden', !colorState.params.skinProtect);
  const presetLabel = document.querySelector('#color-preset-label');
  if (presetLabel) presetLabel.textContent = preset.label;
  const channel = channels.find((item) => item.id === colorState.activeChannel) || channels[0];
  const channelName = document.querySelector('#channel-name');
  const swatch = document.querySelector('#channel-swatch');
  if (channelName) channelName.textContent = `${channel.label}色通道${channel.id === 'orange' ? ' · 肤色专用' : ''}`;
  if (swatch) swatch.setAttribute('style', `background:${channel.tone}`);
}

/**
 * 保存当前调色参数到登录会话。
 * 入参：无。
 * 返回值：无。
 * 边界情况：未登录时不写入存储。
 */
function saveColorState() {
  if (sessionStorage.getItem('photoLabLoggedIn') !== 'true') return;
  colorState.savedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  sessionStorage.setItem('photoLabColorState', JSON.stringify({ preset: colorState.preset, params: colorState.params, savedAt: colorState.savedAt }));
  const status = document.querySelector('#color-save-status');
  const copy = document.querySelector('#color-preview-save');
  if (status) status.innerHTML = `<i></i>已同步 · ${colorState.savedAt}`;
  if (copy) copy.textContent = '已保存';
}

/**
 * 显示调色模块提示。
 * 入参：message 中文提示。
 * 返回值：无。
 * 边界情况：提示节点不存在时忽略。
 */
function showColorToast(message) {
  const toast = document.querySelector('#color-toast');
  if (!(toast instanceof HTMLElement)) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2300);
}

/**
 * 绑定调色模块交互事件。
 * 入参：onBack 返回回调，onNext 下一模块回调。
 * 返回值：无。
 * 边界情况：只绑定当前模块节点，避免影响其他模块。
 */
function bindColorEvents(onBack, onNext) {
  document.querySelectorAll('[data-color-slider]').forEach((node) => node.addEventListener('input', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; const key = input.getAttribute('data-color-slider'); if (!key) return; colorState.params[key] = Number(input.value); updateColorPreview(); saveColorState(); }));
  document.querySelectorAll('[data-channel]').forEach((node) => node.addEventListener('click', () => { const id = node.getAttribute('data-channel'); if (!id) return; colorState.activeChannel = id; document.querySelectorAll('[data-channel]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-channel') === id)); const detail = document.querySelector('.channel-detail'); if (detail) detail.querySelectorAll('.channel-slider-row').forEach((item) => item.remove()); const detailTitle = detail?.querySelector('.channel-detail-title'); if (detailTitle) detailTitle.insertAdjacentHTML('afterend', `${renderChannelSlider('hue', '色相')}${renderChannelSlider('saturation', '饱和度')}${renderChannelSlider('lightness', '明度')}`); bindChannelSliders(); updateColorPreview(); }));
  bindChannelSliders();
  document.querySelector('#skin-protect')?.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; colorState.params.skinProtect = input.checked; updateColorPreview(); saveColorState(); });
  document.querySelectorAll('[data-preset]').forEach((node) => node.addEventListener('click', () => { const id = node.getAttribute('data-preset'); if (!id) return; colorState.preset = id; document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-preset') === id)); updateColorPreview(); saveColorState(); showColorToast(`已套用${getPreset(id).label}风格`); }));
  document.querySelectorAll('[data-color-action]').forEach((node) => node.addEventListener('click', () => { const action = node.getAttribute('data-color-action'); if (action === 'back') { onBack(); return; } if (action === 'help') { showColorToast('预设负责整体色调，七通道用于局部色彩微调'); return; } if (action === 'reset') { colorState.preset = 'landscape'; colorState.params = normalizeColorParams(); document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('active', item.getAttribute('data-preset') === 'landscape')); updateColorPreview(); saveColorState(); showColorToast('已重置全部调色参数'); return; } if (action === 'confirm') { saveColorState(); if (onNext) onNext(); } }));
}

/**
 * 绑定当前通道的 HSL 滑块。
 * 入参：无。
 * 返回值：无。
 * 边界情况：节点不存在时不执行绑定。
 */
function bindChannelSliders() {
  document.querySelectorAll('[data-channel-slider]').forEach((node) => { node.oninput = (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement)) return; const key = input.getAttribute('data-channel-slider'); if (!key) return; colorState.params.channel[colorState.activeChannel][key] = Number(input.value); updateColorPreview(); saveColorState(); }; });
}
