import { LitElement, css, html } from "lit";

import { fetchAuthedWidgetJson } from "../lib/authFetch";

type MyTradesData = {
  ok: true;
  widgetType: string;
  trades: Array<{
    tradeIdeaGroupId: string;
    symbol: string;
    direction: "long" | "short";
    closedAt: number;
    realizedPnl: number | null;
    fees: number | null;
    reviewStatus: "todo" | "reviewed";
  }>;
};

const fmtTime = (ms: number) => new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export class TdrLpMyTrades extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: "api-base" },
    installationId: { type: String, attribute: "installation-id" },
    apiKey: { type: String, attribute: "api-key" },
    limit: { type: Number },
  };

  apiBase = "https://different-trout-684.convex.site";
  installationId = "";
  apiKey = "";
  limit = 20;

  private loading = true;
  private error: string | null = null;
  private trades: MyTradesData["trades"] = [];

  protected async firstUpdated() {
    await this.refresh();
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("apiBase") || changed.has("installationId") || changed.has("apiKey") || changed.has("limit")) {
      void this.refresh();
    }
  }

  private async refresh() {
    this.loading = true;
    this.error = null;
    this.requestUpdate();

    const res = await fetchAuthedWidgetJson<MyTradesData>({
      apiBase: this.apiBase,
      path: "/widgets/auth/my-trades",
      installationId: this.installationId,
      apiKey: this.apiKey,
      query: { limit: this.limit },
    });

    if (!res.ok) {
      this.trades = [];
      this.error = res.error;
      this.loading = false;
      this.requestUpdate();
      return;
    }

    const trades = (res.data as any)?.trades;
    this.trades = Array.isArray(trades) ? trades : [];
    this.loading = false;
    this.requestUpdate();
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--tdrlp-font, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto);
      color: var(--tdrlp-fg, #0f172a);
    }

    .card {
      background: var(--tdrlp-bg, #ffffff);
      border: 1px solid var(--tdrlp-border, #e2e8f0);
      border-radius: var(--tdrlp-radius, 12px);
      overflow: hidden;
    }

    .head {
      padding: 12px 14px;
      border-bottom: 1px solid var(--tdrlp-border, #e2e8f0);
      font-weight: 600;
    }

    .state {
      padding: 14px;
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th,
    td {
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 65%, transparent);
      vertical-align: top;
    }

    th {
      font-size: 11px;
      color: var(--tdrlp-muted, #475569);
      font-weight: 600;
      background: color-mix(in srgb, var(--tdrlp-bg, #ffffff) 92%, var(--tdrlp-border, #e2e8f0));
    }

    .pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 70%, transparent);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      color: var(--tdrlp-muted, #475569);
      white-space: nowrap;
    }
  `;

  render() {
    if (this.loading) return html`<div class="card"><div class="state">Loading…</div></div>`;
    if (this.error) return html`<div class="card"><div class="state">Error: ${this.error}</div></div>`;

    return html`
      <div class="card">
        <div class="head">Recent trades</div>
        ${this.trades.length === 0
          ? html`<div class="state">No trades found.</div>`
          : html`
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Dir</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.trades.map(
                    (t) => html`
                      <tr>
                        <td>${fmtTime(t.closedAt)}</td>
                        <td>${t.symbol}</td>
                        <td><span class="pill">${t.direction}</span></td>
                        <td><span class="pill">${t.reviewStatus}</span></td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `}
      </div>
    `;
  }
}

if (!customElements.get("tdrlp-my-trades")) {
  customElements.define("tdrlp-my-trades", TdrLpMyTrades);
}

