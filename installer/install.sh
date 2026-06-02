#!/bin/bash

set -e

###############################################################################
#                                                                             #
#  Luna Theme Installer                                                        #
#                                                                             #
#  Installs the Luna-themed Pterodactyl panel (gitJALCode/lunatheme) and/or    #
#  stock Pterodactyl Wings on Ubuntu / Debian / Rocky / AlmaLinux systems.     #
#                                                                             #
#  Inspired by https://pterodactyl-installer.se/ but tailored to install the   #
#  Luna panel fork instead of the upstream panel release.                      #
#                                                                             #
#  Usage (as root):                                                            #
#    bash <(curl -sSL https://raw.githubusercontent.com/gitJALCode/lunatheme/main/installer/install.sh)  #
#                                                                             #
#  Panel code released under MIT (Pterodactyl). Luna edits under GPLv3.        #
#  This script is NOT affiliated with the official Pterodactyl Project.        #
#                                                                             #
###############################################################################

# ----------------------------------------------------------------------------
# Configuration — override with environment variables if needed.
# ----------------------------------------------------------------------------
LUNA_REPO="${LUNA_REPO:-https://github.com/gitJALCode/lunatheme.git}"
LUNA_BRANCH="${LUNA_BRANCH:-main}"
# Prebuilt release tarball (with compiled assets). If present, the server does
# not need Node/Yarn. See .github/workflows/build-release.yml.
LUNA_RELEASE_TARBALL="${LUNA_RELEASE_TARBALL:-https://github.com/gitJALCode/lunatheme/releases/latest/download/panel.tar.gz}"

PANEL_DIR="/var/www/pterodactyl"
PHP_VERSION="8.3"
NODE_MAJOR="22"

WINGS_VERSION="${WINGS_VERSION:-latest}"

LOG_PATH="/var/log/luna-installer.log"

# ----------------------------------------------------------------------------
# Colours / output helpers
# ----------------------------------------------------------------------------
COLOR_RESET="\033[0m"
COLOR_RED="\033[0;31m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_CYAN="\033[0;36m"

output() { echo -e "* $1"; }
success() { echo -e "${COLOR_GREEN}* $1${COLOR_RESET}"; }
warn() { echo -e "${COLOR_YELLOW}* $1${COLOR_RESET}"; }
error() { echo -e "${COLOR_RED}* ERROR: $1${COLOR_RESET}" >&2; }
hr() { echo -e "${COLOR_CYAN}--------------------------------------------------------------${COLOR_RESET}"; }

fail() {
    error "$1"
    exit 1
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

ask() {
    # ask "Prompt" "default"  -> echoes the answer (default if empty)
    local prompt="$1" default="$2" answer
    if [ -n "$default" ]; then
        read -r -p "* ${prompt} [${default}]: " answer
        echo "${answer:-$default}"
    else
        read -r -p "* ${prompt}: " answer
        echo "$answer"
    fi
}

ask_secret() {
    local prompt="$1" answer
    read -r -s -p "* ${prompt}: " answer
    echo >&2
    echo "$answer"
}

confirm() {
    # confirm "Question?"  -> returns 0 for yes
    local answer
    read -r -p "* $1 (y/N): " answer
    [[ "$answer" =~ ^[Yy]$ ]]
}

random_password() {
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
}

# ----------------------------------------------------------------------------
# Pre-flight
# ----------------------------------------------------------------------------
require_root() {
    [ "$(id -u)" -eq 0 ] || fail "This script must be run as root (try: sudo bash install.sh)."
}

detect_os() {
    if [ ! -f /etc/os-release ]; then
        fail "Cannot detect operating system (/etc/os-release missing)."
    fi
    # shellcheck disable=SC1091
    . /etc/os-release
    OS_ID="$ID"
    OS_CODENAME="$VERSION_CODENAME"
    OS_VERSION="$VERSION_ID"

    case "$OS_ID" in
        ubuntu | debian)
            PKG_FAMILY="debian"
            WEB_USER="www-data"
            PHP_FPM_SOCK="/run/php/php${PHP_VERSION}-fpm.sock"
            PHP_FPM_SERVICE="php${PHP_VERSION}-fpm"
            REDIS_SERVICE="redis-server"
            CRON_SERVICE="cron"
            ;;
        rocky | almalinux | centos | rhel)
            PKG_FAMILY="rhel"
            WEB_USER="nginx"
            PHP_FPM_SOCK="/var/run/php-fpm/pterodactyl.sock"
            PHP_FPM_SERVICE="php-fpm"
            REDIS_SERVICE="redis"
            CRON_SERVICE="crond"
            RHEL_MAJOR="${OS_VERSION%%.*}"
            ;;
        *) fail "Unsupported OS '$OS_ID'. Supported: Ubuntu, Debian, Rocky, AlmaLinux, CentOS." ;;
    esac

    if [ "$PKG_FAMILY" = "debian" ] && ! command_exists lsb_release; then
        apt-get update -y >/dev/null 2>&1 || true
        apt-get install -y lsb-release >/dev/null 2>&1 || true
    fi
    [ "$PKG_FAMILY" = "debian" ] && { [ -n "$OS_CODENAME" ] || OS_CODENAME="$(lsb_release -sc 2>/dev/null)"; }
}

