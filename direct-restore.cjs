/**
 * Direct Restore Script
 * Restores the original index.html file for development
 */
const fs = require('fs');

console.log("🔄 Restoring development environment...");

try {
  if (fs.existsSync('client/index.html.dev')) {
    fs.copyFileSync('client/index.html.dev', 'client/index.html');
    // Keeping the backup for safety
    // fs.unlinkSync('client/index.html.dev');
    console.log("✅ Restored original index.html");
  } else {
    console.log("⚠️ No backup found at client/index.html.dev");
  }
} catch (e) {
  console.error("❌ Error restoring development environment:", e);
}
