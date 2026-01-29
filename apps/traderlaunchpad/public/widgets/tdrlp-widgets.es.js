/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis, Y = I.ShadowRoot && (I.ShadyCSS === void 0 || I.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Q = Symbol(), st = /* @__PURE__ */ new WeakMap();
let mt = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== Q) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Y && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = st.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && st.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const xt = (r) => new mt(typeof r == "string" ? r : r + "", void 0, Q), At = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((s, i, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[o + 1], r[0]);
  return new mt(e, r, Q);
}, Mt = (r, t) => {
  if (Y) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = I.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, r.appendChild(s);
  }
}, it = Y ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return xt(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: _t, defineProperty: St, getOwnPropertyDescriptor: Et, getOwnPropertyNames: Dt, getOwnPropertySymbols: kt, getPrototypeOf: Pt } = Object, j = globalThis, rt = j.trustedTypes, Tt = rt ? rt.emptyScript : "", Ct = j.reactiveElementPolyfillSupport, U = (r, t) => r, J = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? Tt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, t) {
  let e = r;
  switch (t) {
    case Boolean:
      e = r !== null;
      break;
    case Number:
      e = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(r);
      } catch {
        e = null;
      }
  }
  return e;
} }, ft = (r, t) => !_t(r, t), ot = { attribute: !0, type: String, converter: J, reflect: !1, useDefault: !1, hasChanged: ft };
Symbol.metadata ??= Symbol("metadata"), j.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let S = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ot) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && St(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: o } = Et(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: i, set(n) {
      const c = i?.call(this);
      o?.call(this, n), this.requestUpdate(t, c, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ot;
  }
  static _$Ei() {
    if (this.hasOwnProperty(U("elementProperties"))) return;
    const t = Pt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(U("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(U("properties"))) {
      const e = this.properties, s = [...Dt(e), ...kt(e)];
      for (const i of s) this.createProperty(i, e[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, i] of e) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const i = this._$Eu(e, s);
      i !== void 0 && this._$Eh.set(i, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const i of s) e.unshift(it(i));
    } else t !== void 0 && e.push(it(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Mt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    const s = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, s);
    if (i !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : J).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const o = s.getPropertyOptions(i), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : J;
      this._$Em = i;
      const c = n.fromAttribute(e, o.type);
      this[i] = c ?? this._$Ej?.get(i) ?? c, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (i === !1 && (o = this[t]), s ??= n.getPropertyOptions(t), !((s.hasChanged ?? ft)(o, e) || s.useDefault && s.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: i, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [i, o] of this._$Ep) this[i] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, o] of s) {
        const { wrapped: n } = o, c = this[i];
        n !== !0 || this._$AL.has(i) || c === void 0 || this.C(i, void 0, o, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
S.elementStyles = [], S.shadowRootOptions = { mode: "open" }, S[U("elementProperties")] = /* @__PURE__ */ new Map(), S[U("finalized")] = /* @__PURE__ */ new Map(), Ct?.({ ReactiveElement: S }), (j.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis, nt = (r) => r, B = X.trustedTypes, at = B ? B.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, gt = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, bt = "?" + w, Ut = `<${bt}>`, _ = document, N = () => _.createComment(""), L = (r) => r === null || typeof r != "object" && typeof r != "function", tt = Array.isArray, Rt = (r) => tt(r) || typeof r?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, lt = /-->/g, dt = />/g, x = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ct = /'/g, ht = /"/g, yt = /^(?:script|style|textarea|title)$/i, Nt = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), m = Nt(1), E = Symbol.for("lit-noChange"), f = Symbol.for("lit-nothing"), pt = /* @__PURE__ */ new WeakMap(), M = _.createTreeWalker(_, 129);
function vt(r, t) {
  if (!tt(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return at !== void 0 ? at.createHTML(t) : t;
}
const Lt = (r, t) => {
  const e = r.length - 1, s = [];
  let i, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = k;
  for (let c = 0; c < e; c++) {
    const a = r[c];
    let l, h, p = -1, y = 0;
    for (; y < a.length && (n.lastIndex = y, h = n.exec(a), h !== null); ) y = n.lastIndex, n === k ? h[1] === "!--" ? n = lt : h[1] !== void 0 ? n = dt : h[2] !== void 0 ? (yt.test(h[2]) && (i = RegExp("</" + h[2], "g")), n = x) : h[3] !== void 0 && (n = x) : n === x ? h[0] === ">" ? (n = i ?? k, p = -1) : h[1] === void 0 ? p = -2 : (p = n.lastIndex - h[2].length, l = h[1], n = h[3] === void 0 ? x : h[3] === '"' ? ht : ct) : n === ht || n === ct ? n = x : n === lt || n === dt ? n = k : (n = x, i = void 0);
    const b = n === x && r[c + 1].startsWith("/>") ? " " : "";
    o += n === k ? a + Ut : p >= 0 ? (s.push(l), a.slice(0, p) + gt + a.slice(p) + w + b) : a + w + (p === -2 ? c : b);
  }
  return [vt(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class H {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let o = 0, n = 0;
    const c = t.length - 1, a = this.parts, [l, h] = Lt(t, e);
    if (this.el = H.createElement(l, s), M.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (i = M.nextNode()) !== null && a.length < c; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const p of i.getAttributeNames()) if (p.endsWith(gt)) {
          const y = h[n++], b = i.getAttribute(p).split(w), v = /([.?@])?(.*)/.exec(y);
          a.push({ type: 1, index: o, name: v[2], strings: b, ctor: v[1] === "." ? zt : v[1] === "?" ? Ot : v[1] === "@" ? Ft : W }), i.removeAttribute(p);
        } else p.startsWith(w) && (a.push({ type: 6, index: o }), i.removeAttribute(p));
        if (yt.test(i.tagName)) {
          const p = i.textContent.split(w), y = p.length - 1;
          if (y > 0) {
            i.textContent = B ? B.emptyScript : "";
            for (let b = 0; b < y; b++) i.append(p[b], N()), M.nextNode(), a.push({ type: 2, index: ++o });
            i.append(p[y], N());
          }
        }
      } else if (i.nodeType === 8) if (i.data === bt) a.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = i.data.indexOf(w, p + 1)) !== -1; ) a.push({ type: 7, index: o }), p += w.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = _.createElement("template");
    return s.innerHTML = t, s;
  }
}
function D(r, t, e = r, s) {
  if (t === E) return t;
  let i = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const o = L(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== o && (i?._$AO?.(!1), o === void 0 ? i = void 0 : (i = new o(r), i._$AT(r, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = i : e._$Cl = i), i !== void 0 && (t = D(r, i._$AS(r, t.values), i, s)), t;
}
class Ht {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, i = (t?.creationScope ?? _).importNode(e, !0);
    M.currentNode = i;
    let o = M.nextNode(), n = 0, c = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let l;
        a.type === 2 ? l = new z(o, o.nextSibling, this, t) : a.type === 1 ? l = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (l = new It(o, this, t)), this._$AV.push(l), a = s[++c];
      }
      n !== a?.index && (o = M.nextNode(), n++);
    }
    return M.currentNode = _, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class z {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, s, i) {
    this.type = 2, this._$AH = f, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = D(this, t, e), L(t) ? t === f || t == null || t === "" ? (this._$AH !== f && this._$AR(), this._$AH = f) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Rt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== f && L(this._$AH) ? this._$AA.nextSibling.data = t : this.T(_.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = H.createElement(vt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const o = new Ht(i, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = pt.get(t.strings);
    return e === void 0 && pt.set(t.strings, e = new H(t)), e;
  }
  k(t) {
    tt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const o of t) i === e.length ? e.push(s = new z(this.O(N()), this.O(N()), this, this.options)) : s = e[i], s._$AI(o), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = nt(t).nextSibling;
      nt(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class W {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, o) {
    this.type = 1, this._$AH = f, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = f;
  }
  _$AI(t, e = this, s, i) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = D(this, t, e, 0), n = !L(t) || t !== this._$AH && t !== E, n && (this._$AH = t);
    else {
      const c = t;
      let a, l;
      for (t = o[0], a = 0; a < o.length - 1; a++) l = D(this, c[s + a], e, a), l === E && (l = this._$AH[a]), n ||= !L(l) || l !== this._$AH[a], l === f ? t = f : t !== f && (t += (l ?? "") + o[a + 1]), this._$AH[a] = l;
    }
    n && !i && this.j(t);
  }
  j(t) {
    t === f ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class zt extends W {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === f ? void 0 : t;
  }
}
class Ot extends W {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== f);
  }
}
class Ft extends W {
  constructor(t, e, s, i, o) {
    super(t, e, s, i, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = D(this, t, e, 0) ?? f) === E) return;
    const s = this._$AH, i = t === f && s !== f || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== f && (s === f || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class It {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    D(this, t);
  }
}
const Bt = X.litHtmlPolyfillSupport;
Bt?.(H, z), (X.litHtmlVersions ??= []).push("3.3.2");
const qt = (r, t, e) => {
  const s = e?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = e?.renderBefore ?? null;
    s._$litPart$ = i = new z(t.insertBefore(N(), o), o, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const et = globalThis;
class R extends S {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = qt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return E;
  }
}
R._$litElement$ = !0, R.finalized = !0, et.litElementHydrateSupport?.({ LitElement: R });
const jt = et.litElementPolyfillSupport;
jt?.({ LitElement: R });
(et.litElementVersions ??= []).push("4.2.2");
const Wt = (r, t, e) => Math.max(t, Math.min(e, Math.floor(r))), P = (r) => {
  const t = new Date(r);
  return t.setHours(0, 0, 0, 0), t.getTime();
}, T = (r) => {
  const t = new Date(r);
  return t.setHours(23, 59, 59, 999), t.getTime();
}, O = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() - e), t.setHours(0, 0, 0, 0), t.getTime();
}, F = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() + (6 - e)), t.setHours(23, 59, 59, 999), t.getTime();
}, ut = (r) => !r || !Number.isFinite(r) ? "—" : new Date(r).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), C = (r, t) => {
  const e = new Date(r);
  return e.setDate(e.getDate() + t), e;
}, A = (r) => {
  const t = new Date(r), e = t.getFullYear(), s = String(t.getMonth() + 1).padStart(2, "0"), i = String(t.getDate()).padStart(2, "0");
  return `${e}-${s}-${i}`;
}, Kt = (r) => new Date(r).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }), Vt = (r) => {
  const t = String(r ?? "").trim().toLowerCase();
  return t ? t.includes("high") ? "high" : t.includes("med") ? "medium" : t.includes("low") ? "low" : "unknown" : "unknown";
}, G = (r) => {
  const t = new Date(r);
  return t.setDate(1), t.setHours(0, 0, 0, 0), t.getTime();
}, Gt = (r, t) => {
  const e = new Date(r);
  return e.setMonth(e.getMonth() + t), e;
}, q = class q extends R {
  constructor() {
    super(), this.lastScrollTop = 0, this.lastLoadMoreAtMs = 0, this.hasMorePast = !0, this.apiBase = "https://different-trout-684.convex.site", this.newsBase = "https://traderlaunchpad.com", this.preset = "thisWeek", this.limit = 200, this.currency = "ALL", this.currencies = "", this.impact = "all", this.query = "", this.baseRows = [], this.rows = [], this.loading = !0, this.error = null, this.selectedDateKey = null, this.monthAnchorMs = G(/* @__PURE__ */ new Date()), this.rangeAnchorMs = null, this.isMobile = !1, this.mobileExpandedId = null, this.mobileShowAll = !1;
    const t = /* @__PURE__ */ new Date();
    this.mode = "timeline", this.timelineFromMs = P(C(t, -1)), this.timelineToMs = T(C(t, 7)), this.dayFromMs = void 0, this.dayToMs = void 0, this.loadingMorePast = !1, this.scrolledToUpcoming = !1, this.lastScrollTop = 0, this.lastLoadMoreAtMs = 0, this.hasMorePast = !0;
  }
  connectedCallback() {
    super.connectedCallback(), !(typeof window > "u" || typeof window.matchMedia != "function") && (this.mq = window.matchMedia("(max-width: 640px)"), this.isMobile = !!this.mq.matches, this.handleMqChange = (t) => {
      this.isMobile = !!t.matches, this.isMobile && (this.mobileExpandedId = null, this.mobileShowAll = !1);
    }, this.mq.addEventListener("change", this.handleMqChange));
  }
  disconnectedCallback() {
    this.mq && this.handleMqChange && this.mq.removeEventListener("change", this.handleMqChange), super.disconnectedCallback();
  }
  firstUpdated() {
    this.refresh();
  }
  updated(t) {
    if (t.has("apiBase") || t.has("preset") || t.has("fromMs") || t.has("toMs") || t.has("limit")) {
      this.refresh();
      return;
    }
    (t.has("currency") || t.has("currencies") || t.has("impact") || t.has("query") || t.has("selectedDateKey") || t.has("rangeAnchorMs")) && this.applyFilters();
  }
  resolveRange() {
    const t = typeof this.fromMs == "number" && Number.isFinite(this.fromMs) ? this.fromMs : null, e = typeof this.toMs == "number" && Number.isFinite(this.toMs) ? this.toMs : null;
    if (t !== null && e !== null)
      return { fromMs: Math.max(0, Math.floor(t)), toMs: Math.max(0, Math.floor(e)) };
    if (this.mode === "day" && typeof this.dayFromMs == "number" && typeof this.dayToMs == "number")
      return { fromMs: this.dayFromMs, toMs: this.dayToMs };
    if (this.mode === "timeline")
      return { fromMs: this.timelineFromMs, toMs: this.timelineToMs };
    const s = typeof this.rangeAnchorMs == "number" && Number.isFinite(this.rangeAnchorMs) ? new Date(this.rangeAnchorMs) : /* @__PURE__ */ new Date();
    if (this.preset === "today")
      return { fromMs: P(s), toMs: T(s) };
    if (this.preset === "nextWeek") {
      const i = new Date(s);
      return i.setDate(i.getDate() + 7), { fromMs: O(i), toMs: F(i) };
    }
    return { fromMs: O(s), toMs: F(s) };
  }
  impactClass(t) {
    const e = String(t ?? "").toLowerCase();
    return e.includes("high") ? "impact-high" : e.includes("med") ? "impact-medium" : e.includes("low") ? "impact-low" : "";
  }
  applyFilters() {
    const t = typeof this.currencies == "string" && this.currencies.trim() ? this.currencies.trim() : "", e = t ? t.split(",").map((a) => a.trim().toUpperCase()).filter(Boolean) : [], s = e.length > 0 ? new Set(e) : null, i = typeof this.currency == "string" && this.currency.trim() ? this.currency.trim().toUpperCase() : "", o = typeof this.query == "string" ? this.query.trim().toLowerCase() : "", n = this.impact ?? "all", c = this.selectedDateKey;
    this.rows = (this.baseRows ?? []).filter((a) => {
      const l = String(a.currency ?? "").toUpperCase();
      if (s) {
        if (!s.has(l)) return !1;
      } else if (i && i !== "ALL" && l !== i)
        return !1;
      return n !== "all" && Vt(a.impact) !== n || o && !`${a.title ?? ""}`.toLowerCase().includes(o) ? !1 : c && a.startsAt ? A(a.startsAt) === c : !0;
    }).sort((a, l) => Number(a.startsAt ?? 0) - Number(l.startsAt ?? 0));
  }
  async refresh() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = Wt(Number(this.limit ?? 200), 1, 500);
    this.loading = !0, this.error = null;
    try {
      const i = this.apiBase.replace(/\/+$/, ""), o = new URL(`${i}/widgets/economic-calendar`);
      o.searchParams.set("fromMs", String(t)), o.searchParams.set("toMs", String(e)), o.searchParams.set("limit", String(s));
      const n = await fetch(o.toString(), { method: "GET" });
      if (!n.ok) throw new Error(`Request failed (${n.status})`);
      const c = await n.json(), a = Array.isArray(c?.rows) ? c.rows : [];
      this.baseRows = a.sort((l, h) => Number(l.startsAt ?? 0) - Number(h.startsAt ?? 0)), this.applyFilters(), this.hasMorePast = this.timelineFromMs > 0, this.mode === "timeline" && (this.scrolledToUpcoming = !1, await this.updateComplete, this.scrollToUpcomingIfNeeded());
    } catch (i) {
      this.error = i instanceof Error ? i.message : "Failed to load", this.baseRows = [], this.rows = [];
    } finally {
      this.loading = !1;
    }
  }
  setPreset(t) {
    if (this.preset = t, t === "today") {
      const s = /* @__PURE__ */ new Date();
      this.mode = "day", this.dayFromMs = P(s), this.dayToMs = T(s), this.selectedDateKey = A(s.getTime()), this.rangeAnchorMs = s.getTime(), this.refresh();
      return;
    }
    const e = /* @__PURE__ */ new Date();
    if (this.mode = "timeline", this.dayFromMs = void 0, this.dayToMs = void 0, this.selectedDateKey = null, this.rangeAnchorMs = null, t === "nextWeek") {
      const s = C(e, 7);
      this.timelineFromMs = O(s), this.timelineToMs = F(s);
    } else
      this.timelineFromMs = O(e), this.timelineToMs = F(e);
    this.refresh();
  }
  shiftMonth(t) {
    const e = new Date(this.monthAnchorMs), s = Gt(e, t);
    this.monthAnchorMs = G(s);
  }
  selectDay(t) {
    this.selectedDateKey = A(t), this.rangeAnchorMs = t, this.monthAnchorMs = G(new Date(t));
    const e = new Date(t);
    this.mode = "day", this.dayFromMs = P(e), this.dayToMs = T(e), this.refresh();
  }
  clearDayFilter() {
    this.selectedDateKey = null, this.rangeAnchorMs = null, this.mode = "timeline", this.dayFromMs = void 0, this.dayToMs = void 0, this.mobileExpandedId = null, this.mobileShowAll = !1;
    const t = /* @__PURE__ */ new Date();
    this.timelineFromMs = P(C(t, -1)), this.timelineToMs = T(C(t, 7)), this.refresh();
  }
  toggleMobileExpanded(t) {
    this.mobileExpandedId = this.mobileExpandedId === t ? null : t;
  }
  async loadMorePast(t) {
    if (this.loadingMorePast || this.loading || this.mode !== "timeline" || !this.hasMorePast) return;
    if (this.timelineFromMs <= 0) {
      this.hasMorePast = !1;
      return;
    }
    const e = Date.now();
    if (e - this.lastLoadMoreAtMs < 800) return;
    this.lastLoadMoreAtMs = e, this.loadingMorePast = !0;
    const s = t.scrollTop, i = t.scrollHeight;
    try {
      const c = Math.max(0, this.timelineFromMs - 6048e5);
      if (c === this.timelineFromMs) {
        this.hasMorePast = !1;
        return;
      }
      const a = Math.min(this.timelineToMs, this.timelineFromMs + 432e5), l = this.apiBase.replace(/\/+$/, ""), h = new URL(`${l}/widgets/economic-calendar`);
      h.searchParams.set("fromMs", String(c)), h.searchParams.set("toMs", String(a)), h.searchParams.set("limit", "500");
      const p = await fetch(h.toString(), { method: "GET" });
      if (!p.ok) throw new Error(`Request failed (${p.status})`);
      const y = await p.json(), b = Array.isArray(y?.rows) ? y.rows : [];
      b.length === 0 && c === 0 && (this.hasMorePast = !1);
      const v = /* @__PURE__ */ new Map();
      for (const $ of this.baseRows ?? []) v.set($.id, $);
      for (const $ of b) v.set($.id, $);
      const d = Array.from(v.values()).sort(($, K) => Number($.startsAt ?? 0) - Number(K.startsAt ?? 0));
      this.baseRows = d, this.timelineFromMs = c, this.applyFilters(), await this.updateComplete;
      const g = t.scrollHeight - i;
      t.scrollTop = s + g + 48;
    } catch {
    } finally {
      this.loadingMorePast = !1;
    }
  }
  scrollToUpcomingIfNeeded() {
    if (this.scrolledToUpcoming || this.mode !== "timeline") return;
    const t = this.renderRoot.querySelector('[data-scroll="timeline"]');
    if (!t) return;
    const e = Date.now(), s = (this.rows ?? []).find((o) => typeof o.startsAt == "number" && o.startsAt >= e);
    if (!s) return;
    const i = t.querySelector(`[data-event-id="${s.id}"]`);
    i && (i.scrollIntoView({ block: "center" }), this.scrolledToUpcoming = !0);
  }
  scrollToNextUpcoming() {
    const t = this.renderRoot.querySelector('[data-scroll="timeline"]');
    if (!t) return;
    const e = Date.now(), s = (this.rows ?? []).find((o) => typeof o.startsAt == "number" && o.startsAt > 0 && o.startsAt >= e);
    if (!s) return;
    const i = t.querySelector(`[data-event-id="${s.id}"]`);
    i && (i.scrollIntoView({ block: "center" }), this.scrolledToUpcoming = !0);
  }
  renderMiniCalendar() {
    const t = new Date(this.monthAnchorMs), e = t.getFullYear(), s = t.getMonth(), i = new Date(e, s, 1), o = new Date(i);
    o.setDate(i.getDate() - i.getDay());
    const n = [];
    for (let l = 0; l < 42; l += 1) {
      const h = new Date(o);
      h.setDate(o.getDate() + l), n.push({
        ms: h.getTime(),
        label: String(h.getDate()),
        outside: h.getMonth() !== s
      });
    }
    const c = this.selectedDateKey, a = t.toLocaleDateString([], { month: "long", year: "numeric" });
    return m`
      <div class="calendar">
        <div class="calHeader">
          <button class="btn" type="button" @click=${() => this.shiftMonth(-1)} aria-label="Previous month">
            ◀
          </button>
          <div class="calTitle">${a}</div>
          <button class="btn" type="button" @click=${() => this.shiftMonth(1)} aria-label="Next month">
            ▶
          </button>
        </div>
        <div class="calGrid">
          ${["S", "M", "T", "W", "T", "F", "S"].map((l) => m`<div class="calDow">${l}</div>`)}
          ${n.map((l) => {
      const h = A(l.ms), p = [
        "calDay",
        l.outside ? "calDayOutside" : "",
        c && c === h ? "calDaySelected" : ""
      ].filter(Boolean).join(" ");
      return m`<div class=${p} @click=${() => this.selectDay(l.ms)}>${l.label}</div>`;
    })}
        </div>
      </div>
    `;
  }
  render() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = `${new Date(t).toLocaleDateString()} – ${new Date(e).toLocaleDateString()}`, i = this.newsBase.replace(/\/+$/, ""), o = Date.now(), n = (this.rows ?? []).find((d) => typeof d.startsAt == "number" && d.startsAt > 0 && d.startsAt >= o)?.id ?? null;
    let c = !1;
    const a = A(Date.now()), l = (this.rows ?? []).filter((d) => d.startsAt ? A(d.startsAt) === a : !1), h = 8, p = this.mobileShowAll ? l : l.slice(0, h), y = Array.from(
      new Set(
        (this.baseRows ?? []).map((d) => String(d.currency ?? "").trim().toUpperCase()).filter(Boolean)
      )
    ).sort(), b = [], v = /* @__PURE__ */ new Map();
    for (const d of this.rows ?? []) {
      const u = typeof d.startsAt == "number" ? d.startsAt : t, g = A(u);
      v.has(g) || v.set(g, []), v.get(g).push(d);
    }
    for (const d of Array.from(v.keys()).sort()) {
      const u = v.get(d) ?? [], g = u[0]?.startsAt ?? t;
      b.push({ dayKey: d, dayLabel: typeof g == "number" ? Kt(g) : d, rows: u });
    }
    return this.isMobile ? m`
        <div class="card">
          <div class="header">
            <div>
              <div class="title">Today: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}</div>
              <div class="meta">
                ${this.loading ? "Loading…" : `${l.length} event${l.length === 1 ? "" : "s"} today`}
              </div>
            </div>
          </div>

          ${this.loading ? m`<div class="loading">Loading economic calendar…</div>` : this.error ? m`<div class="error">Error: ${this.error}</div>` : l.length === 0 ? m`<div class="empty">No economic events today.</div>` : m`
                    <div style="padding: 8px 10px;">
                      ${p.map((d) => {
      const u = `${i}/news/${encodeURIComponent(d.id)}`, g = this.mobileExpandedId === d.id;
      return m`
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
                              @click=${() => this.toggleMobileExpanded(d.id)}
                            >
                              <div style="min-width: 0; flex: 1;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                  <div style="font-size: 11px; color: var(--tdrlp-muted, #475569); white-space: nowrap;">
                                    ${ut(d.startsAt)}
                                  </div>
                                  <div style="font-size: 11px; font-weight: 800; white-space: nowrap;">
                                    ${String(d.currency ?? "—").toUpperCase()}
                                  </div>
                                  <span class="badge ${this.impactClass(d.impact)}" style="padding: 1px 6px;">
                                    ${d.impact ?? "—"}
                                  </span>
                                </div>
                                <div style="margin-top: 6px; font-size: 13px; font-weight: 800; line-height: 1.2;">
                                  ${d.title}
                                </div>
                              </div>
                              <div style="font-size: 12px; color: var(--tdrlp-muted, #475569); padding-top: 2px;">
                                ${g ? "▲" : "▼"}
                              </div>
                            </button>

                            ${g ? m`
                                  <div
                                    style="
                                      padding: 10px 10px;
                                      border-top: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
                                      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-accent, #2563eb));
                                      font-size: 12px;
                                    "
                                  >
                                    ${d.country ? m`<div style="color: var(--tdrlp-muted, #475569); margin-bottom: 8px;">
                                          ${d.country}
                                        </div>` : null}

                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Actual</div>
                                        <div style="font-variant-numeric: tabular-nums;">${d.actual ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Forecast</div>
                                        <div style="font-variant-numeric: tabular-nums;">${d.forecast ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Previous</div>
                                        <div style="font-variant-numeric: tabular-nums;">${d.previous ?? "—"}</div>
                                      </div>
                                    </div>

                                    <div style="margin-top: 10px;">
                                      <a href=${u} target="_blank" rel="noreferrer">Open event</a>
                                    </div>
                                  </div>
                                ` : null}
                          </div>
                        `;
    })}

                      ${l.length > h ? m`
                            <button
                              class="btn"
                              style="width: 100%; justify-content: center; margin-top: 4px;"
                              type="button"
                              @click=${() => {
      this.mobileShowAll = !this.mobileShowAll, this.mobileExpandedId = null;
    }}
                            >
                              ${this.mobileShowAll ? "Show fewer" : `Show all (${l.length})`}
                            </button>
                          ` : null}
                    </div>
                  `}
        </div>
      ` : m`
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
              <div class="title">${this.mode === "day" ? "Day" : "Timeline"}: ${s}</div>
              <div class="meta">
                ${this.loading ? "Loading…" : this.mode === "day" ? `${this.rows.length} event${this.rows.length === 1 ? "" : "s"}` : "Next upcoming in view · scroll up for history"}
              </div>
            </div>
            <div class="controlsRow">
              ${this.mode === "timeline" ? m`
                    <button
                      class="btn"
                      type="button"
                      @click=${() => this.scrollToNextUpcoming()}
                      style="width: 140px; justify-content: center;"
                    >
                      Jump to next
                    </button>
                  ` : null}
              <input
                class="field"
                style="width: 220px;"
                placeholder="Search events…"
                .value=${this.query ?? ""}
                @input=${(d) => {
      this.query = String(d?.target?.value ?? "");
    }}
              />
              <select
                class="field"
                style="width: 110px;"
                .value=${this.currency ?? "ALL"}
                @change=${(d) => {
      this.currency = String(d?.target?.value ?? "ALL");
    }}
              >
                <option value="ALL">All</option>
                ${y.map((d) => m`<option value=${d}>${d}</option>`)}
              </select>
              <select
                class="field"
                style="width: 140px;"
                .value=${this.impact ?? "all"}
                @change=${(d) => {
      this.impact = String(d?.target?.value ?? "all");
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

          ${this.loading ? m`<div class="loading">Loading economic calendar…</div>` : this.error ? m`<div class="error">Error: ${this.error}</div>` : b.length === 0 ? m`<div class="empty">No economic events in range.</div>` : m`
                    <div
                      data-scroll="timeline"
                      @scroll=${(d) => {
      const u = d?.currentTarget;
      if (!u || this.mode !== "timeline") return;
      const g = u.scrollTop, $ = g < this.lastScrollTop;
      this.lastScrollTop = g, $ && g <= 24 && this.loadMorePast(u);
    }}
                      style="width: 100%; overflow: auto; max-height: 70vh;"
                    >
                      ${this.mode === "timeline" && this.loadingMorePast ? m`<div class="loadPastBanner">Loading older…</div>` : null}
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
                          ${b.map(
      (d) => m`
                              <tr class="dayRow">
                                <td colspan="7" style="padding: 10px 12px;">${d.dayLabel}</td>
                              </tr>
                              ${d.rows.map((u) => {
        const g = `${i}/news/${encodeURIComponent(u.id)}`, $ = typeof u.startsAt == "number" && u.startsAt > 0 && u.startsAt < o, K = typeof u.startsAt == "number" && u.startsAt > 0 && u.startsAt >= o, $t = !!(n && u.id === n), wt = $ ? "rowPast" : $t ? "rowNext" : K ? "rowUpcoming" : "";
        return m`
                                  ${!c && n && u.id === n ? (c = !0, m`<tr class="splitRow"><td colspan="7"></td></tr>`) : null}
                                  <tr
                                    data-event-id=${u.id}
                                    class=${wt}
                                  >
                                    <td style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${ut(u.startsAt)}
                                    </td>
                                    <td style="font-size: 12px; font-weight: 700;">
                                      ${String(u.currency ?? "—").toUpperCase()}
                                    </td>
                                    <td>
                                      <span class="badge ${this.impactClass(u.impact)}">
                                        ${u.impact ?? "—"}
                                      </span>
                                    </td>
                                    <td style="min-width: 320px;">
                                      <a href=${g} target="_blank" rel="noreferrer">
                                        <div class="eventTitle">${u.title}</div>
                                      </a>
                                      ${u.country ? m`<div class="eventMeta">${u.country}</div>` : null}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${u.actual ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${u.forecast ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${u.previous ?? "—"}
                                    </td>
                                  </tr>
                                `;
      })}
                            `
    )}
                        </tbody>
                      </table>
                    </div>
                  `}
        </div>
      </div>
    `;
  }
};
q.properties = {
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
  baseRows: { state: !0 },
  rows: { state: !0 },
  loading: { state: !0 },
  error: { state: !0 },
  selectedDateKey: { state: !0 },
  monthAnchorMs: { state: !0 },
  rangeAnchorMs: { state: !0 },
  isMobile: { state: !0 },
  mobileExpandedId: { state: !0 },
  mobileShowAll: { state: !0 },
  mode: { state: !0 },
  timelineFromMs: { state: !0 },
  timelineToMs: { state: !0 },
  dayFromMs: { state: !0 },
  dayToMs: { state: !0 },
  loadingMorePast: { state: !0 },
  scrolledToUpcoming: { state: !0 }
}, q.styles = At`
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
let Z = q;
customElements.define("tdrlp-economic-calendar", Z);
