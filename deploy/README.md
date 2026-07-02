# GrowWell production deployment

The production host uses Nginx on port 80. Docker therefore exposes the
frontend only on `127.0.0.1:8081`, and host Nginx proxies public traffic to it.

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
