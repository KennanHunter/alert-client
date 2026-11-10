# @kennanhunter/alert-client

Thin TypeScript client for the alert ingestion API at [kennan.dev](https://kennan.dev). Sends a Discord-embed-shaped alert to a single HTTP endpoint; the server persists it and asynchronously delivers it to Discord.

## Install

```sh
npm i @kennanhunter/alert-client
```

## Usage

```ts
import { createAlertsClient } from "@kennanhunter/alert-client";

const alerts = createAlertsClient({
  apiKey: process.env.ALERTS_KEY!,
  mode: "remote",
});

await alerts.send({
  level: "error",
  source: "nightly-backup",
  embed: {
    title: "Backup failed",
    description: "rclone exited 7 at 03:14",
    color: 0xff5555,
    fields: [
      { name: "host", value: "prod-1", inline: true },
      { name: "duration", value: "42s", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "nightly-backup.sh" },
  },
});
```

Mint an API key at [https://kennan.dev/admin/alerts](https://kennan.dev/admin/alerts). The raw key is shown exactly once at creation time.

## Discord embed limits

The server rejects (400) embeds that exceed these limits:

| Field | Limit |
|---|---|
| `title` | 256 chars |
| `description` | 4096 chars |
| `fields[]` | 25 entries, each `name` ≤ 256, `value` ≤ 1024 |
| `footer.text` | 2048 chars |
| `author.name` | 256 chars |
| Total of all text fields | 6000 chars |

The embed must have at least one of `title`, `description`, or a non-empty `fields` array.

## Errors

Non-2xx responses throw `AlertsError` with `status` and parsed `body`:

```ts
import { AlertsError } from "@kennanhunter/alert-client";

try {
  await alerts.send({ /* ... */ });
} catch (e) {
  if (e instanceof AlertsError) {
    console.error(e.status, e.body);
  } else throw e;
}
```

## License

MIT
