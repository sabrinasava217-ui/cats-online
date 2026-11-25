// Salin Phaser & Supabase ke www/js/lib supaya APK berjalan tanpa CDN.
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'www', 'js', 'lib');
fs.mkdirSync(out, { recursive: true });
const files = [
  ['phaser/dist/phaser.min.js', 'phaser.min.js'],
  ['@supabase/supabase-js/dist/umd/supabase.js', 'supabase.js']
];
for (const [from, to] of files) {
  const src = path.join(__dirname, '..', 'node_modules', from);
  if (!fs.existsSync(src)) { console.error('File tidak ditemukan: ' + src); process.exit(1); }
  fs.copyFileSync(src, path.join(out, to));
  console.log('OK ' + to);
}
