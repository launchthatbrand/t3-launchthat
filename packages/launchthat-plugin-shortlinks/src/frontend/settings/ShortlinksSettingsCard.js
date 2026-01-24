"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortlinksSettingsCard = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var button_1 = require("@acme/ui/button");
var card_1 = require("@acme/ui/card");
var input_1 = require("@acme/ui/input");
var label_1 = require("@acme/ui/label");
var switch_1 = require("@acme/ui/switch");
var ShortlinksSettingsCard = function (props) {
    var _a = react_1.default.useState(props.settings.domain), domain = _a[0], setDomain = _a[1];
    var _b = react_1.default.useState(Boolean(props.settings.enabled)), enabled = _b[0], setEnabled = _b[1];
    var _c = react_1.default.useState(String(props.settings.codeLength)), codeLength = _c[0], setCodeLength = _c[1];
    react_1.default.useEffect(function () {
        setDomain(props.settings.domain);
        setEnabled(Boolean(props.settings.enabled));
        setCodeLength(String(props.settings.codeLength));
    }, [props.settings.domain, props.settings.enabled, props.settings.codeLength]);
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Shortlinks" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Configure the shortlink domain and code generation settings." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 md:col-span-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "shortlinks-domain", children: "Domain" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "shortlinks-domain", value: domain, onChange: function (e) { return setDomain(e.target.value); }, placeholder: "tdrlp.com", disabled: Boolean(props.disabled) }), (0, jsx_runtime_1.jsx)("div", { className: "text-muted-foreground text-xs", children: "Enter a hostname only (no `https://`, no path)." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "shortlinks-codeLength", children: "Code length" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "shortlinks-codeLength", value: codeLength, onChange: function (e) { return setCodeLength(e.target.value); }, inputMode: "numeric", placeholder: "6", disabled: Boolean(props.disabled) }), (0, jsx_runtime_1.jsx)("div", { className: "text-muted-foreground text-xs", children: "Default is 6; larger reduces collisions." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between rounded-md border p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-0.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-semibold", children: "Enabled" }), (0, jsx_runtime_1.jsx)("div", { className: "text-muted-foreground text-xs", children: "When disabled, new shortlinks can still be created, but UI may hide the short domain." })] }), (0, jsx_runtime_1.jsx)(switch_1.Switch, { checked: enabled, onCheckedChange: setEnabled, disabled: Boolean(props.disabled) })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-end", children: (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", disabled: Boolean(props.disabled), onClick: function () { return __awaiter(void 0, void 0, void 0, function () {
                                var next;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            next = {
                                                domain: domain.trim(),
                                                enabled: enabled,
                                                codeLength: Math.max(1, Number.parseInt(codeLength, 10) || 0),
                                            };
                                            return [4 /*yield*/, props.onSave(next)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, children: "Save" }) })] })] }));
};
exports.ShortlinksSettingsCard = ShortlinksSettingsCard;
