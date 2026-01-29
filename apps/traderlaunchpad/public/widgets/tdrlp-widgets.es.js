/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, rt = q.ShadowRoot && (q.ShadyCSS === void 0 || q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ot = Symbol(), ct = /* @__PURE__ */ new WeakMap();
let wt = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== ot) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (rt && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = ct.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && ct.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ut = (r) => new wt(typeof r == "string" ? r : r + "", void 0, ot), V = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((s, i, o) => s + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[o + 1], r[0]);
  return new wt(e, r, ot);
}, Pt = (r, t) => {
  if (rt) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = q.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, r.appendChild(s);
  }
}, ht = rt ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return Ut(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Tt, defineProperty: Ct, getOwnPropertyDescriptor: Rt, getOwnPropertyNames: Nt, getOwnPropertySymbols: zt, getPrototypeOf: It } = Object, G = globalThis, pt = G.trustedTypes, Lt = pt ? pt.emptyScript : "", Bt = G.reactiveElementPolyfillSupport, R = (r, t) => r, Q = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? Lt : null;
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
} }, At = (r, t) => !Tt(r, t), ut = { attribute: !0, type: String, converter: Q, reflect: !1, useDefault: !1, hasChanged: At };
Symbol.metadata ??= Symbol("metadata"), G.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let k = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ut) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && Ct(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: o } = Rt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: i, set(a) {
      const d = i?.call(this);
      o?.call(this, a), this.requestUpdate(t, d, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ut;
  }
  static _$Ei() {
    if (this.hasOwnProperty(R("elementProperties"))) return;
    const t = It(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(R("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(R("properties"))) {
      const e = this.properties, s = [...Nt(e), ...zt(e)];
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
      for (const i of s) e.unshift(ht(i));
    } else t !== void 0 && e.push(ht(t));
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
    return Pt(t, this.constructor.elementStyles), t;
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
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : Q).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const o = s.getPropertyOptions(i), a = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : Q;
      this._$Em = i;
      const d = a.fromAttribute(e, o.type);
      this[i] = d ?? this._$Ej?.get(i) ?? d, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, o) {
    if (t !== void 0) {
      const a = this.constructor;
      if (i === !1 && (o = this[t]), s ??= a.getPropertyOptions(t), !((s.hasChanged ?? At)(o, e) || s.useDefault && s.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: i, wrapped: o }, a) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        const { wrapped: a } = o, d = this[i];
        a !== !0 || this._$AL.has(i) || d === void 0 || this.C(i, void 0, o, d);
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
k.elementStyles = [], k.shadowRootOptions = { mode: "open" }, k[R("elementProperties")] = /* @__PURE__ */ new Map(), k[R("finalized")] = /* @__PURE__ */ new Map(), Bt?.({ ReactiveElement: k }), (G.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const at = globalThis, ft = (r) => r, O = at.trustedTypes, mt = O ? O.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, Mt = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, _t = "?" + x, Ht = `<${_t}>`, S = document, N = () => S.createComment(""), z = (r) => r === null || typeof r != "object" && typeof r != "function", nt = Array.isArray, qt = (r) => nt(r) || typeof r?.[Symbol.iterator] == "function", X = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, gt = /-->/g, vt = />/g, A = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), bt = /'/g, yt = /"/g, St = /^(?:script|style|textarea|title)$/i, Ot = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), l = Ot(1), E = Symbol.for("lit-noChange"), m = Symbol.for("lit-nothing"), $t = /* @__PURE__ */ new WeakMap(), _ = S.createTreeWalker(S, 129);
function kt(r, t) {
  if (!nt(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return mt !== void 0 ? mt.createHTML(t) : t;
}
const Ft = (r, t) => {
  const e = r.length - 1, s = [];
  let i, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = U;
  for (let d = 0; d < e; d++) {
    const n = r[d];
    let c, p, u = -1, b = 0;
    for (; b < n.length && (a.lastIndex = b, p = a.exec(n), p !== null); ) b = a.lastIndex, a === U ? p[1] === "!--" ? a = gt : p[1] !== void 0 ? a = vt : p[2] !== void 0 ? (St.test(p[2]) && (i = RegExp("</" + p[2], "g")), a = A) : p[3] !== void 0 && (a = A) : a === A ? p[0] === ">" ? (a = i ?? U, u = -1) : p[1] === void 0 ? u = -2 : (u = a.lastIndex - p[2].length, c = p[1], a = p[3] === void 0 ? A : p[3] === '"' ? yt : bt) : a === yt || a === bt ? a = A : a === gt || a === vt ? a = U : (a = A, i = void 0);
    const v = a === A && r[d + 1].startsWith("/>") ? " " : "";
    o += a === U ? n + Ht : u >= 0 ? (s.push(c), n.slice(0, u) + Mt + n.slice(u) + x + v) : n + x + (u === -2 ? d : v);
  }
  return [kt(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class I {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let o = 0, a = 0;
    const d = t.length - 1, n = this.parts, [c, p] = Ft(t, e);
    if (this.el = I.createElement(c, s), _.currentNode = this.el.content, e === 2 || e === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = _.nextNode()) !== null && n.length < d; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Mt)) {
          const b = p[a++], v = i.getAttribute(u).split(x), y = /([.?@])?(.*)/.exec(b);
          n.push({ type: 1, index: o, name: y[2], strings: v, ctor: y[1] === "." ? jt : y[1] === "?" ? Wt : y[1] === "@" ? Vt : J }), i.removeAttribute(u);
        } else u.startsWith(x) && (n.push({ type: 6, index: o }), i.removeAttribute(u));
        if (St.test(i.tagName)) {
          const u = i.textContent.split(x), b = u.length - 1;
          if (b > 0) {
            i.textContent = O ? O.emptyScript : "";
            for (let v = 0; v < b; v++) i.append(u[v], N()), _.nextNode(), n.push({ type: 2, index: ++o });
            i.append(u[b], N());
          }
        }
      } else if (i.nodeType === 8) if (i.data === _t) n.push({ type: 2, index: o });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(x, u + 1)) !== -1; ) n.push({ type: 7, index: o }), u += x.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = S.createElement("template");
    return s.innerHTML = t, s;
  }
}
function D(r, t, e = r, s) {
  if (t === E) return t;
  let i = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const o = z(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== o && (i?._$AO?.(!1), o === void 0 ? i = void 0 : (i = new o(r), i._$AT(r, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = i : e._$Cl = i), i !== void 0 && (t = D(r, i._$AS(r, t.values), i, s)), t;
}
class Kt {
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
    const { el: { content: e }, parts: s } = this._$AD, i = (t?.creationScope ?? S).importNode(e, !0);
    _.currentNode = i;
    let o = _.nextNode(), a = 0, d = 0, n = s[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let c;
        n.type === 2 ? c = new L(o, o.nextSibling, this, t) : n.type === 1 ? c = new n.ctor(o, n.name, n.strings, this, t) : n.type === 6 && (c = new Gt(o, this, t)), this._$AV.push(c), n = s[++d];
      }
      a !== n?.index && (o = _.nextNode(), a++);
    }
    return _.currentNode = S, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class L {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, s, i) {
    this.type = 2, this._$AH = m, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
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
    t = D(this, t, e), z(t) ? t === m || t == null || t === "" ? (this._$AH !== m && this._$AR(), this._$AH = m) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : qt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== m && z(this._$AH) ? this._$AA.nextSibling.data = t : this.T(S.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = I.createElement(kt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const o = new Kt(i, this), a = o.u(this.options);
      o.p(e), this.T(a), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = $t.get(t.strings);
    return e === void 0 && $t.set(t.strings, e = new I(t)), e;
  }
  k(t) {
    nt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const o of t) i === e.length ? e.push(s = new L(this.O(N()), this.O(N()), this, this.options)) : s = e[i], s._$AI(o), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = ft(t).nextSibling;
      ft(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class J {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, o) {
    this.type = 1, this._$AH = m, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = m;
  }
  _$AI(t, e = this, s, i) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = D(this, t, e, 0), a = !z(t) || t !== this._$AH && t !== E, a && (this._$AH = t);
    else {
      const d = t;
      let n, c;
      for (t = o[0], n = 0; n < o.length - 1; n++) c = D(this, d[s + n], e, n), c === E && (c = this._$AH[n]), a ||= !z(c) || c !== this._$AH[n], c === m ? t = m : t !== m && (t += (c ?? "") + o[n + 1]), this._$AH[n] = c;
    }
    a && !i && this.j(t);
  }
  j(t) {
    t === m ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class jt extends J {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === m ? void 0 : t;
  }
}
class Wt extends J {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== m);
  }
}
class Vt extends J {
  constructor(t, e, s, i, o) {
    super(t, e, s, i, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = D(this, t, e, 0) ?? m) === E) return;
    const s = this._$AH, i = t === m && s !== m || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== m && (s === m || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Gt {
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
const Jt = at.litHtmlPolyfillSupport;
Jt?.(I, L), (at.litHtmlVersions ??= []).push("3.3.2");
const Zt = (r, t, e) => {
  const s = e?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = e?.renderBefore ?? null;
    s._$litPart$ = i = new L(t.insertBefore(N(), o), o, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt = globalThis;
class w extends k {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Zt(e, this.renderRoot, this.renderOptions);
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
w._$litElement$ = !0, w.finalized = !0, lt.litElementHydrateSupport?.({ LitElement: w });
const Xt = lt.litElementPolyfillSupport;
Xt?.({ LitElement: w });
(lt.litElementVersions ??= []).push("4.2.2");
const Yt = (r, t, e) => Math.max(t, Math.min(e, Math.floor(r))), P = (r) => {
  const t = new Date(r);
  return t.setHours(0, 0, 0, 0), t.getTime();
}, T = (r) => {
  const t = new Date(r);
  return t.setHours(23, 59, 59, 999), t.getTime();
}, B = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() - e), t.setHours(0, 0, 0, 0), t.getTime();
}, H = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() + (6 - e)), t.setHours(23, 59, 59, 999), t.getTime();
}, xt = (r) => !r || !Number.isFinite(r) ? "—" : new Date(r).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), C = (r, t) => {
  const e = new Date(r);
  return e.setDate(e.getDate() + t), e;
}, M = (r) => {
  const t = new Date(r), e = t.getFullYear(), s = String(t.getMonth() + 1).padStart(2, "0"), i = String(t.getDate()).padStart(2, "0");
  return `${e}-${s}-${i}`;
}, Qt = (r) => new Date(r).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }), te = (r) => {
  const t = String(r ?? "").trim().toLowerCase();
  return t ? t.includes("high") ? "high" : t.includes("med") ? "medium" : t.includes("low") ? "low" : "unknown" : "unknown";
}, Y = (r) => {
  const t = new Date(r);
  return t.setDate(1), t.setHours(0, 0, 0, 0), t.getTime();
}, ee = (r, t) => {
  const e = new Date(r);
  return e.setMonth(e.getMonth() + t), e;
}, F = class F extends w {
  constructor() {
    super(), this.lastScrollTop = 0, this.lastLoadMoreAtMs = 0, this.hasMorePast = !0, this.apiBase = "https://different-trout-684.convex.site", this.newsBase = "https://traderlaunchpad.com", this.preset = "thisWeek", this.limit = 200, this.currency = "ALL", this.currencies = "", this.impact = "all", this.query = "", this.baseRows = [], this.rows = [], this.loading = !0, this.error = null, this.selectedDateKey = null, this.monthAnchorMs = Y(/* @__PURE__ */ new Date()), this.rangeAnchorMs = null, this.isMobile = !1, this.mobileExpandedId = null, this.mobileShowAll = !1;
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
      return i.setDate(i.getDate() + 7), { fromMs: B(i), toMs: H(i) };
    }
    return { fromMs: B(s), toMs: H(s) };
  }
  impactClass(t) {
    const e = String(t ?? "").toLowerCase();
    return e.includes("high") ? "impact-high" : e.includes("med") ? "impact-medium" : e.includes("low") ? "impact-low" : "";
  }
  applyFilters() {
    const t = typeof this.currencies == "string" && this.currencies.trim() ? this.currencies.trim() : "", e = t ? t.split(",").map((n) => n.trim().toUpperCase()).filter(Boolean) : [], s = e.length > 0 ? new Set(e) : null, i = typeof this.currency == "string" && this.currency.trim() ? this.currency.trim().toUpperCase() : "", o = typeof this.query == "string" ? this.query.trim().toLowerCase() : "", a = this.impact ?? "all", d = this.selectedDateKey;
    this.rows = (this.baseRows ?? []).filter((n) => {
      const c = String(n.currency ?? "").toUpperCase();
      if (s) {
        if (!s.has(c)) return !1;
      } else if (i && i !== "ALL" && c !== i)
        return !1;
      return a !== "all" && te(n.impact) !== a || o && !`${n.title ?? ""}`.toLowerCase().includes(o) ? !1 : d && n.startsAt ? M(n.startsAt) === d : !0;
    }).sort((n, c) => Number(n.startsAt ?? 0) - Number(c.startsAt ?? 0));
  }
  async refresh() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = Yt(Number(this.limit ?? 200), 1, 500);
    this.loading = !0, this.error = null;
    try {
      const i = this.apiBase.replace(/\/+$/, ""), o = new URL(`${i}/widgets/economic-calendar`);
      o.searchParams.set("fromMs", String(t)), o.searchParams.set("toMs", String(e)), o.searchParams.set("limit", String(s));
      const a = await fetch(o.toString(), { method: "GET" });
      if (!a.ok) throw new Error(`Request failed (${a.status})`);
      const d = await a.json(), n = Array.isArray(d?.rows) ? d.rows : [];
      this.baseRows = n.sort((c, p) => Number(c.startsAt ?? 0) - Number(p.startsAt ?? 0)), this.applyFilters(), this.hasMorePast = this.timelineFromMs > 0, this.mode === "timeline" && (this.scrolledToUpcoming = !1, await this.updateComplete, this.scrollToUpcomingIfNeeded());
    } catch (i) {
      this.error = i instanceof Error ? i.message : "Failed to load", this.baseRows = [], this.rows = [];
    } finally {
      this.loading = !1;
    }
  }
  setPreset(t) {
    if (this.preset = t, t === "today") {
      const s = /* @__PURE__ */ new Date();
      this.mode = "day", this.dayFromMs = P(s), this.dayToMs = T(s), this.selectedDateKey = M(s.getTime()), this.rangeAnchorMs = s.getTime(), this.refresh();
      return;
    }
    const e = /* @__PURE__ */ new Date();
    if (this.mode = "timeline", this.dayFromMs = void 0, this.dayToMs = void 0, this.selectedDateKey = null, this.rangeAnchorMs = null, t === "nextWeek") {
      const s = C(e, 7);
      this.timelineFromMs = B(s), this.timelineToMs = H(s);
    } else
      this.timelineFromMs = B(e), this.timelineToMs = H(e);
    this.refresh();
  }
  shiftMonth(t) {
    const e = new Date(this.monthAnchorMs), s = ee(e, t);
    this.monthAnchorMs = Y(s);
  }
  selectDay(t) {
    this.selectedDateKey = M(t), this.rangeAnchorMs = t, this.monthAnchorMs = Y(new Date(t));
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
      const d = Math.max(0, this.timelineFromMs - 6048e5);
      if (d === this.timelineFromMs) {
        this.hasMorePast = !1;
        return;
      }
      const n = Math.min(this.timelineToMs, this.timelineFromMs + 432e5), c = this.apiBase.replace(/\/+$/, ""), p = new URL(`${c}/widgets/economic-calendar`);
      p.searchParams.set("fromMs", String(d)), p.searchParams.set("toMs", String(n)), p.searchParams.set("limit", "500");
      const u = await fetch(p.toString(), { method: "GET" });
      if (!u.ok) throw new Error(`Request failed (${u.status})`);
      const b = await u.json(), v = Array.isArray(b?.rows) ? b.rows : [];
      v.length === 0 && d === 0 && (this.hasMorePast = !1);
      const y = /* @__PURE__ */ new Map();
      for (const $ of this.baseRows ?? []) y.set($.id, $);
      for (const $ of v) y.set($.id, $);
      const h = Array.from(y.values()).sort(($, Z) => Number($.startsAt ?? 0) - Number(Z.startsAt ?? 0));
      this.baseRows = h, this.timelineFromMs = d, this.applyFilters(), await this.updateComplete;
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
    const a = [];
    for (let c = 0; c < 42; c += 1) {
      const p = new Date(o);
      p.setDate(o.getDate() + c), a.push({
        ms: p.getTime(),
        label: String(p.getDate()),
        outside: p.getMonth() !== s
      });
    }
    const d = this.selectedDateKey, n = t.toLocaleDateString([], { month: "long", year: "numeric" });
    return l`
      <div class="calendar">
        <div class="calHeader">
          <button class="btn" type="button" @click=${() => this.shiftMonth(-1)} aria-label="Previous month">
            ◀
          </button>
          <div class="calTitle">${n}</div>
          <button class="btn" type="button" @click=${() => this.shiftMonth(1)} aria-label="Next month">
            ▶
          </button>
        </div>
        <div class="calGrid">
          ${["S", "M", "T", "W", "T", "F", "S"].map((c) => l`<div class="calDow">${c}</div>`)}
          ${a.map((c) => {
      const p = M(c.ms), u = [
        "calDay",
        c.outside ? "calDayOutside" : "",
        d && d === p ? "calDaySelected" : ""
      ].filter(Boolean).join(" ");
      return l`<div class=${u} @click=${() => this.selectDay(c.ms)}>${c.label}</div>`;
    })}
        </div>
      </div>
    `;
  }
  render() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = `${new Date(t).toLocaleDateString()} – ${new Date(e).toLocaleDateString()}`, i = this.newsBase.replace(/\/+$/, ""), o = Date.now(), a = (this.rows ?? []).find((h) => typeof h.startsAt == "number" && h.startsAt > 0 && h.startsAt >= o)?.id ?? null;
    let d = !1;
    const n = M(Date.now()), c = (this.rows ?? []).filter((h) => h.startsAt ? M(h.startsAt) === n : !1), p = 8, u = this.mobileShowAll ? c : c.slice(0, p), b = Array.from(
      new Set(
        (this.baseRows ?? []).map((h) => String(h.currency ?? "").trim().toUpperCase()).filter(Boolean)
      )
    ).sort(), v = [], y = /* @__PURE__ */ new Map();
    for (const h of this.rows ?? []) {
      const f = typeof h.startsAt == "number" ? h.startsAt : t, g = M(f);
      y.has(g) || y.set(g, []), y.get(g).push(h);
    }
    for (const h of Array.from(y.keys()).sort()) {
      const f = y.get(h) ?? [], g = f[0]?.startsAt ?? t;
      v.push({ dayKey: h, dayLabel: typeof g == "number" ? Qt(g) : h, rows: f });
    }
    return this.isMobile ? l`
        <div class="card">
          <div class="header">
            <div>
              <div class="title">Today: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}</div>
              <div class="meta">
                ${this.loading ? "Loading…" : `${c.length} event${c.length === 1 ? "" : "s"} today`}
              </div>
            </div>
          </div>

          ${this.loading ? l`<div class="loading">Loading economic calendar…</div>` : this.error ? l`<div class="error">Error: ${this.error}</div>` : c.length === 0 ? l`<div class="empty">No economic events today.</div>` : l`
                    <div style="padding: 8px 10px;">
                      ${u.map((h) => {
      const f = `${i}/news/${encodeURIComponent(h.id)}`, g = this.mobileExpandedId === h.id;
      return l`
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
                              @click=${() => this.toggleMobileExpanded(h.id)}
                            >
                              <div style="min-width: 0; flex: 1;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                  <div style="font-size: 11px; color: var(--tdrlp-muted, #475569); white-space: nowrap;">
                                    ${xt(h.startsAt)}
                                  </div>
                                  <div style="font-size: 11px; font-weight: 800; white-space: nowrap;">
                                    ${String(h.currency ?? "—").toUpperCase()}
                                  </div>
                                  <span class="badge ${this.impactClass(h.impact)}" style="padding: 1px 6px;">
                                    ${h.impact ?? "—"}
                                  </span>
                                </div>
                                <div style="margin-top: 6px; font-size: 13px; font-weight: 800; line-height: 1.2;">
                                  ${h.title}
                                </div>
                              </div>
                              <div style="font-size: 12px; color: var(--tdrlp-muted, #475569); padding-top: 2px;">
                                ${g ? "▲" : "▼"}
                              </div>
                            </button>

                            ${g ? l`
                                  <div
                                    style="
                                      padding: 10px 10px;
                                      border-top: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
                                      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-accent, #2563eb));
                                      font-size: 12px;
                                    "
                                  >
                                    ${h.country ? l`<div style="color: var(--tdrlp-muted, #475569); margin-bottom: 8px;">
                                          ${h.country}
                                        </div>` : null}

                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Actual</div>
                                        <div style="font-variant-numeric: tabular-nums;">${h.actual ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Forecast</div>
                                        <div style="font-variant-numeric: tabular-nums;">${h.forecast ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Previous</div>
                                        <div style="font-variant-numeric: tabular-nums;">${h.previous ?? "—"}</div>
                                      </div>
                                    </div>

                                    <div style="margin-top: 10px;">
                                      <a href=${f} target="_blank" rel="noreferrer">Open event</a>
                                    </div>
                                  </div>
                                ` : null}
                          </div>
                        `;
    })}

                      ${c.length > p ? l`
                            <button
                              class="btn"
                              style="width: 100%; justify-content: center; margin-top: 4px;"
                              type="button"
                              @click=${() => {
      this.mobileShowAll = !this.mobileShowAll, this.mobileExpandedId = null;
    }}
                            >
                              ${this.mobileShowAll ? "Show fewer" : `Show all (${c.length})`}
                            </button>
                          ` : null}
                    </div>
                  `}
        </div>
      ` : l`
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
              ${this.mode === "timeline" ? l`
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
                @input=${(h) => {
      this.query = String(h?.target?.value ?? "");
    }}
              />
              <select
                class="field"
                style="width: 110px;"
                .value=${this.currency ?? "ALL"}
                @change=${(h) => {
      this.currency = String(h?.target?.value ?? "ALL");
    }}
              >
                <option value="ALL">All</option>
                ${b.map((h) => l`<option value=${h}>${h}</option>`)}
              </select>
              <select
                class="field"
                style="width: 140px;"
                .value=${this.impact ?? "all"}
                @change=${(h) => {
      this.impact = String(h?.target?.value ?? "all");
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

          ${this.loading ? l`<div class="loading">Loading economic calendar…</div>` : this.error ? l`<div class="error">Error: ${this.error}</div>` : v.length === 0 ? l`<div class="empty">No economic events in range.</div>` : l`
                    <div
                      data-scroll="timeline"
                      @scroll=${(h) => {
      const f = h?.currentTarget;
      if (!f || this.mode !== "timeline") return;
      const g = f.scrollTop, $ = g < this.lastScrollTop;
      this.lastScrollTop = g, $ && g <= 24 && this.loadMorePast(f);
    }}
                      style="width: 100%; overflow: auto; max-height: 70vh;"
                    >
                      ${this.mode === "timeline" && this.loadingMorePast ? l`<div class="loadPastBanner">Loading older…</div>` : null}
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
                          ${v.map(
      (h) => l`
                              <tr class="dayRow">
                                <td colspan="7" style="padding: 10px 12px;">${h.dayLabel}</td>
                              </tr>
                              ${h.rows.map((f) => {
        const g = `${i}/news/${encodeURIComponent(f.id)}`, $ = typeof f.startsAt == "number" && f.startsAt > 0 && f.startsAt < o, Z = typeof f.startsAt == "number" && f.startsAt > 0 && f.startsAt >= o, Et = !!(a && f.id === a), Dt = $ ? "rowPast" : Et ? "rowNext" : Z ? "rowUpcoming" : "";
        return l`
                                  ${!d && a && f.id === a ? (d = !0, l`<tr class="splitRow"><td colspan="7"></td></tr>`) : null}
                                  <tr
                                    data-event-id=${f.id}
                                    class=${Dt}
                                  >
                                    <td style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${xt(f.startsAt)}
                                    </td>
                                    <td style="font-size: 12px; font-weight: 700;">
                                      ${String(f.currency ?? "—").toUpperCase()}
                                    </td>
                                    <td>
                                      <span class="badge ${this.impactClass(f.impact)}">
                                        ${f.impact ?? "—"}
                                      </span>
                                    </td>
                                    <td style="min-width: 320px;">
                                      <a href=${g} target="_blank" rel="noreferrer">
                                        <div class="eventTitle">${f.title}</div>
                                      </a>
                                      ${f.country ? l`<div class="eventMeta">${f.country}</div>` : null}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${f.actual ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${f.forecast ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${f.previous ?? "—"}
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
F.properties = {
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
}, F.styles = V`
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
let tt = F;
customElements.define("tdrlp-economic-calendar", tt);
const dt = async (r) => {
  const t = String(r.apiBase ?? "").trim().replace(/\/+$/, "").replace(/\/api$/, ""), e = String(r.path ?? ""), s = String(r.installationId ?? "").trim(), i = String(r.apiKey ?? "").trim();
  if (!t) return { ok: !1, error: "Missing apiBase" };
  if (!e.startsWith("/")) return { ok: !1, error: "Invalid path" };
  if (!s) return { ok: !1, error: "Missing installationId" };
  if (!i) return { ok: !1, error: "Missing apiKey" };
  const o = new URL(`${t}${e}`), a = r.query ?? {};
  for (const [p, u] of Object.entries(a))
    u != null && o.searchParams.set(p, String(u));
  const d = await fetch(o.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-TDRLP-Widget-Id": s,
      "X-TDRLP-Widget-Key": i
    }
  });
  if (!d.ok)
    return { ok: !1, error: await d.text().catch(() => "") || `Request failed (${d.status})` };
  const n = await d.json().catch(() => null);
  return !n || typeof n != "object" ? { ok: !1, error: "Invalid response" } : !n.ok ? { ok: !1, error: typeof n.error == "string" ? n.error : "Request failed" } : { ok: !0, data: n };
}, K = class K extends w {
  constructor() {
    super(...arguments), this.apiBase = "https://different-trout-684.convex.site", this.installationId = "", this.apiKey = "", this.loading = !0, this.error = null, this.payload = null;
  }
  async firstUpdated() {
    await this.refresh();
  }
  updated(t) {
    (t.has("apiBase") || t.has("installationId") || t.has("apiKey")) && this.refresh();
  }
  async refresh() {
    this.loading = !0, this.error = null, this.requestUpdate();
    const t = await dt({
      apiBase: this.apiBase,
      path: "/widgets/auth/profile-card",
      installationId: this.installationId,
      apiKey: this.apiKey
    });
    if (!t.ok) {
      this.payload = null, this.error = t.error, this.loading = !1, this.requestUpdate();
      return;
    }
    const e = t.data, s = e && typeof e == "object" ? e.data : null;
    this.payload = s && typeof s == "object" ? s : null, this.loading = !1, this.requestUpdate();
  }
  render() {
    if (this.loading)
      return l`<div class="card"><div class="state">Loading…</div></div>`;
    if (this.error)
      return l`<div class="card"><div class="state">Error: ${this.error}</div></div>`;
    if (!this.payload)
      return l`<div class="card"><div class="state">No data.</div></div>`;
    const t = this.payload, e = t.name || t.publicUsername || "Trader", s = t.publicUsername ? `@${t.publicUsername}` : null, i = t.headline, o = (d) => `${Math.round((Number.isFinite(d) ? d : 0) * 100)}%`, a = (d) => `${Math.round(Number.isFinite(d) ? d : 0)}`;
    return l`
      <div class="card">
        <div class="header">
          <div class="avatar">${t.image ? l`<img src=${t.image} alt=${e} />` : l``}</div>
          <div>
            <div class="title">${e}</div>
            <div class="sub">${s ?? "TraderLaunchpad"}</div>
          </div>
        </div>

        <div class="grid">
          <div class="metric">
            <div class="k">Win rate</div>
            <div class="v">${o(i.winRate)}</div>
          </div>
          <div class="metric">
            <div class="k">Closed trades</div>
            <div class="v">${a(i.closedTrades)}</div>
          </div>
          <div class="metric">
            <div class="k">Open trades</div>
            <div class="v">${a(i.openTrades)}</div>
          </div>
          <div class="metric">
            <div class="k">Sample size</div>
            <div class="v">${a(i.sampleSize)}</div>
          </div>
        </div>
      </div>
    `;
  }
};
K.properties = {
  apiBase: { type: String, attribute: "api-base" },
  installationId: { type: String, attribute: "installation-id" },
  apiKey: { type: String, attribute: "api-key" }
}, K.styles = V`
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
let et = K;
customElements.get("tdrlp-profile-card") || customElements.define("tdrlp-profile-card", et);
const se = (r) => new Date(r).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), j = class j extends w {
  constructor() {
    super(...arguments), this.apiBase = "https://different-trout-684.convex.site", this.installationId = "", this.apiKey = "", this.limit = 20, this.loading = !0, this.error = null, this.trades = [];
  }
  async firstUpdated() {
    await this.refresh();
  }
  updated(t) {
    (t.has("apiBase") || t.has("installationId") || t.has("apiKey") || t.has("limit")) && this.refresh();
  }
  async refresh() {
    this.loading = !0, this.error = null, this.requestUpdate();
    const t = await dt({
      apiBase: this.apiBase,
      path: "/widgets/auth/my-trades",
      installationId: this.installationId,
      apiKey: this.apiKey,
      query: { limit: this.limit }
    });
    if (!t.ok) {
      this.trades = [], this.error = t.error, this.loading = !1, this.requestUpdate();
      return;
    }
    const e = t.data?.trades;
    this.trades = Array.isArray(e) ? e : [], this.loading = !1, this.requestUpdate();
  }
  render() {
    return this.loading ? l`<div class="card"><div class="state">Loading…</div></div>` : this.error ? l`<div class="card"><div class="state">Error: ${this.error}</div></div>` : l`
      <div class="card">
        <div class="head">Recent trades</div>
        ${this.trades.length === 0 ? l`<div class="state">No trades found.</div>` : l`
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
      (t) => l`
                      <tr>
                        <td>${se(t.closedAt)}</td>
                        <td>${t.symbol}</td>
                        <td><span class="pill">${t.direction}</span></td>
                        <td><span class="pill">${t.reviewStatus}</span></td>
                      </tr>
                    `
    )}
                </tbody>
              </table>
            `}
      </div>
    `;
  }
};
j.properties = {
  apiBase: { type: String, attribute: "api-base" },
  installationId: { type: String, attribute: "installation-id" },
  apiKey: { type: String, attribute: "api-key" },
  limit: { type: Number }
}, j.styles = V`
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
let st = j;
customElements.get("tdrlp-my-trades") || customElements.define("tdrlp-my-trades", st);
const W = class W extends w {
  constructor() {
    super(...arguments), this.apiBase = "https://different-trout-684.convex.site", this.installationId = "", this.apiKey = "", this.limit = 50, this.loading = !0, this.error = null, this.positions = [];
  }
  async firstUpdated() {
    await this.refresh();
  }
  updated(t) {
    (t.has("apiBase") || t.has("installationId") || t.has("apiKey") || t.has("limit")) && this.refresh();
  }
  async refresh() {
    this.loading = !0, this.error = null, this.requestUpdate();
    const t = await dt({
      apiBase: this.apiBase,
      path: "/widgets/auth/open-positions",
      installationId: this.installationId,
      apiKey: this.apiKey,
      query: { limit: this.limit }
    });
    if (!t.ok) {
      this.positions = [], this.error = t.error, this.loading = !1, this.requestUpdate();
      return;
    }
    const e = t.data?.positions;
    this.positions = Array.isArray(e) ? e : [], this.loading = !1, this.requestUpdate();
  }
  render() {
    return this.loading ? l`<div class="card"><div class="state">Loading…</div></div>` : this.error ? l`<div class="card"><div class="state">Error: ${this.error}</div></div>` : l`
      <div class="card">
        <div class="head">Open positions</div>
        ${this.positions.length === 0 ? l`<div class="state">No open positions.</div>` : l`
              ${this.positions.map((t) => {
      const e = t.symbol ?? "—", s = t.side ?? "—", i = typeof t.qty == "number" ? t.qty : null, o = typeof t.avgPrice == "number" ? t.avgPrice : null;
      return l`
                  <div class="row">
                    <div>
                      <div class="sym">${e}</div>
                      <div class="meta">
                        ${i !== null ? l`Qty ${i}` : l``}
                        ${i !== null && o !== null ? l` · ` : l``}
                        ${o !== null ? l`Avg ${o}` : l``}
                      </div>
                    </div>
                    <div><span class="pill">${s}</span></div>
                  </div>
                `;
    })}
            `}
      </div>
    `;
  }
};
W.properties = {
  apiBase: { type: String, attribute: "api-base" },
  installationId: { type: String, attribute: "installation-id" },
  apiKey: { type: String, attribute: "api-key" },
  limit: { type: Number }
}, W.styles = V`
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
let it = W;
customElements.get("tdrlp-open-positions") || customElements.define("tdrlp-open-positions", it);
