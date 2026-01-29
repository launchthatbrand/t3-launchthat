/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const z = globalThis, Z = z.ShadowRoot && (z.ShadyCSS === void 0 || z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, J = Symbol(), tt = /* @__PURE__ */ new WeakMap();
let pt = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== J) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Z && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = tt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && tt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const $t = (r) => new pt(typeof r == "string" ? r : r + "", void 0, J), wt = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((s, i, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[o + 1], r[0]);
  return new pt(e, r, J);
}, xt = (r, t) => {
  if (Z) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = z.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, r.appendChild(s);
  }
}, et = Z ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return $t(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: At, defineProperty: Mt, getOwnPropertyDescriptor: _t, getOwnPropertyNames: St, getOwnPropertySymbols: Dt, getPrototypeOf: Et } = Object, q = globalThis, st = q.trustedTypes, Pt = st ? st.emptyScript : "", Tt = q.reactiveElementPolyfillSupport, C = (r, t) => r, V = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? Pt : null;
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
} }, ut = (r, t) => !At(r, t), it = { attribute: !0, type: String, converter: V, reflect: !1, useDefault: !1, hasChanged: ut };
Symbol.metadata ??= Symbol("metadata"), q.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = it) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && Mt(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: o } = _t(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: i, set(n) {
      const h = i?.call(this);
      o?.call(this, n), this.requestUpdate(t, h, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const t = Et(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const e = this.properties, s = [...St(e), ...Dt(e)];
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
      for (const i of s) e.unshift(et(i));
    } else t !== void 0 && e.push(et(t));
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
    return xt(t, this.constructor.elementStyles), t;
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
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : V).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const o = s.getPropertyOptions(i), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : V;
      this._$Em = i;
      const h = n.fromAttribute(e, o.type);
      this[i] = h ?? this._$Ej?.get(i) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (i === !1 && (o = this[t]), s ??= n.getPropertyOptions(t), !((s.hasChanged ?? ut)(o, e) || s.useDefault && s.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, s)))) return;
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
        const { wrapped: n } = o, h = this[i];
        n !== !0 || this._$AL.has(i) || h === void 0 || this.C(i, void 0, o, h);
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[C("elementProperties")] = /* @__PURE__ */ new Map(), A[C("finalized")] = /* @__PURE__ */ new Map(), Tt?.({ ReactiveElement: A }), (q.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Y = globalThis, rt = (r) => r, F = Y.trustedTypes, ot = F ? F.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, mt = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, ft = "?" + y, Ct = `<${ft}>`, x = document, U = () => x.createComment(""), R = (r) => r === null || typeof r != "object" && typeof r != "function", Q = Array.isArray, kt = (r) => Q(r) || typeof r?.[Symbol.iterator] == "function", W = `[ 	
\f\r]`, D = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, at = />/g, b = RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), lt = /'/g, dt = /"/g, gt = /^(?:script|style|textarea|title)$/i, Ut = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), f = Ut(1), M = Symbol.for("lit-noChange"), g = Symbol.for("lit-nothing"), ct = /* @__PURE__ */ new WeakMap(), w = x.createTreeWalker(x, 129);
function yt(r, t) {
  if (!Q(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ot !== void 0 ? ot.createHTML(t) : t;
}
const Rt = (r, t) => {
  const e = r.length - 1, s = [];
  let i, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = D;
  for (let h = 0; h < e; h++) {
    const l = r[h];
    let d, u, p = -1, a = 0;
    for (; a < l.length && (n.lastIndex = a, u = n.exec(l), u !== null); ) a = n.lastIndex, n === D ? u[1] === "!--" ? n = nt : u[1] !== void 0 ? n = at : u[2] !== void 0 ? (gt.test(u[2]) && (i = RegExp("</" + u[2], "g")), n = b) : u[3] !== void 0 && (n = b) : n === b ? u[0] === ">" ? (n = i ?? D, p = -1) : u[1] === void 0 ? p = -2 : (p = n.lastIndex - u[2].length, d = u[1], n = u[3] === void 0 ? b : u[3] === '"' ? dt : lt) : n === dt || n === lt ? n = b : n === nt || n === at ? n = D : (n = b, i = void 0);
    const c = n === b && r[h + 1].startsWith("/>") ? " " : "";
    o += n === D ? l + Ct : p >= 0 ? (s.push(d), l.slice(0, p) + mt + l.slice(p) + y + c) : l + y + (p === -2 ? h : c);
  }
  return [yt(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class N {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let o = 0, n = 0;
    const h = t.length - 1, l = this.parts, [d, u] = Rt(t, e);
    if (this.el = N.createElement(d, s), w.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (i = w.nextNode()) !== null && l.length < h; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const p of i.getAttributeNames()) if (p.endsWith(mt)) {
          const a = u[n++], c = i.getAttribute(p).split(y), m = /([.?@])?(.*)/.exec(a);
          l.push({ type: 1, index: o, name: m[2], strings: c, ctor: m[1] === "." ? Lt : m[1] === "?" ? Ht : m[1] === "@" ? Ot : B }), i.removeAttribute(p);
        } else p.startsWith(y) && (l.push({ type: 6, index: o }), i.removeAttribute(p));
        if (gt.test(i.tagName)) {
          const p = i.textContent.split(y), a = p.length - 1;
          if (a > 0) {
            i.textContent = F ? F.emptyScript : "";
            for (let c = 0; c < a; c++) i.append(p[c], U()), w.nextNode(), l.push({ type: 2, index: ++o });
            i.append(p[a], U());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ft) l.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = i.data.indexOf(y, p + 1)) !== -1; ) l.push({ type: 7, index: o }), p += y.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = x.createElement("template");
    return s.innerHTML = t, s;
  }
}
function _(r, t, e = r, s) {
  if (t === M) return t;
  let i = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const o = R(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== o && (i?._$AO?.(!1), o === void 0 ? i = void 0 : (i = new o(r), i._$AT(r, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = i : e._$Cl = i), i !== void 0 && (t = _(r, i._$AS(r, t.values), i, s)), t;
}
class Nt {
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
    const { el: { content: e }, parts: s } = this._$AD, i = (t?.creationScope ?? x).importNode(e, !0);
    w.currentNode = i;
    let o = w.nextNode(), n = 0, h = 0, l = s[0];
    for (; l !== void 0; ) {
      if (n === l.index) {
        let d;
        l.type === 2 ? d = new L(o, o.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (d = new zt(o, this, t)), this._$AV.push(d), l = s[++h];
      }
      n !== l?.index && (o = w.nextNode(), n++);
    }
    return w.currentNode = x, i;
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
    this.type = 2, this._$AH = g, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
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
    t = _(this, t, e), R(t) ? t === g || t == null || t === "" ? (this._$AH !== g && this._$AR(), this._$AH = g) : t !== this._$AH && t !== M && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : kt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== g && R(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = N.createElement(yt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const o = new Nt(i, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = ct.get(t.strings);
    return e === void 0 && ct.set(t.strings, e = new N(t)), e;
  }
  k(t) {
    Q(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const o of t) i === e.length ? e.push(s = new L(this.O(U()), this.O(U()), this, this.options)) : s = e[i], s._$AI(o), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = rt(t).nextSibling;
      rt(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class B {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, o) {
    this.type = 1, this._$AH = g, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = g;
  }
  _$AI(t, e = this, s, i) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = _(this, t, e, 0), n = !R(t) || t !== this._$AH && t !== M, n && (this._$AH = t);
    else {
      const h = t;
      let l, d;
      for (t = o[0], l = 0; l < o.length - 1; l++) d = _(this, h[s + l], e, l), d === M && (d = this._$AH[l]), n ||= !R(d) || d !== this._$AH[l], d === g ? t = g : t !== g && (t += (d ?? "") + o[l + 1]), this._$AH[l] = d;
    }
    n && !i && this.j(t);
  }
  j(t) {
    t === g ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Lt extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === g ? void 0 : t;
  }
}
class Ht extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== g);
  }
}
class Ot extends B {
  constructor(t, e, s, i, o) {
    super(t, e, s, i, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = _(this, t, e, 0) ?? g) === M) return;
    const s = this._$AH, i = t === g && s !== g || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== g && (s === g || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class zt {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    _(this, t);
  }
}
const Ft = Y.litHtmlPolyfillSupport;
Ft?.(N, L), (Y.litHtmlVersions ??= []).push("3.3.2");
const It = (r, t, e) => {
  const s = e?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = e?.renderBefore ?? null;
    s._$litPart$ = i = new L(t.insertBefore(U(), o), o, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis;
class k extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = It(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return M;
  }
}
k._$litElement$ = !0, k.finalized = !0, X.litElementHydrateSupport?.({ LitElement: k });
const qt = X.litElementPolyfillSupport;
qt?.({ LitElement: k });
(X.litElementVersions ??= []).push("4.2.2");
const Bt = (r, t, e) => Math.max(t, Math.min(e, Math.floor(r))), E = (r) => {
  const t = new Date(r);
  return t.setHours(0, 0, 0, 0), t.getTime();
}, P = (r) => {
  const t = new Date(r);
  return t.setHours(23, 59, 59, 999), t.getTime();
}, H = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() - e), t.setHours(0, 0, 0, 0), t.getTime();
}, O = (r) => {
  const t = new Date(r), e = t.getDay();
  return t.setDate(t.getDate() + (6 - e)), t.setHours(23, 59, 59, 999), t.getTime();
}, ht = (r) => !r || !Number.isFinite(r) ? "—" : new Date(r).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), T = (r, t) => {
  const e = new Date(r);
  return e.setDate(e.getDate() + t), e;
}, $ = (r) => {
  const t = new Date(r), e = t.getFullYear(), s = String(t.getMonth() + 1).padStart(2, "0"), i = String(t.getDate()).padStart(2, "0");
  return `${e}-${s}-${i}`;
}, jt = (r) => new Date(r).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }), Wt = (r) => {
  const t = String(r ?? "").trim().toLowerCase();
  return t ? t.includes("high") ? "high" : t.includes("med") ? "medium" : t.includes("low") ? "low" : "unknown" : "unknown";
}, K = (r) => {
  const t = new Date(r);
  return t.setDate(1), t.setHours(0, 0, 0, 0), t.getTime();
}, Kt = (r, t) => {
  const e = new Date(r);
  return e.setMonth(e.getMonth() + t), e;
}, I = class I extends k {
  constructor() {
    super(), this.lastScrollTop = 0, this.lastLoadMoreAtMs = 0, this.hasMorePast = !0, this.apiBase = "https://different-trout-684.convex.site", this.newsBase = "https://traderlaunchpad.com", this.preset = "thisWeek", this.limit = 200, this.currency = "ALL", this.currencies = "", this.impact = "all", this.query = "", this.baseRows = [], this.rows = [], this.loading = !0, this.error = null, this.selectedDateKey = null, this.monthAnchorMs = K(/* @__PURE__ */ new Date()), this.rangeAnchorMs = null, this.isMobile = !1, this.mobileExpandedId = null, this.mobileShowAll = !1;
    const t = /* @__PURE__ */ new Date();
    this.mode = "timeline", this.timelineFromMs = E(T(t, -1)), this.timelineToMs = P(T(t, 7)), this.dayFromMs = void 0, this.dayToMs = void 0, this.loadingMorePast = !1, this.scrolledToUpcoming = !1, this.lastScrollTop = 0, this.lastLoadMoreAtMs = 0, this.hasMorePast = !0;
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
      return { fromMs: E(s), toMs: P(s) };
    if (this.preset === "nextWeek") {
      const i = new Date(s);
      return i.setDate(i.getDate() + 7), { fromMs: H(i), toMs: O(i) };
    }
    return { fromMs: H(s), toMs: O(s) };
  }
  impactClass(t) {
    const e = String(t ?? "").toLowerCase();
    return e.includes("high") ? "impact-high" : e.includes("med") ? "impact-medium" : e.includes("low") ? "impact-low" : "";
  }
  applyFilters() {
    const t = typeof this.currencies == "string" && this.currencies.trim() ? this.currencies.trim() : "", e = t ? t.split(",").map((l) => l.trim().toUpperCase()).filter(Boolean) : [], s = e.length > 0 ? new Set(e) : null, i = typeof this.currency == "string" && this.currency.trim() ? this.currency.trim().toUpperCase() : "", o = typeof this.query == "string" ? this.query.trim().toLowerCase() : "", n = this.impact ?? "all", h = this.selectedDateKey;
    this.rows = (this.baseRows ?? []).filter((l) => {
      const d = String(l.currency ?? "").toUpperCase();
      if (s) {
        if (!s.has(d)) return !1;
      } else if (i && i !== "ALL" && d !== i)
        return !1;
      return n !== "all" && Wt(l.impact) !== n || o && !`${l.title ?? ""}`.toLowerCase().includes(o) ? !1 : h && l.startsAt ? $(l.startsAt) === h : !0;
    }).sort((l, d) => Number(l.startsAt ?? 0) - Number(d.startsAt ?? 0));
  }
  async refresh() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = Bt(Number(this.limit ?? 200), 1, 500);
    this.loading = !0, this.error = null;
    try {
      const i = this.apiBase.replace(/\/+$/, ""), o = new URL(`${i}/widgets/economic-calendar`);
      o.searchParams.set("fromMs", String(t)), o.searchParams.set("toMs", String(e)), o.searchParams.set("limit", String(s));
      const n = await fetch(o.toString(), { method: "GET" });
      if (!n.ok) throw new Error(`Request failed (${n.status})`);
      const h = await n.json(), l = Array.isArray(h?.rows) ? h.rows : [];
      this.baseRows = l.sort((d, u) => Number(d.startsAt ?? 0) - Number(u.startsAt ?? 0)), this.applyFilters(), this.hasMorePast = this.timelineFromMs > 0, this.mode === "timeline" && (this.scrolledToUpcoming = !1, await this.updateComplete, this.scrollToUpcomingIfNeeded());
    } catch (i) {
      this.error = i instanceof Error ? i.message : "Failed to load", this.baseRows = [], this.rows = [];
    } finally {
      this.loading = !1;
    }
  }
  setPreset(t) {
    if (this.preset = t, t === "today") {
      const s = /* @__PURE__ */ new Date();
      this.mode = "day", this.dayFromMs = E(s), this.dayToMs = P(s), this.selectedDateKey = $(s.getTime()), this.rangeAnchorMs = s.getTime(), this.refresh();
      return;
    }
    const e = /* @__PURE__ */ new Date();
    if (this.mode = "timeline", this.dayFromMs = void 0, this.dayToMs = void 0, this.selectedDateKey = null, this.rangeAnchorMs = null, t === "nextWeek") {
      const s = T(e, 7);
      this.timelineFromMs = H(s), this.timelineToMs = O(s);
    } else
      this.timelineFromMs = H(e), this.timelineToMs = O(e);
    this.refresh();
  }
  shiftMonth(t) {
    const e = new Date(this.monthAnchorMs), s = Kt(e, t);
    this.monthAnchorMs = K(s);
  }
  selectDay(t) {
    this.selectedDateKey = $(t), this.rangeAnchorMs = t, this.monthAnchorMs = K(new Date(t));
    const e = new Date(t);
    this.mode = "day", this.dayFromMs = E(e), this.dayToMs = P(e), this.refresh();
  }
  clearDayFilter() {
    this.selectedDateKey = null, this.rangeAnchorMs = null, this.mode = "timeline", this.dayFromMs = void 0, this.dayToMs = void 0, this.mobileExpandedId = null, this.mobileShowAll = !1;
    const t = /* @__PURE__ */ new Date();
    this.timelineFromMs = E(T(t, -1)), this.timelineToMs = P(T(t, 7)), this.refresh();
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
      const h = Math.max(0, this.timelineFromMs - 6048e5);
      if (h === this.timelineFromMs) {
        this.hasMorePast = !1;
        return;
      }
      const l = Math.min(this.timelineToMs, this.timelineFromMs + 432e5), d = this.apiBase.replace(/\/+$/, ""), u = new URL(`${d}/widgets/economic-calendar`);
      u.searchParams.set("fromMs", String(h)), u.searchParams.set("toMs", String(l)), u.searchParams.set("limit", "500");
      const p = await fetch(u.toString(), { method: "GET" });
      if (!p.ok) throw new Error(`Request failed (${p.status})`);
      const a = await p.json(), c = Array.isArray(a?.rows) ? a.rows : [];
      c.length === 0 && h === 0 && (this.hasMorePast = !1);
      const m = /* @__PURE__ */ new Map();
      for (const v of this.baseRows ?? []) m.set(v.id, v);
      for (const v of c) m.set(v.id, v);
      const S = Array.from(m.values()).sort((v, bt) => Number(v.startsAt ?? 0) - Number(bt.startsAt ?? 0));
      this.baseRows = S, this.timelineFromMs = h, this.applyFilters(), await this.updateComplete;
      const vt = t.scrollHeight - i;
      t.scrollTop = s + vt + 48;
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
  renderMiniCalendar() {
    const t = new Date(this.monthAnchorMs), e = t.getFullYear(), s = t.getMonth(), i = new Date(e, s, 1), o = new Date(i);
    o.setDate(i.getDate() - i.getDay());
    const n = [];
    for (let d = 0; d < 42; d += 1) {
      const u = new Date(o);
      u.setDate(o.getDate() + d), n.push({
        ms: u.getTime(),
        label: String(u.getDate()),
        outside: u.getMonth() !== s
      });
    }
    const h = this.selectedDateKey, l = t.toLocaleDateString([], { month: "long", year: "numeric" });
    return f`
      <div class="calendar">
        <div class="calHeader">
          <button class="btn" type="button" @click=${() => this.shiftMonth(-1)} aria-label="Previous month">
            ◀
          </button>
          <div class="calTitle">${l}</div>
          <button class="btn" type="button" @click=${() => this.shiftMonth(1)} aria-label="Next month">
            ▶
          </button>
        </div>
        <div class="calGrid">
          ${["S", "M", "T", "W", "T", "F", "S"].map((d) => f`<div class="calDow">${d}</div>`)}
          ${n.map((d) => {
      const u = $(d.ms), p = [
        "calDay",
        d.outside ? "calDayOutside" : "",
        h && h === u ? "calDaySelected" : ""
      ].filter(Boolean).join(" ");
      return f`<div class=${p} @click=${() => this.selectDay(d.ms)}>${d.label}</div>`;
    })}
        </div>
      </div>
    `;
  }
  render() {
    const { fromMs: t, toMs: e } = this.resolveRange(), s = `${new Date(t).toLocaleDateString()} – ${new Date(e).toLocaleDateString()}`, i = this.newsBase.replace(/\/+$/, ""), o = $(Date.now()), n = (this.rows ?? []).filter((a) => a.startsAt ? $(a.startsAt) === o : !1), h = 8, l = this.mobileShowAll ? n : n.slice(0, h), d = Array.from(
      new Set(
        (this.baseRows ?? []).map((a) => String(a.currency ?? "").trim().toUpperCase()).filter(Boolean)
      )
    ).sort(), u = [], p = /* @__PURE__ */ new Map();
    for (const a of this.rows ?? []) {
      const c = typeof a.startsAt == "number" ? a.startsAt : t, m = $(c);
      p.has(m) || p.set(m, []), p.get(m).push(a);
    }
    for (const a of Array.from(p.keys()).sort()) {
      const c = p.get(a) ?? [], m = c[0]?.startsAt ?? t;
      u.push({ dayKey: a, dayLabel: typeof m == "number" ? jt(m) : a, rows: c });
    }
    return this.isMobile ? f`
        <div class="card">
          <div class="header">
            <div>
              <div class="title">Today: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}</div>
              <div class="meta">
                ${this.loading ? "Loading…" : `${n.length} event${n.length === 1 ? "" : "s"} today`}
              </div>
            </div>
          </div>

          ${this.loading ? f`<div class="loading">Loading economic calendar…</div>` : this.error ? f`<div class="error">Error: ${this.error}</div>` : n.length === 0 ? f`<div class="empty">No economic events today.</div>` : f`
                    <div style="padding: 8px 10px;">
                      ${l.map((a) => {
      const c = `${i}/news/${encodeURIComponent(a.id)}`, m = this.mobileExpandedId === a.id;
      return f`
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
                              @click=${() => this.toggleMobileExpanded(a.id)}
                            >
                              <div style="min-width: 0; flex: 1;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                  <div style="font-size: 11px; color: var(--tdrlp-muted, #475569); white-space: nowrap;">
                                    ${ht(a.startsAt)}
                                  </div>
                                  <div style="font-size: 11px; font-weight: 800; white-space: nowrap;">
                                    ${String(a.currency ?? "—").toUpperCase()}
                                  </div>
                                  <span class="badge ${this.impactClass(a.impact)}" style="padding: 1px 6px;">
                                    ${a.impact ?? "—"}
                                  </span>
                                </div>
                                <div style="margin-top: 6px; font-size: 13px; font-weight: 800; line-height: 1.2;">
                                  ${a.title}
                                </div>
                              </div>
                              <div style="font-size: 12px; color: var(--tdrlp-muted, #475569); padding-top: 2px;">
                                ${m ? "▲" : "▼"}
                              </div>
                            </button>

                            ${m ? f`
                                  <div
                                    style="
                                      padding: 10px 10px;
                                      border-top: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
                                      background: color-mix(in srgb, var(--tdrlp-bg, #fff) 92%, var(--tdrlp-accent, #2563eb));
                                      font-size: 12px;
                                    "
                                  >
                                    ${a.country ? f`<div style="color: var(--tdrlp-muted, #475569); margin-bottom: 8px;">
                                          ${a.country}
                                        </div>` : null}

                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Actual</div>
                                        <div style="font-variant-numeric: tabular-nums;">${a.actual ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Forecast</div>
                                        <div style="font-variant-numeric: tabular-nums;">${a.forecast ?? "—"}</div>
                                      </div>
                                      <div>
                                        <div style="font-weight: 800; color: var(--tdrlp-muted, #475569); font-size: 11px;">Previous</div>
                                        <div style="font-variant-numeric: tabular-nums;">${a.previous ?? "—"}</div>
                                      </div>
                                    </div>

                                    <div style="margin-top: 10px;">
                                      <a href=${c} target="_blank" rel="noreferrer">Open event</a>
                                    </div>
                                  </div>
                                ` : null}
                          </div>
                        `;
    })}

                      ${n.length > h ? f`
                            <button
                              class="btn"
                              style="width: 100%; justify-content: center; margin-top: 4px;"
                              type="button"
                              @click=${() => {
      this.mobileShowAll = !this.mobileShowAll, this.mobileExpandedId = null;
    }}
                            >
                              ${this.mobileShowAll ? "Show fewer" : `Show all (${n.length})`}
                            </button>
                          ` : null}
                    </div>
                  `}
        </div>
      ` : f`
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
              <input
                class="field"
                style="width: 220px;"
                placeholder="Search events…"
                .value=${this.query ?? ""}
                @input=${(a) => {
      this.query = String(a?.target?.value ?? "");
    }}
              />
              <select
                class="field"
                style="width: 110px;"
                .value=${this.currency ?? "ALL"}
                @change=${(a) => {
      this.currency = String(a?.target?.value ?? "ALL");
    }}
              >
                <option value="ALL">All</option>
                ${d.map((a) => f`<option value=${a}>${a}</option>`)}
              </select>
              <select
                class="field"
                style="width: 140px;"
                .value=${this.impact ?? "all"}
                @change=${(a) => {
      this.impact = String(a?.target?.value ?? "all");
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

          ${this.loading ? f`<div class="loading">Loading economic calendar…</div>` : this.error ? f`<div class="error">Error: ${this.error}</div>` : u.length === 0 ? f`<div class="empty">No economic events in range.</div>` : f`
                    <div
                      data-scroll="timeline"
                      @scroll=${(a) => {
      const c = a?.currentTarget;
      if (!c || this.mode !== "timeline") return;
      const m = c.scrollTop, S = m < this.lastScrollTop;
      this.lastScrollTop = m, S && m <= 24 && this.loadMorePast(c);
    }}
                      style="width: 100%; overflow: auto; max-height: 70vh;"
                    >
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
                          ${u.map(
      (a) => f`
                              <tr class="dayRow">
                                <td colspan="7" style="padding: 10px 12px;">${a.dayLabel}</td>
                              </tr>
                              ${a.rows.map((c) => {
        const m = `${i}/news/${encodeURIComponent(c.id)}`, S = Date.now(), j = typeof c.startsAt == "number" && c.startsAt > 0 && c.startsAt < S;
        return f`
                                  <tr
                                    data-event-id=${c.id}
                                    class=${j ? "rowPast" : ""}
                                  >
                                    <td style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${ht(c.startsAt)}
                                    </td>
                                    <td style="font-size: 12px; font-weight: 700;">
                                      ${String(c.currency ?? "—").toUpperCase()}
                                    </td>
                                    <td>
                                      <span class="badge ${this.impactClass(c.impact)}">
                                        ${c.impact ?? "—"}
                                      </span>
                                    </td>
                                    <td style="min-width: 320px;">
                                      <a
                                        href=${m}
                                        target="_blank"
                                        rel="noreferrer"
                                        style=${j ? "color: var(--tdrlp-muted, #475569);" : ""}
                                      >
                                        ${c.title}
                                      </a>
                                      ${c.country ? f`<div style="margin-top: 2px; font-size: 12px; color: var(--tdrlp-muted, #475569);">${c.country}</div>` : null}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${c.actual ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${c.forecast ?? "—"}
                                    </td>
                                    <td class="right" style="font-size: 12px; color: var(--tdrlp-muted, #475569);">
                                      ${c.previous ?? "—"}
                                    </td>
                                  </tr>
                                `;
      })}
                            `
    )}
                        </tbody>
                      </table>
                    </div>
                    ${this.mode === "timeline" && this.loadingMorePast ? f`<div class="loading" style="border-top: 1px solid var(--tdrlp-border, #e2e8f0);">Loading older…</div>` : null}
                  `}
        </div>
      </div>
    `;
  }
};
I.properties = {
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
}, I.styles = wt`
    :host {
      display: block;
      font-family: var(--tdrlp-font, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto);
      color: var(--tdrlp-fg, #0f172a);
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
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: var(--tdrlp-muted, #475569);
      padding: 10px 12px;
      border-bottom: 1px solid var(--tdrlp-border, #e2e8f0);
      background: var(--tdrlp-bg, #fff);
    }

    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 60%, transparent);
      vertical-align: top;
    }

    tbody tr:hover td {
      background: color-mix(in srgb, var(--tdrlp-accent, #2563eb) 6%, transparent);
    }

    /* Past events: make clearly visually distinct */
    tr.rowPast td {
      background: color-mix(in srgb, var(--tdrlp-border, #e2e8f0) 22%, transparent);
      color: var(--tdrlp-muted, #475569);
    }

    tr.rowPast a {
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
let G = I;
customElements.define("tdrlp-economic-calendar", G);
