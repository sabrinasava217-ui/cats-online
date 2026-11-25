// Dijalankan setelah "npx cap add android": landscape, fullscreen, ikon, nama aplikasi.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const PKG = 'com.catsonline.game';

function must(p) { if (!fs.existsSync(p)) { console.error('Tidak ada: ' + p); process.exit(1); } }

// 1. Manifest: paksa landscape
must(manifestPath);
let m = fs.readFileSync(manifestPath, 'utf8');
if (!m.includes('<activity')) { console.error('Manifest: tag <activity> tidak ditemukan'); process.exit(1); }
if (!m.includes('screenOrientation')) m = m.replace('<activity', '<activity\n            android:screenOrientation="sensorLandscape"');
fs.writeFileSync(manifestPath, m);

// 2. Tema fullscreen + layar notch
const stylesPath = path.join(res, 'values', 'styles.xml');
must(stylesPath);
let s = fs.readFileSync(stylesPath, 'utf8');
if (!s.includes('windowFullscreen')) {
  if (!s.includes('<item name="android:background">@null</item>')) { console.error('styles.xml: pola tema tidak ditemukan'); process.exit(1); }
  s = s.replace('<item name="android:background">@null</item>',
    '<item name="android:background">@null</item>\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>');
}
fs.writeFileSync(stylesPath, s);

// 3. Nama aplikasi
const strPath = path.join(res, 'values', 'strings.xml');
must(strPath);
let t = fs.readFileSync(strPath, 'utf8')
  .replace(/(<string name="app_name">)[^<]*(<\/string>)/, '$1CATS ONLINE$2')
  .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, '$1CATS ONLINE$2');
fs.writeFileSync(strPath, t);

// 4. Ikon
const iconSrc = path.join(root, 'resources', 'android');
for (const dir of fs.readdirSync(iconSrc)) {
  const dst = path.join(res, dir);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(path.join(iconSrc, dir))) fs.copyFileSync(path.join(iconSrc, dir, f), path.join(dst, f));
}
fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFCC99</color>\n</resources>\n');

// 5. MainActivity: mode imersif (bar sistem tersembunyi) + layar tetap menyala
const javaDir = path.join(root, 'android', 'app', 'src', 'main', 'java', ...PKG.split('.'));
fs.mkdirSync(javaDir, { recursive: true });
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), `package ${PKG};

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
`);
console.log('Konfigurasi Android selesai');
