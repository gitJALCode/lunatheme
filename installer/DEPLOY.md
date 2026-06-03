# Deploying Luna Theme to a server

## 1. Publish from your PC (GitHub)

### Push code

```bash
cd "d:\My Theme"   # or your clone path
git push -u origin main
```

If GitHub returns **account suspended**, resolve that at https://support.github.com first.

### Build `panel.tar.gz`

**Windows (PowerShell):**

```powershell
.\scripts\build-panel-release.ps1
```

**Linux / macOS:**

```bash
chmod +x scripts/build-panel-release.sh
./scripts/build-panel-release.sh
```

Output: `panel.tar.gz` in the project root (~3–13 MB with compiled assets).

### Upload the release asset

1. Open https://github.com/gitJALCode/lunatheme/releases/new  
2. Tag: e.g. `v1.0.0` → **Publish release**  
3. Attach **`panel.tar.gz`** (exact filename)  
4. Publish  

The installer downloads:

`https://github.com/gitJALCode/lunatheme/releases/latest/download/panel.tar.gz`

---

## 2. Install on the VPS

SSH as **root**:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/gitJALCode/lunatheme/main/installer/install.sh)
```

### Menu

| Option | When to use |
|--------|-------------|
| **[0] Fresh install** | Empty server or full reinstall |
| **[1] Upgrade** | Pterodactyl or Luna already at `/var/www/pterodactyl` |
| **[2] Wings** | Install stock Wings only |
| **[3] Both** | New panel + Wings |

### Fresh install tips

- Use a **domain** (e.g. `panel.example.com`), not a bare IP, if you want SSL.
- Point the domain’s **A record** to your server IP before enabling Let’s Encrypt.
- Credentials are saved to `/root/luna-panel-credentials.txt` when the install finishes.

### Already had Pterodactyl?

Use **[1] Upgrade**, not **[0]**. Fresh install resets the MySQL `pterodactyl` user password.

---

## 3. After install

```bash
# Panel URL (from installer)
cat /root/luna-panel-credentials.txt

# Services
systemctl status nginx php8.3-fpm pteroq mariadb redis-server

# If the site does not load
nginx -t
systemctl restart nginx php8.3-fpm
ufw allow 80/tcp && ufw allow 443/tcp   # if UFW is active
```

### Wings (optional)

Create a node in the panel admin → copy config to `/etc/pterodactyl/config.yml`:

```bash
systemctl enable --now wings
```

---

## 4. Troubleshooting

| Problem | Fix |
|---------|-----|
| `ERR_CONNECTION_REFUSED` | `systemctl start nginx` · open ports 80/443 |
| MySQL access denied | Use **[1] Upgrade** or reset user (see installer README) |
| Composer / Stripe lock error | Push latest `composer.lock` and new `panel.tar.gz` |
| Maintenance mode stuck | `cd /var/www/pterodactyl && php artisan up` |
| IP in browser, no domain | Use `http://YOUR_IP` only if nginx `server_name` matches |

---

## 5. Environment overrides

```bash
LUNA_BRANCH=main \
LUNA_RELEASE_TARBALL=https://github.com/gitJALCode/lunatheme/releases/latest/download/panel.tar.gz \
bash installer/install.sh
```
