const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
try {
  require('esbuild').transformSync(content, { loader: 'tsx' });
  console.log("Syntax is OK!");
} catch (e) {
  console.error(e.message);
}
