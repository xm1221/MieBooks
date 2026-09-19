// 添加一条问答到 web/qa-data.json
// 用法：
//   交互模式：node scripts/add-qa.mjs
//   参数模式：node scripts/add-qa.mjs "问题" "回答" ["昵称"] ["日期"]
// 之后：git add web/qa-data.json && git commit -m "add qa" && git push 即可上线
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web', 'qa-data.json');
const today = new Date().toISOString().slice(0, 10);

let q, a, nickname = '', date = '';
const args = process.argv.slice(2);

if (args.length >= 2) {
  [q, a, nickname, date] = args;
  q = q.trim(); a = a.trim(); nickname = (nickname || '').trim();
  date = (date || '').trim() || today;
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt) => new Promise((res) => rl.question(prompt, res));
  q = (await ask('问题：')).trim();
  a = (await ask('回答（单行；多行请直接编辑 qa-data.json，换行用 \\n）：')).trim();
  nickname = (await ask('提问者昵称（可空）：')).trim();
  date = (await ask('日期（回车=今天）：')).trim() || today;
  rl.close();
}

if (!q || !a) {
  console.error('❌ 问题与回答不能为空');
  process.exit(1);
}

const data = JSON.parse(readFileSync(dataFile, 'utf8'));
data.items.push({ q, a, nickname: nickname || undefined, date });
writeFileSync(dataFile, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log(`✅ 已添加（共 ${data.items.length} 条）`);
console.log('接下来：');
console.log('  git add web/qa-data.json');
console.log(`  git commit -m "add qa: ${q.slice(0, 20)}"`);
console.log('  git push');
