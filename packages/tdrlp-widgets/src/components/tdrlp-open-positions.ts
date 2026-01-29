import { LitElement, css, html } from "lit";

import { fetchAuthedWidgetJson } from "../lib/authFetch";

type OpenPositionsData = {
  ok: true;
  widgetType: string;
  positions: Array<{
    externalPositionId: string;
    symbol: string | null;
    instrumentId: string | null;
    side: "buy" | "sell" | null;
    openedAt: number | null;
    qty: number | null;
    avgPrice: number | null;
    updatedAt: number;
  }>;
};

export class TdrLpOpenPositions extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: "api-base" },
    installationId: { type: String, attribute: "installation-id" },
    apiKey: { type: String, attribute: "api-key" },
    limit: { type: Number },
  };

  apiBase = "https://different-trout-684.convex.site";
  installationId = "";
  apiKey = "";
  limit = 50;

  private loading = true;
  private error: string | null = null;
  private positions: OpenPositionsData["positions"] = [];

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

    const res = await fetchAuthedWidgetJson<OpenPositionsData>({
      apiBase: this.apiBase,
      path: "/widgets/auth/open-positions",
      installationId: this.installationId,
      apiKey: this.apiKey,
      query: { limit: this.limit },
    });

    if (!res.ok) {
      this.positions = [];
      this.error = res.error;
      this.loading = false;
      this.requestUpdate();
      return;
    }

    const positions = (res.data as any)?.positions;
    this.positions = Array.isArray(positions) ? positions : [];
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

    .row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 65%, transparent);
    }

    .sym {
      font-weight: 600;
    }

    .meta {
      margin-top: 2px;
      font-size: 11px;
      color: var(--tdrlp-muted, #475569);
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
        <div class="head">Open positions</div>
        ${this.positions.length === 0
          ? html`<div class="state">No open positions.</div>`
          : html`
              ${this.positions.map((p) => {
                const symbol = p.symbol ?? "—";
                const side = p.side ?? "—";
                const qty = typeof p.qty === "number" ? p.qty : null;
                const avg = typeof p.avgPrice === "number" ? p.avgPrice : null;
                return html`
                  <div class="row">
                    <div>
                      <div class="sym">${symbol}</div>
                      <div class="meta">
                        ${qty !== null ? html`Qty ${qty}` : html``}
                        ${qty !== null && avg !== null ? html` · ` : html``}
                        ${avg !== null ? html`Avg ${avg}` : html``}
                      </div>
                    </div>
                    <div><span class="pill">${side}</span></div>
                  </div>
                `;
              })}
            `}
      </div>
    `;
  }
}

if (!customElements.get("tdrlp-open-positions")) {
  customElements.define("tdrlp-open-positions", TdrLpOpenPositions);
}

