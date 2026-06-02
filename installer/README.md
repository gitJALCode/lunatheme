# Luna Theme Installer

Automated installer for the **Luna-themed Pterodactyl panel**
([`gitJALCode/lunatheme`](https://github.com/gitJALCode/lunatheme)) and **stock
Pterodactyl Wings**. Inspired by [pterodactyl-installer.se](https://pterodactyl-installer.se/),
but it deploys this fork instead of the upstream panel.

## Supported systems

- Ubuntu 20.04 / 22.04 / 24.04
- Debian 11 / 12
- Rocky Linux 8 / 9
- AlmaLinux 8 / 9 (and compatible CentOS)

A fresh VPS with root access is strongly recommended.

## Quick start

Run as root on the target server:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/gitJALCode/lunatheme/main/installer/install.sh)
```

You'll get a menu:

- `[0]` Install the Luna panel
- `[1]` Install stock Wings
- `[2]` Install both (panel first, then Wings)
- `[3]` Uninstall the panel and/or Wings
- `[4]` Exit

### Distro differences handled automatically

| | Debian/Ubuntu | Rocky/AlmaLinux |
| --- | --- | --- |
| PHP repo | Ondřej Surý / Sury | EPEL + Remi |
| Web user | `www-data` | `nginx` |
| nginx config | `sites-available` | `conf.d` |
| Extras | — | SELinux booleans + firewalld ports |

## What the panel installer does

1. Installs PHP 8.3, MariaDB, nginx, Redis, Composer (and Node 22 + Yarn only if
   it has to build from source).
2. Fetches the panel:
   - downloads the prebuilt `panel.tar.gz` from your latest GitHub Release if one
     exists (no Node needed), **or**
   - clones the repo and runs `yarn build:production` to compile the Luna assets.
3. Creates the database, runs migrations + seeders, links storage (needed for the
   Luna avatar upload feature), and creates your admin account.
4. Configures the `pteroq` queue worker, the scheduler cron entry, nginx, and an
   optional free Let's Encrypt SSL certificate.

## What the Wings installer does

Installs Docker and the **official, unmodified** Wings binary from
`pterodactyl/wings` releases, plus the `wings.service` systemd unit. After
creating a Node in the panel admin UI, paste its config into
`/etc/pterodactyl/config.yml` and run:

```bash
systemctl enable --now wings
```

## Prebuilt releases (recommended)

Building webpack assets on a small VPS is slow and memory-hungry. The included
GitHub Actions workflow (`.github/workflows/build-release.yml`) builds
`panel.tar.gz` automatically whenever you publish a Release, so the installer can
just download it. To trigger it, publish a release (or run the workflow manually
from the Actions tab).

## Configuration overrides

Environment variables you can set before running the script:

| Variable               | Default                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `LUNA_REPO`            | `https://github.com/gitJALCode/lunatheme.git`                           |
| `LUNA_BRANCH`          | `main`                                                                   |
| `LUNA_RELEASE_TARBALL` | `https://github.com/gitJALCode/lunatheme/releases/latest/download/panel.tar.gz` |
| `WINGS_VERSION`        | `latest`                                                                 |
| `FORCE_BUILD`          | unset (set to `true` to always build from source)                       |

Example — always build from source on the `dev` branch:

```bash
LUNA_BRANCH=dev FORCE_BUILD=true bash install.sh
```

## Uninstalling

Run the script and choose `[3]`. You can remove the panel, Wings, or both. The
uninstaller stops/removes the systemd services, cron entry, and nginx config,
and optionally drops the database and deletes files (it asks before any
destructive step). System packages (PHP, nginx, MariaDB, Redis, Docker) are
left installed.

## Notes

- This script is **not** affiliated with the official Pterodactyl Project.
- Wings is installed completely unmodified ("stock"); only the panel is themed.
