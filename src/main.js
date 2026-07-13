import './styles.css';
import { renderLightApp } from './light.js';
import { renderColorApp } from './color.js';
import { renderDetailApp } from './detail.js';
import { renderScoreApp } from './score.js';

const compositionPlans = [
  { id: 'thirds', label: '三分构图', note: '主体落在视觉交点', icon: '▦', position: { x: 50, y: 42 }, crop: { x: 4, y: 5, width: 92, height: 90 } },
  { id: 'center', label: '居中对称', note: '平衡建筑与静物', icon: '⊙', position: { x: 50, y: 50 }, crop: { x: 8, y: 8, width: 84, height: 84 } },
  { id: 'minimal', label: '极简留白', note: '保留远景呼吸空间', icon: '◌', position: { x: 68, y: 48 }, crop: { x: 0, y: 12, width: 100, height: 76 } },
  { id: 'cinema', label: '电影宽幅', note: '2.39:1 叙事画面', icon: '▰', position: { x: 54, y: 46 }, crop: { x: 2, y: 22, width: 96, height: 56 } }
];

const ratios = [
  { value: 'free', label: '原比例' },
  { value: '1:1', label: '1:1' },
  { value: '3:2', label: '3:2' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '2.39:1', label: '2.39:1' }
];

const state = {
  activePlan: 'thirds',
  activeRatio: 'free',
  image: null,
  imageUrl: '',
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isLeveling: true,
  isCleaning: false,
  isProcessing: false,
  confirmed: false,
  pointer: null,
  pinchDistance: 0
};

const app = document.querySelector('#app');
const authState = {
  isLoggedIn: sessionStorage.getItem('photoLabLoggedIn') === 'true',
  phone: sessionStorage.getItem('photoLabPhone') || '',
  codeSent: false,
  guestUsed: sessionStorage.getItem('photoLabGuestUsed') === 'true',
  showGuide: sessionStorage.getItem('photoLabGuideSeen') !== 'true',
  currentView: sessionStorage.getItem('photoLabView') || 'login'
};

const guideSteps = [
  { index: '01', title: '构图裁切', copy: '先锁定主体与画面比例，调整空间关系，保留照片原始叙事。', tone: 'mint' },
  { index: '02', title: '分层光影', copy: '再处理亮部、暗部和局部层次，让画面更接近你的拍摄意图。', tone: 'orange' },
  { index: '03', title: '专业调色', copy: '最后建立色彩关系，控制饱和度与肤色，不套用廉价滤镜。', tone: 'lavender' },
  { index: '04', title: '画质修复', copy: '针对噪点、细节与输出尺寸进行克制修复，保留自然质感。', tone: 'blue' },
  { index: '05', title: 'AI 评分诊断', copy: '获得专业维度建议，低分作品可以回到任意模块继续修改。', tone: 'rose' }
];

/**
 * 创建裁切模块页面结构。
 * 入参：无。
 * 返回值：无。
 * 边界情况：页面挂载节点不存在时直接结束，避免脚本报错。
 */
