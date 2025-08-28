// fix-imports.js
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

function walk(dir, ext = '.ts') {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walk(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      result.push(fullPath);
    }
  }
  return result;
}

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Regex: match import/export ... from '...'
  const updated = code.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (match, p1, p2, p3) => {
      // If it already ends with .js or .json, leave it alone
      if (p2.endsWith('.js') || p2.endsWith('.json')) return match;
      return `${p1}${p2}.js${p3}`;
    }
  );

  if (updated !== code) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`✔ Fixed imports in: ${path.relative(process.cwd(), file)}`);
  }
}

const files = walk(SRC_DIR, '.ts');
for (const file of files) {
  fixFile(file);
}
console.log('✅ All done!');
