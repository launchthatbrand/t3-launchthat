import { LitElement, css, html } from "lit";

import { fetchAuthedWidgetJson } from "../lib/authFetch";

type ProfileCardData = {
  ok: true;
  widgetType: string;
  data: {
    userId: string;
    name: string | null;
    publicUsername: string | null;
    image: string | null;
    headline: {
      sampleSize: number;
      closedTrades: number;
      openTrades: number;
      winRate: number;
      expectancy: number;
      totalFees: number;
      totalPnl: number;
    };
  };
};

export class TdrLpProfileCard extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: "api-base" },
    installationId: { type: String, attribute: "installation-id" },
    apiKey: { type: String, attribute: "api-key" },
  };

  apiBase = "https://different-trout-684.convex.site";
  installationId = "";
  apiKey = "";

  private loading = true;
  private error: string | null = null;
  private payload: ProfileCardData["data"] | null = null;

  protected async firstUpdated() {
    await this.refresh();
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("apiBase") || changed.has("installationId") || changed.has("apiKey")) {
      void this.refresh();
    }
  }

  private async refresh() {
    this.loading = true;
    this.error = null;
    this.requestUpdate();

    const res = await fetchAuthedWidgetJson<ProfileCardData>({
      apiBase: this.apiBase,
      path: "/widgets/auth/profile-card",
      installationId: this.installationId,
      apiKey: this.apiKey,
    });

    if (!res.ok) {
      this.payload = null;
      this.error = res.error;
      this.loading = false;
      this.requestUpdate();
      return;
    }

    const dataUnknown = res.data as unknown;
    const data = dataUnknown && typeof dataUnknown === "object" ? (dataUnknown as any).data : null;
    this.payload = data && typeof data === "object" ? (data as any) : null;
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

    .header {
      display: flex;
      gap: 12px;
      padding: 14px;
      align-items: center;
      border-bottom: 1px solid var(--tdrlp-border, #e2e8f0);
    }

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 40%, transparent);
      overflow: hidden;
      flex: 0 0 auto;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .title {
      font-weight: 600;
      line-height: 1.15;
    }

    .sub {
      margin-top: 2px;
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding: 14px;
    }

    .metric {
      border: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
      border-radius: 10px;
      padding: 10px;
      background: color-mix(in srgb, var(--tdrlp-bg, #ffffff) 92%, var(--tdrlp-border, #e2e8f0));
    }

    .k {
      font-size: 11px;
      color: var(--tdrlp-muted, #475569);
    }

    .v {
      margin-top: 4px;
      font-weight: 600;
    }

    .state {
      padding: 14px;
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
    }
  `;

  render() {
    if (this.loading) {
      return html`<div class="card"><div class="state">Loading…</div></div>`;
    }
    if (this.error) {
      return html`<div class="card"><div class="state">Error: ${this.error}</div></div>`;
    }
    if (!this.payload) {
      return html`<div class="card"><div class="state">No data.</div></div>`;
    }

    const p = this.payload;
    const title = p.name || p.publicUsername || "Trader";
    const handle = p.publicUsername ? `@${p.publicUsername}` : null;
    const h = p.headline;
    const fmtPct = (n: number) => `${Math.round((Number.isFinite(n) ? n : 0) * 100)}%`;
    const fmtNum = (n: number) => `${Math.round(Number.isFinite(n) ? n : 0)}`;

    return html`
      <div class="card">
        <div class="header">
          <div class="avatar">${p.image ? html`<img src=${p.image} alt=${title} />` : html``}</div>
          <div>
            <div class="title">${title}</div>
            <div class="sub">${handle ?? "TraderLaunchpad"}</div>
          </div>
        </div>

        <div class="grid">
          <div class="metric">
            <div class="k">Win rate</div>
            <div class="v">${fmtPct(h.winRate)}</div>
          </div>
          <div class="metric">
            <div class="k">Closed trades</div>
            <div class="v">${fmtNum(h.closedTrades)}</div>
          </div>
          <div class="metric">
            <div class="k">Open trades</div>
            <div class="v">${fmtNum(h.openTrades)}</div>
          </div>
          <div class="metric">
            <div class="k">Sample size</div>
            <div class="v">${fmtNum(h.sampleSize)}</div>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("tdrlp-profile-card")) {
  customElements.define("tdrlp-profile-card", TdrLpProfileCard);
}

