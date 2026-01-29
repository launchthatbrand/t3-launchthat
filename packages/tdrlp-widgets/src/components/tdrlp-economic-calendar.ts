import { LitElement, css, html } from "lit";

type Preset = "today" | "thisWeek" | "nextWeek";
type ImpactFilter = "all" | "high" | "medium" | "low" | "unknown";
type ViewMode = "timeline" | "day";

type Row = {
  id: string;
  title: string;
  startsAt: number | null;
  currency: string | null;
  country: string | null;
  impact: string | null;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
};

const clampInt = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.floor(v)));

const startOfDayMs = (d: Date): number => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const endOfDayMs = (d: Date): number => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
};

const startOfWeekMs = (d: Date): number => {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const endOfWeekMs = (d: Date): number => {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (6 - day));
  x.setHours(23, 59, 59, 999);
  return x.getTime();
};

const formatTime = (ms: number | null): string => {
  if (!ms || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const addDays = (d: Date, delta: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
};

const formatDateKey = (ms: number): string => {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDayLabel = (ms: number): string => {
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const impactKey = (impact: string | null | undefined): ImpactFilter => {
  const v = String(impact ?? "").trim().toLowerCase();
  if (!v) return "unknown";
  if (v.includes("high")) return "high";
  if (v.includes("med")) return "medium";
  if (v.includes("low")) return "low";
  return "unknown";
};

const startOfMonthMs = (d: Date): number => {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const addMonths = (d: Date, delta: number): Date => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + delta);
  return x;
};

export class TdrLpEconomicCalendar extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: "api-base" },
    newsBase: { type: String, attribute: "news-base" },
    preset: { type: String },
    fromMs: { type: Number, attribute: "from-ms" },
    toMs: { type: Number, attribute: "to-ms" },
    currency: { type: String },
    currencies: { type: String },
    impact: { type: String },
    query: { type: String },
    limit: { type: Number },
    // internal
    baseRows: { state: true },
    rows: { state: true },
    loading: { state: true },
    error: { state: true },
    selectedDateKey: { state: true },
    monthAnchorMs: { state: true },
    rangeAnchorMs: { state: true },
    isMobile: { state: true },
    mobileExpandedId: { state: true },
    mobileShowAll: { state: true },
    mode: { state: true },
    timelineFromMs: { state: true },
    timelineToMs: { state: true },
    dayFromMs: { state: true },
    dayToMs: { state: true },
    loadingMorePast: { state: true },
    scrolledToUpcoming: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: var(--tdrlp-font, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto);
      color: var(--tdrlp-fg, #0f172a);
    }

    :host {
      --tdrlp-sticky-header-height: 35px;
    }

    .layout {
      display: grid;
      gap: 16px;
    }

    @media (min-width: 1024px) {
      .layout {
        grid-template-columns: 280px 1fr;
        align-items: start;
      }
    }

    .card {
      background: var(--tdrlp-bg, #ffffff);
      border: 1px solid var(--tdrlp-border, #e2e8f0);
      border-radius: var(--tdrlp-radius, 12px);
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--tdrlp-border, #e2e8f0);
      background: var(--tdrlp-bg, #fff);
    }

    .title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .meta {
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
      white-space: nowrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead th {
      position: sticky;
      top: 0;
      z-index: 3;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: var(--tdrlp-muted, #475569);
      padding: 9px 10px;
      border-bottom: 1px solid var(--tdrlp-border, #e2e8f0);
      background: var(--tdrlp-bg, #fff);
    }

    tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
      vertical-align: top;
    }

    tbody tr:hover td {
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 6%, transparent);
    }

    /* Past events: make clearly visually distinct */
    tr.rowPast td {
      background: transparent;
      color: color-mix(in srgb, var(--tdrlp-fg, #0f172a) 35%, var(--tdrlp-muted, #475569));
    }

    tr.rowPast a {
      color: var(--tdrlp-muted, #475569);
    }

    /* Upcoming rows are neutral; only the "next" row is emphasized. */
    tr.rowUpcoming td {
      background: transparent;
    }

    /* Next upcoming event: subtle ring highlight (single row) */
    tr.rowNext td {
      border-top: 2px solid color-mix(in srgb, #f59e0b 70%, transparent);
      border-bottom: 2px solid color-mix(in srgb, #f59e0b 70%, transparent);
      background: color-mix(in srgb, #f59e0b 10%, transparent);
    }
    tr.rowNext td:first-child {
      border-left: 2px solid color-mix(in srgb, #f59e0b 70%, transparent);
    }
    tr.rowNext td:last-child {
      border-right: 2px solid color-mix(in srgb, #f59e0b 70%, transparent);
    }

    /* Separator between past and upcoming */
    tr.splitRow td {
      padding: 0;
      height: 0;
      border-bottom: 0;
      border-top: 2px solid #f59e0b;
      background: transparent;
    }

    .dayRow td {
      position: sticky;
      top: var(--tdrlp-sticky-header-height);
      z-index: 2;
      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-border, #e2e8f0));
      backdrop-filter: blur(4px);
      border-bottom: 1px solid black;
    }

    .loadPastBanner {
      position: sticky;
      top: var(--tdrlp-sticky-header-height);
      z-index: 2;
      padding: 6px 10px;
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-border, #e2e8f0));
      border-bottom: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
    }

    .eventTitle {
      font-size: 13px;
      font-weight: 750;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .eventMeta {
      margin-top: 2px;
      font-size: 12px;
      color: var(--tdrlp-muted, #475569);
    }

    .right {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--tdrlp-border, #e2e8f0);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--tdrlp-muted, #475569);
      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-accent, #2563eb));
    }

    .impact-high {
      color: #b91c1c;
      border-color: color-mix(in srgb, #ef4444 35%, var(--tdrlp-border, #e2e8f0));
      background: color-mix(in srgb, #ef4444 10%, var(--tdrlp-bg, #fff));
    }

    .impact-medium {
      color: #a16207;
      border-color: color-mix(in srgb, #f59e0b 35%, var(--tdrlp-border, #e2e8f0));
      background: color-mix(in srgb, #f59e0b 10%, var(--tdrlp-bg, #fff));
    }

    .impact-low {
      color: #334155;
    }

    .empty,
    .error,
    .loading {
      padding: 12px 14px;
      font-size: 13px;
      color: var(--tdrlp-muted, #475569);
    }

    .controlsRow {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    @media (min-width: 640px) {
      .controlsRow {
        flex-direction: row;
        align-items: center;
      }
    }

    .btnRow {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    button {
      font: inherit;
    }

    .btn {
      border: 1px solid var(--tdrlp-border, #e2e8f0);
      background: var(--tdrlp-bg, #fff);
      color: var(--tdrlp-fg, #0f172a);
      border-radius: 10px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn:hover {
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 6%, var(--tdrlp-bg, #fff));
    }

    .btnPrimary {
      border-color: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 30%, var(--tdrlp-border, #e2e8f0));
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 10%, var(--tdrlp-bg, #fff));
    }

    .field {
      border: 1px solid var(--tdrlp-border, #e2e8f0);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 13px;
      background: var(--tdrlp-bg, #fff);
      color: var(--tdrlp-fg, #0f172a);
      outline: none;
    }

    .field:focus {
      border-color: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 35%, var(--tdrlp-border, #e2e8f0));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--tdrlp-accent, #2563eb) 18%, transparent);
    }

    .calendar {
      padding: 10px;
    }

    .calHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      gap: 8px;
    }

    .calTitle {
      font-size: 12px;
      font-weight: 800;
      color: var(--tdrlp-muted, #475569);
    }

    .calGrid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .calDow {
      font-size: 10px;
      font-weight: 800;
      color: var(--tdrlp-muted, #64748b);
      text-align: center;
      padding: 2px 0;
      user-select: none;
    }

    .calDay {
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 8px 0;
      text-align: center;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }

    .calDay:hover {
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 6%, transparent);
    }

    .calDayOutside {
      color: color-mix(in srgb, var(--tdrlp-muted, #64748b) 70%, transparent);
    }

    .calDaySelected {
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 14%, transparent);
      border-color: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 35%, transparent);
      font-weight: 800;
    }

    .dayRow {
      background: color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 18%, transparent);
      font-size: 12px;
      font-weight: 800;
      color: var(--tdrlp-muted, #475569);
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `;

  // NOTE: Do NOT use class field initializers for reactive props here.
  // Some TS emit modes define fields via defineProperty, bypassing Lit setters.
  declare apiBase: string;
  declare newsBase: string;
  declare preset: Preset;
  declare fromMs?: number;
  declare toMs?: number;
  declare currency?: string;
  declare currencies?: string;
  declare impact?: ImpactFilter;
  declare query?: string;
  declare limit: number;

  declare baseRows: Row[];
  declare rows: Row[];
  declare loading: boolean;
  declare error: string | null;
  declare selectedDateKey: string | null;
  declare monthAnchorMs: number;
  declare rangeAnchorMs: number | null;
  declare isMobile: boolean;
  declare mobileExpandedId: string | null;
  declare mobileShowAll: boolean;
  declare mode: ViewMode;
  declare timelineFromMs: number;
  declare timelineToMs: number;
  declare dayFromMs?: number;
  declare dayToMs?: number;
  declare loadingMorePast: boolean;
  declare scrolledToUpcoming: boolean;

  private mq?: MediaQueryList;
  private handleMqChange?: (e: MediaQueryListEvent) => void;
  private lastScrollTop = 0;
  private lastLoadMoreAtMs = 0;
  private hasMorePast = true;

  constructor() {
    super();
    // Defaults
    this.apiBase = "https://different-trout-684.convex.site";
    this.newsBase = "https://traderlaunchpad.com";
    this.preset = "thisWeek";
    this.limit = 200;
    this.currency = "ALL";
    this.currencies = "";
    this.impact = "all";
    this.query = "";

    // Internal state
    this.baseRows = [];
    this.rows = [];
    this.loading = true;
    this.error = null;
    this.selectedDateKey = null;
    this.monthAnchorMs = startOfMonthMs(new Date());
    this.rangeAnchorMs = null;
    this.isMobile = false;
    this.mobileExpandedId = null;
    this.mobileShowAll = false;

    const now = new Date();
    // Option 2 default window: yesterday → +7 days.
    this.mode = "timeline";
    this.timelineFromMs = startOfDayMs(addDays(now, -1));
    this.timelineToMs = endOfDayMs(addDays(now, 7));
    this.dayFromMs = undefined;
    this.dayToMs = undefined;
    this.loadingMorePast = false;
    this.scrolledToUpcoming = false;

    this.lastScrollTop = 0;
    this.lastLoadMoreAtMs = 0;
    this.hasMorePast = true;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    this.mq = window.matchMedia("(max-width: 640px)");
    this.isMobile = Boolean(this.mq.matches);
    this.handleMqChange = (e: MediaQueryListEvent) => {
      this.isMobile = Boolean(e.matches);
      if (this.isMobile) {
        // Always collapse the accordion when entering mobile mode.
        this.mobileExpandedId = null;
        this.mobileShowAll = false;
      }
    };
    this.mq.addEventListener("change", this.handleMqChange);
  }

  disconnectedCallback(): void {
    if (this.mq && this.handleMqChange) {
      this.mq.removeEventListener("change", this.handleMqChange);
    }
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    void this.refresh();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (
      changed.has("apiBase") ||
      changed.has("preset") ||
      changed.has("fromMs") ||
      changed.has("toMs") ||
      changed.has("limit")
    ) {
      void this.refresh();
      return;
    }
    if (
      changed.has("currency") ||
      changed.has("currencies") ||
      changed.has("impact") ||
      changed.has("query") ||
      changed.has("selectedDateKey") ||
      changed.has("rangeAnchorMs")
    ) {
      this.applyFilters();
    }
    // `timelineFromMs` can change during infinite-scroll backfill; do NOT auto-refresh
    // on window vars here or it causes a flash/jump loop. We explicitly refresh from
    // user-initiated actions (preset/day selection/clear day filter) instead.
  }

  private resolveRange(): { fromMs: number; toMs: number } {
    const fromAttr = typeof this.fromMs === "number" && Number.isFinite(this.fromMs) ? this.fromMs : null;
    const toAttr = typeof this.toMs === "number" && Number.isFinite(this.toMs) ? this.toMs : null;
    if (fromAttr !== null && toAttr !== null) {
      return { fromMs: Math.max(0, Math.floor(fromAttr)), toMs: Math.max(0, Math.floor(toAttr)) };
    }

    if (this.mode === "day" && typeof this.dayFromMs === "number" && typeof this.dayToMs === "number") {
      return { fromMs: this.dayFromMs, toMs: this.dayToMs };
    }

    if (this.mode === "timeline") {
      return { fromMs: this.timelineFromMs, toMs: this.timelineToMs };
    }

    // Fallback to preset behavior (should be rare once mode is used).
    const anchor =
      typeof this.rangeAnchorMs === "number" && Number.isFinite(this.rangeAnchorMs)
        ? new Date(this.rangeAnchorMs)
        : new Date();
    if (this.preset === "today") {
      return { fromMs: startOfDayMs(anchor), toMs: endOfDayMs(anchor) };
    }
    if (this.preset === "nextWeek") {
      const next = new Date(anchor);
      next.setDate(next.getDate() + 7);
      return { fromMs: startOfWeekMs(next), toMs: endOfWeekMs(next) };
    }
    return { fromMs: startOfWeekMs(anchor), toMs: endOfWeekMs(anchor) };
  }

  private impactClass(impact: string | null): string {
    const v = String(impact ?? "").toLowerCase();
    if (v.includes("high")) return "impact-high";
    if (v.includes("med")) return "impact-medium";
    if (v.includes("low")) return "impact-low";
    return "";
  }

  private applyFilters(): void {
    const currenciesRaw =
      typeof this.currencies === "string" && this.currencies.trim() ? this.currencies.trim() : "";
    const currenciesList = currenciesRaw
      ? currenciesRaw
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
      : [];
    const currencyAllow =
      currenciesList.length > 0 ? new Set<string>(currenciesList) : null;

    const currencySingle =
      typeof this.currency === "string" && this.currency.trim()
        ? this.currency.trim().toUpperCase()
        : "";
    const query = typeof this.query === "string" ? this.query.trim().toLowerCase() : "";
    const impact = (this.impact ?? "all") as ImpactFilter;
    const selectedDateKey = this.selectedDateKey;

    this.rows = (this.baseRows ?? [])
      .filter((r) => {
        const rowCcy = String(r.currency ?? "").toUpperCase();
        if (currencyAllow) {
          if (!currencyAllow.has(rowCcy)) return false;
        } else if (currencySingle && currencySingle !== "ALL") {
          if (rowCcy !== currencySingle) return false;
        }
        if (impact !== "all") {
          if (impactKey(r.impact) !== impact) return false;
        }
        if (query) {
          const hay = `${r.title ?? ""}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        if (selectedDateKey && r.startsAt) {
          return formatDateKey(r.startsAt) === selectedDateKey;
        }
        return true;
      })
      .sort((a, b) => Number(a.startsAt ?? 0) - Number(b.startsAt ?? 0));
  }

  private async refresh(): Promise<void> {
    const { fromMs, toMs } = this.resolveRange();
    const limit = clampInt(Number(this.limit ?? 200), 1, 500);

    this.loading = true;
    this.error = null;

    try {
      const base = this.apiBase.replace(/\/+$/, "");
      const u = new URL(`${base}/widgets/economic-calendar`);
      u.searchParams.set("fromMs", String(fromMs));
      u.searchParams.set("toMs", String(toMs));
      u.searchParams.set("limit", String(limit));
      const res = await fetch(u.toString(), { method: "GET" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as any;
      const list: Row[] = Array.isArray(json?.rows) ? (json.rows as Row[]) : [];
      this.baseRows = list.sort((a, b) => Number(a.startsAt ?? 0) - Number(b.startsAt ?? 0));
      this.applyFilters();
      this.hasMorePast = this.timelineFromMs > 0;

      if (this.mode === "timeline") {
        // Allow auto-scroll again whenever we refresh the window.
        this.scrolledToUpcoming = false;
        await this.updateComplete;
        this.scrollToUpcomingIfNeeded();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load";
      this.baseRows = [];
      this.rows = [];
    } finally {
      this.loading = false;
    }
  }

  private setPreset(next: Preset) {
    this.preset = next;
    if (next === "today") {
      const now = new Date();
      this.mode = "day";
      this.dayFromMs = startOfDayMs(now);
      this.dayToMs = endOfDayMs(now);
      this.selectedDateKey = formatDateKey(now.getTime());
      this.rangeAnchorMs = now.getTime();
      void this.refresh();
      return;
    }

    // Convert preset back into a timeline window (still supports infinite-scroll backfill).
    const now = new Date();
    this.mode = "timeline";
    this.dayFromMs = undefined;
    this.dayToMs = undefined;
    this.selectedDateKey = null;
    this.rangeAnchorMs = null;

    if (next === "nextWeek") {
      const nextWeek = addDays(now, 7);
      this.timelineFromMs = startOfWeekMs(nextWeek);
      this.timelineToMs = endOfWeekMs(nextWeek);
    } else {
      this.timelineFromMs = startOfWeekMs(now);
      this.timelineToMs = endOfWeekMs(now);
    }
    void this.refresh();
  }

  private shiftMonth(delta: number) {
    const d = new Date(this.monthAnchorMs);
    const next = addMonths(d, delta);
    this.monthAnchorMs = startOfMonthMs(next);
  }

  private selectDay(ms: number) {
    this.selectedDateKey = formatDateKey(ms);
    this.rangeAnchorMs = ms;
    this.monthAnchorMs = startOfMonthMs(new Date(ms));

    const d = new Date(ms);
    this.mode = "day";
    this.dayFromMs = startOfDayMs(d);
    this.dayToMs = endOfDayMs(d);
    void this.refresh();
  }

  private clearDayFilter() {
    this.selectedDateKey = null;
    this.rangeAnchorMs = null;
    this.mode = "timeline";
    this.dayFromMs = undefined;
    this.dayToMs = undefined;
    this.mobileExpandedId = null;
    this.mobileShowAll = false;

    const now = new Date();
    this.timelineFromMs = startOfDayMs(addDays(now, -1));
    this.timelineToMs = endOfDayMs(addDays(now, 7));
    void this.refresh();
  }

  private toggleMobileExpanded(id: string) {
    this.mobileExpandedId = this.mobileExpandedId === id ? null : id;
  }

  private async loadMorePast(scrollEl: HTMLElement): Promise<void> {
    if (this.loadingMorePast || this.loading) return;
    if (this.mode !== "timeline") return;
    if (!this.hasMorePast) return;
    if (this.timelineFromMs <= 0) {
      this.hasMorePast = false;
      return;
    }

    // Cooldown to prevent rapid-fire requests / scroll jitter.
    const nowMs = Date.now();
    if (nowMs - this.lastLoadMoreAtMs < 800) return;
    this.lastLoadMoreAtMs = nowMs;

    this.loadingMorePast = true;
    const prevScrollTop = scrollEl.scrollTop;
    const prevScrollHeight = scrollEl.scrollHeight;

    try {
      const chunkDays = 7;
      const overlapMs = 12 * 60 * 60 * 1000;
      const newFromMs = Math.max(0, this.timelineFromMs - chunkDays * 24 * 60 * 60 * 1000);
      if (newFromMs === this.timelineFromMs) {
        this.hasMorePast = false;
        return;
      }
      const fetchToMs = Math.min(this.timelineToMs, this.timelineFromMs + overlapMs);

      const base = this.apiBase.replace(/\/+$/, "");
      const u = new URL(`${base}/widgets/economic-calendar`);
      u.searchParams.set("fromMs", String(newFromMs));
      u.searchParams.set("toMs", String(fetchToMs));
      u.searchParams.set("limit", "500");
      const res = await fetch(u.toString(), { method: "GET" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as any;
      const list: Row[] = Array.isArray(json?.rows) ? (json.rows as Row[]) : [];
      if (list.length === 0 && newFromMs === 0) {
        this.hasMorePast = false;
      }

      const byId = new Map<string, Row>();
      for (const r of this.baseRows ?? []) byId.set(r.id, r);
      for (const r of list) byId.set(r.id, r);

      const merged = Array.from(byId.values()).sort((a, b) => Number(a.startsAt ?? 0) - Number(b.startsAt ?? 0));
      this.baseRows = merged;
      this.timelineFromMs = newFromMs;
      this.applyFilters();

      await this.updateComplete;
      const newScrollHeight = scrollEl.scrollHeight;
      const delta = newScrollHeight - prevScrollHeight;
      // Nudge away from the top threshold to avoid immediately re-triggering.
      scrollEl.scrollTop = prevScrollTop + delta + 48;
    } catch {
      // ignore
    } finally {
      this.loadingMorePast = false;
    }
  }

  private scrollToUpcomingIfNeeded(): void {
    if (this.scrolledToUpcoming) return;
    if (this.mode !== "timeline") return;
    const scrollEl = this.renderRoot.querySelector<HTMLElement>('[data-scroll="timeline"]');
    if (!scrollEl) return;

    const nowMs = Date.now();
    const target = (this.rows ?? []).find((r) => typeof r.startsAt === "number" && r.startsAt >= nowMs);
    if (!target) return;

    const rowEl = scrollEl.querySelector<HTMLElement>(`[data-event-id="${target.id}"]`);
    if (!rowEl) return;
    rowEl.scrollIntoView({ block: "center" });
    this.scrolledToUpcoming = true;
  }

  private scrollToNextUpcoming(): void {
    const scrollEl = this.renderRoot.querySelector<HTMLElement>('[data-scroll="timeline"]');
    if (!scrollEl) return;

    const nowMs = Date.now();
    const target = (this.rows ?? []).find((r) => typeof r.startsAt === "number" && r.startsAt > 0 && r.startsAt >= nowMs);
    if (!target) return;

    const rowEl = scrollEl.querySelector<HTMLElement>(`[data-event-id="${target.id}"]`);
    if (!rowEl) return;
    rowEl.scrollIntoView({ block: "center" });
    this.scrolledToUpcoming = true;
  }

  private renderMiniCalendar() {
    const anchor = new Date(this.monthAnchorMs);
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday

    const days: Array<{ ms: number; label: string; outside: boolean }> = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        ms: d.getTime(),
        label: String(d.getDate()),
        outside: d.getMonth() !== month,
      });
    }

    const selected = this.selectedDateKey;
    const monthLabel = anchor.toLocaleDateString([], { month: "long", year: "numeric" });

    return html`
      <div class="calendar">
        <div class="calHeader">
          <button class="btn" type="button" @click=${() => this.shiftMonth(-1)} aria-label="Previous month">
            ◀
          </button>
          <div class="calTitle">${monthLabel}</div>
          <button class="btn" type="button" @click=${() => this.shiftMonth(1)} aria-label="Next month">
            ▶
          </button>
        </div>
        <div class="calGrid">
          ${["S", "M", "T", "W", "T", "F", "S"].map((d) => html`<div class="calDow">${d}</div>`)}
          ${days.map((d) => {
      const key = formatDateKey(d.ms);
      const cls = [
        "calDay",
        d.outside ? "calDayOutside" : "",
        selected && selected === key ? "calDaySelected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return html`<div class=${cls} @click=${() => this.selectDay(d.ms)}>${d.label}</div>`;
    })}
        </div>
      </div>
    `;
  }

  render() {
    const { fromMs, toMs } = this.resolveRange();
    const rangeLabel = `${new Date(fromMs).toLocaleDateString()} – ${new Date(toMs).toLocaleDateString()}`;
    const newsBase = this.newsBase.replace(/\/+$/, "");
    const nowMs = Date.now();
    const firstUpcomingId =
      (this.rows ?? []).find((r) => typeof r.startsAt === "number" && r.startsAt > 0 && r.startsAt >= nowMs)?.id ??
      null;
    let didInsertSplit = false;

    const todayKey = formatDateKey(Date.now());
    const mobileRowsAll = (this.rows ?? []).filter((r) => {
      if (!r.startsAt) return false;
      return formatDateKey(r.startsAt) === todayKey;
    });
    const mobileLimit = 8;
    const mobileRows = this.mobileShowAll ? mobileRowsAll : mobileRowsAll.slice(0, mobileLimit);

    const availableCurrencies = Array.from(
      new Set(
        (this.baseRows ?? [])
          .map((r) => String(r.currency ?? "").trim().toUpperCase())
          .filter(Boolean),
      ),
    ).sort();

    const grouped: Array<{ dayKey: string; dayLabel: string; rows: Row[] }> = [];
    const by = new Map<string, Row[]>();
    for (const r of this.rows ?? []) {
      const ms = typeof r.startsAt === "number" ? r.startsAt : fromMs;
      const key = formatDateKey(ms);
      if (!by.has(key)) by.set(key, []);
      by.get(key)!.push(r);
    }
    for (const key of Array.from(by.keys()).sort()) {
      const rows = by.get(key) ?? [];
      const ms = rows[0]?.startsAt ?? fromMs;
      grouped.push({ dayKey: key, dayLabel: typeof ms === "number" ? formatDayLabel(ms) : key, rows });
    }

    if (this.isMobile) {
      return html`
        <div class="card">
          <div class="header">
            <div>
              <div class="title">Today: ${new Date().toLocaleDateString()}</div>
              <div class="meta">
                ${this.loading ? "Loading…" : `${mobileRowsAll.length} event${mobileRowsAll.length === 1 ? "" : "s"} today`}
              </div>
            </div>
          </div>

          ${this.loading
          ? html`<div class="loading">Loading economic calendar…</div>`
          : this.error
            ? html`<div class="error">Error: ${this.error}</div>`
            : mobileRowsAll.length === 0
              ? html`<div class="empty">No economic events today.</div>`
              : html`
                    <div style="padding: 8px 10px;">
                      ${mobileRows.map((r) => {
                const href = `${newsBase}/news/${encodeURIComponent(r.id)}`;
                const expanded = this.mobileExpandedId === r.id;
                return html`
                          <div
                            style="
                              border: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 70%, transparent);
                              border-radius: 12px;
                              overflow: hidden;
                              margin-bottom: 8px;
                            "
                          >
                            <button
                              class="btn"
                              style="
                                width: 100%;
                                display: flex;
                                align-items: flex-start;
                                justify-content: space-between;
                                gap: 10px;
                                border: 0;
                                border-radius: 0;
                                padding: 10px 10px;
                                text-align: left;
                                background: var(--tdrlp-bg, #fff);
                              "
                              type="button"
                              @click=${() => this.toggleMobileExpanded(r.id)}
                            >
                              <div style="min-width: 0; flex: 1;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                  <div style="font-size: 11px; color: var(--tdrlp-muted, #475569); white-space: nowrap;">
                                    ${formatTime(r.startsAt)}
                                  </div>
                                  <div style="font-size: 11px; font-weight: 800; white-space: nowrap;">
                                    ${String(r.currency ?? "—").toUpperCase()}
                                  </div>
                                  <span class="badge ${this.impactClass(r.impact)}" style="padding: 1px 6px;">
                                    ${r.impact ?? "—"}
                                  </span>
                                </div>
                                <div style="margin-top: 6px; font-size: 13px; font-weight: 800; line-height: 1.2;">
                                  ${r.title}
                                </div>
                              </div>
                              <div style="font-size: 12px; color: var(--tdrlp-muted, #475569); padding-top: 2px;">
                                ${expanded ? "▲" : "▼"}
                              </div>
                            </button>

                            ${expanded
                    ? html`
                                  <div
                                    style="
                                      padding: 10px 10px;
                                      border-top: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
                                      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-accent, #2563eb));
                                      font-size: 12px;
                                    "
                                  >
                                    ${r.country
                        ? html`<div style="color: var(--tdrlp-muted, #475569); margin-bottom: 8px;">
                                          ${r.country}
                                        </div>`
                        : null}

                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Actual</div>
                                        <div style="font-variant-numeric: tabular-nums;">${r.actual ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Forecast</div>
                                        <div style="font-variant-numeric: tabular-nums;">${r.forecast ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Previous</div>
                                        <div style="font-variant-numeric: tabular-nums;">${r.previous ?? "—"}</div>
                                      </div>
                                    </div>

                                    <div style="margin-top: 10px;">
                                      <a href=${href} target="_blank" rel="noreferrer">Open event</a>
                                    </div>
                                  </div>
                                `
                    : null}
                          </div>
                        `;
              })}

                      ${mobileRowsAll.length > mobileLimit
                  ? html`
                            <button
                              class="btn"
                              style="width: 100%; justify-content: center; margin-top: 4px;"
                              type="button"
                              @click=${() => {
                      this.mobileShowAll = !this.mobileShowAll;
                      this.mobileExpandedId = null;
                    }}
                            >
                              ${this.mobileShowAll
                      ? "Show fewer"
                      : `Show all (${mobileRowsAll.length})`}
                            </button>
                          `
                  : null}
                    </div>
                  `}
        </div>
      `;
    }

    return html`
      <div class="layout">
        <div class="card">
          <div class="header">
            <div class="title">Navigation</div>
          </div>
          <div style="padding: 12px 14px;">
            <div class="btnRow">
              <button class="btn ${this.preset === "today" ? "btnPrimary" : ""}" type="button" @click=${() => this.setPreset("today")}>
                Today
              </button>
              <button class="btn ${this.preset === "thisWeek" ? "btnPrimary" : ""}" type="button" @click=${() => this.setPreset("thisWeek")}>
                This week
              </button>
              <button class="btn ${this.preset === "nextWeek" ? "btnPrimary" : ""}" type="button" @click=${() => this.setPreset("nextWeek")}>
                Next week
              </button>
            </div>
            <div class="card" style="margin-top: 10px;">
              ${this.renderMiniCalendar()}
            </div>
            <button class="btn" style="margin-top: 10px; width: 100%; text-align: left;" type="button" ?disabled=${!this.selectedDateKey} @click=${() => this.clearDayFilter()}>
              Clear day filter
            </button>
          </div>
        </div>

        <div class="card">
          <div class="header">
            <div>
              <div class="title">${this.mode === "day" ? "Day" : "Timeline"}: ${rangeLabel}</div>
              <div class="meta">
                ${this.loading
        ? "Loading…"
        : this.mode === "day"
          ? `${this.rows.length} event${this.rows.length === 1 ? "" : "s"}`
          : `Next upcoming in view · scroll up for history`}
              </div>
            </div>
            <div class="controlsRow">
              ${this.mode === "timeline"
        ? html`
                    <button
                      class="btn"
                      type="button"
                      @click=${() => this.scrollToNextUpcoming()}
                      style="width: 140px; justify-content: center;"
                    >
                      Jump to next
                    </button>
                  `
        : null}
              <input
                class="field"
                style="width: 220px;"
                placeholder="Search events…"
                .value=${this.query ?? ""}
                @input=${(e: any) => {
        this.query = String(e?.target?.value ?? "");
      }}
              />
              <select
                class="field"
                style="width: 110px;"
                .value=${this.currency ?? "ALL"}
                @change=${(e: any) => {
        this.currency = String(e?.target?.value ?? "ALL");
      }}
              >
                <option value="ALL">All</option>
                ${availableCurrencies.map((c) => html`<option value=${c}>${c}</option>`)}
              </select>
              <select
                class="field"
                style="width: 140px;"
                .value=${this.impact ?? "all"}
                @change=${(e: any) => {
        this.impact = String(e?.target?.value ?? "all") as ImpactFilter;
      }}
              >
                <option value="all">All impact</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          ${this.loading
        ? html`<div class="loading">Loading economic calendar…</div>`
        : this.error
          ? html`<div class="error">Error: ${this.error}</div>`
          : grouped.length === 0
            ? html`<div class="empty">No economic events in range.</div>`
            : html`
                    <div
                      data-scroll="timeline"
                      @scroll=${(e: any) => {
                const el = e?.currentTarget as HTMLElement | null;
                if (!el) return;
                if (this.mode !== "timeline") return;
                const nextTop = el.scrollTop;
                const scrollingUp = nextTop < this.lastScrollTop;
                this.lastScrollTop = nextTop;
                if (scrollingUp && nextTop <= 24) void this.loadMorePast(el);
              }}
                      style="width: 100%; overflow: auto; max-height: 70vh;"
                    >
                      ${this.mode === "timeline" && this.loadingMorePast
                ? html`<div class="loadPastBanner">Loading older…</div>`
                : null}
                      <table>
                        <thead>
                          <tr>
                            <th style="width: 120px;">Time</th>
                            <th style="width: 110px;">Currency</th>
                            <th style="width: 120px;">Impact</th>
                            <th>Event</th>
                            <th class="right" style="width: 120px;">Actual</th>
                            <th class="right" style="width: 120px;">Forecast</th>
                            <th class="right" style="width: 120px;">Previous</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${grouped.map(
                  (g) => html`
                              <tr class="dayRow">
                                <td colspan="7" style="padding: 10px 12px;">${g.dayLabel}</td>
                              </tr>
                              ${g.rows.map((r) => {
                    const href = `${newsBase}/news/${encodeURIComponent(r.id)}`;
                    const isPast =
                      typeof r.startsAt === "number" && r.startsAt > 0 && r.startsAt < nowMs;
                    const isUpcoming =
                      typeof r.startsAt === "number" && r.startsAt > 0 && r.startsAt >= nowMs;
                    const isNextUpcoming = Boolean(firstUpcomingId && r.id === firstUpcomingId);
                    const rowClass = isPast
                      ? "rowPast"
                      : isNextUpcoming
                        ? "rowNext"
                        : isUpcoming
                          ? "rowUpcoming"
                          : "";
                    return html`
                                  ${!didInsertSplit && firstUpcomingId && r.id === firstUpcomingId
                        ? (() => {
                          didInsertSplit = true;
                          return html`<tr class="splitRow"><td colspan="7"></td></tr>`;
                        })()
                        : null}
                                  <tr
                                    data-event-id=${r.id}
                                    class=${rowClass}
                                  >
                                    <td style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${formatTime(r.startsAt)}
                                    </td>
                                    <td style="font-size: 12px; font-weight: 700;">
                                      ${String(r.currency ?? "—").toUpperCase()}
                                    </td>
                                    <td>
                                      <span class="badge ${this.impactClass(r.impact)}">
                                        ${r.impact ?? "—"}
                                      </span>
                                    </td>
                                    <td style="min-width: 320px;">
                                      <a href=${href} target="_blank" rel="noreferrer">
                                        <div class="eventTitle">${r.title}</div>
                                      </a>
                                      ${r.country
                        ? html`<div class="eventMeta">${r.country}</div>`
                        : null}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${r.actual ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${r.forecast ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${r.previous ?? "—"}
                                    </td>
                                  </tr>
                                `;
                  })}
                            `,
                )}
                        </tbody>
                      </table>
                    </div>
                  `}
        </div>
      </div>
    `;
  }
}

customElements.define("tdrlp-economic-calendar", TdrLpEconomicCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "tdrlp-economic-calendar": TdrLpEconomicCalendar;
  }
}