detect_arch() {
    case "$(uname -m)" in
        x86_64 | amd64) ARCH="amd64" ;;
        aarch64 | arm64) ARCH="arm64" ;;
        *) fail "Unsupported CPU architecture: $(uname -m)" ;;
    esac
}

# ----------------------------------------------------------------------------
# Dependency installation
# ----------------------------------------------------------------------------
install_node() {
    if command_exists node && [ "$(node -v | grep -oE '[0-9]+' | head -1)" -ge "$NODE_MAJOR" ] 2>/dev/null; then
        output "Node $(node -v) already installed."
    else
        output "Installing Node ${NODE_MAJOR}.x..."
        if [ "$PKG_FAMILY" = "debian" ]; then
            curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
            apt-get install -y nodejs
        else
            curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
            dnf install -y nodejs
        fi
    fi
    command_exists yarn || npm install -g yarn
}

install_composer() {
    if command_exists composer; then
        output "Composer already installed."
        return
    fi
    output "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
}

install_panel_dependencies_debian() {
    output "Configuring PHP ${PHP_VERSION} repository..."
    apt-get install -y software-properties-common apt-transport-https ca-certificates curl gnupg lsb-release >/dev/null

    if [ "$OS_ID" = "ubuntu" ]; then
        LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
    else
        curl -fsSL https://packages.sury.org/php/apt.gpg | gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-php.gpg
        echo "deb https://packages.sury.org/php/ ${OS_CODENAME} main" >/etc/apt/sources.list.d/sury-php.list
    fi

    apt-get update -y
    apt-get install -y \
        "php${PHP_VERSION}" "php${PHP_VERSION}-common" "php${PHP_VERSION}-cli" "php${PHP_VERSION}-fpm" \
        "php${PHP_VERSION}-gd" "php${PHP_VERSION}-mysql" "php${PHP_VERSION}-mbstring" "php${PHP_VERSION}-bcmath" \
        "php${PHP_VERSION}-xml" "php${PHP_VERSION}-curl" "php${PHP_VERSION}-zip" "php${PHP_VERSION}-intl" \
        "php${PHP_VERSION}-sqlite3" \
        mariadb-server nginx tar unzip git redis-server cron
}

