## Discord Gateway Worker (DigitalOcean)

This worker connects to the Discord Gateway (websocket) as the **global LaunchThat bot**, listens for **forum support threads**, and relays thread events to Convex via a signed POST request.

### Required environment variables

- `DISCORD_BOT_TOKEN`: the bot token for the global LaunchThat bot
- `DISCORD_RELAY_URL`: your Convex http endpoint URL, e.g. `https://<deployment>.convex.site/discord/gateway`
- `DISCORD_RELAY_SECRET`: a random secret shared between worker and Convex (HMAC-SHA256 base64)

### Deploy to a DigitalOcean droplet (Ubuntu)

1. Create droplet
   - Ubuntu 22.04 or 24.04
   - Size: start with Basic (1 vCPU / 1GB) and scale if needed

2. SSH in

```bash
ssh root@<droplet-ip>
```

3. Install Node + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git
corepack enable
corepack prepare pnpm@10.6.3 --activate
```

4. Clone repo + install deps

```bash
git clone <your-repo-url> /opt/launchthat
cd /opt/launchthat
pnpm install --frozen-lockfile
```

5. Create env file for the worker

```bash
cd /opt/launchthat/apps/discord-gateway-worker
cat > .env << 'EOF'
DISCORD_BOT_TOKEN=...
DISCORD_RELAY_URL=https://<deployment>.convex.site/discord/gateway
DISCORD_RELAY_SECRET=...
EOF
```

6. Run as a service (systemd)

Create a service file:

```bash
cat > /etc/systemd/system/discord-gateway-worker.service << 'EOF'
[Unit]
Description=Discord Gateway Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/launchthat/apps/discord-gateway-worker
EnvironmentFile=/opt/launchthat/apps/discord-gateway-worker/.env
ExecStart=/usr/bin/node /opt/launchthat/apps/discord-gateway-worker/src/index.js
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF
```

Enable + start:

```bash
systemctl daemon-reload
systemctl enable discord-gateway-worker
systemctl start discord-gateway-worker
```

Logs:

```bash
journalctl -u discord-gateway-worker -f
```

### Notes

- You **do not** need to open inbound ports if the worker only makes outbound HTTPS requests to Convex.
- Ensure the bot has permission to read forum thread messages (and `Message Content Intent` is enabled in the Discord developer portal).


