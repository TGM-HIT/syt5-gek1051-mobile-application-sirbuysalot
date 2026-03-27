# Deployment Guide

## Schnellstart (Lokal)

```bash
# 1. Klone das Repo
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot.git
cd syt5-gek1051-mobile-application-sirbuysalot

# 2. Environment setup
cp .env.example .env
# Bearbeite .env mit deinen DB-Credentials

# 3. Alles starten
docker compose up -d

# 4. Backend starten (neue Konsole)
cd backend
./mvnw spring-boot:run

# 5. Frontend starten (neue Konsole)
cd frontend
npm install
npm run dev

# Oeffne http://localhost:5173
```

## Production Deployment

### Option 1: Docker Compose auf Server

```bash
# Auf dem Server:
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot.git
cd syt5-gek1051-mobile-application-sirbuysalot
cp .env.example .env

# .env bearbeiten mit echten Credentials
nano .env

# Full production stack starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 2: Frontend mit nginx + Backend JAR

1. **Frontend bauen:**
```bash
cd frontend
npm ci
npm run build
# Output in frontend/dist/
```

2. **Backend JAR bauen:**
```bash
cd backend
./mvnw -B package -DskipTests
# Output in backend/target/sirbuysalot-0.1.0.jar
```

3. **nginx config** (siehe `frontend/nginx.conf`):
```nginx
server {
    listen 80;
    server_name sirbuysalot.deinedomain.at;
    
    root /var/www/sirbuysalot;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **Systemd Service fuer Backend:**
```ini
# /etc/systemd/system/sirbuysalot.service
[Unit]
Description=SirBuysALot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sirbuysalot
ExecStart=/usr/bin/java -jar sirbuysalot-0.1.0.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Option 3: GitHub Actions CI/CD (automatic)

Push to `main` triggered automatic deployment:

1. Secrets konfigurieren in GitHub Repo Settings:
   - `DEPLOY_HOST` - Server IP/hostname
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_SSH_KEY` - Private SSH key
   - `DEPLOY_PATH` - Path to repo on server

2. Workflow liegt unter `.github/workflows/deploy.yml`

3. Manual trigger: Actions > Deploy > Run workflow

## Benötigte Secrets (.env)

```bash
POSTGRES_DB=sirbuysalot
POSTGRES_USER=sirbuysalot_user
POSTGRES_PASSWORD=<starkes-passwort>
DATABASE_URL=jdbc:postgresql://localhost:5432/sirbuysalot
SPRING_PROFILES_ACTIVE=prod
```

## Health Check

Nach Deployment:
```bash
# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl -I http://localhost:5173
```

## Troubleshooting

**Frontend zeigt 404 nach Refresh:**
-> nginx `try_files $uri $uri/ /index.html` fehlt

**API Calls schlagen fehl:**
-> CORS Config in Backend checken, Origin muss frontend domain erlauben

**WebSocket funktioniert nicht:**
-> STOMP Endpoint und Upgrade Header in nginx/proxy checken

**PWA Install-Prompt erscheint nicht:**
-> Service Worker muss registriert sein, HTTPS noetig fuer Production PWA