install_panel_dependencies_rhel() {
    output "Configuring EPEL and Remi repositories..."
    dnf install -y epel-release curl tar unzip git policycoreutils
    dnf install -y "https://rpms.remirepo.net/enterprise/remi-release-${RHEL_MAJOR}.rpm"
    dnf module reset php -y
    dnf module enable "php:remi-${PHP_VERSION}" -y

    output "Installing MariaDB, nginx, Redis and PHP ${PHP_VERSION}..."
    dnf install -y \
        php php-common php-cli php-fpm php-gd php-mysqlnd php-mbstring php-bcmath \
        php-xml php-curl php-zip php-intl php-process \
        mariadb-server nginx redis cronie

    configure_php_fpm_pool_rhel
}

configure_php_fpm_pool_rhel() {
    # Point PHP-FPM at a dedicated socket owned by nginx.
    mkdir -p /var/run/php-fpm
    local pool="/etc/php-fpm.d/www.conf"
    if [ -f "$pool" ]; then
        sed -i "s|^user = .*|user = nginx|" "$pool"
        sed -i "s|^group = .*|group = nginx|" "$pool"
        sed -i "s|^listen = .*|listen = ${PHP_FPM_SOCK}|" "$pool"
        sed -i "s|^;*listen.owner = .*|listen.owner = nginx|" "$pool"
        sed -i "s|^;*listen.group = .*|listen.group = nginx|" "$pool"
        sed -i "s|^;*listen.mode = .*|listen.mode = 0750|" "$pool"
    fi
}

install_selinux_tooling_rhel() {
    if command_exists getenforce && [ "$(getenforce)" != "Disabled" ]; then
        output "Applying SELinux booleans for the panel..."
        setsebool -P httpd_can_network_connect 1 || true
        setsebool -P httpd_execmem 1 || true
        setsebool -P httpd_unified 1 || true
    fi
}

open_firewall_rhel() {
    if command_exists firewall-cmd && systemctl is-active --quiet firewalld; then
        output "Opening firewall ports 80/443..."
        firewall-cmd --add-service=http --add-service=https --permanent || true
        firewall-cmd --reload || true
    fi
}

install_panel_dependencies() {
    output "Installing system dependencies (this may take a few minutes)..."
    if [ "$PKG_FAMILY" = "debian" ]; then
        install_panel_dependencies_debian
    else
        install_panel_dependencies_rhel
    fi

    install_composer

    systemctl enable --now "$REDIS_SERVICE" >/dev/null 2>&1 || true
    systemctl enable --now mariadb >/dev/null 2>&1 || true
    systemctl enable --now "$PHP_FPM_SERVICE" >/dev/null 2>&1 || true
    systemctl enable --now "$CRON_SERVICE" >/dev/null 2>&1 || true

    if [ "$PKG_FAMILY" = "rhel" ]; then
        install_selinux_tooling_rhel
        open_firewall_rhel
    fi
}

