import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
/**
 * 复现页面使用的 HTML 转义规则。
 * 入参：value 原始文件名。
 * 返回值：编码后的 HTML 文本。
 * 边界情况：空值按空字符串处理。
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

test('文件名 HTML 转义不会保留可执行标签', () => {
  const maliciousName = '" onerror="alert(1)" <img src=x> & report.jpg';
  const escapedName = escapeHtml(maliciousName);

  assert.equal(escapedName, '&quot; onerror=&quot;alert(1)&quot; &lt;img src=x&gt; &amp; report.jpg');
  assert.equal(escapedName.includes('<img'), false);
});

test('评分与批量视图均通过 escapeHtml 保护文件名', () => {
  const scoreSource = fs.readFileSync(new URL('../src/score.js', import.meta.url), 'utf8');
  const detailSource = fs.readFileSync(new URL('../src/detail.js', import.meta.url), 'utf8');

  assert.match(scoreSource, /escapeHtml\(scoreState\.file\.name\)/);
  assert.match(detailSource, /escapeHtml\(detailState\.reference\.name\)/);
});