function renderCropApp() {
  if (!app) return;
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="光屿图片精修首页">
          <span class="brand-mark">✦</span>
          <span><strong>光屿</strong><small>PHOTO LAB</small></span>
        </a>
        <div class="module-title"><span class="eyebrow">MODULE 01</span><span>智能构图裁切</span></div>
        <div class="top-actions">
          <span class="status-dot"><i></i>云端画布已连接</span>
          <button class="icon-button" type="button" data-action="help" aria-label="查看帮助">?</button>
          <button class="avatar" type="button" aria-label="打开账户菜单">林</button>
        </div>
      </header>
      <main class="workspace">
        <aside class="left-panel panel-block">
          <div class="panel-heading"><span><span class="section-kicker">A</span>素材与方案</span><button class="icon-button subtle" type="button" data-action="collapse-left" aria-label="折叠素材栏">‹</button></div>
          <label class="upload-box" for="image-input">
            <input id="image-input" type="file" accept="image/jpeg,image/png,image/webp" />
            <span class="upload-icon">＋</span>
            <strong>上传一张图片</strong>
            <small>JPG、PNG、WEBP · 最大 30MB</small>
          </label>
          <div class="asset-chip"><span class="mini-thumb"></span><span><strong id="asset-name">未选择图片</strong><small id="asset-meta">等待上传</small></span><button class="icon-button subtle" type="button" data-action="clear-image" aria-label="移除图片">×</button></div>
          <div class="subsection-title"><span>构图方案</span><span class="muted">AI 推荐</span></div>
          <div class="plan-grid">${compositionPlans.map((plan) => `<button class="plan-card ${plan.id === state.activePlan ? 'active' : ''}" type="button" data-plan="${plan.id}"><span class="plan-thumb plan-${plan.id}"><i>${plan.icon}</i></span><span><strong>${plan.label}</strong><small>${plan.note}</small></span></button>`).join('')}</div>
          <div class="subject-note"><span class="sparkle">✦</span><span><strong>主体识别</strong><small id="subject-copy">等待图片后自动识别人脸、山峰、建筑与静物</small></span></div>
        </aside>

        <section class="canvas-stage" aria-label="图片预览画布">
          <div class="canvas-topline"><div><span class="section-kicker">B</span><strong>预览画布</strong><span class="canvas-hint">拖动调整构图 · 双指缩放</span></div><span class="safe-label">可逆编辑</span></div>
          <div class="canvas-wrap" id="canvas-wrap">
            <div class="empty-canvas" id="empty-canvas"><div class="empty-illustration"><span>△</span><span>◒</span><span>╱</span></div><strong>上传图片开始构图</strong><small>AI 会锁定主体并给出专业裁切建议</small></div>
            <canvas id="preview-canvas" aria-label="图片裁切预览"></canvas>
            <div class="crop-frame" id="crop-frame" aria-hidden="true"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><span class="grid-line h one"></span><span class="grid-line h two"></span><span class="grid-line v one"></span><span class="grid-line v two"></span></div>
            <div class="canvas-loader" id="canvas-loader"><span></span>正在生成裁切预览</div>
            <div class="canvas-zoom"><button type="button" data-action="zoom-out" aria-label="缩小预览">−</button><span id="zoom-label">100%</span><button type="button" data-action="zoom-in" aria-label="放大预览">＋</button><button type="button" data-action="reset-view" aria-label="重置画布视图">↺</button></div>
          </div>
          <div class="canvas-footer"><span class="detect-status"><i></i><span id="detect-copy">等待上传素材</span></span><span id="canvas-size">-- × --</span></div>
        </section>

        <aside class="right-panel panel-block">
          <div class="panel-heading"><span><span class="section-kicker">C</span>裁切参数</span><span class="round-badge">01</span></div>
          <div class="control-section"><div class="control-label"><span>输出比例</span><span class="muted">画幅</span></div><div class="ratio-grid">${ratios.map((ratio) => `<button type="button" class="ratio-button ${ratio.value === state.activeRatio ? 'active' : ''}" data-ratio="${ratio.value}">${ratio.label}</button>`).join('')}</div></div>
          <div class="control-section toggle-section"><div><strong>透视 & 倾斜矫正</strong><small>自动拉直地平线与建筑线条</small></div><button type="button" class="switch ${state.isLeveling ? 'on' : ''}" data-toggle="leveling" role="switch" aria-checked="${state.isLeveling}" aria-label="透视与倾斜矫正"><span></span></button></div>
          <div class="control-section toggle-section"><div><strong>智能杂物消除</strong><small>电线、路人、垃圾与镜头污点</small></div><button type="button" class="switch ${state.isCleaning ? 'on' : ''}" data-toggle="cleaning" role="switch" aria-checked="${state.isCleaning}" aria-label="智能杂物消除"><span></span></button></div>
          <div class="scope-note"><span class="scope-icon">◉</span><div><strong>本模块处理范围</strong><p>仅裁切、透视矫正与环境修复，不改变光影、色彩和画质细节。</p></div></div>
          <div class="parameter-summary"><div><span>主体保护</span><strong>已锁定</strong></div><div><span>边缘填充</span><strong>${state.isCleaning ? '智能匹配' : '关闭'}</strong></div><div><span>处理方式</span><strong>云端处理</strong></div></div>
        </aside>
      </main>
      <footer class="bottom-bar"><div class="history-actions"><button type="button" class="text-button" data-action="undo">↶ <span>撤销</span></button><button type="button" class="text-button" data-action="restore">↺ <span>还原原图</span></button></div><div class="bottom-progress"><span>构图裁切</span><div class="progress-track"><i></i></div><span>1 / 5</span></div><button type="button" class="confirm-button" data-action="confirm"><span class="confirm-icon">✓</span><span>${state.confirmed ? '已存入云端画布' : '确认裁切并继续'}</span><span class="arrow">→</span></button></footer>
      <div class="toast" id="toast" role="status"></div>
    </div>`;
}

/**
 * 创建登录页面。
 * 入参：无。
 * 返回值：无。
 * 边界情况：挂载节点不存在时不执行 DOM 写入。
 */
function renderLogin() {
  if (!app) return;
  app.innerHTML = `
    <div class="auth-shell">
      <div class="auth-glow glow-one"></div><div class="auth-glow glow-two"></div>
      <div class="auth-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-sun"></div><div class="art-mountain mountain-back"></div><div class="art-mountain mountain-front"></div><div class="art-camera"><span></span></div><i class="art-star star-one">✦</i><i class="art-star star-two">✧</i></div>
      <header class="auth-header"><a class="brand auth-brand" href="#"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></a><span class="auth-header-note">给专业摄影师的 AI 精修工作台</span></header>
      <main class="auth-content"><section class="auth-intro"><span class="auth-kicker">YOUR PHOTO, YOUR STORY</span><h1>让每一张照片<br /><em>更接近你的想法</em></h1><p>从构图开始，沿着专业摄影工作流，完成一次克制而有层次的精修。</p><div class="auth-points"><span>✦ 云端保存每一步</span><span>◒ 专业审美模型</span></div></section>
        <section class="auth-card" aria-label="登录光屿">
          <div class="auth-card-heading"><span class="auth-card-icon">◌</span><div><h2>欢迎回到光屿</h2><p>登录后开启完整云端精修体验</p></div></div>
          <div class="login-tabs"><button class="login-tab active" type="button">手机号登录</button><span>安全快捷</span></div>
          <form id="login-form" class="login-form">
            <label for="phone-input">手机号</label><div class="input-shell"><span>+86</span><input id="phone-input" inputmode="tel" maxlength="11" placeholder="请输入手机号" value="${authState.phone}" /></div>
            <label for="code-input">验证码</label><div class="input-shell"><input id="code-input" inputmode="numeric" maxlength="6" placeholder="请输入 6 位验证码" /><button type="button" class="code-button" data-action="send-code">${authState.codeSent ? '验证码已发送' : '获取验证码'}</button></div>
            <label class="agreement"><input id="agreement-input" type="checkbox" /><span>我已阅读并同意 <a href="#">服务协议</a> 与 <a href="#">隐私政策</a></span></label>
            <button class="primary-gradient-button" type="submit"><span>登录并开始创作</span><b>→</b></button>
          </form>
          <div class="divider"><span>或使用快捷登录</span></div><button class="quick-login" type="button" data-action="quick-login"><span class="quick-icon">◉</span>快捷登录体验版</button><p class="guest-note">未登录也可免费处理 1 张图片，但不会保存到云端</p>
        </section>
      </main>
      <footer class="auth-footer"><span>© 2026 光屿 PHOTO LAB</span><span>照片属于你，决定权也属于你</span></footer>
      <div class="toast" id="toast" role="status"></div>
    </div>`;
}

/**
 * 创建登录后的首页。
 * 入参：无。
 * 返回值：无。
 * 边界情况：当前账号未登录时回退到登录页面。
 */
function renderHome() {
  if (!app) return;
  if (!authState.isLoggedIn) { renderLogin(); return; }
  app.innerHTML = `
    <div class="home-shell"><header class="home-nav"><a class="brand" href="#"><span class="brand-mark">✦</span><span><strong>光屿</strong><small>PHOTO LAB</small></span></a><nav class="home-nav-links"><button type="button" data-action="open-library">云端素材库 <span class="nav-count">12</span></button><button type="button" data-action="open-guide">新手引导</button><button type="button" data-action="help">帮助中心</button></nav><div class="account-menu"><button class="account-button" type="button"><span class="avatar">林</span><span><strong>林摄影</strong><small>专业版账号</small></span><i>⌄</i></button><button class="logout-button" type="button" data-action="logout">退出登录</button></div></header>
      <main class="home-main"><section class="home-hero"><div><span class="auth-kicker">GOOD TO SEE YOU AGAIN</span><h1>今天，想先从哪一张<br /><em>照片开始？</em></h1><p>你的专业工作流已准备就绪，云端素材会自动保留每一步调整。</p></div><div class="hero-frame"><div class="hero-photo"></div><span class="hero-tag">CLOUD / READY</span></div></section>
        <section class="feature-section"><div class="section-title-row"><div><span class="home-section-kicker">START A NEW STORY</span><h2>选择你的工作方式</h2></div><span class="saved-hint">⌁ 最近保存 · 3 分钟前</span></div><div class="feature-grid"><button class="feature-card mint-card" type="button" data-action="open-crop"><span class="feature-number">01</span><span class="feature-symbol">◫</span><span class="feature-copy"><strong>单张图片精修</strong><small>从构图到评分，逐步打磨一张作品</small></span><span class="feature-arrow">↗</span></button><button class="feature-card orange-card" type="button" data-action="open-batch"><span class="feature-number">02</span><span class="feature-symbol">▦</span><span class="feature-copy"><strong>批量组图处理</strong><small>统一风格与参数，高效完成系列作品</small></span><span class="feature-arrow">↗</span></button><button class="feature-card lavender-card" type="button" data-action="open-history"><span class="feature-number">03</span><span class="feature-symbol">◷</span><span class="feature-copy"><strong>历史成片库</strong><small>调取旧作品，继续你的二次创作</small></span><span class="feature-arrow">↗</span></button></div></section>
        <section class="home-lower"><div class="library-preview"><div class="section-title-row"><div><span class="home-section-kicker">YOUR CLOUD LIBRARY</span><h2>最近的作品</h2></div><button class="text-link" type="button" data-action="open-library">查看全部 →</button></div><div class="recent-grid"><div class="recent-image recent-one"><span>风光 · 2.39:1</span></div><div class="recent-image recent-two"><span>人像 · 3:2</span></div><div class="recent-image recent-three"><span>商业 · 1:1</span></div></div></div><div class="workflow-note"><span class="note-orbit">✦</span><span class="home-section-kicker">YOUR WORKFLOW</span><h3>专业，但不复杂</h3><p>每一步都可回退，所有调整参数都保存在云端。你可以随时回到构图、光影、调色、画质或评分模块。</p><button type="button" class="soft-button" data-action="open-guide">查看工作流</button></div></section>
      </main>${authState.showGuide ? guideModalMarkup() : ''}<div class="toast" id="toast" role="status"></div></div>`;
}

/**
 * 返回新手引导弹窗的初始结构。
 * 入参：无。
 * 返回值：弹窗 HTML 字符串。
 * 边界情况：引导步骤为空时仍显示关闭按钮，避免用户被卡住。
 */
function guideModalMarkup() {
  const step = guideSteps[0];
  return `<div class="guide-backdrop" id="guide-modal"><section class="guide-modal" role="dialog" aria-modal="true" aria-label="新手引导"><button class="guide-close" type="button" data-action="close-guide" aria-label="关闭新手引导">×</button><div class="guide-visual ${step.tone}"><span>${step.index}</span><i>✦</i><b>◒</b></div><div class="guide-body"><span class="home-section-kicker">FIRST TIME HERE?</span><h2>五步，完成一张<br />属于你的照片</h2><p>我们会按照专业摄影工作流，带你了解每个模块的作用。</p><div class="guide-step-list">${guideSteps.map((item, index) => `<button class="guide-step ${index === 0 ? 'active' : ''}" type="button" data-guide-step="${index}"><span>${item.index}</span><b>${item.title}</b></button>`).join('')}</div><div class="guide-detail"><strong>${step.title}</strong><p>${step.copy}</p></div><div class="guide-actions"><button class="text-button" type="button" data-action="close-guide">稍后自己探索</button><button class="primary-gradient-button guide-next" type="button" data-action="next-guide">下一步 <b>→</b></button></div></div></section></div>`;
}

/**
 * 根据当前访问状态渲染页面路由。
 * 入参：view 目标页面，可选 login、home、crop。
 * 返回值：无。
 * 边界情况：未登录访问首页或裁切页时显示登录页。
 */
function renderRoute(view = authState.currentView) {
  authState.currentView = view;
  sessionStorage.setItem('photoLabView', view);
  if (view === 'home' && authState.isLoggedIn) { renderHome(); return; }
  if (view === 'crop') { renderCropApp(); drawCanvas(); bindCanvasInteractions(); return; }
  if (view === 'light' && authState.isLoggedIn) { renderLightApp(() => renderRoute('crop'), () => renderRoute('color')); return; }
  if (view === 'color' && authState.isLoggedIn) { renderColorApp(() => renderRoute('light'), () => renderRoute('detail')); return; }
  if (view === 'detail' && authState.isLoggedIn) { renderDetailApp(() => renderRoute('color'), () => renderRoute('score')); return; }
  if (view === 'score' && authState.isLoggedIn) { renderScoreApp((viewName) => renderRoute(viewName)); return; }
  renderLogin();
}

/**
 * 处理登录成功并建立演示账号会话。
 * 入参：phone 手机号。
 * 返回值：无。
 * 边界情况：手机号格式不正确时不建立登录状态。
 */
function loginSuccess(phone) {
  if (!/^1\d{10}$/.test(phone)) { showToast('请输入 11 位手机号'); return; }
  authState.isLoggedIn = true;
  authState.phone = phone;
  authState.showGuide = sessionStorage.getItem('photoLabGuideSeen') !== 'true';
  sessionStorage.setItem('photoLabLoggedIn', 'true');
  sessionStorage.setItem('photoLabPhone', phone);
  renderRoute('home');
}

/**
 * 关闭并记住新手引导状态。
 * 入参：无。
 * 返回值：无。
 * 边界情况：弹窗不存在时只更新会话标记。
 */
function closeGuide() {
  authState.showGuide = false;
  sessionStorage.setItem('photoLabGuideSeen', 'true');
  document.querySelector('#guide-modal')?.remove();
}

/**
 * 绑定裁切画布的指针和缩放事件。
 * 入参：无。
 * 返回值：无。
 * 边界情况：当前不是裁切页时不绑定事件。
 */
function bindCanvasInteractions() {
  const canvasWrap = document.querySelector('#canvas-wrap');
  if (!(canvasWrap instanceof HTMLElement)) return;
  canvasWrap.addEventListener('pointerdown', (event) => { if (!state.image) return; canvasWrap.setPointerCapture(event.pointerId); state.pointer = { x: event.clientX, y: event.clientY }; });
  canvasWrap.addEventListener('pointermove', handlePointerMove);
  canvasWrap.addEventListener('pointerup', () => { state.pointer = null; });
  canvasWrap.addEventListener('pointercancel', () => { state.pointer = null; });
  canvasWrap.addEventListener('wheel', (event) => { if (!state.image) return; event.preventDefault(); state.zoom = Math.max(0.6, Math.min(2.5, state.zoom + (event.deltaY > 0 ? -0.08 : 0.08))); drawCanvas(); }, { passive: false });
}

/**
 * 根据当前状态绘制图片预览与裁切框。
 * 入参：无。
 * 返回值：无。
 * 边界情况：未上传图片时只显示空状态，不访问图片尺寸。
 */
function drawCanvas() {
  const canvas = document.querySelector('#preview-canvas');
  const wrap = document.querySelector('#canvas-wrap');
  const frame = document.querySelector('#crop-frame');
  if (!(canvas instanceof HTMLCanvasElement) || !(wrap instanceof HTMLElement) || !(frame instanceof HTMLElement)) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = Math.max(320, wrap.clientWidth);
  const height = Math.max(260, wrap.clientHeight);
  const ratio = state.activeRatio === 'free' ? (state.image ? state.image.width / state.image.height : 3 / 2) : ratioToNumber(state.activeRatio);
  const frameWidth = Math.min(width - 48, Math.max(180, height * ratio));
  const frameHeight = Math.min(height - 48, Math.max(180, frameWidth / ratio));
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  context.fillStyle = '#dceee6';
  context.fillRect(0, 0, width, height);
  if (state.image) {
    const imageRatio = state.image.width / state.image.height;
    let drawWidth = width;
    let drawHeight = width / imageRatio;
    if (drawHeight < height) { drawHeight = height; drawWidth = height * imageRatio; }
    const drawX = (width - drawWidth) / 2 + state.offsetX;
    const drawY = (height - drawHeight) / 2 + state.offsetY;
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(state.zoom, state.zoom);
    context.translate(-width / 2, -height / 2);
    context.drawImage(state.image, drawX, drawY, drawWidth, drawHeight);
    context.restore();
  } else {
    context.fillStyle = '#c7e2d7';
    context.fillRect(0, 0, width, height);
  }
  frame.style.width = `${frameWidth}px`;
  frame.style.height = `${frameHeight}px`;
  frame.style.left = `${(width - frameWidth) / 2}px`;
  frame.style.top = `${(height - frameHeight) / 2}px`;
  const zoomLabel = document.querySelector('#zoom-label');
  if (zoomLabel) zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
}

/**
 * 将比例字符串转换为宽高比数字。
 * 入参：ratio 比例字符串，例如 16:9。
 * 返回值：宽高比数字。
 * 边界情况：输入无法解析时返回默认 3:2。
 */
function ratioToNumber(ratio) {
  const parts = ratio.split(':').map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1]) || parts[1] === 0) return 3 / 2;
  return parts[0] / parts[1];
}

/**
 * 显示短时状态提示。
 * 入参：message 要显示的中文提示。
 * 返回值：无。
 * 边界情况：提示节点不存在时忽略提示，不影响主交互。
 */
function showToast(message) {
  const toast = document.querySelector('#toast');
  if (!(toast instanceof HTMLElement)) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

/**
 * 刷新页面中依赖状态的控件。
 * 入参：无。
 * 返回值：无。
 * 边界情况：部分节点不存在时只更新可找到的节点。
 */
function refreshState() {
  document.querySelectorAll('[data-plan]').forEach((node) => node.classList.toggle('active', node.getAttribute('data-plan') === state.activePlan));
  document.querySelectorAll('[data-ratio]').forEach((node) => node.classList.toggle('active', node.getAttribute('data-ratio') === state.activeRatio));
  document.querySelectorAll('[data-toggle]').forEach((node) => {
    const key = node.getAttribute('data-toggle');
    const enabled = key === 'leveling' ? state.isLeveling : state.isCleaning;
    node.classList.toggle('on', enabled);
    node.setAttribute('aria-checked', String(enabled));
  });
  const summary = document.querySelector('.parameter-summary div:nth-child(2) strong');
  if (summary) summary.textContent = state.isCleaning ? '智能匹配' : '关闭';
  const confirmText = document.querySelector('.confirm-button span:nth-child(2)');
  if (confirmText) confirmText.textContent = state.confirmed ? '已存入云端画布' : '确认裁切并继续';
  drawCanvas();
}

/**
 * 读取本地图片并加载到预览画布。
 * 入参：file 浏览器选择的图片文件。
 * 返回值：无。
 * 边界情况：文件为空或格式不是图片时显示错误提示。
 */
function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) { showToast('请选择 JPG、PNG 或 WEBP 图片'); return; }
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.image = image;
    state.imageUrl = imageUrl;
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    state.confirmed = false;
    const empty = document.querySelector('#empty-canvas');
    if (empty) empty.classList.add('hidden');
    const name = document.querySelector('#asset-name');
    const meta = document.querySelector('#asset-meta');
    const size = document.querySelector('#canvas-size');
    const detectCopy = document.querySelector('#detect-copy');
    const subjectCopy = document.querySelector('#subject-copy');
    if (name) name.textContent = file.name;
    if (meta) meta.textContent = `${formatBytes(file.size)} · 已载入`;
    if (size) size.textContent = `${image.width} × ${image.height}`;
    if (detectCopy) detectCopy.textContent = '主体识别完成 · 可调整构图';
    if (subjectCopy) subjectCopy.textContent = '已识别主体，四套方案已生成';
    drawCanvas();
    showToast('图片已载入，已生成四套构图建议');
  };
  image.onerror = () => showToast('图片读取失败，请重新选择');
  image.src = imageUrl;
}

/**
 * 格式化文件大小。
 * 入参：bytes 文件字节数。
 * 返回值：适合界面显示的大小文本。
 * 边界情况：非正数返回 0 KB。
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 处理鼠标与触屏拖动，更新画布位移。
 * 入参：event 指针事件。
 * 返回值：无。
 * 边界情况：未开始拖动或未上传图片时不更新状态。
 */
function handlePointerMove(event) {
  if (!state.pointer || !state.image) return;
  state.offsetX += event.clientX - state.pointer.x;
  state.offsetY += event.clientY - state.pointer.y;
  state.pointer = { x: event.clientX, y: event.clientY };
  drawCanvas();
}

renderRoute();

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === 'image-input' && target.files) loadImage(target.files[0]);
});

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-action], [data-plan], [data-ratio], [data-toggle], [data-guide-step]') : null;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute('data-action');
  const plan = target.getAttribute('data-plan');
  const ratio = target.getAttribute('data-ratio');
  const toggle = target.getAttribute('data-toggle');
  const guideStep = target.getAttribute('data-guide-step');
  if (action === 'send-code') {
    const phoneInput = document.querySelector('#phone-input');
    const phone = phoneInput instanceof HTMLInputElement ? phoneInput.value.trim() : '';
    if (!/^1\d{10}$/.test(phone)) { showToast('请先输入正确的手机号'); return; }
    authState.codeSent = true;
    renderLogin();
    showToast('验证码已发送，演示验证码为 123456');
    return;
  }
  if (action === 'quick-login') { loginSuccess('13800138000'); return; }
  if (action === 'open-crop') { renderRoute('crop'); return; }
  if (action === 'open-light') { renderRoute('light'); return; }
  if (action === 'open-library') { showToast('云端素材库已准备就绪，最近作品共 12 张'); return; }
  if (action === 'open-batch' || action === 'open-history') { showToast('该工作流入口已保留，将在后续模块接入'); return; }
  if (action === 'open-guide') { authState.showGuide = true; renderRoute('home'); return; }
  if (action === 'close-guide') { closeGuide(); return; }
  if (action === 'next-guide') { const active = document.querySelector('.guide-step.active'); const current = active instanceof HTMLElement ? Number(active.getAttribute('data-guide-step')) : 0; const next = current + 1; if (next >= guideSteps.length) { closeGuide(); showToast('引导完成，开始你的第一张作品'); return; } updateGuideStep(next); return; }
  if (action === 'logout') { authState.isLoggedIn = false; authState.currentView = 'login'; authState.codeSent = false; sessionStorage.clear(); renderRoute('login'); return; }
  if (guideStep !== null) { updateGuideStep(Number(guideStep)); return; }
  if (plan) { state.activePlan = plan; refreshState(); showToast(`已切换为${compositionPlans.find((item) => item.id === plan)?.label ?? '推荐'}方案`); return; }
  if (ratio) { state.activeRatio = ratio; refreshState(); return; }
  if (toggle === 'leveling') { state.isLeveling = !state.isLeveling; refreshState(); return; }
  if (toggle === 'cleaning') { state.isCleaning = !state.isCleaning; refreshState(); return; }
  if (action === 'zoom-in') { state.zoom = Math.min(2.5, state.zoom + 0.1); drawCanvas(); return; }
  if (action === 'zoom-out') { state.zoom = Math.max(0.6, state.zoom - 0.1); drawCanvas(); return; }
  if (action === 'reset-view') { state.zoom = 1; state.offsetX = 0; state.offsetY = 0; drawCanvas(); return; }
  if (action === 'restore') { state.activePlan = 'thirds'; state.activeRatio = 'free'; state.zoom = 1; state.offsetX = 0; state.offsetY = 0; state.isLeveling = true; state.isCleaning = false; state.confirmed = false; refreshState(); showToast('已还原原图参数'); return; }
  if (action === 'undo') { state.offsetX = 0; state.offsetY = 0; drawCanvas(); showToast('已撤销最近一次画布移动'); return; }
  if (action === 'clear-image') { state.image = null; state.imageUrl = ''; document.querySelector('#image-input')?.setAttribute('value', ''); document.querySelector('#empty-canvas')?.classList.remove('hidden'); refreshState(); showToast('已移除当前图片'); return; }
  if (action === 'confirm') { if (!state.image) { showToast('请先上传图片'); return; } state.isProcessing = true; document.querySelector('#canvas-loader')?.classList.add('visible'); window.setTimeout(() => { state.isProcessing = false; state.confirmed = true; document.querySelector('#canvas-loader')?.classList.remove('visible'); refreshState(); renderRoute('light'); }, 900); return; }
  if (action === 'help') showToast('拖动画布调整主体位置，方案和比例可随时切换');
});

window.addEventListener('resize', drawCanvas);

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'login-form') return;
  event.preventDefault();
  const phoneInput = document.querySelector('#phone-input');
  const codeInput = document.querySelector('#code-input');
  const agreement = document.querySelector('#agreement-input');
  const phone = phoneInput instanceof HTMLInputElement ? phoneInput.value.trim() : '';
  const code = codeInput instanceof HTMLInputElement ? codeInput.value.trim() : '';
  if (!(agreement instanceof HTMLInputElement) || !agreement.checked) { showToast('请先同意服务协议与隐私政策'); return; }
  if (!authState.codeSent || code !== '123456') { showToast('请输入正确验证码，演示验证码为 123456'); return; }
  loginSuccess(phone);
});

/**
 * 切换新手引导当前步骤。
 * 入参：index 步骤索引，范围为 0 到 4。
 * 返回值：无。
 * 边界情况：索引越界时回退到第一步。
 */
function updateGuideStep(index) {
  const safeIndex = index >= 0 && index < guideSteps.length ? index : 0;
  const step = guideSteps[safeIndex];
  document.querySelectorAll('.guide-step').forEach((node) => node.classList.toggle('active', node.getAttribute('data-guide-step') === String(safeIndex)));
  const visual = document.querySelector('.guide-visual');
  const indexLabel = visual?.querySelector('span');
  const detailTitle = document.querySelector('.guide-detail strong');
  const detailCopy = document.querySelector('.guide-detail p');
  if (visual) { visual.className = `guide-visual ${step.tone}`; }
  if (indexLabel) indexLabel.textContent = step.index;
  if (detailTitle) detailTitle.textContent = step.title;
  if (detailCopy) detailCopy.textContent = step.copy;
}
