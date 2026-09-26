# Durable hosting on Oracle Cloud Always Free

This deployment keeps the existing JSON database and uploaded documents on
the VM's boot volume. Oracle's Always Free resources are subject to home
region availability and account limits; confirm that the VM and storage are
marked **Always Free** before creating them. A running VM still needs backups.

## Before moving traffic

1. **Do not redeploy or restart the current Render service yet.** Render Free
   has no persistent disk or Shell/SSH access. A redeploy can erase records
   that exist only in its current instance. Record the current `/api/ready`
   user/order counts and check recent prices and coupons in Admin. Find the
   newest complete backup of `data/db.json` **and** `data/uploads/`. The
   database alone cannot recover uploaded print files.
2. Create an Always Free VM with enough boot storage, a reserved public IP,
   and inbound TCP 80/443 allowed in both Oracle's network rules and the VM
   firewall. Install Docker Engine and its Compose plugin using Docker's
   [Ubuntu](https://docs.docker.com/engine/install/ubuntu/) or
   [Oracle Linux](https://docs.docker.com/engine/install/centos/) guide.
3. Clone this repository on the VM. Copy `.env.example` to `.env`; set
   `NODE_ENV=production`, `DEMO_LOGIN=off`, `ADMIN_EMAIL`, a strong
   `ADMIN_PASSWORD`, and `SITE_HOST` to the production domain. Copy all
   existing secrets from Render's Environment page into `.env`. Restrict it
   with `chmod 600 .env`. Never commit or share this file.
4. Copy the **complete** backup into the checkout's `data/` directory,
   including `db.json`, `uploads/`, and `.diskid` if present. Keep an
   untouched copy elsewhere. If the backup is older than the live Render
   counts or recent orders, pause the migration until those missing records
   can be recovered. This repository has no full data export endpoint on
   Render Free.
5. Set the domain's DNS A record to the VM's public IP. From the checkout,
   run `docker compose --env-file .env -f deploy/compose.yaml up -d --build`
   and then `docker compose --env-file .env -f deploy/compose.yaml logs --tail=100 app`. The app
   refuses to start if a production database is missing or corrupt.
6. Compare `/api/ready` counts with the backup and check a recent price,
   coupon, customer, order and uploaded PDF in the new Admin UI. Only then
   accept new orders on the new host. Keep the old service available until
   the check is complete, but avoid taking orders on both hosts at once.

For a **brand-new shop with no prior data**, add `INIT_EMPTY_DB=yes` to
`.env` for the first boot only. Remove it immediately after the database
is created. Never use it to recover from a missing database.

## Ongoing operation

- `docker compose --env-file .env -f deploy/compose.yaml up -d --build` updates the app
  without deleting `data/`; never use `down -v` for this deployment.
- Back up the whole `data/` directory regularly to a separate location,
  and schedule Oracle boot-volume backups if available. Test a restore.
- If the VM or boot volume is deleted, its data may be lost. Restore the
  backup before restarting the app or changing DNS.
