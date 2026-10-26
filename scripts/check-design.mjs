// Lime Health dizayn tizimi tekshiruvi (docs/design-system/README.md, 10-bo‘lim "Tekshiruv").
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'src';
const ALLOWED_COLOR_FILES = ['src/shared/theme/tokens.ts', 'src/styles/variables.css'];
const ICON_MODULE = 'src/shared/icons/index.tsx';
const rules = [
  { name: 'gradient', re: /gradient/i },
  { name: 'backdrop-blur', re: /backdrop-blur|backdrop-filter/i },
  { name: 'shadow-2xl', re: /shadow-2xl/ },
  { name: 'hardcode rang', re: /#[0-9a-fA-F]{3,8}\b/, skip: ALLOWED_COLOR_FILES },
  { name: 'tailwind arbitrary rang', re: /(bg|text|border|fill|stroke)-\[#/ },
  // lime — sirt rangi; och fonda matn bo'lmaydi
  { name: 'lime matn', re: /\btext-(lime|lime-press|lime-soft|olive|primary-(50|100|200|300|400))\b/ },
  { name: 'bold (faqat 300–500)', re: /\bfont-(bold|extrabold|black)\b|fontWeight:\s*[6-9]00/ },
  { name: 'ikonka faqat @/shared/icons', re: /from ['"](lucide-react|@hugeicons\/core-free-icons|@ant-design\/icons)['"]/, skip: [ICON_MODULE] },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

let fails = 0;
for (const file of walk(ROOT)) {
  const rel = relative('.', file).split(sep).join('/');
  if (!/\.(tsx?|css)$/.test(rel)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const r of rules) {
      if (r.skip?.includes(rel)) continue;
      // CSS id/anchor (#root, #print-root) va data-URL'lar rang emas
      if (r.name === 'hardcode rang' && /#(root|print-root)\b/.test(line)) continue;
      if (r.re.test(line)) {
        fails++;
        console.log(`${rel}:${i + 1}  [${r.name}]  ${line.trim()}`);
      }
    }
  });
}
console.log(fails ? `\n${fails} ta muammo topildi` : 'Dizayn tekshiruvi: toza');
process.exit(fails ? 1 : 0);
