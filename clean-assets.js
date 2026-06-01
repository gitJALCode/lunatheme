// Cross-platform replacement for the Unix `find`-based clean step.
// Recursively removes generated .js and .map files from public/assets.
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'public', 'assets');

function clean(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            clean(full);
        } else if (/\.(js|map)$/.test(entry.name)) {
            fs.unlinkSync(full);
        }
    }
}

clean(target);