# ----------------------------------------------------------------------------
# Panel installation
# ----------------------------------------------------------------------------
download_panel_files() {
    mkdir -p "$PANEL_DIR"
    cd "$PANEL_DIR"

    USED_PREBUILT=false
    if [ "${FORCE_BUILD:-false}" != "true" ]; then
        output "Attempting to download prebuilt panel from latest release..."
        if curl -fsSL -o /tmp/panel.tar.gz "$LUNA_RELEASE_TARBALL" 2>/dev/null && tar -tzf /tmp/panel.tar.gz >/dev/null 2>&1; then
            tar -xzf /tmp/panel.tar.gz -C "$PANEL_DIR"
            rm -f /tmp/panel.tar.gz
            USED_PREBUILT=true
            success "Using prebuilt release (compiled assets included)."
        else
            warn "No prebuilt release found — will build from source instead."
        fi
    fi

    if [ "$USED_PREBUILT" = false ]; then
        output "Cloning Luna panel from ${LUNA_REPO} (${LUNA_BRANCH})..."
        if [ -d "${PANEL_DIR}/.git" ]; then
            git -C "$PANEL_DIR" fetch --all && git -C "$PANEL_DIR" reset --hard "origin/${LUNA_BRANCH}"
        else
            rm -rf "${PANEL_DIR:?}/"* "${PANEL_DIR:?}/".* 2>/dev/null || true
            git clone --branch "$LUNA_BRANCH" --depth 1 "$LUNA_REPO" "$PANEL_DIR"
        fi
    fi

    chmod -R 755 storage/* bootstrap/cache/ 2>/dev/null || true
}

build_panel_assets() {
    if [ "$USED_PREBUILT" = true ]; then
        output "Skipping asset build (using prebuilt release)."
        return
    fi
    install_node
    cd "$PANEL_DIR"
    output "Installing frontend dependencies (this can take a while)..."
    yarn install --frozen-lockfile || yarn install
    output "Building themed assets with webpack..."
    yarn build:production
}

configure_database() {
    output "Configuring MariaDB database..."
    mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
}

configure_panel_env() {
    cd "$PANEL_DIR"
    [ -f .env ] || cp .env.example .env

    composer install --no-dev --optimize-autoloader

    php artisan key:generate --force

    php artisan p:environment:setup \
        --author="$ADMIN_EMAIL" \
        --url="${APP_SCHEME}://${FQDN}" \
        --timezone="$TIMEZONE" \
        --cache=redis \
        --session=redis \
        --queue=redis \
        --redis-host=127.0.0.1 \
        --redis-pass="null" \
        --redis-port=6379 \
        --settings-ui=true

    php artisan p:environment:database \
        --host=127.0.0.1 \
        --port=3306 \
        --database="$DB_NAME" \
        --username="$DB_USER" \
        --password="$DB_PASS"

    output "Running database migrations..."
    php artisan migrate --seed --force

    # Required for the Luna avatar upload feature.
    php artisan storage:link || true
}

create_admin_user() {
    output "Creating the administrator account..."
    php artisan p:user:make \
        --email="$ADMIN_EMAIL" \
        --username="$ADMIN_USER" \
        --name-first="$ADMIN_FIRST" \
        --name-last="$ADMIN_LAST" \
        --password="$ADMIN_PASS" \
        --admin=1
}

set_permissions() {
    chown -R "${WEB_USER}:${WEB_USER}" "$PANEL_DIR"/*
}

configure_cron() {
    output "Installing the scheduler cron entry..."
    (crontab -l 2>/dev/null | grep -v "artisan schedule:run" ; echo "* * * * * php ${PANEL_DIR}/artisan schedule:run >> /dev/null 2>&1") | crontab -
}

configure_queue_worker() {
    output "Installing the pteroq queue worker service..."
    cat >/etc/systemd/system/pteroq.service <<EOF
[Unit]
Description=Pterodactyl Queue Worker
After=${REDIS_SERVICE}.service

[Service]
User=${WEB_USER}
Group=${WEB_USER}
Restart=always
ExecStart=/usr/bin/php ${PANEL_DIR}/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable --now pteroq.service
}

configure_nginx() {
    output "Configuring nginx for ${FQDN}..."

    local conf_target
    if [ "$PKG_FAMILY" = "debian" ]; then
        rm -f /etc/nginx/sites-enabled/default
        mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
        conf_target="/etc/nginx/sites-available/pterodactyl.conf"
    else
        # RHEL nginx loads everything from conf.d. Our server_name match takes
        # priority over the stock default server block, so we leave it as-is.
        conf_target="/etc/nginx/conf.d/pterodactyl.conf"
    fi

    cat >"$conf_target" <<EOF
server {
    listen 80;
    server_name ${FQDN};

    root ${PANEL_DIR}/public;
    index index.php;

    access_log /var/log/nginx/pterodactyl.app-access.log;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;

    sendfile off;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)\$;
        fastcgi_pass unix:${PHP_FPM_SOCK};
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

    if [ "$PKG_FAMILY" = "debian" ]; then
        ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
    fi

    if nginx -t; then
        systemctl enable --now nginx >/dev/null 2>&1 || true
        systemctl restart nginx
    else
        warn "nginx config test failed — review ${conf_target}."
    fi
}

configure_ssl() {
    if [ "$USE_SSL" != "true" ]; then
        return
    fi
    output "Requesting Let's Encrypt certificate for ${FQDN}..."
    if [ "$PKG_FAMILY" = "debian" ]; then
        apt-get install -y certbot python3-certbot-nginx
    else
        dnf install -y certbot python3-certbot-nginx
    fi
    if certbot --nginx -d "$FQDN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect; then
        success "SSL certificate installed."
    else
        warn "Certbot failed — the panel will remain available over HTTP. You can retry later with: certbot --nginx -d ${FQDN}"
    fi
}

install_panel() {
    hr
    output "Luna Panel installation"
    hr

    FQDN="$(ask 'Panel domain (FQDN), e.g. panel.example.com')"
    [ -n "$FQDN" ] || fail "A domain is required."

    TIMEZONE="$(ask 'Server timezone' "$(cat /etc/timezone 2>/dev/null || echo UTC)")"

    DB_NAME="$(ask 'Database name' 'panel')"
    DB_USER="$(ask 'Database username' 'pterodactyl')"
    DB_PASS="$(ask_secret 'Database password (leave blank to auto-generate)')"
    [ -n "$DB_PASS" ] || { DB_PASS="$(random_password)"; warn "Generated DB password: ${DB_PASS}"; }

    ADMIN_EMAIL="$(ask 'Admin email')"
    ADMIN_USER="$(ask 'Admin username' 'admin')"
    ADMIN_FIRST="$(ask 'Admin first name' 'Admin')"
    ADMIN_LAST="$(ask 'Admin last name' 'User')"
    ADMIN_PASS="$(ask_secret 'Admin password')"
    [ -n "$ADMIN_PASS" ] || fail "An admin password is required."

    if confirm "Obtain a free Let's Encrypt SSL certificate for ${FQDN}? (requires the domain to point at this server)"; then
        USE_SSL="true"
        APP_SCHEME="https"
    else
        USE_SSL="false"
        APP_SCHEME="http"
    fi

    install_panel_dependencies
    download_panel_files
    build_panel_assets
    configure_database
    configure_panel_env
    create_admin_user
    configure_cron
    configure_queue_worker
    configure_nginx
    set_permissions
    configure_ssl

    hr
    success "Panel installation complete!"
    output "Visit: ${APP_SCHEME}://${FQDN}"
    output "Login: ${ADMIN_EMAIL}"
    hr
}

# ----------------------------------------------------------------------------
# Wings installation (stock / official)
# ----------------------------------------------------------------------------
install_docker() {
    if command_exists docker; then
        output "Docker already installed."
    else
        output "Installing Docker..."
        curl -sSL https://get.docker.com | CHANNEL=stable bash
    fi
    systemctl enable --now docker
}

install_wings() {
    hr
    output "Stock Pterodactyl Wings installation"
    hr
    detect_arch
    install_docker

    mkdir -p /etc/pterodactyl /var/run/wings

    local url
    if [ "$WINGS_VERSION" = "latest" ]; then
        url="https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_${ARCH}"
    else
        url="https://github.com/pterodactyl/wings/releases/download/${WINGS_VERSION}/wings_linux_${ARCH}"
    fi

    output "Downloading stock Wings (${ARCH})..."
    curl -L -o /usr/local/bin/wings "$url"
    chmod u+x /usr/local/bin/wings

    cat >/etc/systemd/system/wings.service <<'EOF'
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload

    if [ "$PKG_FAMILY" = "rhel" ] && command_exists firewall-cmd && systemctl is-active --quiet firewalld; then
        output "Opening firewall ports 8080/2022 for Wings..."
        firewall-cmd --add-port=8080/tcp --add-port=2022/tcp --permanent || true
        firewall-cmd --reload || true
    fi

    hr
    success "Wings installed."
    warn "Wings is NOT started yet. Create a Node in the panel admin area,"
    warn "copy its configuration into /etc/pterodactyl/config.yml, then run:"
    output "    systemctl enable --now wings"
    hr
}

# ----------------------------------------------------------------------------
# Uninstall
# ----------------------------------------------------------------------------
uninstall_panel() {
    hr
    output "Uninstalling the Luna panel"
    hr

    output "Stopping panel services..."
    systemctl disable --now pteroq.service >/dev/null 2>&1 || true
    rm -f /etc/systemd/system/pteroq.service
    systemctl daemon-reload

    output "Removing the scheduler cron entry..."
    (crontab -l 2>/dev/null | grep -v "${PANEL_DIR}/artisan schedule:run") | crontab - 2>/dev/null || true

    output "Removing nginx configuration..."
    rm -f /etc/nginx/sites-enabled/pterodactyl.conf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/conf.d/pterodactyl.conf
    systemctl reload nginx >/dev/null 2>&1 || true

    if confirm "Drop the panel database and user? (DESTROYS ALL PANEL DATA)"; then
        local db_name db_user
        db_name="$(ask 'Database name to drop' 'panel')"
        db_user="$(ask 'Database user to drop' 'pterodactyl')"
        mysql -u root <<SQL || warn "Could not drop database (it may not exist)."
DROP DATABASE IF EXISTS ${db_name};
DROP USER IF EXISTS '${db_user}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
    fi

    if confirm "Delete the panel files at ${PANEL_DIR}?"; then
        rm -rf "${PANEL_DIR:?}"
    fi

    success "Panel uninstalled. System packages (PHP, nginx, MariaDB, Redis) were left installed."
}

uninstall_wings() {
    hr
    output "Uninstalling stock Wings"
    hr

    systemctl disable --now wings >/dev/null 2>&1 || true
    rm -f /etc/systemd/system/wings.service
    systemctl daemon-reload
    rm -f /usr/local/bin/wings

    if confirm "Delete Wings data directories (/etc/pterodactyl and /var/lib/pterodactyl)? (DESTROYS ALL SERVER DATA)"; then
        rm -rf /etc/pterodactyl /var/lib/pterodactyl /var/log/pterodactyl
    fi

    success "Wings uninstalled. Docker was left installed."
}

uninstall_menu() {
    hr
    output "What would you like to uninstall?"
    echo "  [0] Panel"
    echo "  [1] Wings"
    echo "  [2] Both"
    echo "  [3] Cancel"
    hr
    local choice
    choice="$(ask 'Select an option 0-3' '3')"
    case "$choice" in
        0) uninstall_panel ;;
        1) uninstall_wings ;;
        2) uninstall_panel; uninstall_wings ;;
        *) output "Cancelled." ;;
    esac
}

# ----------------------------------------------------------------------------
# Menu
# ----------------------------------------------------------------------------
main_menu() {
    clear
    hr
    echo -e "${COLOR_CYAN}            Luna Theme — Pterodactyl Installer${COLOR_RESET}"
    hr
    output "Repo:   ${LUNA_REPO} (${LUNA_BRANCH})"
    output "Wings:  stock / official (${WINGS_VERSION})"
    hr
    output "OS:     ${OS_ID} ${OS_VERSION} (${PKG_FAMILY})"
    hr
    echo "  [0] Install the Luna panel"
    echo "  [1] Install stock Wings"
    echo "  [2] Install both (panel, then Wings)"
    echo "  [3] Uninstall panel and/or Wings"
    echo "  [4] Exit"
    hr
    local choice
    choice="$(ask 'Select an option 0-4' '0')"
    case "$choice" in
        0) install_panel ;;
        1) install_wings ;;
        2) install_panel; install_wings ;;
        3) uninstall_menu ;;
        4) exit 0 ;;
        *) error "Invalid option."; sleep 1; main_menu ;;
    esac
}

# ----------------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------------
require_root
detect_os
mkdir -p "$(dirname "$LOG_PATH")"
main_menu |& tee -a "$LOG_PATH"
