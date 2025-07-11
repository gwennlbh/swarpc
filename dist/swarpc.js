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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = Server;
exports.Client = Client;
var arktype_1 = require("arktype");
function Server(procedures, _a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, worker = _b.worker;
    var instance = {
        procedures: procedures,
        implementations: {},
        start: function () { },
    };
    var _loop_1 = function (functionName) {
        instance[functionName] = (function (implementation) {
            if (!instance.procedures[functionName]) {
                throw new Error("No procedure found for function name: ".concat(functionName));
            }
            instance.implementations[functionName] = implementation;
        });
    };
    for (var functionName in procedures) {
        _loop_1(functionName);
    }
    var PayloadSchema = arktype_1.type.or.apply(arktype_1.type, Object.entries(procedures).map(function (_a) {
        var functionName = _a[0], input = _a[1].input;
        return ({
            functionName: (0, arktype_1.type)("\"".concat(functionName, "\"")),
            requestId: (0, arktype_1.type)("string >= 1"),
            input: input,
        });
    }));
    instance.start = function (self) {
        var postMessage = function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!worker) return [3 /*break*/, 1];
                        self.postMessage(data);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, self.clients.matchAll().then(function (clients) {
                            clients.forEach(function (client) { return client.postMessage(data); });
                        })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        self.addEventListener("message", function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, functionName, requestId, input, postError, implementation;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = PayloadSchema.assert(event.data), functionName = _a.functionName, requestId = _a.requestId, input = _a.input;
                        postError = function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, postMessage({
                                        functionName: functionName,
                                        requestId: requestId,
                                        error: {
                                            message: "message" in error ? error.message : String(error),
                                        },
                                    })];
                            });
                        }); };
                        implementation = instance.implementations[functionName];
                        if (!!implementation) return [3 /*break*/, 2];
                        return [4 /*yield*/, postError("No implementation found")];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, implementation(input, function (progress) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, postMessage({ functionName: functionName, requestId: requestId, progress: progress })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                            .catch(function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, postError(error)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                            .then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, postMessage({ functionName: functionName, requestId: requestId, result: result })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return instance;
}
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15);
}
var pendingRequests = new Map();
var _clientListenerStarted = false;
function startClientListener(worker) {
    return __awaiter(this, void 0, void 0, function () {
        var sw, w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (_clientListenerStarted)
                        return [2 /*return*/];
                    if (!!worker) return [3 /*break*/, 2];
                    return [4 /*yield*/, navigator.serviceWorker.ready];
                case 1:
                    sw = _a.sent();
                    if (!(sw === null || sw === void 0 ? void 0 : sw.active)) {
                        throw new Error("[SWARPC Client] Service Worker is not active");
                    }
                    if (!navigator.serviceWorker.controller) {
                        console.warn("[SWARPC Client] Service Worker is not controlling the page");
                    }
                    _a.label = 2;
                case 2:
                    w = worker !== null && worker !== void 0 ? worker : navigator.serviceWorker;
                    w.addEventListener("message", function (event) {
                        var _a = event.data || {}, functionName = _a.functionName, requestId = _a.requestId, data = __rest(_a, ["functionName", "requestId"]);
                        if (!requestId) {
                            throw new Error("[SWARPC Client] Message received without requestId");
                        }
                        var handlers = pendingRequests.get(requestId);
                        if (!handlers) {
                            throw new Error("[SWARPC Client] ".concat(requestId, " has no active request handlers"));
                        }
                        if ("error" in data) {
                            handlers.reject(new Error(data.error.message));
                            pendingRequests.delete(requestId);
                        }
                        else if ("progress" in data) {
                            handlers.onProgress(data.progress);
                        }
                        else if ("result" in data) {
                            handlers.resolve(data.result);
                            pendingRequests.delete(requestId);
                        }
                    });
                    _clientListenerStarted = true;
                    return [2 /*return*/];
            }
        });
    });
}
function Client(procedures, _a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, worker = _b.worker;
    var instance = { procedures: procedures };
    var _loop_2 = function (functionName) {
        instance[functionName] = (function (input_1) {
            var args_1 = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args_1[_i - 1] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([input_1], args_1, true), void 0, function (input, onProgress) {
                var w, _a;
                if (onProgress === void 0) { onProgress = function () { }; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            procedures[functionName].input.assert(input);
                            return [4 /*yield*/, startClientListener(worker)];
                        case 1:
                            _b.sent();
                            if (!(worker !== null && worker !== void 0)) return [3 /*break*/, 2];
                            _a = worker;
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, navigator.serviceWorker.ready.then(function (r) { return r.active; })];
                        case 3:
                            _a = (_b.sent());
                            _b.label = 4;
                        case 4:
                            w = _a;
                            if (!w) {
                                throw new Error("[SWARPC Client] No active service worker found");
                            }
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    if (!worker && !navigator.serviceWorker.controller)
                                        console.warn("[SWARPC Client] Service Worker is not controlling the page");
                                    var requestId = generateRequestId();
                                    pendingRequests.set(requestId, { resolve: resolve, onProgress: onProgress, reject: reject });
                                    w.postMessage({ functionName: functionName, input: input, requestId: requestId });
                                })];
                    }
                });
            });
        });
    };
    for (var _i = 0, _c = Object.keys(procedures); _i < _c.length; _i++) {
        var functionName = _c[_i];
        _loop_2(functionName);
    }
    return instance;
}
