const fs = require('fs');
const css = fs.readFileSync('src/styles.css', 'utf8');
let depth = 0, min = 0, inStr = null, inComment = false;
for (let i = 0; i < css.length; i++) {
  const c = css[i], n = css[i + 1];
  if (inComment) { if (c === '*' && n === '/') { inComment = false; i++; } continue; }
  if (!inStr && c === '/' && n === '*') { inComment = true; i++; continue; }
  if (inStr) { if (c === inStr && css[i - 1] !== '\\') inStr = null; continue; }
  if (c === '"' || c === "'") { inStr = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth < min) min = depth; }
}
console.log('braces depth end:', depth, '| min:', min);
console.log(depth === 0 && min === 0 ? 'CSS BALANCED OK' : 'CSS UNBALANCED!');
