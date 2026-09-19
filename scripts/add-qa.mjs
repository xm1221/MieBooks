// 添加问答到 web/qa-data.json
// 用法：
//   文件模式：node scripts/add-qa.mjs --file <路径.md|路径.json>
//   参数模式：node scripts/add-qa.mjs "问题" "回答" ["昵称"] ["日期"]
//   交互模式：node scripts/add-qa.mjs
// 之后：git add web/qa-data.json && git commit -m "add qa" && git push 即可上线
//
// Markdown 文件格式（支持多个问答，重复 Q/A 块即可）：
//   # Q：问题标题
//   问题详细内容（可多行）
//
//   # A：回答内容（可多行）
//   > 昵称：小明
//   > 日期：2026-09-18
//
// JSON 文件格式（与 qa-data.json 同构，批量导入）：
//   { "items": [ { "q": "…", "a": "…", "nickname": "…", "date": "2026-09-18" } ] }
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web', 'qa-data.json');
const today = () => new Date().toISOString().slice(0, 10);

// ---- 解析器 ----

function parseJson(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : [data]);
  return arr
    .filter((it) => it && typeof it.q === 'string' && typeof it.a === 'string' && it.q.trim() && it.a.trim())
    .map((it) => ({
      q: it.q.trim(),
      a: it.a.trim(),
      nickname: it.nickname ? String(it.nickname).trim() : undefined,
      date: it.date ? String(it.date).trim() : today(),
    }));
}

function parseMd(text) {
  const items = [];
  const blocks = text
    .replace(/^\uFEFF/, '')
    .split(/^#\s*Q\s*[：:]/m)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const aMatch = block.match(/^#\s*A\s*[：:]/m);
    const q = aMatch ? block.slice(0, aMatch.index).trim() : block.trim();
    const rest = aMatch ? block.slice(aMatch.index).replace(/^#\s*A\s*[：:]\s*/, '').trim() : '';

    let nickname = '';
    let date = '';
    const contentLines = [];
    for (const line of rest.split('\n')) {
      const nick = line.match(/^>\s*昵称\s*[：:]\s*(.*)$/);
      const dat = line.match(/^>\s*日期\s*[：:]\s*(.*)$/);
      if (nick) nickname = nick[1].trim();
      else if (dat) date = dat[1].trim();
      else contentLines.push(line);
    }
    const a = contentLines.join('\n').trim();
    if (q && a) {
      items.push({ q, a, nickname: nickname || undefined, date: date || today() });
    }
  }
  return items;
}

// ---- 主流程 ----

const args = process.argv.slice(2);
let items = [];

const fileIdx = args.indexOf('--file');
if (fileIdx !== -1 && args[fileIdx + 1]) {
  const filePath = args[fileIdx + 1];
  const text = readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    items = parseJson(text);
  } else {
    items = parseMd(text);
  }
  if (!items.length) {
    console.error('❌ 文件中没有解析到有效问答');
    process.exit(1);
  }
} else if (args.length >= 2) {
  let [, , nickname, date] = args;
  items = [{
    q: args[0].trim(),
    a: args[1].trim(),
    nickname: (nickname || '').trim() || undefined,
    date: (date || '').trim() || today(),
  }];
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt) => new Promise((res) => rl.question(prompt, res));
  const q = (await ask('问题：')).trim();
  const a = (await ask('回答（单行；多行请用 --file）：')).trim();
  const nickname = (await ask('提问者昵称（可空）：')).trim();
  const date = (await ask('日期（回车=今天）：')).trim() || today();
  rl.close();
  if (!q || !a) {
    console.error('❌ 问题与回答不能为空');
    process.exit(1);
  }
  items = [{ q, a, nickname: nickname || undefined, date }];
}

const data = JSON.parse(readFileSync(dataFile, 'utf8'));
data.items.push(...items);
writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log(`✅ 已添加 ${items.length} 条（共 ${data.items.length} 条）`);
console.log('接下来：');
console.log('  git add web/qa-data.json');
console.log(`  git commit -m "add qa: ${items[0].q.slice(0, 20)}"`);
console.log('  git push');
