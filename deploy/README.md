# GrowWell production deployment

The production host uses Nginx on port 80. Docker exposes the frontend only
on `127.0.0.1:${FRONTEND_PORT}` and host Nginx proxies public traffic to it.
The default is port `8081`; the current GrowWell VPS uses port `3000`.

Public production traffic must terminate TLS at the host Nginx (or an upstream
trusted proxy). Set these values in the root `.env` to the real HTTPS origin;
do not use the server IP or an `http://` origin:

```env
PUBLIC_BASE_URL=https://growwell.example.com
ALLOWED_ORIGINS=https://growwell.example.com
FRONTEND_PORT=3000
```

The checked-in port-80 server block is the internal proxy baseline. Preserve
the VPS certificate configuration and redirect public HTTP traffic to HTTPS.

## Deploy the current revision

```sh
git pull --ff-only origin main
git rev-parse HEAD
docker compose build backend frontend
docker compose up -d --force-recreate backend frontend
docker compose ps
docker compose logs --tail=100 backend frontend
```

## Configure host Nginx

Copy `deploy/nginx-growwell.conf` to the host's enabled Nginx configuration,
disable the distribution's default welcome-page site, then validate and reload:

```sh
sudo cp deploy/nginx-growwell.conf /etc/nginx/sites-available/growwell
sudo ln -sfn /etc/nginx/sites-available/growwell /etc/nginx/sites-enabled/growwell
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Verify PDF upload

1. Upload a PDF smaller than 10 MB from **Admin > Edukasi**.
2. Confirm the API request returns HTTP `201`.
3. Confirm the file exists in the persistent volume:

   ```sh
   docker compose exec backend ls -lah /app/uploads/edukasi
   ```

4. Open the returned `/uploads/edukasi/<uuid>.pdf` URL and confirm it returns
   HTTP `200` with `Content-Type: application/pdf`.

If upload fails, inspect the backend error recorded for that request:

```sh
docker compose logs --tail=200 backend
```
