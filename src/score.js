const scoreWeights = { composition: 30, light: 25, color: 25, detail: 20 };
const reportDefaults = {
  total: 78,
  dimensions: { composition: 23, light: 20, color: 19, detail: 16 },
  defects: [
    { id: 'composition', type: '构图', title: '主体略偏右，留白关系还可以更舒展', note: '视线引导没有完全落在主体上，建议回到构图模块微调主体位置。', tone: 'mint', target: 'crop', icon: '◫' },
    { id: 'light', type: '光影', title: '暗部细节略闷，局部层次不足', note: '画面整体稳定，但阴影区域可以适度打开，避免主体与背景黏连。', tone: 'orange', target: 'light', icon: '◒' },
    { id: 'color', type: '色彩', title: '橙色区域稍抢眼，整体色调需要更统一', note: '肤色基本自然，建议轻微收敛橙色通道并检查组图一致性。', tone: 'lavender', target: 'color', icon: '◉' },
    { id: 'detail', type: '画质', title: '主体边缘细节有轻微柔化', note: '建议对主体轮廓进行克制锐化，保留背景自然虚化与原生质感。', tone: 'blue', target: 'detail', icon: '✦' }
  ]
};

const scoreState = { file: null, report: loadLatestReport(), reportHistory: loadReportHistory(), isEvaluating: false, forceModal: false };

/**
 * 读取最新评分报告。
 * 入参：无。
 * 返回值：评分报告或默认报告。
 * 边界情况：存储损坏时使用默认报告。
 */
function loadLatestReport() {
  try { const raw = sessionStorage.getItem('photoLabLatestReport'); return raw ? JSON.parse(raw) : { ...reportDefaults }; } catch { return { ...reportDefaults }; }
}

/**
 * 读取历史评分报告列表。
 * 入参：无。
 * 返回值：历史报告数组。
 * 边界情况：无效存储返回空数组。
 */
function loadReportHistory() {
  try { const raw = sessionStorage.getItem('photoLabReportHistory'); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/**
 * 挂载评分诊断页面。
 * 入参：onNavigate 跳转修图模块回调。
 * 返回值：无。
 * 边界情况：根节点不存在时停止挂载。
 */
export function renderScoreApp(onNavigate) {
  const app = document.querySelector('#app');
  if (!app) return;
  const report = scoreState.report;
  const status = getScoreStatus(report.total);
  app.innerHTML = `<div class="score-shell"><header class="score-topbar"><button class="score-brand" type="button" data-score-action="home"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></button><div class="score-title"><span>MODULE 06</span><strong>AI 专业成片评分诊断</strong></div><div class="score-actions"><span class="score-save"><i></i>报告云端永久保存</span><button class="score-help" type="button" data-score-action="help" aria-label="打开评分帮助">?</button><button class="score-avatar" type="button" aria-label="当前账号">林</button></div></header><main class="score-workspace"><section class="score-hero"><div class="score-upload"><label class="score-upload-box" for="score-input"><input id="score-input" type="file" accept="image/jpeg,image/png,image/webp" /><span>＋</span><strong>${scoreState.file ? scoreState.file.name : '上传最终成片'}</strong><small>上传后自动完成全维度评测</small></label><div class="report-meta"><span>REPORT / ${scoreState.reportHistory.length + 1}</span><small>${report.updatedAt || '本次评测 · 刚刚完成'}</small></div></div><div class="score-card ${status.tone}"><div class="score-card-label"><span>FINAL SCORE</span><strong>${status.label}</strong></div><div class="score-number">${report.total}<small>/ 100</small></div><div class="score-status-line"><i></i>${status.description}</div></div><div class="score-history"><span>◷</span><strong>${scoreState.reportHistory.length || 1}</strong><small>份历史报告<br />可随时对比</small></div></section><section class="dimension-section"><div class="score-section-heading"><div><span class="score-kicker">A / PROFESSIONAL DIMENSIONS</span><h1>四维评分诊断</h1></div><span>固定权重 · 满分 100</span></div><div class="dimension-grid">${renderDimension('composition', '构图', '主体关系与视觉引导', report.dimensions.composition, scoreWeights.composition, 'mint')}${renderDimension('light', '光影层次', '明暗分层与主体突出', report.dimensions.light, scoreWeights.light, 'orange')}${renderDimension('color', '色彩和谐', '色调统一与情绪表达', report.dimensions.color, scoreWeights.color, 'lavender')}${renderDimension('detail', '画质质感', '噪点、锐度与原生质感', report.dimensions.detail, scoreWeights.detail, 'blue')}</div></section><section class="diagnosis-grid"><div class="defect-section"><div class="score-section-heading"><div><span class="score-kicker">B / VISUAL DIAGNOSIS</span><h2>画面缺陷标注</h2></div><span>点击扣分项快速修复</span></div><div class="defect-list">${report.defects.map((defect) => `<button class="defect-card ${defect.tone}" type="button" data-target="${defect.target}"><span class="defect-icon">${defect.icon}</span><span><em>${defect.type} · 扣分项</em><strong>${defect.title}</strong><small>${defect.note}</small></span><b>↗</b></button>`).join('')}</div></div><div class="advice-section"><div class="score-section-heading"><div><span class="score-kicker">C / PHOTOGRAPHER ADVICE</span><h2>专业修改方案</h2></div><span>通俗可执行</span></div><div class="advice-card"><div class="advice-lead"><span>✦</span><div><strong>${status.adviceTitle}</strong><p>${status.adviceCopy}</p></div></div><ol>${renderAdviceList(report.defects)}</ol></div><div class="report-binding"><span>◈</span><span>本报告已与原图绑定保存<br /><small>重修后会生成新的报告，可对比任意版本</small></span></div></div></section></main><footer class="score-bottom"><div><button type="button" data-score-action="home">← 返回工作台首页</button><span>评分模块只诊断，不自动修改图片</span></div><div class="score-pipeline"><span>01 构图</span><i></i><span>02 光影</span><i></i><span>03 调色</span><i></i><span>04 画质</span><i></i><strong>05 评分</strong></div><button class="score-save-button ${status.locked ? 'locked' : ''}" type="button" data-score-action="download">${status.locked ? '🔒 完成重修后解锁下载' : '↓ 下载并存入作品集'}</button></footer>${status.locked ? renderForceModal(report) : status.optional ? renderOptionalModal(report) : ''}<div class="score-toast" id="score-toast" role="status"></div></div>`;
  bindScoreEvents(onNavigate);
}

/**
 * 根据总分返回分级状态。
 * 入参：total 总分。
 * 返回值：状态文案和流程控制参数。
 * 边界情况：分数限制在 0 到 100。
 */
function getScoreStatus(total) {
  const safeTotal = Math.max(0, Math.min(100, Number(total) || 0));
  if (safeTotal < 60) return { label: '不合格 · 必须重修', tone: 'fail', locked: true, description: '高清下载与作品集存档已锁定', adviceTitle: '这张照片值得再打磨一次', adviceCopy: '当前存在影响成片质量的明显问题，请按下方建议完成重修，再次评测即可解锁全部权限。' };
  if (safeTotal < 80) return { label: '待优化 · 建议重修', tone: 'pending', optional: true, description: '存在明显缺陷，可自主选择重修', adviceTitle: '基础不错，再做一轮细节优化', adviceCopy: '作品已经具备完整框架，优先处理下面标注的扣分项，分数会更稳定。' };
  return { label: '合格成片 · 可保存', tone: 'pass', description: '已达到专业成片保存标准', adviceTitle: '这是一张可以交付的成片', adviceCopy: '整体完成度良好，可以直接下载保存，也可以继续微调后再次评测。' };
}

/**
 * 生成维度评分卡。
 * 入参：key 维度键、label 名称、note 说明、score 得分、weight 权重、tone 颜色。
 * 返回值：评分卡 HTML 字符串。
 * 边界情况：得分按权重限制。
 */
function renderDimension(key, label, note, score, weight, tone) {
  const safeScore = Math.max(0, Math.min(weight, Number(score) || 0));
  return `<button class="dimension-card ${tone}" type="button" data-target="${key === 'composition' ? 'crop' : key}"><div class="dimension-top"><span>${label}</span><strong>${safeScore}<small>/${weight}</small></strong></div><div class="dimension-track"><i style="width:${(safeScore / weight) * 100}%"></i></div><small>${note}</small><b>查看问题 →</b></button>`;
}

/**
 * 生成建议列表。
 * 入参：defects 缺陷数组。
 * 返回值：建议列表 HTML 字符串。
 * 边界情况：缺陷为空时显示整体保持建议。
 */
function renderAdviceList(defects) {
  if (!defects.length) return '<li>当前没有需要优先处理的缺陷，保持现有参数即可。</li>';
  return defects.slice(0, 4).map((defect) => `<li><button type="button" data-target="${defect.target}"><span>${defect.type}</span>${defect.note} <b>去调整 ↗</b></button></li>`).join('');
}

/**
 * 生成低分强制重修弹窗。
 * 入参：report 当前报告。
 * 返回值：弹窗 HTML 字符串。
 * 边界情况：无。
 */
function renderForceModal(report) {
  return `<div class="score-modal-backdrop"><section class="score-modal force-modal" role="dialog" aria-modal="true" aria-label="强制重修提示"><span class="modal-alert">!</span><span class="score-kicker">RETOUCH REQUIRED</span><h2>这张成片还不能交付</h2><p>当前得分 <strong>${report.total}</strong>，低于 60 分合格线。请根据专业修改方案完成重修，二次评测达标后即可解锁高清下载。</p><div class="modal-summary"><span>已标注 ${report.defects.length} 个优先问题</span><span>重修次数不限</span><span>历史报告永久保留</span></div><button class="modal-primary" type="button" data-score-action="start-rework">开始重修 →</button></section></div>`;
}

/**
 * 生成 60 到 79 分提示弹窗。
 * 入参：report 当前报告。
 * 返回值：弹窗 HTML 字符串。
 * 边界情况：无。
 */
function renderOptionalModal(report) {
  return `<div class="score-modal-backdrop"><section class="score-modal optional-modal" role="dialog" aria-modal="true" aria-label="待优化提示"><span class="modal-alert">i</span><span class="score-kicker">GOOD START</span><h2>作品已经不错，再精修一轮</h2><p>当前得分 <strong>${report.total}</strong>，存在几个明显但可快速改善的问题。你可以现在重修，也可以先保存当前版本。</p><div class="modal-actions"><button type="button" class="modal-secondary" data-score-action="close-modal">稍后处理</button><button type="button" class="modal-primary" data-score-action="start-rework">开始优化 →</button></div></section></div>`;
}

/**
 * 保存新的评分报告。
 * 入参：file 上传成片文件。
 * 返回值：新的评分报告。
 * 边界情况：文件名包含 low 或 低分时生成低于 60 分报告用于验证强制重修。
 */
function evaluateFile(file) {
  const isLow = /low|低分/i.test(file.name);
  const isPass = /pass|合格|满分/i.test(file.name);
  const total = isLow ? 56 : isPass ? 86 : 78;
  const dimensions = isLow ? { composition: 16, light: 14, color: 14, detail: 12 } : isPass ? { composition: 27, light: 22, color: 21, detail: 16 } : { ...reportDefaults.dimensions };
  const report = { ...reportDefaults, total, dimensions, updatedAt: new Date().toLocaleString('zh-CN'), imageName: file.name, id: `report-${Date.now()}` };
  const history = [...scoreState.reportHistory, report].slice(-20);
  sessionStorage.setItem('photoLabLatestReport', JSON.stringify(report));
  sessionStorage.setItem('photoLabReportHistory', JSON.stringify(history));
  return report;
}

/**
 * 显示评分提示。
 * 入参：message 中文提示。
 * 返回值：无。
 * 边界情况：提示节点不存在时忽略。
 */
function showScoreToast(message) {
  const toast = document.querySelector('#score-toast');
  if (!(toast instanceof HTMLElement)) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2300);
}

/**
 * 绑定评分页面事件。
 * 入参：onNavigate 进入指定修图模块的回调。
 * 返回值：无。
 * 边界情况：当前不是评分页时不执行绑定。
 */
function bindScoreEvents(onNavigate) {
  document.querySelector('#score-input')?.addEventListener('change', (event) => { const input = event.currentTarget; if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return; scoreState.file = input.files[0]; scoreState.isEvaluating = true; showScoreToast('正在完成四维专业评测'); window.setTimeout(() => { scoreState.report = evaluateFile(scoreState.file); scoreState.reportHistory = loadReportHistory(); scoreState.isEvaluating = false; renderScoreApp(onNavigate); }, 650); });
  document.querySelectorAll('[data-target]').forEach((node) => node.addEventListener('click', () => { const target = node.getAttribute('data-target'); if (target && onNavigate) onNavigate(target); }));
  document.querySelectorAll('[data-score-action]').forEach((node) => node.addEventListener('click', () => { const action = node.getAttribute('data-score-action'); if (action === 'home') { onNavigate('home'); return; } if (action === 'help') { showScoreToast('点击任意评分项可直接回到对应模块修复问题'); return; } if (action === 'close-modal') { node.closest('.score-modal-backdrop')?.remove(); return; } if (action === 'start-rework') { node.closest('.score-modal-backdrop')?.remove(); const first = scoreState.report.defects[0]; if (first && onNavigate) onNavigate(first.target); return; } if (action === 'download') { const status = getScoreStatus(scoreState.report.total); if (status.locked) showScoreToast('当前分数未达标，请先完成强制重修'); else showScoreToast('成片已加入作品集下载队列'); } }));
}
