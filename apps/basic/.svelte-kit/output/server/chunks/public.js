const isFunction$1 = (input) => typeof input === "function";
const dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      if (arity(arguments)) {
        return body.apply(this, arguments);
      }
      return (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    case 4:
      return function(a, b, c, d) {
        if (arguments.length >= 4) {
          return body(a, b, c, d);
        }
        return function(self) {
          return body(self, a, b, c);
        };
      };
    case 5:
      return function(a, b, c, d, e) {
        if (arguments.length >= 5) {
          return body(a, b, c, d, e);
        }
        return function(self) {
          return body(self, a, b, c, d);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args2 = arguments;
        return function(self) {
          return body(self, ...args2);
        };
      };
  }
};
const identity = (a) => a;
const constant = (value) => () => value;
const constTrue = /* @__PURE__ */ constant(true);
const constFalse = /* @__PURE__ */ constant(false);
const constUndefined = /* @__PURE__ */ constant(void 0);
const constVoid = constUndefined;
function pipe(a, ab, bc, cd, de, ef, fg, gh, hi) {
  switch (arguments.length) {
    case 1:
      return a;
    case 2:
      return ab(a);
    case 3:
      return bc(ab(a));
    case 4:
      return cd(bc(ab(a)));
    case 5:
      return de(cd(bc(ab(a))));
    case 6:
      return ef(de(cd(bc(ab(a)))));
    case 7:
      return fg(ef(de(cd(bc(ab(a))))));
    case 8:
      return gh(fg(ef(de(cd(bc(ab(a)))))));
    case 9:
      return hi(gh(fg(ef(de(cd(bc(ab(a))))))));
    default: {
      let ret = arguments[0];
      for (let i = 1; i < arguments.length; i++) {
        ret = arguments[i](ret);
      }
      return ret;
    }
  }
}
function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 1:
      return ab;
    case 2:
      return function() {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function() {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function() {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function() {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function() {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function() {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function() {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function() {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
  }
  return;
}
const make$u = (isEquivalent) => (self, that) => self === that || isEquivalent(self, that);
const isStrictEquivalent = (x, y) => x === y;
const strict = () => isStrictEquivalent;
const number$2 = /* @__PURE__ */ strict();
const mapInput$1 = /* @__PURE__ */ dual(2, (self, f) => make$u((x, y) => self(f(x), f(y))));
const Date$1 = /* @__PURE__ */ mapInput$1(number$2, (date) => date.getTime());
const array$1 = (item) => make$u((self, that) => {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0; i < self.length; i++) {
    const isEq = item(self[i], that[i]);
    if (!isEq) {
      return false;
    }
  }
  return true;
});
let moduleVersion = "3.14.8";
const getCurrentVersion = () => moduleVersion;
const globalStoreId = `effect/GlobalValue/globalStoreId/${/* @__PURE__ */ getCurrentVersion()}`;
let globalStore;
const globalValue = (id, compute) => {
  if (!globalStore) {
    globalThis[globalStoreId] ??= /* @__PURE__ */ new Map();
    globalStore = globalThis[globalStoreId];
  }
  if (!globalStore.has(id)) {
    globalStore.set(id, compute());
  }
  return globalStore.get(id);
};
const isString = (input) => typeof input === "string";
const isNumber = (input) => typeof input === "number";
const isBoolean = (input) => typeof input === "boolean";
const isBigInt = (input) => typeof input === "bigint";
const isSymbol = (input) => typeof input === "symbol";
const isFunction = isFunction$1;
const isUndefined = (input) => input === void 0;
const isNotUndefined = (input) => input !== void 0;
const isNotNull = (input) => input !== null;
const isNever = (_) => false;
const isRecordOrArray = (input) => typeof input === "object" && input !== null;
const isObject = (input) => isRecordOrArray(input) || isFunction(input);
const hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObject(self) && property in self);
const isTagged = /* @__PURE__ */ dual(2, (self, tag) => hasProperty(self, "_tag") && self["_tag"] === tag);
const isNullable = (input) => input === null || input === void 0;
const isNotNullable = (input) => input !== null && input !== void 0;
const isDate = (input) => input instanceof Date;
const isIterable = (input) => hasProperty(input, Symbol.iterator);
const isRecord = (input) => isRecordOrArray(input) && !Array.isArray(input);
const isPromiseLike = (input) => hasProperty(input, "then") && isFunction(input.then);
const getBugErrorMessage = (message) => `BUG: ${message} - please report an issue at https://github.com/Effect-TS/effect/issues`;
let SingleShotGen$1 = class SingleShotGen {
  self;
  called = false;
  constructor(self) {
    this.self = self;
  }
  /**
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * @since 2.0.0
   */
  return(a) {
    return {
      value: a,
      done: true
    };
  }
  /**
   * @since 2.0.0
   */
  throw(e) {
    throw e;
  }
  /**
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new SingleShotGen(this.self);
  }
};
const defaultIncHi = 335903614;
const defaultIncLo = 4150755663;
const MUL_HI = 1481765933 >>> 0;
const MUL_LO = 1284865837 >>> 0;
const BIT_53 = 9007199254740992;
const BIT_27 = 134217728;
class PCGRandom {
  _state;
  constructor(seedHi, seedLo, incHi, incLo) {
    if (isNullable(seedLo) && isNullable(seedHi)) {
      seedLo = Math.random() * 4294967295 >>> 0;
      seedHi = 0;
    } else if (isNullable(seedLo)) {
      seedLo = seedHi;
      seedHi = 0;
    }
    if (isNullable(incLo) && isNullable(incHi)) {
      incLo = this._state ? this._state[3] : defaultIncLo;
      incHi = this._state ? this._state[2] : defaultIncHi;
    } else if (isNullable(incLo)) {
      incLo = incHi;
      incHi = 0;
    }
    this._state = new Int32Array([0, 0, incHi >>> 0, ((incLo || 0) | 1) >>> 0]);
    this._next();
    add64(this._state, this._state[0], this._state[1], seedHi >>> 0, seedLo >>> 0);
    this._next();
    return this;
  }
  /**
   * Returns a copy of the internal state of this random number generator as a
   * JavaScript Array.
   *
   * @category getters
   * @since 2.0.0
   */
  getState() {
    return [this._state[0], this._state[1], this._state[2], this._state[3]];
  }
  /**
   * Restore state previously retrieved using `getState()`.
   *
   * @since 2.0.0
   */
  setState(state) {
    this._state[0] = state[0];
    this._state[1] = state[1];
    this._state[2] = state[2];
    this._state[3] = state[3] | 1;
  }
  /**
   * Get a uniformly distributed 32 bit integer between [0, max).
   *
   * @category getter
   * @since 2.0.0
   */
  integer(max) {
    return Math.round(this.number() * Number.MAX_SAFE_INTEGER) % max;
  }
  /**
   * Get a uniformly distributed IEEE-754 double between 0.0 and 1.0, with
   * 53 bits of precision (every bit of the mantissa is randomized).
   *
   * @category getters
   * @since 2.0.0
   */
  number() {
    const hi = (this._next() & 67108863) * 1;
    const lo = (this._next() & 134217727) * 1;
    return (hi * BIT_27 + lo) / BIT_53;
  }
  /** @internal */
  _next() {
    const oldHi = this._state[0] >>> 0;
    const oldLo = this._state[1] >>> 0;
    mul64(this._state, oldHi, oldLo, MUL_HI, MUL_LO);
    add64(this._state, this._state[0], this._state[1], this._state[2], this._state[3]);
    let xsHi = oldHi >>> 18;
    let xsLo = (oldLo >>> 18 | oldHi << 14) >>> 0;
    xsHi = (xsHi ^ oldHi) >>> 0;
    xsLo = (xsLo ^ oldLo) >>> 0;
    const xorshifted = (xsLo >>> 27 | xsHi << 5) >>> 0;
    const rot = oldHi >>> 27;
    const rot2 = (-rot >>> 0 & 31) >>> 0;
    return (xorshifted >>> rot | xorshifted << rot2) >>> 0;
  }
}
function mul64(out, aHi, aLo, bHi, bLo) {
  let c1 = (aLo >>> 16) * (bLo & 65535) >>> 0;
  let c0 = (aLo & 65535) * (bLo >>> 16) >>> 0;
  let lo = (aLo & 65535) * (bLo & 65535) >>> 0;
  let hi = (aLo >>> 16) * (bLo >>> 16) + ((c0 >>> 16) + (c1 >>> 16)) >>> 0;
  c0 = c0 << 16 >>> 0;
  lo = lo + c0 >>> 0;
  if (lo >>> 0 < c0 >>> 0) {
    hi = hi + 1 >>> 0;
  }
  c1 = c1 << 16 >>> 0;
  lo = lo + c1 >>> 0;
  if (lo >>> 0 < c1 >>> 0) {
    hi = hi + 1 >>> 0;
  }
  hi = hi + Math.imul(aLo, bHi) >>> 0;
  hi = hi + Math.imul(aHi, bLo) >>> 0;
  out[0] = hi;
  out[1] = lo;
}
function add64(out, aHi, aLo, bHi, bLo) {
  let hi = aHi + bHi >>> 0;
  const lo = aLo + bLo >>> 0;
  if (lo >>> 0 < aLo >>> 0) {
    hi = hi + 1 | 0;
  }
  out[0] = hi;
  out[1] = lo;
}
const YieldWrapTypeId = /* @__PURE__ */ Symbol.for("effect/Utils/YieldWrap");
class YieldWrap {
  /**
   * @since 3.0.6
   */
  #value;
  constructor(value) {
    this.#value = value;
  }
  /**
   * @since 3.0.6
   */
  [YieldWrapTypeId]() {
    return this.#value;
  }
}
function yieldWrapGet(self) {
  if (typeof self === "object" && self !== null && YieldWrapTypeId in self) {
    return self[YieldWrapTypeId]();
  }
  throw new Error(getBugErrorMessage("yieldWrapGet"));
}
const structuralRegionState = /* @__PURE__ */ globalValue("effect/Utils/isStructuralRegion", () => ({
  enabled: false,
  tester: void 0
}));
const tracingFunction = (name) => {
  const wrap = {
    [name](body) {
      return body();
    }
  };
  return function(fn) {
    return wrap[name](fn);
  };
};
const internalCall = /* @__PURE__ */ tracingFunction("effect_internal_function");
const randomHashCache = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Hash/randomHashCache"), () => /* @__PURE__ */ new WeakMap());
const symbol$1 = /* @__PURE__ */ Symbol.for("effect/Hash");
const hash = (self) => {
  if (structuralRegionState.enabled === true) {
    return 0;
  }
  switch (typeof self) {
    case "number":
      return number$1(self);
    case "bigint":
      return string(self.toString(10));
    case "boolean":
      return string(String(self));
    case "symbol":
      return string(String(self));
    case "string":
      return string(self);
    case "undefined":
      return string("undefined");
    case "function":
    case "object": {
      if (self === null) {
        return string("null");
      } else if (self instanceof Date) {
        return hash(self.toISOString());
      } else if (self instanceof URL) {
        return hash(self.href);
      } else if (isHash(self)) {
        return self[symbol$1]();
      } else {
        return random(self);
      }
    }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
const random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number$1(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
const combine$5 = (b) => (self) => self * 53 ^ b;
const optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
const isHash = (u) => hasProperty(u, symbol$1);
const number$1 = (n) => {
  if (n !== n || n === Infinity) {
    return 0;
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 4294967295;
  }
  while (n > 4294967295) {
    h ^= n /= 4294967295;
  }
  return optimize(h);
};
const string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
const structureKeys = (o, keys2) => {
  let h = 12289;
  for (let i = 0; i < keys2.length; i++) {
    h ^= pipe(string(keys2[i]), combine$5(hash(o[keys2[i]])));
  }
  return optimize(h);
};
const structure = (o) => structureKeys(o, Object.keys(o));
const array = (arr) => {
  let h = 6151;
  for (let i = 0; i < arr.length; i++) {
    h = pipe(h, combine$5(hash(arr[i])));
  }
  return optimize(h);
};
const cached = function() {
  if (arguments.length === 1) {
    const self2 = arguments[0];
    return function(hash3) {
      Object.defineProperty(self2, symbol$1, {
        value() {
          return hash3;
        },
        enumerable: false
      });
      return hash3;
    };
  }
  const self = arguments[0];
  const hash2 = arguments[1];
  Object.defineProperty(self, symbol$1, {
    value() {
      return hash2;
    },
    enumerable: false
  });
  return hash2;
};
const symbol = /* @__PURE__ */ Symbol.for("effect/Equal");
function equals$1() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) {
    return true;
  }
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "object" || selfType === "function") {
    if (self !== null && that !== null) {
      if (isEqual(self) && isEqual(that)) {
        if (hash(self) === hash(that) && self[symbol](that)) {
          return true;
        } else {
          return structuralRegionState.enabled && structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
        }
      } else if (self instanceof Date && that instanceof Date) {
        return self.toISOString() === that.toISOString();
      } else if (self instanceof URL && that instanceof URL) {
        return self.href === that.href;
      }
    }
    if (structuralRegionState.enabled) {
      if (Array.isArray(self) && Array.isArray(that)) {
        return self.length === that.length && self.every((v, i) => compareBoth(v, that[i]));
      }
      if (Object.getPrototypeOf(self) === Object.prototype && Object.getPrototypeOf(self) === Object.prototype) {
        const keysSelf = Object.keys(self);
        const keysThat = Object.keys(that);
        if (keysSelf.length === keysThat.length) {
          for (const key of keysSelf) {
            if (!(key in that && compareBoth(self[key], that[key]))) {
              return structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
            }
          }
          return true;
        }
      }
      return structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
    }
  }
  return structuralRegionState.enabled && structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
}
const isEqual = (u) => hasProperty(u, symbol);
const equivalence = () => equals$1;
const NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
const toJSON = (x) => {
  try {
    if (hasProperty(x, "toJSON") && isFunction(x["toJSON"]) && x["toJSON"].length === 0) {
      return x.toJSON();
    } else if (Array.isArray(x)) {
      return x.map(toJSON);
    }
  } catch (_) {
    return {};
  }
  return redact(x);
};
const format$3 = (x) => JSON.stringify(x, null, 2);
const toStringUnknown = (u, whitespace = 2) => {
  if (typeof u === "string") {
    return u;
  }
  try {
    return typeof u === "object" ? stringifyCircular(u, whitespace) : String(u);
  } catch (_) {
    return String(u);
  }
};
const stringifyCircular = (obj, whitespace) => {
  let cache = [];
  const retVal = JSON.stringify(obj, (_key, value) => typeof value === "object" && value !== null ? cache.includes(value) ? void 0 : cache.push(value) && (redactableState.fiberRefs !== void 0 && isRedactable(value) ? value[symbolRedactable](redactableState.fiberRefs) : value) : value, whitespace);
  cache = void 0;
  return retVal;
};
const symbolRedactable = /* @__PURE__ */ Symbol.for("effect/Inspectable/Redactable");
const isRedactable = (u) => typeof u === "object" && u !== null && symbolRedactable in u;
const redactableState = /* @__PURE__ */ globalValue("effect/Inspectable/redactableState", () => ({
  fiberRefs: void 0
}));
const withRedactableContext = (context2, f) => {
  const prev = redactableState.fiberRefs;
  redactableState.fiberRefs = context2;
  try {
    return f();
  } finally {
    redactableState.fiberRefs = prev;
  }
};
const redact = (u) => {
  if (isRedactable(u) && redactableState.fiberRefs !== void 0) {
    return u[symbolRedactable](redactableState.fiberRefs);
  }
  return u;
};
const pipeArguments = (self, args2) => {
  switch (args2.length) {
    case 0:
      return self;
    case 1:
      return args2[0](self);
    case 2:
      return args2[1](args2[0](self));
    case 3:
      return args2[2](args2[1](args2[0](self)));
    case 4:
      return args2[3](args2[2](args2[1](args2[0](self))));
    case 5:
      return args2[4](args2[3](args2[2](args2[1](args2[0](self)))));
    case 6:
      return args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))));
    case 7:
      return args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))));
    case 8:
      return args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))))));
    case 9:
      return args2[8](args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args2.length; i < len; i++) {
        ret = args2[i](ret);
      }
      return ret;
    }
  }
};
const OP_ASYNC = "Async";
const OP_COMMIT = "Commit";
const OP_FAILURE = "Failure";
const OP_ON_FAILURE = "OnFailure";
const OP_ON_SUCCESS = "OnSuccess";
const OP_ON_SUCCESS_AND_FAILURE = "OnSuccessAndFailure";
const OP_SUCCESS = "Success";
const OP_SYNC = "Sync";
const OP_TAG = "Tag";
const OP_UPDATE_RUNTIME_FLAGS = "UpdateRuntimeFlags";
const OP_WHILE = "While";
const OP_ITERATOR = "Iterator";
const OP_WITH_RUNTIME = "WithRuntime";
const OP_YIELD = "Yield";
const OP_REVERT_FLAGS = "RevertFlags";
const EffectTypeId$1 = /* @__PURE__ */ Symbol.for("effect/Effect");
const StreamTypeId = /* @__PURE__ */ Symbol.for("effect/Stream");
const SinkTypeId = /* @__PURE__ */ Symbol.for("effect/Sink");
const ChannelTypeId = /* @__PURE__ */ Symbol.for("effect/Channel");
const effectVariance = {
  /* c8 ignore next */
  _R: (_) => _,
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _,
  _V: /* @__PURE__ */ getCurrentVersion()
};
const sinkVariance = {
  /* c8 ignore next */
  _A: (_) => _,
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _L: (_) => _,
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
};
const channelVariance = {
  /* c8 ignore next */
  _Env: (_) => _,
  /* c8 ignore next */
  _InErr: (_) => _,
  /* c8 ignore next */
  _InElem: (_) => _,
  /* c8 ignore next */
  _InDone: (_) => _,
  /* c8 ignore next */
  _OutErr: (_) => _,
  /* c8 ignore next */
  _OutElem: (_) => _,
  /* c8 ignore next */
  _OutDone: (_) => _
};
const EffectPrototype$1 = {
  [EffectTypeId$1]: effectVariance,
  [StreamTypeId]: effectVariance,
  [SinkTypeId]: sinkVariance,
  [ChannelTypeId]: channelVariance,
  [symbol](that) {
    return this === that;
  },
  [symbol$1]() {
    return cached(this, random(this));
  },
  [Symbol.iterator]() {
    return new SingleShotGen$1(new YieldWrap(this));
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const StructuralPrototype = {
  [symbol$1]() {
    return cached(this, structure(this));
  },
  [symbol](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) {
      return false;
    }
    for (const key of selfKeys) {
      if (!(key in that && equals$1(this[key], that[key]))) {
        return false;
      }
    }
    return true;
  }
};
const CommitPrototype = {
  ...EffectPrototype$1,
  _op: OP_COMMIT
};
const StructuralCommitPrototype = {
  ...CommitPrototype,
  ...StructuralPrototype
};
const Base$1 = /* @__PURE__ */ function() {
  function Base2() {
  }
  Base2.prototype = CommitPrototype;
  return Base2;
}();
const TypeId$c = /* @__PURE__ */ Symbol.for("effect/Option");
const CommonProto$1 = {
  ...EffectPrototype$1,
  [TypeId$c]: {
    _A: (_) => _
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format$3(this.toJSON());
  }
};
const SomeProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto$1), {
  _tag: "Some",
  _op: "Some",
  [symbol](that) {
    return isOption$1(that) && isSome$1(that) && equals$1(this.value, that.value);
  },
  [symbol$1]() {
    return cached(this, combine$5(hash(this._tag))(hash(this.value)));
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJSON(this.value)
    };
  }
});
const NoneHash = /* @__PURE__ */ hash("None");
const NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto$1), {
  _tag: "None",
  _op: "None",
  [symbol](that) {
    return isOption$1(that) && isNone$1(that);
  },
  [symbol$1]() {
    return NoneHash;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
const isOption$1 = (input) => hasProperty(input, TypeId$c);
const isNone$1 = (fa) => fa._tag === "None";
const isSome$1 = (fa) => fa._tag === "Some";
const none$5 = /* @__PURE__ */ Object.create(NoneProto);
const some$1 = (value) => {
  const a = Object.create(SomeProto);
  a.value = value;
  return a;
};
const TypeId$b = /* @__PURE__ */ Symbol.for("effect/Either");
const CommonProto = {
  ...EffectPrototype$1,
  [TypeId$b]: {
    _R: (_) => _
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format$3(this.toJSON());
  }
};
const RightProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Right",
  _op: "Right",
  [symbol](that) {
    return isEither$2(that) && isRight$1(that) && equals$1(this.right, that.right);
  },
  [symbol$1]() {
    return combine$5(hash(this._tag))(hash(this.right));
  },
  toJSON() {
    return {
      _id: "Either",
      _tag: this._tag,
      right: toJSON(this.right)
    };
  }
});
const LeftProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Left",
  _op: "Left",
  [symbol](that) {
    return isEither$2(that) && isLeft$1(that) && equals$1(this.left, that.left);
  },
  [symbol$1]() {
    return combine$5(hash(this._tag))(hash(this.left));
  },
  toJSON() {
    return {
      _id: "Either",
      _tag: this._tag,
      left: toJSON(this.left)
    };
  }
});
const isEither$2 = (input) => hasProperty(input, TypeId$b);
const isLeft$1 = (ma) => ma._tag === "Left";
const isRight$1 = (ma) => ma._tag === "Right";
const left$1 = (left2) => {
  const a = Object.create(LeftProto);
  a.left = left2;
  return a;
};
const right$1 = (right2) => {
  const a = Object.create(RightProto);
  a.right = right2;
  return a;
};
const right = right$1;
const left = left$1;
const isEither$1 = isEither$2;
const isLeft = isLeft$1;
const isRight = isRight$1;
const mapBoth$3 = /* @__PURE__ */ dual(2, (self, {
  onLeft,
  onRight
}) => isLeft(self) ? left(onLeft(self.left)) : right(onRight(self.right)));
const mapLeft = /* @__PURE__ */ dual(2, (self, f) => isLeft(self) ? left(f(self.left)) : right(self.right));
const map$8 = /* @__PURE__ */ dual(2, (self, f) => isRight(self) ? right(f(self.right)) : left(self.left));
const match$6 = /* @__PURE__ */ dual(2, (self, {
  onLeft,
  onRight
}) => isLeft(self) ? onLeft(self.left) : onRight(self.right));
const merge$5 = /* @__PURE__ */ match$6({
  onLeft: identity,
  onRight: identity
});
const getOrThrowWith$1 = /* @__PURE__ */ dual(2, (self, onLeft) => {
  if (isRight(self)) {
    return self.right;
  }
  throw onLeft(self.left);
});
const getOrThrow$1 = /* @__PURE__ */ getOrThrowWith$1(() => new Error("getOrThrow called on a Left"));
const isNonEmptyArray$1 = (self) => self.length > 0;
const make$t = (compare2) => (self, that) => self === that ? 0 : compare2(self, that);
const number = /* @__PURE__ */ make$t((self, that) => self < that ? -1 : 1);
const mapInput = /* @__PURE__ */ dual(2, (self, f) => make$t((b1, b2) => self(f(b1), f(b2))));
const greaterThan$1 = (O) => dual(2, (self, that) => O(self, that) === 1);
const none$4 = () => none$5;
const some = some$1;
const isOption = isOption$1;
const isNone = isNone$1;
const isSome = isSome$1;
const match$5 = /* @__PURE__ */ dual(2, (self, {
  onNone,
  onSome
}) => isNone(self) ? onNone() : onSome(self.value));
const getOrElse = /* @__PURE__ */ dual(2, (self, onNone) => isNone(self) ? onNone() : self.value);
const orElse$3 = /* @__PURE__ */ dual(2, (self, that) => isNone(self) ? that() : self);
const orElseSome = /* @__PURE__ */ dual(2, (self, onNone) => isNone(self) ? some(onNone()) : self);
const fromNullable = (nullableValue) => nullableValue == null ? none$4() : some(nullableValue);
const getOrUndefined = /* @__PURE__ */ getOrElse(constUndefined);
const liftThrowable = (f) => (...a) => {
  try {
    return some(f(...a));
  } catch (e) {
    return none$4();
  }
};
const getOrThrowWith = /* @__PURE__ */ dual(2, (self, onNone) => {
  if (isSome(self)) {
    return self.value;
  }
  throw onNone();
});
const getOrThrow = /* @__PURE__ */ getOrThrowWith(() => new Error("getOrThrow called on a None"));
const map$7 = /* @__PURE__ */ dual(2, (self, f) => isNone(self) ? none$4() : some(f(self.value)));
const flatMap$5 = /* @__PURE__ */ dual(2, (self, f) => isNone(self) ? none$4() : f(self.value));
const flatMapNullable = /* @__PURE__ */ dual(2, (self, f) => isNone(self) ? none$4() : fromNullable(f(self.value)));
const filterMap = flatMap$5;
const filter = /* @__PURE__ */ dual(2, (self, predicate) => filterMap(self, (b) => predicate(b) ? some$1(b) : none$5));
const getEquivalence$3 = (isEquivalent) => make$u((x, y) => isNone(x) ? isNone(y) : isNone(y) ? false : isEquivalent(x.value, y.value));
const containsWith = (isEquivalent) => dual(2, (self, a) => isNone(self) ? false : isEquivalent(self.value, a));
const _equivalence$3 = /* @__PURE__ */ equivalence();
const contains = /* @__PURE__ */ containsWith(_equivalence$3);
const exists = /* @__PURE__ */ dual(2, (self, refinement) => isNone(self) ? false : refinement(self.value));
const mergeWith = (f) => (o1, o2) => {
  if (isNone(o1)) {
    return o2;
  } else if (isNone(o2)) {
    return o1;
  }
  return some(f(o1.value, o2.value));
};
const make$s = (...elements) => elements;
const allocate = (n) => new Array(n);
const makeBy = /* @__PURE__ */ dual(2, (n, f) => {
  const max = Math.max(1, Math.floor(n));
  const out = new Array(max);
  for (let i = 0; i < max; i++) {
    out[i] = f(i);
  }
  return out;
});
const fromIterable$6 = (collection) => Array.isArray(collection) ? collection : Array.from(collection);
const ensure = (self) => Array.isArray(self) ? self : [self];
const matchLeft = /* @__PURE__ */ dual(2, (self, {
  onEmpty,
  onNonEmpty
}) => isNonEmptyReadonlyArray(self) ? onNonEmpty(headNonEmpty$1(self), tailNonEmpty$1(self)) : onEmpty());
const prepend$2 = /* @__PURE__ */ dual(2, (self, head2) => [head2, ...self]);
const append$1 = /* @__PURE__ */ dual(2, (self, last2) => [...self, last2]);
const appendAll$2 = /* @__PURE__ */ dual(2, (self, that) => fromIterable$6(self).concat(fromIterable$6(that)));
const isArray = Array.isArray;
const isEmptyArray = (self) => self.length === 0;
const isEmptyReadonlyArray = isEmptyArray;
const isNonEmptyArray = isNonEmptyArray$1;
const isNonEmptyReadonlyArray = isNonEmptyArray$1;
const isOutOfBounds = (i, as2) => i < 0 || i >= as2.length;
const clamp = (i, as2) => Math.floor(Math.min(Math.max(0, i), as2.length));
const get$a = /* @__PURE__ */ dual(2, (self, index) => {
  const i = Math.floor(index);
  return isOutOfBounds(i, self) ? none$4() : some(self[i]);
});
const unsafeGet$3 = /* @__PURE__ */ dual(2, (self, index) => {
  const i = Math.floor(index);
  if (isOutOfBounds(i, self)) {
    throw new Error(`Index ${i} out of bounds`);
  }
  return self[i];
});
const head$1 = /* @__PURE__ */ get$a(0);
const headNonEmpty$1 = /* @__PURE__ */ unsafeGet$3(0);
const last = (self) => isNonEmptyReadonlyArray(self) ? some(lastNonEmpty(self)) : none$4();
const lastNonEmpty = (self) => self[self.length - 1];
const tailNonEmpty$1 = (self) => self.slice(1);
const spanIndex = (self, predicate) => {
  let i = 0;
  for (const a of self) {
    if (!predicate(a, i)) {
      break;
    }
    i++;
  }
  return i;
};
const span = /* @__PURE__ */ dual(2, (self, predicate) => splitAt(self, spanIndex(self, predicate)));
const drop$1 = /* @__PURE__ */ dual(2, (self, n) => {
  const input = fromIterable$6(self);
  return input.slice(clamp(n, input), input.length);
});
const reverse$2 = (self) => Array.from(self).reverse();
const sort = /* @__PURE__ */ dual(2, (self, O) => {
  const out = Array.from(self);
  out.sort(O);
  return out;
});
const zip$1 = /* @__PURE__ */ dual(2, (self, that) => zipWith$2(self, that, make$s));
const zipWith$2 = /* @__PURE__ */ dual(3, (self, that, f) => {
  const as2 = fromIterable$6(self);
  const bs = fromIterable$6(that);
  if (isNonEmptyReadonlyArray(as2) && isNonEmptyReadonlyArray(bs)) {
    const out = [f(headNonEmpty$1(as2), headNonEmpty$1(bs))];
    const len = Math.min(as2.length, bs.length);
    for (let i = 1; i < len; i++) {
      out[i] = f(as2[i], bs[i]);
    }
    return out;
  }
  return [];
});
const _equivalence$2 = /* @__PURE__ */ equivalence();
const splitAt = /* @__PURE__ */ dual(2, (self, n) => {
  const input = Array.from(self);
  const _n = Math.floor(n);
  if (isNonEmptyReadonlyArray(input)) {
    if (_n >= 1) {
      return splitNonEmptyAt(input, _n);
    }
    return [[], input];
  }
  return [input, []];
});
const splitNonEmptyAt = /* @__PURE__ */ dual(2, (self, n) => {
  const _n = Math.max(1, Math.floor(n));
  return _n >= self.length ? [copy$1(self), []] : [prepend$2(self.slice(1, _n), headNonEmpty$1(self)), self.slice(_n)];
});
const copy$1 = (self) => self.slice();
const unionWith = /* @__PURE__ */ dual(3, (self, that, isEquivalent) => {
  const a = fromIterable$6(self);
  const b = fromIterable$6(that);
  if (isNonEmptyReadonlyArray(a)) {
    if (isNonEmptyReadonlyArray(b)) {
      const dedupe2 = dedupeWith(isEquivalent);
      return dedupe2(appendAll$2(a, b));
    }
    return a;
  }
  return b;
});
const union$2 = /* @__PURE__ */ dual(2, (self, that) => unionWith(self, that, _equivalence$2));
const empty$l = () => [];
const of$2 = (a) => [a];
const map$6 = /* @__PURE__ */ dual(2, (self, f) => self.map(f));
const flatMap$4 = /* @__PURE__ */ dual(2, (self, f) => {
  if (isEmptyReadonlyArray(self)) {
    return [];
  }
  const out = [];
  for (let i = 0; i < self.length; i++) {
    const inner = f(self[i], i);
    for (let j = 0; j < inner.length; j++) {
      out.push(inner[j]);
    }
  }
  return out;
});
const flatten$3 = /* @__PURE__ */ flatMap$4(identity);
const reduce$6 = /* @__PURE__ */ dual(3, (self, b, f) => fromIterable$6(self).reduce((b2, a, i) => f(b2, a, i), b));
const unfold$1 = (b, f) => {
  const out = [];
  let next = b;
  let o;
  while (isSome(o = f(next))) {
    const [a, b2] = o.value;
    out.push(a);
    next = b2;
  }
  return out;
};
const getEquivalence$2 = array$1;
const dedupeWith = /* @__PURE__ */ dual(2, (self, isEquivalent) => {
  const input = fromIterable$6(self);
  if (isNonEmptyReadonlyArray(input)) {
    const out = [headNonEmpty$1(input)];
    const rest = tailNonEmpty$1(input);
    for (const r of rest) {
      if (out.every((a) => !isEquivalent(r, a))) {
        out.push(r);
      }
    }
    return out;
  }
  return [];
});
const dedupe = (self) => dedupeWith(self, equivalence());
const join$1 = /* @__PURE__ */ dual(2, (self, sep) => fromIterable$6(self).join(sep));
const getKeysForIndexSignature = (input, parameter) => {
  switch (parameter._tag) {
    case "StringKeyword":
    case "TemplateLiteral":
      return Object.keys(input);
    case "SymbolKeyword":
      return Object.getOwnPropertySymbols(input);
    case "Refinement":
      return getKeysForIndexSignature(input, parameter.from);
  }
};
const ownKeys = (o) => Object.keys(o).concat(Object.getOwnPropertySymbols(o));
const memoizeThunk = (f) => {
  let done2 = false;
  let a;
  return () => {
    if (done2) {
      return a;
    }
    a = f();
    done2 = true;
    return a;
  };
};
const formatDate = (date) => {
  try {
    return date.toISOString();
  } catch (e) {
    return String(date);
  }
};
const formatUnknown = (u, checkCircular = true) => {
  if (Array.isArray(u)) {
    return `[${u.map((i) => formatUnknown(i, checkCircular)).join(",")}]`;
  }
  if (isDate(u)) {
    return formatDate(u);
  }
  if (hasProperty(u, "toString") && isFunction(u["toString"]) && u["toString"] !== Object.prototype.toString) {
    return u["toString"]();
  }
  if (isString(u)) {
    return JSON.stringify(u);
  }
  if (isNumber(u) || u == null || isBoolean(u) || isSymbol(u)) {
    return String(u);
  }
  if (isBigInt(u)) {
    return String(u) + "n";
  }
  if (isIterable(u)) {
    return `${u.constructor.name}(${formatUnknown(Array.from(u), checkCircular)})`;
  }
  try {
    if (checkCircular) {
      JSON.stringify(u);
    }
    const pojo = `{${ownKeys(u).map((k) => `${isString(k) ? JSON.stringify(k) : String(k)}:${formatUnknown(u[k], false)}`).join(",")}}`;
    const name = u.constructor.name;
    return u.constructor !== Object.prototype.constructor ? `${name}(${pojo})` : pojo;
  } catch (e) {
    return "<circular structure>";
  }
};
const formatPropertyKey$1 = (name) => typeof name === "string" ? JSON.stringify(name) : String(name);
const isNonEmpty$3 = (x) => Array.isArray(x);
const formatPathKey = (key) => `[${formatPropertyKey$1(key)}]`;
const formatPath = (path) => isNonEmpty$3(path) ? path.map(formatPathKey).join("") : formatPathKey(path);
const getErrorMessage = (reason, details, path, ast) => {
  let out = reason;
  if (path && isNonEmptyReadonlyArray(path)) {
    out += `
at path: ${formatPath(path)}`;
  }
  if (details !== void 0) {
    out += `
details: ${details}`;
  }
  if (ast) {
    out += `
schema (${ast._tag}): ${ast}`;
  }
  return out;
};
const getSchemaExtendErrorMessage = (x, y, path) => getErrorMessage("Unsupported schema or overlapping types", `cannot extend ${x} with ${y}`, path);
const getASTUnsupportedKeySchemaErrorMessage = (ast) => getErrorMessage("Unsupported key schema", void 0, void 0, ast);
const getASTUnsupportedLiteralErrorMessage = (literal) => getErrorMessage("Unsupported literal", `literal value: ${formatUnknown(literal)}`);
const getASTDuplicateIndexSignatureErrorMessage = (type) => getErrorMessage("Duplicate index signature", `${type} index signature`);
const getASTIndexSignatureParameterErrorMessage = /* @__PURE__ */ getErrorMessage("Unsupported index signature parameter", "An index signature parameter type must be `string`, `symbol`, a template literal type or a refinement of the previous types");
const getASTRequiredElementFollowinAnOptionalElementErrorMessage = /* @__PURE__ */ getErrorMessage("Invalid element", "A required element cannot follow an optional element. ts(1257)");
const getASTDuplicatePropertySignatureTransformationErrorMessage = (key) => getErrorMessage("Duplicate property signature transformation", `Duplicate key ${formatUnknown(key)}`);
const getASTDuplicatePropertySignatureErrorMessage = (key) => getErrorMessage("Duplicate property signature", `Duplicate key ${formatUnknown(key)}`);
const DateFromSelfSchemaId$1 = /* @__PURE__ */ Symbol.for("effect/SchemaId/DateFromSelf");
const Order$1 = number;
const escape = (string2) => string2.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
const BrandAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Brand");
const SchemaIdAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/SchemaId");
const MessageAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Message");
const MissingMessageAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/MissingMessage");
const IdentifierAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Identifier");
const TitleAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Title");
const AutoTitleAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/AutoTitle");
const DescriptionAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Description");
const ExamplesAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Examples");
const DefaultAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Default");
const JSONSchemaAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/JSONSchema");
const ArbitraryAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Arbitrary");
const PrettyAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Pretty");
const EquivalenceAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Equivalence");
const DocumentationAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Documentation");
const ConcurrencyAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Concurrency");
const BatchingAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Batching");
const ParseIssueTitleAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/ParseIssueTitle");
const ParseOptionsAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/ParseOptions");
const DecodingFallbackAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/DecodingFallback");
const SurrogateAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/Surrogate");
const StableFilterAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/StableFilter");
const getAnnotation = /* @__PURE__ */ dual(2, (annotated, key) => Object.prototype.hasOwnProperty.call(annotated.annotations, key) ? some(annotated.annotations[key]) : none$4());
const getBrandAnnotation = /* @__PURE__ */ getAnnotation(BrandAnnotationId);
const getMessageAnnotation = /* @__PURE__ */ getAnnotation(MessageAnnotationId);
const getMissingMessageAnnotation = /* @__PURE__ */ getAnnotation(MissingMessageAnnotationId);
const getTitleAnnotation = /* @__PURE__ */ getAnnotation(TitleAnnotationId);
const getAutoTitleAnnotation = /* @__PURE__ */ getAnnotation(AutoTitleAnnotationId);
const getIdentifierAnnotation = /* @__PURE__ */ getAnnotation(IdentifierAnnotationId);
const getDescriptionAnnotation = /* @__PURE__ */ getAnnotation(DescriptionAnnotationId);
const getConcurrencyAnnotation = /* @__PURE__ */ getAnnotation(ConcurrencyAnnotationId);
const getBatchingAnnotation = /* @__PURE__ */ getAnnotation(BatchingAnnotationId);
const getParseIssueTitleAnnotation$1 = /* @__PURE__ */ getAnnotation(ParseIssueTitleAnnotationId);
const getParseOptionsAnnotation = /* @__PURE__ */ getAnnotation(ParseOptionsAnnotationId);
const getDecodingFallbackAnnotation = /* @__PURE__ */ getAnnotation(DecodingFallbackAnnotationId);
const getSurrogateAnnotation = /* @__PURE__ */ getAnnotation(SurrogateAnnotationId);
const getStableFilterAnnotation = /* @__PURE__ */ getAnnotation(StableFilterAnnotationId);
const hasStableFilter = (annotated) => exists(getStableFilterAnnotation(annotated), (b) => b === true);
const JSONIdentifierAnnotationId = /* @__PURE__ */ Symbol.for("effect/annotation/JSONIdentifier");
const getJSONIdentifierAnnotation = /* @__PURE__ */ getAnnotation(JSONIdentifierAnnotationId);
const getJSONIdentifier = (annotated) => orElse$3(getJSONIdentifierAnnotation(annotated), () => getIdentifierAnnotation(annotated));
class Declaration {
  typeParameters;
  decodeUnknown;
  encodeUnknown;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "Declaration";
  constructor(typeParameters, decodeUnknown2, encodeUnknown2, annotations2 = {}) {
    this.typeParameters = typeParameters;
    this.decodeUnknown = decodeUnknown2;
    this.encodeUnknown = encodeUnknown2;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => "<declaration schema>");
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      typeParameters: this.typeParameters.map((ast) => ast.toJSON()),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const createASTGuard = (tag) => (ast) => ast._tag === tag;
let Literal$1 = class Literal {
  literal;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "Literal";
  constructor(literal, annotations2 = {}) {
    this.literal = literal;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => formatUnknown(this.literal));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      literal: isBigInt(this.literal) ? String(this.literal) : this.literal,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
};
const isLiteral = /* @__PURE__ */ createASTGuard("Literal");
const $null = /* @__PURE__ */ new Literal$1(null);
class UniqueSymbol {
  symbol;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "UniqueSymbol";
  constructor(symbol2, annotations2 = {}) {
    this.symbol = symbol2;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => formatUnknown(this.symbol));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      symbol: String(this.symbol),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
class UndefinedKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "UndefinedKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const undefinedKeyword = /* @__PURE__ */ new UndefinedKeyword({
  [TitleAnnotationId]: "undefined"
});
class NeverKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "NeverKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const neverKeyword = /* @__PURE__ */ new NeverKeyword({
  [TitleAnnotationId]: "never"
});
class UnknownKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "UnknownKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const unknownKeyword = /* @__PURE__ */ new UnknownKeyword({
  [TitleAnnotationId]: "unknown"
});
class AnyKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "AnyKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const anyKeyword = /* @__PURE__ */ new AnyKeyword({
  [TitleAnnotationId]: "any"
});
class StringKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "StringKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const stringKeyword = /* @__PURE__ */ new StringKeyword({
  [TitleAnnotationId]: "string",
  [DescriptionAnnotationId]: "a string"
});
const isStringKeyword = /* @__PURE__ */ createASTGuard("StringKeyword");
class NumberKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "NumberKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const numberKeyword = /* @__PURE__ */ new NumberKeyword({
  [TitleAnnotationId]: "number",
  [DescriptionAnnotationId]: "a number"
});
const isNumberKeyword = /* @__PURE__ */ createASTGuard("NumberKeyword");
class BooleanKeyword {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "BooleanKeyword";
  constructor(annotations2 = {}) {
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return formatKeyword(this);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const booleanKeyword = /* @__PURE__ */ new BooleanKeyword({
  [TitleAnnotationId]: "boolean",
  [DescriptionAnnotationId]: "a boolean"
});
const isBooleanKeyword = /* @__PURE__ */ createASTGuard("BooleanKeyword");
const isSymbolKeyword = /* @__PURE__ */ createASTGuard("SymbolKeyword");
let Type$1 = class Type {
  type;
  annotations;
  constructor(type, annotations2 = {}) {
    this.type = type;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      type: this.type.toJSON(),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return String(this.type);
  }
};
class OptionalType extends Type$1 {
  isOptional;
  constructor(type, isOptional, annotations2 = {}) {
    super(type, annotations2);
    this.isOptional = isOptional;
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      type: this.type.toJSON(),
      isOptional: this.isOptional,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return String(this.type) + (this.isOptional ? "?" : "");
  }
}
const getRestASTs = (rest) => rest.map((annotatedAST) => annotatedAST.type);
class TupleType {
  elements;
  rest;
  isReadonly;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "TupleType";
  constructor(elements, rest, isReadonly, annotations2 = {}) {
    this.elements = elements;
    this.rest = rest;
    this.isReadonly = isReadonly;
    this.annotations = annotations2;
    let hasOptionalElement = false;
    let hasIllegalRequiredElement = false;
    for (const e of elements) {
      if (e.isOptional) {
        hasOptionalElement = true;
      } else if (hasOptionalElement) {
        hasIllegalRequiredElement = true;
        break;
      }
    }
    if (hasIllegalRequiredElement || hasOptionalElement && rest.length > 1) {
      throw new Error(getASTRequiredElementFollowinAnOptionalElementErrorMessage);
    }
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => formatTuple(this));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      elements: this.elements.map((e) => e.toJSON()),
      rest: this.rest.map((ast) => ast.toJSON()),
      isReadonly: this.isReadonly,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const formatTuple = (ast) => {
  const formattedElements = ast.elements.map(String).join(", ");
  return matchLeft(ast.rest, {
    onEmpty: () => `readonly [${formattedElements}]`,
    onNonEmpty: (head2, tail) => {
      const formattedHead = String(head2);
      const wrappedHead = formattedHead.includes(" | ") ? `(${formattedHead})` : formattedHead;
      if (tail.length > 0) {
        const formattedTail = tail.map(String).join(", ");
        if (ast.elements.length > 0) {
          return `readonly [${formattedElements}, ...${wrappedHead}[], ${formattedTail}]`;
        } else {
          return `readonly [...${wrappedHead}[], ${formattedTail}]`;
        }
      } else {
        if (ast.elements.length > 0) {
          return `readonly [${formattedElements}, ...${wrappedHead}[]]`;
        } else {
          return `ReadonlyArray<${formattedHead}>`;
        }
      }
    }
  });
};
class PropertySignature extends OptionalType {
  name;
  isReadonly;
  constructor(name, type, isOptional, isReadonly, annotations2) {
    super(type, isOptional, annotations2);
    this.name = name;
    this.isReadonly = isReadonly;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return (this.isReadonly ? "readonly " : "") + String(this.name) + (this.isOptional ? "?" : "") + ": " + this.type;
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      name: String(this.name),
      type: this.type.toJSON(),
      isOptional: this.isOptional,
      isReadonly: this.isReadonly,
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const isParameter = (ast) => {
  switch (ast._tag) {
    case "StringKeyword":
    case "SymbolKeyword":
    case "TemplateLiteral":
      return true;
    case "Refinement":
      return isParameter(ast.from);
  }
  return false;
};
class IndexSignature {
  type;
  isReadonly;
  /**
   * @since 3.10.0
   */
  parameter;
  constructor(parameter, type, isReadonly) {
    this.type = type;
    this.isReadonly = isReadonly;
    if (isParameter(parameter)) {
      this.parameter = parameter;
    } else {
      throw new Error(getASTIndexSignatureParameterErrorMessage);
    }
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return (this.isReadonly ? "readonly " : "") + `[x: ${this.parameter}]: ${this.type}`;
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      parameter: this.parameter.toJSON(),
      type: this.type.toJSON(),
      isReadonly: this.isReadonly
    };
  }
}
class TypeLiteral {
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "TypeLiteral";
  /**
   * @since 3.10.0
   */
  propertySignatures;
  /**
   * @since 3.10.0
   */
  indexSignatures;
  constructor(propertySignatures, indexSignatures, annotations2 = {}) {
    this.annotations = annotations2;
    const keys2 = {};
    for (let i = 0; i < propertySignatures.length; i++) {
      const name = propertySignatures[i].name;
      if (Object.prototype.hasOwnProperty.call(keys2, name)) {
        throw new Error(getASTDuplicatePropertySignatureErrorMessage(name));
      }
      keys2[name] = null;
    }
    const parameters = {
      string: false,
      symbol: false
    };
    for (let i = 0; i < indexSignatures.length; i++) {
      const encodedParameter = getEncodedParameter(indexSignatures[i].parameter);
      if (isStringKeyword(encodedParameter)) {
        if (parameters.string) {
          throw new Error(getASTDuplicateIndexSignatureErrorMessage("string"));
        }
        parameters.string = true;
      } else if (isSymbolKeyword(encodedParameter)) {
        if (parameters.symbol) {
          throw new Error(getASTDuplicateIndexSignatureErrorMessage("symbol"));
        }
        parameters.symbol = true;
      }
    }
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => formatTypeLiteral(this));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      propertySignatures: this.propertySignatures.map((ps) => ps.toJSON()),
      indexSignatures: this.indexSignatures.map((ps) => ps.toJSON()),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
}
const formatIndexSignatures = (iss) => iss.map(String).join("; ");
const formatTypeLiteral = (ast) => {
  if (ast.propertySignatures.length > 0) {
    const pss = ast.propertySignatures.map(String).join("; ");
    if (ast.indexSignatures.length > 0) {
      return `{ ${pss}; ${formatIndexSignatures(ast.indexSignatures)} }`;
    } else {
      return `{ ${pss} }`;
    }
  } else {
    if (ast.indexSignatures.length > 0) {
      return `{ ${formatIndexSignatures(ast.indexSignatures)} }`;
    } else {
      return "{}";
    }
  }
};
const isTypeLiteral = /* @__PURE__ */ createASTGuard("TypeLiteral");
const sortCandidates = /* @__PURE__ */ sort(/* @__PURE__ */ mapInput(Order$1, (ast) => {
  switch (ast._tag) {
    case "AnyKeyword":
      return 0;
    case "UnknownKeyword":
      return 1;
    case "ObjectKeyword":
      return 2;
    case "StringKeyword":
    case "NumberKeyword":
    case "BooleanKeyword":
    case "BigIntKeyword":
    case "SymbolKeyword":
      return 3;
  }
  return 4;
}));
const literalMap = {
  string: "StringKeyword",
  number: "NumberKeyword",
  boolean: "BooleanKeyword",
  bigint: "BigIntKeyword"
};
const flatten$2 = (candidates) => flatMap$4(candidates, (ast) => isUnion(ast) ? flatten$2(ast.types) : [ast]);
const unify = (candidates) => {
  const cs = sortCandidates(candidates);
  const out = [];
  const uniques = {};
  const literals = [];
  for (const ast of cs) {
    switch (ast._tag) {
      case "NeverKeyword":
        break;
      case "AnyKeyword":
        return [anyKeyword];
      case "UnknownKeyword":
        return [unknownKeyword];
      case "ObjectKeyword":
      case "UndefinedKeyword":
      case "VoidKeyword":
      case "StringKeyword":
      case "NumberKeyword":
      case "BooleanKeyword":
      case "BigIntKeyword":
      case "SymbolKeyword": {
        if (!uniques[ast._tag]) {
          uniques[ast._tag] = ast;
          out.push(ast);
        }
        break;
      }
      case "Literal": {
        const type = typeof ast.literal;
        switch (type) {
          case "string":
          case "number":
          case "bigint":
          case "boolean": {
            const _tag = literalMap[type];
            if (!uniques[_tag] && !literals.includes(ast.literal)) {
              literals.push(ast.literal);
              out.push(ast);
            }
            break;
          }
          case "object": {
            if (!literals.includes(ast.literal)) {
              literals.push(ast.literal);
              out.push(ast);
            }
            break;
          }
        }
        break;
      }
      case "UniqueSymbol": {
        if (!uniques["SymbolKeyword"] && !literals.includes(ast.symbol)) {
          literals.push(ast.symbol);
          out.push(ast);
        }
        break;
      }
      case "TupleType": {
        if (!uniques["ObjectKeyword"]) {
          out.push(ast);
        }
        break;
      }
      case "TypeLiteral": {
        if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
          if (!uniques["{}"]) {
            uniques["{}"] = ast;
            out.push(ast);
          }
        } else if (!uniques["ObjectKeyword"]) {
          out.push(ast);
        }
        break;
      }
      default:
        out.push(ast);
    }
  }
  return out;
};
let Union$1 = class Union {
  types;
  annotations;
  static make = (types, annotations2) => {
    return isMembers(types) ? new Union(types, annotations2) : types.length === 1 ? types[0] : neverKeyword;
  };
  /** @internal */
  static unify = (candidates, annotations2) => {
    return Union.make(unify(flatten$2(candidates)), annotations2);
  };
  /**
   * @since 3.10.0
   */
  _tag = "Union";
  constructor(types, annotations2 = {}) {
    this.types = types;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => this.types.map(String).join(" | "));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      types: this.types.map((ast) => ast.toJSON()),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
};
const mapMembers = (members, f) => members.map(f);
const isMembers = (as2) => as2.length > 1;
const isUnion = /* @__PURE__ */ createASTGuard("Union");
const toJSONMemoMap = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Schema/AST/toJSONMemoMap"), () => /* @__PURE__ */ new WeakMap());
class Suspend {
  f;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "Suspend";
  constructor(f, annotations2 = {}) {
    this.f = f;
    this.annotations = annotations2;
    this.f = memoizeThunk(f);
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getExpected(this).pipe(orElse$3(() => flatMap$5(liftThrowable(this.f)(), (ast) => getExpected(ast))), getOrElse(() => "<suspended schema>"));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    const ast = this.f();
    let out = toJSONMemoMap.get(ast);
    if (out) {
      return out;
    }
    toJSONMemoMap.set(ast, {
      _tag: this._tag
    });
    out = {
      _tag: this._tag,
      ast: ast.toJSON(),
      annotations: toJSONAnnotations(this.annotations)
    };
    toJSONMemoMap.set(ast, out);
    return out;
  }
}
let Refinement$1 = class Refinement {
  from;
  filter;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "Refinement";
  constructor(from, filter2, annotations2 = {}) {
    this.from = from;
    this.filter = filter2;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getIdentifierAnnotation(this).pipe(getOrElse(() => match$5(getOrElseExpected(this), {
      onNone: () => `{ ${this.from} | filter }`,
      onSome: (expected) => isRefinement$1(this.from) ? String(this.from) + " & " + expected : expected
    })));
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      from: this.from.toJSON(),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
};
const isRefinement$1 = /* @__PURE__ */ createASTGuard("Refinement");
const defaultParseOption = {};
let Transformation$1 = class Transformation {
  from;
  to;
  transformation;
  annotations;
  /**
   * @since 3.10.0
   */
  _tag = "Transformation";
  constructor(from, to, transformation, annotations2 = {}) {
    this.from = from;
    this.to = to;
    this.transformation = transformation;
    this.annotations = annotations2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return getOrElse(getExpected(this), () => `(${String(this.from)} <-> ${String(this.to)})`);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _tag: this._tag,
      from: this.from.toJSON(),
      to: this.to.toJSON(),
      annotations: toJSONAnnotations(this.annotations)
    };
  }
};
const isTransformation$1 = /* @__PURE__ */ createASTGuard("Transformation");
class FinalTransformation {
  decode;
  encode;
  /**
   * @since 3.10.0
   */
  _tag = "FinalTransformation";
  constructor(decode2, encode2) {
    this.decode = decode2;
    this.encode = encode2;
  }
}
const createTransformationGuard = (tag) => (ast) => ast._tag === tag;
class ComposeTransformation {
  /**
   * @since 3.10.0
   */
  _tag = "ComposeTransformation";
}
const composeTransformation = /* @__PURE__ */ new ComposeTransformation();
let PropertySignatureTransformation$1 = class PropertySignatureTransformation {
  from;
  to;
  decode;
  encode;
  constructor(from, to, decode2, encode2) {
    this.from = from;
    this.to = to;
    this.decode = decode2;
    this.encode = encode2;
  }
};
class TypeLiteralTransformation {
  propertySignatureTransformations;
  /**
   * @since 3.10.0
   */
  _tag = "TypeLiteralTransformation";
  constructor(propertySignatureTransformations) {
    this.propertySignatureTransformations = propertySignatureTransformations;
    const fromKeys = {};
    const toKeys = {};
    for (const pst of propertySignatureTransformations) {
      const from = pst.from;
      if (fromKeys[from]) {
        throw new Error(getASTDuplicatePropertySignatureTransformationErrorMessage(from));
      }
      fromKeys[from] = true;
      const to = pst.to;
      if (toKeys[to]) {
        throw new Error(getASTDuplicatePropertySignatureTransformationErrorMessage(to));
      }
      toKeys[to] = true;
    }
  }
}
const isTypeLiteralTransformation = /* @__PURE__ */ createTransformationGuard("TypeLiteralTransformation");
const annotations = (ast, overrides) => {
  const d = Object.getOwnPropertyDescriptors(ast);
  const value = {
    ...ast.annotations,
    ...overrides
  };
  const surrogate = getSurrogateAnnotation(ast);
  if (isSome(surrogate)) {
    value[SurrogateAnnotationId] = annotations(surrogate.value, overrides);
  }
  d.annotations.value = value;
  return Object.create(Object.getPrototypeOf(ast), d);
};
const STRING_KEYWORD_PATTERN = "[\\s\\S]*";
const NUMBER_KEYWORD_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
const getTemplateLiteralSpanTypePattern = (type, capture2) => {
  switch (type._tag) {
    case "Literal":
      return escape(String(type.literal));
    case "StringKeyword":
      return STRING_KEYWORD_PATTERN;
    case "NumberKeyword":
      return NUMBER_KEYWORD_PATTERN;
    case "TemplateLiteral":
      return getTemplateLiteralPattern(type);
    case "Union":
      return type.types.map((type2) => getTemplateLiteralSpanTypePattern(type2)).join("|");
  }
};
const handleTemplateLiteralSpanTypeParens = (type, s, capture2, top) => {
  if (isUnion(type)) ;
  else {
    return s;
  }
  return `(${s})`;
};
const getTemplateLiteralPattern = (ast, capture2, top) => {
  let pattern = ``;
  if (ast.head !== "") {
    const head2 = escape(ast.head);
    pattern += head2;
  }
  for (const span2 of ast.spans) {
    const spanPattern = getTemplateLiteralSpanTypePattern(span2.type);
    pattern += handleTemplateLiteralSpanTypeParens(span2.type, spanPattern);
    if (span2.literal !== "") {
      const literal = escape(span2.literal);
      pattern += literal;
    }
  }
  return pattern;
};
const getTemplateLiteralRegExp = (ast) => new RegExp(`^${getTemplateLiteralPattern(ast)}$`);
const record = (key, value) => {
  const propertySignatures = [];
  const indexSignatures = [];
  const go2 = (key2) => {
    switch (key2._tag) {
      case "NeverKeyword":
        break;
      case "StringKeyword":
      case "SymbolKeyword":
      case "TemplateLiteral":
      case "Refinement":
        indexSignatures.push(new IndexSignature(key2, value, true));
        break;
      case "Literal":
        if (isString(key2.literal) || isNumber(key2.literal)) {
          propertySignatures.push(new PropertySignature(key2.literal, value, false, true));
        } else {
          throw new Error(getASTUnsupportedLiteralErrorMessage(key2.literal));
        }
        break;
      case "Enums": {
        for (const [_, name] of key2.enums) {
          propertySignatures.push(new PropertySignature(name, value, false, true));
        }
        break;
      }
      case "UniqueSymbol":
        propertySignatures.push(new PropertySignature(key2.symbol, value, false, true));
        break;
      case "Union":
        key2.types.forEach(go2);
        break;
      default:
        throw new Error(getASTUnsupportedKeySchemaErrorMessage(key2));
    }
  };
  go2(key);
  return {
    propertySignatures,
    indexSignatures
  };
};
const mutable$1 = (ast) => {
  switch (ast._tag) {
    case "TupleType":
      return ast.isReadonly === false ? ast : new TupleType(ast.elements, ast.rest, false, ast.annotations);
    case "TypeLiteral": {
      const propertySignatures = changeMap(ast.propertySignatures, (ps) => ps.isReadonly === false ? ps : new PropertySignature(ps.name, ps.type, ps.isOptional, false, ps.annotations));
      const indexSignatures = changeMap(ast.indexSignatures, (is2) => is2.isReadonly === false ? is2 : new IndexSignature(is2.parameter, is2.type, false));
      return propertySignatures === ast.propertySignatures && indexSignatures === ast.indexSignatures ? ast : new TypeLiteral(propertySignatures, indexSignatures, ast.annotations);
    }
    case "Union": {
      const types = changeMap(ast.types, mutable$1);
      return types === ast.types ? ast : Union$1.make(types, ast.annotations);
    }
    case "Suspend":
      return new Suspend(() => mutable$1(ast.f()), ast.annotations);
    case "Refinement": {
      const from = mutable$1(ast.from);
      return from === ast.from ? ast : new Refinement$1(from, ast.filter, ast.annotations);
    }
    case "Transformation": {
      const from = mutable$1(ast.from);
      const to = mutable$1(ast.to);
      return from === ast.from && to === ast.to ? ast : new Transformation$1(from, to, ast.transformation, ast.annotations);
    }
  }
  return ast;
};
const pickAnnotations = (annotationIds) => (annotated) => {
  let out = void 0;
  for (const id of annotationIds) {
    if (Object.prototype.hasOwnProperty.call(annotated.annotations, id)) {
      if (out === void 0) {
        out = {};
      }
      out[id] = annotated.annotations[id];
    }
  }
  return out;
};
const omitAnnotations = (annotationIds) => (annotated) => {
  const out = {
    ...annotated.annotations
  };
  for (const id of annotationIds) {
    delete out[id];
  }
  return out;
};
const preserveTransformationAnnotations = /* @__PURE__ */ pickAnnotations([ExamplesAnnotationId, DefaultAnnotationId, JSONSchemaAnnotationId, ArbitraryAnnotationId, PrettyAnnotationId, EquivalenceAnnotationId]);
const typeAST = (ast) => {
  switch (ast._tag) {
    case "Declaration": {
      const typeParameters = changeMap(ast.typeParameters, typeAST);
      return typeParameters === ast.typeParameters ? ast : new Declaration(typeParameters, ast.decodeUnknown, ast.encodeUnknown, ast.annotations);
    }
    case "TupleType": {
      const elements = changeMap(ast.elements, (e) => {
        const type = typeAST(e.type);
        return type === e.type ? e : new OptionalType(type, e.isOptional);
      });
      const restASTs = getRestASTs(ast.rest);
      const rest = changeMap(restASTs, typeAST);
      return elements === ast.elements && rest === restASTs ? ast : new TupleType(elements, rest.map((type) => new Type$1(type)), ast.isReadonly, ast.annotations);
    }
    case "TypeLiteral": {
      const propertySignatures = changeMap(ast.propertySignatures, (p) => {
        const type = typeAST(p.type);
        return type === p.type ? p : new PropertySignature(p.name, type, p.isOptional, p.isReadonly);
      });
      const indexSignatures = changeMap(ast.indexSignatures, (is2) => {
        const type = typeAST(is2.type);
        return type === is2.type ? is2 : new IndexSignature(is2.parameter, type, is2.isReadonly);
      });
      return propertySignatures === ast.propertySignatures && indexSignatures === ast.indexSignatures ? ast : new TypeLiteral(propertySignatures, indexSignatures, ast.annotations);
    }
    case "Union": {
      const types = changeMap(ast.types, typeAST);
      return types === ast.types ? ast : Union$1.make(types, ast.annotations);
    }
    case "Suspend":
      return new Suspend(() => typeAST(ast.f()), ast.annotations);
    case "Refinement": {
      const from = typeAST(ast.from);
      return from === ast.from ? ast : new Refinement$1(from, ast.filter, ast.annotations);
    }
    case "Transformation": {
      const preserve = preserveTransformationAnnotations(ast);
      return typeAST(preserve !== void 0 ? annotations(ast.to, preserve) : ast.to);
    }
  }
  return ast;
};
const createJSONIdentifierAnnotation = (annotated) => match$5(getJSONIdentifier(annotated), {
  onNone: () => void 0,
  onSome: (identifier2) => ({
    [JSONIdentifierAnnotationId]: identifier2
  })
});
function changeMap(as2, f) {
  let changed = false;
  const out = allocate(as2.length);
  for (let i = 0; i < as2.length; i++) {
    const a = as2[i];
    const fa = f(a);
    if (fa !== a) {
      changed = true;
    }
    out[i] = fa;
  }
  return changed ? out : as2;
}
const encodedAST_ = (ast, isBound) => {
  switch (ast._tag) {
    case "Declaration": {
      const typeParameters = changeMap(ast.typeParameters, (ast2) => encodedAST_(ast2));
      return typeParameters === ast.typeParameters ? ast : new Declaration(typeParameters, ast.decodeUnknown, ast.encodeUnknown, ast.annotations);
    }
    case "TupleType": {
      const elements = changeMap(ast.elements, (e) => {
        const type = encodedAST_(e.type);
        return type === e.type ? e : new OptionalType(type, e.isOptional);
      });
      const restASTs = getRestASTs(ast.rest);
      const rest = changeMap(restASTs, (ast2) => encodedAST_(ast2));
      return elements === ast.elements && rest === restASTs ? ast : new TupleType(elements, rest.map((ast2) => new Type$1(ast2)), ast.isReadonly, createJSONIdentifierAnnotation(ast));
    }
    case "TypeLiteral": {
      const propertySignatures = changeMap(ast.propertySignatures, (ps) => {
        const type = encodedAST_(ps.type);
        return type === ps.type ? ps : new PropertySignature(ps.name, type, ps.isOptional, ps.isReadonly);
      });
      const indexSignatures = changeMap(ast.indexSignatures, (is2) => {
        const type = encodedAST_(is2.type);
        return type === is2.type ? is2 : new IndexSignature(is2.parameter, type, is2.isReadonly);
      });
      return propertySignatures === ast.propertySignatures && indexSignatures === ast.indexSignatures ? ast : new TypeLiteral(propertySignatures, indexSignatures, createJSONIdentifierAnnotation(ast));
    }
    case "Union": {
      const types = changeMap(ast.types, (ast2) => encodedAST_(ast2));
      return types === ast.types ? ast : Union$1.make(types, createJSONIdentifierAnnotation(ast));
    }
    case "Suspend":
      return new Suspend(() => encodedAST_(ast.f()), createJSONIdentifierAnnotation(ast));
    case "Refinement": {
      const from = encodedAST_(ast.from);
      const identifier2 = createJSONIdentifierAnnotation(ast);
      return identifier2 ? annotations(from, identifier2) : from;
    }
    case "Transformation": {
      const identifier2 = createJSONIdentifierAnnotation(ast);
      return encodedAST_(identifier2 ? annotations(ast.from, identifier2) : ast.from);
    }
  }
  return ast;
};
const encodedAST = (ast) => encodedAST_(ast);
const toJSONAnnotations = (annotations2) => {
  const out = {};
  for (const k of Object.getOwnPropertySymbols(annotations2)) {
    out[String(k)] = annotations2[k];
  }
  return out;
};
const getEncodedParameter = (ast) => {
  switch (ast._tag) {
    case "StringKeyword":
    case "SymbolKeyword":
    case "TemplateLiteral":
      return ast;
    case "Refinement":
      return getEncodedParameter(ast.from);
  }
};
const formatKeyword = (ast) => getOrElse(getExpected(ast), () => ast._tag);
function getBrands(ast) {
  return match$5(getBrandAnnotation(ast), {
    onNone: () => "",
    onSome: (brands) => brands.map((brand) => ` & Brand<${formatUnknown(brand)}>`).join("")
  });
}
const getOrElseExpected = (ast) => getTitleAnnotation(ast).pipe(orElse$3(() => getDescriptionAnnotation(ast)), orElse$3(() => getAutoTitleAnnotation(ast)), map$7((s) => s + getBrands(ast)));
const getExpected = (ast) => orElse$3(getIdentifierAnnotation(ast), () => getOrElseExpected(ast));
const TagTypeId = /* @__PURE__ */ Symbol.for("effect/Context/Tag");
const ReferenceTypeId = /* @__PURE__ */ Symbol.for("effect/Context/Reference");
const STMSymbolKey = "effect/STM";
const STMTypeId = /* @__PURE__ */ Symbol.for(STMSymbolKey);
const TagProto = {
  ...EffectPrototype$1,
  _op: "Tag",
  [STMTypeId]: effectVariance,
  [TagTypeId]: {
    _Service: (_) => _,
    _Identifier: (_) => _
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "Tag",
      key: this.key,
      stack: this.stack
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  of(self) {
    return self;
  },
  context(self) {
    return make$r(this, self);
  }
};
const ReferenceProto = {
  ...TagProto,
  [ReferenceTypeId]: ReferenceTypeId
};
const makeGenericTag = (key) => {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  const creationError = new Error();
  Error.stackTraceLimit = limit;
  const tag = Object.create(TagProto);
  Object.defineProperty(tag, "stack", {
    get() {
      return creationError.stack;
    }
  });
  tag.key = key;
  return tag;
};
const Tag$1 = (id) => () => {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  const creationError = new Error();
  Error.stackTraceLimit = limit;
  function TagClass() {
  }
  Object.setPrototypeOf(TagClass, TagProto);
  TagClass.key = id;
  Object.defineProperty(TagClass, "stack", {
    get() {
      return creationError.stack;
    }
  });
  return TagClass;
};
const Reference$1 = () => (id, options) => {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  const creationError = new Error();
  Error.stackTraceLimit = limit;
  function ReferenceClass() {
  }
  Object.setPrototypeOf(ReferenceClass, ReferenceProto);
  ReferenceClass.key = id;
  ReferenceClass.defaultValue = options.defaultValue;
  Object.defineProperty(ReferenceClass, "stack", {
    get() {
      return creationError.stack;
    }
  });
  return ReferenceClass;
};
const TypeId$a = /* @__PURE__ */ Symbol.for("effect/Context");
const ContextProto = {
  [TypeId$a]: {
    _Services: (_) => _
  },
  [symbol](that) {
    if (isContext$1(that)) {
      if (this.unsafeMap.size === that.unsafeMap.size) {
        for (const k of this.unsafeMap.keys()) {
          if (!that.unsafeMap.has(k) || !equals$1(this.unsafeMap.get(k), that.unsafeMap.get(k))) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  },
  [symbol$1]() {
    return cached(this, number$1(this.unsafeMap.size));
  },
  pipe() {
    return pipeArguments(this, arguments);
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.unsafeMap).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
const makeContext = (unsafeMap) => {
  const context2 = Object.create(ContextProto);
  context2.unsafeMap = unsafeMap;
  return context2;
};
const serviceNotFoundError = (tag) => {
  const error = new Error(`Service not found${tag.key ? `: ${String(tag.key)}` : ""}`);
  if (tag.stack) {
    const lines = tag.stack.split("\n");
    if (lines.length > 2) {
      const afterAt = lines[2].match(/at (.*)/);
      if (afterAt) {
        error.message = error.message + ` (defined at ${afterAt[1]})`;
      }
    }
  }
  if (error.stack) {
    const lines = error.stack.split("\n");
    lines.splice(1, 3);
    error.stack = lines.join("\n");
  }
  return error;
};
const isContext$1 = (u) => hasProperty(u, TypeId$a);
const isTag$1 = (u) => hasProperty(u, TagTypeId);
const isReference = (u) => hasProperty(u, ReferenceTypeId);
const _empty$6 = /* @__PURE__ */ makeContext(/* @__PURE__ */ new Map());
const empty$k = () => _empty$6;
const make$r = (tag, service) => makeContext(/* @__PURE__ */ new Map([[tag.key, service]]));
const add$3 = /* @__PURE__ */ dual(3, (self, tag, service) => {
  const map2 = new Map(self.unsafeMap);
  map2.set(tag.key, service);
  return makeContext(map2);
});
const defaultValueCache = /* @__PURE__ */ globalValue("effect/Context/defaultValueCache", () => /* @__PURE__ */ new Map());
const getDefaultValue = (tag) => {
  if (defaultValueCache.has(tag.key)) {
    return defaultValueCache.get(tag.key);
  }
  const value = tag.defaultValue();
  defaultValueCache.set(tag.key, value);
  return value;
};
const unsafeGetReference = (self, tag) => {
  return self.unsafeMap.has(tag.key) ? self.unsafeMap.get(tag.key) : getDefaultValue(tag);
};
const unsafeGet$2 = /* @__PURE__ */ dual(2, (self, tag) => {
  if (!self.unsafeMap.has(tag.key)) {
    if (ReferenceTypeId in tag) return getDefaultValue(tag);
    throw serviceNotFoundError(tag);
  }
  return self.unsafeMap.get(tag.key);
});
const get$9 = unsafeGet$2;
const getOption$1 = /* @__PURE__ */ dual(2, (self, tag) => {
  if (!self.unsafeMap.has(tag.key)) {
    return isReference(tag) ? some$1(getDefaultValue(tag)) : none$5;
  }
  return some$1(self.unsafeMap.get(tag.key));
});
const merge$4 = /* @__PURE__ */ dual(2, (self, that) => {
  const map2 = new Map(self.unsafeMap);
  for (const [tag, s] of that.unsafeMap) {
    map2.set(tag, s);
  }
  return makeContext(map2);
});
const GenericTag = makeGenericTag;
const isContext = isContext$1;
const isTag = isTag$1;
const empty$j = empty$k;
const make$q = make$r;
const add$2 = add$3;
const get$8 = get$9;
const unsafeGet$1 = unsafeGet$2;
const getOption = getOption$1;
const merge$3 = merge$4;
const Tag = Tag$1;
const Reference = Reference$1;
const TypeId$9 = /* @__PURE__ */ Symbol.for("effect/Chunk");
function copy(src, srcPos, dest, destPos, len) {
  for (let i = srcPos; i < Math.min(src.length, srcPos + len); i++) {
    dest[destPos + i - srcPos] = src[i];
  }
  return dest;
}
const emptyArray = [];
const getEquivalence$1 = (isEquivalent) => make$u((self, that) => self.length === that.length && toReadonlyArray(self).every((value, i) => isEquivalent(value, unsafeGet(that, i))));
const _equivalence$1 = /* @__PURE__ */ getEquivalence$1(equals$1);
const ChunkProto = {
  [TypeId$9]: {
    _A: (_) => _
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "Chunk",
      values: toReadonlyArray(this).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  [symbol](that) {
    return isChunk(that) && _equivalence$1(this, that);
  },
  [symbol$1]() {
    return cached(this, array(toReadonlyArray(this)));
  },
  [Symbol.iterator]() {
    switch (this.backing._tag) {
      case "IArray": {
        return this.backing.array[Symbol.iterator]();
      }
      case "IEmpty": {
        return emptyArray[Symbol.iterator]();
      }
      default: {
        return toReadonlyArray(this)[Symbol.iterator]();
      }
    }
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeChunk = (backing) => {
  const chunk = Object.create(ChunkProto);
  chunk.backing = backing;
  switch (backing._tag) {
    case "IEmpty": {
      chunk.length = 0;
      chunk.depth = 0;
      chunk.left = chunk;
      chunk.right = chunk;
      break;
    }
    case "IConcat": {
      chunk.length = backing.left.length + backing.right.length;
      chunk.depth = 1 + Math.max(backing.left.depth, backing.right.depth);
      chunk.left = backing.left;
      chunk.right = backing.right;
      break;
    }
    case "IArray": {
      chunk.length = backing.array.length;
      chunk.depth = 0;
      chunk.left = _empty$5;
      chunk.right = _empty$5;
      break;
    }
    case "ISingleton": {
      chunk.length = 1;
      chunk.depth = 0;
      chunk.left = _empty$5;
      chunk.right = _empty$5;
      break;
    }
    case "ISlice": {
      chunk.length = backing.length;
      chunk.depth = backing.chunk.depth + 1;
      chunk.left = _empty$5;
      chunk.right = _empty$5;
      break;
    }
  }
  return chunk;
};
const isChunk = (u) => hasProperty(u, TypeId$9);
const _empty$5 = /* @__PURE__ */ makeChunk({
  _tag: "IEmpty"
});
const empty$i = () => _empty$5;
const make$p = (...as2) => unsafeFromNonEmptyArray(as2);
const of$1 = (a) => makeChunk({
  _tag: "ISingleton",
  a
});
const fromIterable$5 = (self) => isChunk(self) ? self : unsafeFromArray(fromIterable$6(self));
const copyToArray = (self, array2, initial) => {
  switch (self.backing._tag) {
    case "IArray": {
      copy(self.backing.array, 0, array2, initial, self.length);
      break;
    }
    case "IConcat": {
      copyToArray(self.left, array2, initial);
      copyToArray(self.right, array2, initial + self.left.length);
      break;
    }
    case "ISingleton": {
      array2[initial] = self.backing.a;
      break;
    }
    case "ISlice": {
      let i = 0;
      let j = initial;
      while (i < self.length) {
        array2[j] = unsafeGet(self, i);
        i += 1;
        j += 1;
      }
      break;
    }
  }
};
const toReadonlyArray_ = (self) => {
  switch (self.backing._tag) {
    case "IEmpty": {
      return emptyArray;
    }
    case "IArray": {
      return self.backing.array;
    }
    default: {
      const arr = new Array(self.length);
      copyToArray(self, arr, 0);
      self.backing = {
        _tag: "IArray",
        array: arr
      };
      self.left = _empty$5;
      self.right = _empty$5;
      self.depth = 0;
      return arr;
    }
  }
};
const toReadonlyArray = toReadonlyArray_;
const reverseChunk = (self) => {
  switch (self.backing._tag) {
    case "IEmpty":
    case "ISingleton":
      return self;
    case "IArray": {
      return makeChunk({
        _tag: "IArray",
        array: reverse$2(self.backing.array)
      });
    }
    case "IConcat": {
      return makeChunk({
        _tag: "IConcat",
        left: reverse$1(self.backing.right),
        right: reverse$1(self.backing.left)
      });
    }
    case "ISlice":
      return unsafeFromArray(reverse$2(toReadonlyArray(self)));
  }
};
const reverse$1 = reverseChunk;
const get$7 = /* @__PURE__ */ dual(2, (self, index) => index < 0 || index >= self.length ? none$4() : some(unsafeGet(self, index)));
const unsafeFromArray = (self) => self.length === 0 ? empty$i() : self.length === 1 ? of$1(self[0]) : makeChunk({
  _tag: "IArray",
  array: self
});
const unsafeFromNonEmptyArray = (self) => unsafeFromArray(self);
const unsafeGet = /* @__PURE__ */ dual(2, (self, index) => {
  switch (self.backing._tag) {
    case "IEmpty": {
      throw new Error(`Index out of bounds`);
    }
    case "ISingleton": {
      if (index !== 0) {
        throw new Error(`Index out of bounds`);
      }
      return self.backing.a;
    }
    case "IArray": {
      if (index >= self.length || index < 0) {
        throw new Error(`Index out of bounds`);
      }
      return self.backing.array[index];
    }
    case "IConcat": {
      return index < self.left.length ? unsafeGet(self.left, index) : unsafeGet(self.right, index - self.left.length);
    }
    case "ISlice": {
      return unsafeGet(self.backing.chunk, index + self.backing.offset);
    }
  }
});
const append = /* @__PURE__ */ dual(2, (self, a) => appendAll$1(self, of$1(a)));
const prepend$1 = /* @__PURE__ */ dual(2, (self, elem) => appendAll$1(of$1(elem), self));
const drop = /* @__PURE__ */ dual(2, (self, n) => {
  if (n <= 0) {
    return self;
  } else if (n >= self.length) {
    return _empty$5;
  } else {
    switch (self.backing._tag) {
      case "ISlice": {
        return makeChunk({
          _tag: "ISlice",
          chunk: self.backing.chunk,
          offset: self.backing.offset + n,
          length: self.backing.length - n
        });
      }
      case "IConcat": {
        if (n > self.left.length) {
          return drop(self.right, n - self.left.length);
        }
        return makeChunk({
          _tag: "IConcat",
          left: drop(self.left, n),
          right: self.right
        });
      }
      default: {
        return makeChunk({
          _tag: "ISlice",
          chunk: self,
          offset: n,
          length: self.length - n
        });
      }
    }
  }
});
const appendAll$1 = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.backing._tag === "IEmpty") {
    return that;
  }
  if (that.backing._tag === "IEmpty") {
    return self;
  }
  const diff2 = that.depth - self.depth;
  if (Math.abs(diff2) <= 1) {
    return makeChunk({
      _tag: "IConcat",
      left: self,
      right: that
    });
  } else if (diff2 < -1) {
    if (self.left.depth >= self.right.depth) {
      const nr = appendAll$1(self.right, that);
      return makeChunk({
        _tag: "IConcat",
        left: self.left,
        right: nr
      });
    } else {
      const nrr = appendAll$1(self.right.right, that);
      if (nrr.depth === self.depth - 3) {
        const nr = makeChunk({
          _tag: "IConcat",
          left: self.right.left,
          right: nrr
        });
        return makeChunk({
          _tag: "IConcat",
          left: self.left,
          right: nr
        });
      } else {
        const nl = makeChunk({
          _tag: "IConcat",
          left: self.left,
          right: self.right.left
        });
        return makeChunk({
          _tag: "IConcat",
          left: nl,
          right: nrr
        });
      }
    }
  } else {
    if (that.right.depth >= that.left.depth) {
      const nl = appendAll$1(self, that.left);
      return makeChunk({
        _tag: "IConcat",
        left: nl,
        right: that.right
      });
    } else {
      const nll = appendAll$1(self, that.left.left);
      if (nll.depth === that.depth - 3) {
        const nl = makeChunk({
          _tag: "IConcat",
          left: nll,
          right: that.left.right
        });
        return makeChunk({
          _tag: "IConcat",
          left: nl,
          right: that.right
        });
      } else {
        const nr = makeChunk({
          _tag: "IConcat",
          left: that.left.right,
          right: that.right
        });
        return makeChunk({
          _tag: "IConcat",
          left: nll,
          right: nr
        });
      }
    }
  }
});
const isEmpty$5 = (self) => self.length === 0;
const isNonEmpty$2 = (self) => self.length > 0;
const head = /* @__PURE__ */ get$7(0);
const unsafeHead = (self) => unsafeGet(self, 0);
const headNonEmpty = unsafeHead;
const tailNonEmpty = (self) => drop(self, 1);
const TypeId$8 = /* @__PURE__ */ Symbol.for("effect/Duration");
const bigint0$1 = /* @__PURE__ */ BigInt(0);
const bigint24 = /* @__PURE__ */ BigInt(24);
const bigint60 = /* @__PURE__ */ BigInt(60);
const bigint1e3 = /* @__PURE__ */ BigInt(1e3);
const bigint1e6 = /* @__PURE__ */ BigInt(1e6);
const bigint1e9 = /* @__PURE__ */ BigInt(1e9);
const DURATION_REGEX = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/;
const decode = (input) => {
  if (isDuration(input)) {
    return input;
  } else if (isNumber(input)) {
    return millis(input);
  } else if (isBigInt(input)) {
    return nanos(input);
  } else if (Array.isArray(input) && input.length === 2 && input.every(isNumber)) {
    if (input[0] === -Infinity || input[1] === -Infinity || Number.isNaN(input[0]) || Number.isNaN(input[1])) {
      return zero;
    }
    if (input[0] === Infinity || input[1] === Infinity) {
      return infinity;
    }
    return nanos(BigInt(Math.round(input[0] * 1e9)) + BigInt(Math.round(input[1])));
  } else if (isString(input)) {
    const match2 = DURATION_REGEX.exec(input);
    if (match2) {
      const [_, valueStr, unit] = match2;
      const value = Number(valueStr);
      switch (unit) {
        case "nano":
        case "nanos":
          return nanos(BigInt(valueStr));
        case "micro":
        case "micros":
          return micros(BigInt(valueStr));
        case "milli":
        case "millis":
          return millis(value);
        case "second":
        case "seconds":
          return seconds(value);
        case "minute":
        case "minutes":
          return minutes(value);
        case "hour":
        case "hours":
          return hours(value);
        case "day":
        case "days":
          return days(value);
        case "week":
        case "weeks":
          return weeks(value);
      }
    }
  }
  throw new Error("Invalid DurationInput");
};
const zeroValue = {
  _tag: "Millis",
  millis: 0
};
const infinityValue = {
  _tag: "Infinity"
};
const DurationProto = {
  [TypeId$8]: TypeId$8,
  [symbol$1]() {
    return cached(this, structure(this.value));
  },
  [symbol](that) {
    return isDuration(that) && equals(this, that);
  },
  toString() {
    return `Duration(${format$2(this)})`;
  },
  toJSON() {
    switch (this.value._tag) {
      case "Millis":
        return {
          _id: "Duration",
          _tag: "Millis",
          millis: this.value.millis
        };
      case "Nanos":
        return {
          _id: "Duration",
          _tag: "Nanos",
          hrtime: toHrTime(this)
        };
      case "Infinity":
        return {
          _id: "Duration",
          _tag: "Infinity"
        };
    }
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const make$o = (input) => {
  const duration = Object.create(DurationProto);
  if (isNumber(input)) {
    if (isNaN(input) || input <= 0) {
      duration.value = zeroValue;
    } else if (!Number.isFinite(input)) {
      duration.value = infinityValue;
    } else if (!Number.isInteger(input)) {
      duration.value = {
        _tag: "Nanos",
        nanos: BigInt(Math.round(input * 1e6))
      };
    } else {
      duration.value = {
        _tag: "Millis",
        millis: input
      };
    }
  } else if (input <= bigint0$1) {
    duration.value = zeroValue;
  } else {
    duration.value = {
      _tag: "Nanos",
      nanos: input
    };
  }
  return duration;
};
const isDuration = (u) => hasProperty(u, TypeId$8);
const isZero = (self) => {
  switch (self.value._tag) {
    case "Millis": {
      return self.value.millis === 0;
    }
    case "Nanos": {
      return self.value.nanos === bigint0$1;
    }
    case "Infinity": {
      return false;
    }
  }
};
const zero = /* @__PURE__ */ make$o(0);
const infinity = /* @__PURE__ */ make$o(Infinity);
const nanos = (nanos2) => make$o(nanos2);
const micros = (micros2) => make$o(micros2 * bigint1e3);
const millis = (millis2) => make$o(millis2);
const seconds = (seconds2) => make$o(seconds2 * 1e3);
const minutes = (minutes2) => make$o(minutes2 * 6e4);
const hours = (hours2) => make$o(hours2 * 36e5);
const days = (days2) => make$o(days2 * 864e5);
const weeks = (weeks2) => make$o(weeks2 * 6048e5);
const toMillis = (self) => match$4(self, {
  onMillis: (millis2) => millis2,
  onNanos: (nanos2) => Number(nanos2) / 1e6
});
const unsafeToNanos = (self) => {
  const _self = decode(self);
  switch (_self.value._tag) {
    case "Infinity":
      throw new Error("Cannot convert infinite duration to nanos");
    case "Nanos":
      return _self.value.nanos;
    case "Millis":
      return BigInt(Math.round(_self.value.millis * 1e6));
  }
};
const toHrTime = (self) => {
  const _self = decode(self);
  switch (_self.value._tag) {
    case "Infinity":
      return [Infinity, 0];
    case "Nanos":
      return [Number(_self.value.nanos / bigint1e9), Number(_self.value.nanos % bigint1e9)];
    case "Millis":
      return [Math.floor(_self.value.millis / 1e3), Math.round(_self.value.millis % 1e3 * 1e6)];
  }
};
const match$4 = /* @__PURE__ */ dual(2, (self, options) => {
  const _self = decode(self);
  switch (_self.value._tag) {
    case "Nanos":
      return options.onNanos(_self.value.nanos);
    case "Infinity":
      return options.onMillis(Infinity);
    case "Millis":
      return options.onMillis(_self.value.millis);
  }
});
const matchWith = /* @__PURE__ */ dual(3, (self, that, options) => {
  const _self = decode(self);
  const _that = decode(that);
  if (_self.value._tag === "Infinity" || _that.value._tag === "Infinity") {
    return options.onMillis(toMillis(_self), toMillis(_that));
  } else if (_self.value._tag === "Nanos" || _that.value._tag === "Nanos") {
    const selfNanos = _self.value._tag === "Nanos" ? _self.value.nanos : BigInt(Math.round(_self.value.millis * 1e6));
    const thatNanos = _that.value._tag === "Nanos" ? _that.value.nanos : BigInt(Math.round(_that.value.millis * 1e6));
    return options.onNanos(selfNanos, thatNanos);
  }
  return options.onMillis(_self.value.millis, _that.value.millis);
});
const Equivalence = (self, that) => matchWith(self, that, {
  onMillis: (self2, that2) => self2 === that2,
  onNanos: (self2, that2) => self2 === that2
});
const times = /* @__PURE__ */ dual(2, (self, times2) => match$4(self, {
  onMillis: (millis2) => make$o(millis2 * times2),
  onNanos: (nanos2) => make$o(nanos2 * BigInt(times2))
}));
const sum = /* @__PURE__ */ dual(2, (self, that) => matchWith(self, that, {
  onMillis: (self2, that2) => make$o(self2 + that2),
  onNanos: (self2, that2) => make$o(self2 + that2)
}));
const lessThanOrEqualTo = /* @__PURE__ */ dual(2, (self, that) => matchWith(self, that, {
  onMillis: (self2, that2) => self2 <= that2,
  onNanos: (self2, that2) => self2 <= that2
}));
const greaterThanOrEqualTo = /* @__PURE__ */ dual(2, (self, that) => matchWith(self, that, {
  onMillis: (self2, that2) => self2 >= that2,
  onNanos: (self2, that2) => self2 >= that2
}));
const equals = /* @__PURE__ */ dual(2, (self, that) => Equivalence(decode(self), decode(that)));
const parts = (self) => {
  const duration = decode(self);
  if (duration.value._tag === "Infinity") {
    return {
      days: Infinity,
      hours: Infinity,
      minutes: Infinity,
      seconds: Infinity,
      millis: Infinity,
      nanos: Infinity
    };
  }
  const nanos2 = unsafeToNanos(duration);
  const ms = nanos2 / bigint1e6;
  const sec = ms / bigint1e3;
  const min2 = sec / bigint60;
  const hr = min2 / bigint60;
  const days2 = hr / bigint24;
  return {
    days: Number(days2),
    hours: Number(hr % bigint24),
    minutes: Number(min2 % bigint60),
    seconds: Number(sec % bigint60),
    millis: Number(ms % bigint1e3),
    nanos: Number(nanos2 % bigint1e6)
  };
};
const format$2 = (self) => {
  const duration = decode(self);
  if (duration.value._tag === "Infinity") {
    return "Infinity";
  }
  if (isZero(duration)) {
    return "0";
  }
  const fragments = parts(duration);
  const pieces = [];
  if (fragments.days !== 0) {
    pieces.push(`${fragments.days}d`);
  }
  if (fragments.hours !== 0) {
    pieces.push(`${fragments.hours}h`);
  }
  if (fragments.minutes !== 0) {
    pieces.push(`${fragments.minutes}m`);
  }
  if (fragments.seconds !== 0) {
    pieces.push(`${fragments.seconds}s`);
  }
  if (fragments.millis !== 0) {
    pieces.push(`${fragments.millis}ms`);
  }
  if (fragments.nanos !== 0) {
    pieces.push(`${fragments.nanos}ns`);
  }
  return pieces.join(" ");
};
const SIZE = 5;
const BUCKET_SIZE = /* @__PURE__ */ Math.pow(2, SIZE);
const MASK = BUCKET_SIZE - 1;
const MAX_INDEX_NODE = BUCKET_SIZE / 2;
const MIN_ARRAY_NODE = BUCKET_SIZE / 4;
function popcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function hashFragment(shift, h) {
  return h >>> shift & MASK;
}
function toBitmap(x) {
  return 1 << x;
}
function fromBitmap(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
const make$n = (value, previous) => ({
  value,
  previous
});
function arrayUpdate(mutate2, at, v, arr) {
  let out = arr;
  if (!mutate2) {
    const len = arr.length;
    out = new Array(len);
    for (let i = 0; i < len; ++i) out[i] = arr[i];
  }
  out[at] = v;
  return out;
}
function arraySpliceOut(mutate2, at, arr) {
  const newLen = arr.length - 1;
  let i = 0;
  let g = 0;
  let out = arr;
  if (mutate2) {
    i = g = at;
  } else {
    out = new Array(newLen);
    while (i < at) out[g++] = arr[i++];
  }
  ++i;
  while (i <= newLen) out[g++] = arr[i++];
  if (mutate2) {
    out.length = newLen;
  }
  return out;
}
function arraySpliceIn(mutate2, at, v, arr) {
  const len = arr.length;
  if (mutate2) {
    let i2 = len;
    while (i2 >= at) arr[i2--] = arr[i2];
    arr[at] = v;
    return arr;
  }
  let i = 0, g = 0;
  const out = new Array(len + 1);
  while (i < at) out[g++] = arr[i++];
  out[at] = v;
  while (i < len) out[++g] = arr[i++];
  return out;
}
class EmptyNode {
  _tag = "EmptyNode";
  modify(edit, _shift, f, hash2, key, size2) {
    const v = f(none$4());
    if (isNone(v)) return new EmptyNode();
    ++size2.value;
    return new LeafNode(edit, hash2, key, v);
  }
}
function isEmptyNode(a) {
  return isTagged(a, "EmptyNode");
}
function isLeafNode(node) {
  return isEmptyNode(node) || node._tag === "LeafNode" || node._tag === "CollisionNode";
}
function canEditNode(node, edit) {
  return isEmptyNode(node) ? false : edit === node.edit;
}
class LeafNode {
  edit;
  hash;
  key;
  value;
  _tag = "LeafNode";
  constructor(edit, hash2, key, value) {
    this.edit = edit;
    this.hash = hash2;
    this.key = key;
    this.value = value;
  }
  modify(edit, shift, f, hash2, key, size2) {
    if (equals$1(key, this.key)) {
      const v2 = f(this.value);
      if (v2 === this.value) return this;
      else if (isNone(v2)) {
        --size2.value;
        return new EmptyNode();
      }
      if (canEditNode(this, edit)) {
        this.value = v2;
        return this;
      }
      return new LeafNode(edit, hash2, key, v2);
    }
    const v = f(none$4());
    if (isNone(v)) return this;
    ++size2.value;
    return mergeLeaves(edit, shift, this.hash, this, hash2, new LeafNode(edit, hash2, key, v));
  }
}
class CollisionNode {
  edit;
  hash;
  children;
  _tag = "CollisionNode";
  constructor(edit, hash2, children) {
    this.edit = edit;
    this.hash = hash2;
    this.children = children;
  }
  modify(edit, shift, f, hash2, key, size2) {
    if (hash2 === this.hash) {
      const canEdit = canEditNode(this, edit);
      const list = this.updateCollisionList(canEdit, edit, this.hash, this.children, f, key, size2);
      if (list === this.children) return this;
      return list.length > 1 ? new CollisionNode(edit, this.hash, list) : list[0];
    }
    const v = f(none$4());
    if (isNone(v)) return this;
    ++size2.value;
    return mergeLeaves(edit, shift, this.hash, this, hash2, new LeafNode(edit, hash2, key, v));
  }
  updateCollisionList(mutate2, edit, hash2, list, f, key, size2) {
    const len = list.length;
    for (let i = 0; i < len; ++i) {
      const child = list[i];
      if ("key" in child && equals$1(key, child.key)) {
        const value = child.value;
        const newValue2 = f(value);
        if (newValue2 === value) return list;
        if (isNone(newValue2)) {
          --size2.value;
          return arraySpliceOut(mutate2, i, list);
        }
        return arrayUpdate(mutate2, i, new LeafNode(edit, hash2, key, newValue2), list);
      }
    }
    const newValue = f(none$4());
    if (isNone(newValue)) return list;
    ++size2.value;
    return arrayUpdate(mutate2, len, new LeafNode(edit, hash2, key, newValue), list);
  }
}
class IndexedNode {
  edit;
  mask;
  children;
  _tag = "IndexedNode";
  constructor(edit, mask, children) {
    this.edit = edit;
    this.mask = mask;
    this.children = children;
  }
  modify(edit, shift, f, hash2, key, size2) {
    const mask = this.mask;
    const children = this.children;
    const frag = hashFragment(shift, hash2);
    const bit = toBitmap(frag);
    const indx = fromBitmap(mask, bit);
    const exists2 = mask & bit;
    const canEdit = canEditNode(this, edit);
    if (!exists2) {
      const _newChild = new EmptyNode().modify(edit, shift + SIZE, f, hash2, key, size2);
      if (!_newChild) return this;
      return children.length >= MAX_INDEX_NODE ? expand(edit, frag, _newChild, mask, children) : new IndexedNode(edit, mask | bit, arraySpliceIn(canEdit, indx, _newChild, children));
    }
    const current = children[indx];
    const child = current.modify(edit, shift + SIZE, f, hash2, key, size2);
    if (current === child) return this;
    let bitmap = mask;
    let newChildren;
    if (isEmptyNode(child)) {
      bitmap &= ~bit;
      if (!bitmap) return new EmptyNode();
      if (children.length <= 2 && isLeafNode(children[indx ^ 1])) {
        return children[indx ^ 1];
      }
      newChildren = arraySpliceOut(canEdit, indx, children);
    } else {
      newChildren = arrayUpdate(canEdit, indx, child, children);
    }
    if (canEdit) {
      this.mask = bitmap;
      this.children = newChildren;
      return this;
    }
    return new IndexedNode(edit, bitmap, newChildren);
  }
}
class ArrayNode {
  edit;
  size;
  children;
  _tag = "ArrayNode";
  constructor(edit, size2, children) {
    this.edit = edit;
    this.size = size2;
    this.children = children;
  }
  modify(edit, shift, f, hash2, key, size2) {
    let count = this.size;
    const children = this.children;
    const frag = hashFragment(shift, hash2);
    const child = children[frag];
    const newChild = (child || new EmptyNode()).modify(edit, shift + SIZE, f, hash2, key, size2);
    if (child === newChild) return this;
    const canEdit = canEditNode(this, edit);
    let newChildren;
    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
      ++count;
      newChildren = arrayUpdate(canEdit, frag, newChild, children);
    } else if (!isEmptyNode(child) && isEmptyNode(newChild)) {
      --count;
      if (count <= MIN_ARRAY_NODE) {
        return pack(edit, count, frag, children);
      }
      newChildren = arrayUpdate(canEdit, frag, new EmptyNode(), children);
    } else {
      newChildren = arrayUpdate(canEdit, frag, newChild, children);
    }
    if (canEdit) {
      this.size = count;
      this.children = newChildren;
      return this;
    }
    return new ArrayNode(edit, count, newChildren);
  }
}
function pack(edit, count, removed, elements) {
  const children = new Array(count - 1);
  let g = 0;
  let bitmap = 0;
  for (let i = 0, len = elements.length; i < len; ++i) {
    if (i !== removed) {
      const elem = elements[i];
      if (elem && !isEmptyNode(elem)) {
        children[g++] = elem;
        bitmap |= 1 << i;
      }
    }
  }
  return new IndexedNode(edit, bitmap, children);
}
function expand(edit, frag, child, bitmap, subNodes) {
  const arr = [];
  let bit = bitmap;
  let count = 0;
  for (let i = 0; bit; ++i) {
    if (bit & 1) arr[i] = subNodes[count++];
    bit >>>= 1;
  }
  arr[frag] = child;
  return new ArrayNode(edit, count + 1, arr);
}
function mergeLeavesInner(edit, shift, h1, n1, h2, n2) {
  if (h1 === h2) return new CollisionNode(edit, h1, [n2, n1]);
  const subH1 = hashFragment(shift, h1);
  const subH2 = hashFragment(shift, h2);
  if (subH1 === subH2) {
    return (child) => new IndexedNode(edit, toBitmap(subH1) | toBitmap(subH2), [child]);
  } else {
    const children = subH1 < subH2 ? [n1, n2] : [n2, n1];
    return new IndexedNode(edit, toBitmap(subH1) | toBitmap(subH2), children);
  }
}
function mergeLeaves(edit, shift, h1, n1, h2, n2) {
  let stack = void 0;
  let currentShift = shift;
  while (true) {
    const res = mergeLeavesInner(edit, currentShift, h1, n1, h2, n2);
    if (typeof res === "function") {
      stack = make$n(res, stack);
      currentShift = currentShift + SIZE;
    } else {
      let final = res;
      while (stack != null) {
        final = stack.value(final);
        stack = stack.previous;
      }
      return final;
    }
  }
}
const HashMapSymbolKey = "effect/HashMap";
const HashMapTypeId = /* @__PURE__ */ Symbol.for(HashMapSymbolKey);
const HashMapProto = {
  [HashMapTypeId]: HashMapTypeId,
  [Symbol.iterator]() {
    return new HashMapIterator(this, (k, v) => [k, v]);
  },
  [symbol$1]() {
    let hash$1 = hash(HashMapSymbolKey);
    for (const item of this) {
      hash$1 ^= pipe(hash(item[0]), combine$5(hash(item[1])));
    }
    return cached(this, hash$1);
  },
  [symbol](that) {
    if (isHashMap(that)) {
      if (that._size !== this._size) {
        return false;
      }
      for (const item of this) {
        const elem = pipe(that, getHash(item[0], hash(item[0])));
        if (isNone(elem)) {
          return false;
        } else {
          if (!equals$1(item[1], elem.value)) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "HashMap",
      values: Array.from(this).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeImpl$1 = (editable, edit, root, size2) => {
  const map2 = Object.create(HashMapProto);
  map2._editable = editable;
  map2._edit = edit;
  map2._root = root;
  map2._size = size2;
  return map2;
};
class HashMapIterator {
  map;
  f;
  v;
  constructor(map2, f) {
    this.map = map2;
    this.f = f;
    this.v = visitLazy(this.map._root, this.f, void 0);
  }
  next() {
    if (isNone(this.v)) {
      return {
        done: true,
        value: void 0
      };
    }
    const v0 = this.v.value;
    this.v = applyCont(v0.cont);
    return {
      done: false,
      value: v0.value
    };
  }
  [Symbol.iterator]() {
    return new HashMapIterator(this.map, this.f);
  }
}
const applyCont = (cont) => cont ? visitLazyChildren(cont[0], cont[1], cont[2], cont[3], cont[4]) : none$4();
const visitLazy = (node, f, cont = void 0) => {
  switch (node._tag) {
    case "LeafNode": {
      if (isSome(node.value)) {
        return some({
          value: f(node.key, node.value.value),
          cont
        });
      }
      return applyCont(cont);
    }
    case "CollisionNode":
    case "ArrayNode":
    case "IndexedNode": {
      const children = node.children;
      return visitLazyChildren(children.length, children, 0, f, cont);
    }
    default: {
      return applyCont(cont);
    }
  }
};
const visitLazyChildren = (len, children, i, f, cont) => {
  while (i < len) {
    const child = children[i++];
    if (child && !isEmptyNode(child)) {
      return visitLazy(child, f, [len, children, i, f, cont]);
    }
  }
  return applyCont(cont);
};
const _empty$4 = /* @__PURE__ */ makeImpl$1(false, 0, /* @__PURE__ */ new EmptyNode(), 0);
const empty$h = () => _empty$4;
const fromIterable$4 = (entries) => {
  const map2 = beginMutation$1(empty$h());
  for (const entry of entries) {
    set$4(map2, entry[0], entry[1]);
  }
  return endMutation$1(map2);
};
const isHashMap = (u) => hasProperty(u, HashMapTypeId);
const isEmpty$4 = (self) => self && isEmptyNode(self._root);
const get$6 = /* @__PURE__ */ dual(2, (self, key) => getHash(self, key, hash(key)));
const getHash = /* @__PURE__ */ dual(3, (self, key, hash2) => {
  let node = self._root;
  let shift = 0;
  while (true) {
    switch (node._tag) {
      case "LeafNode": {
        return equals$1(key, node.key) ? node.value : none$4();
      }
      case "CollisionNode": {
        if (hash2 === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i];
            if ("key" in child && equals$1(key, child.key)) {
              return child.value;
            }
          }
        }
        return none$4();
      }
      case "IndexedNode": {
        const frag = hashFragment(shift, hash2);
        const bit = toBitmap(frag);
        if (node.mask & bit) {
          node = node.children[fromBitmap(node.mask, bit)];
          shift += SIZE;
          break;
        }
        return none$4();
      }
      case "ArrayNode": {
        node = node.children[hashFragment(shift, hash2)];
        if (node) {
          shift += SIZE;
          break;
        }
        return none$4();
      }
      default:
        return none$4();
    }
  }
});
const has$3 = /* @__PURE__ */ dual(2, (self, key) => isSome(getHash(self, key, hash(key))));
const set$4 = /* @__PURE__ */ dual(3, (self, key, value) => modifyAt$1(self, key, () => some(value)));
const setTree = /* @__PURE__ */ dual(3, (self, newRoot, newSize) => {
  if (self._editable) {
    self._root = newRoot;
    self._size = newSize;
    return self;
  }
  return newRoot === self._root ? self : makeImpl$1(self._editable, self._edit, newRoot, newSize);
});
const keys$1 = (self) => new HashMapIterator(self, (key) => key);
const size$4 = (self) => self._size;
const beginMutation$1 = (self) => makeImpl$1(true, self._edit + 1, self._root, self._size);
const endMutation$1 = (self) => {
  self._editable = false;
  return self;
};
const modifyAt$1 = /* @__PURE__ */ dual(3, (self, key, f) => modifyHash(self, key, hash(key), f));
const modifyHash = /* @__PURE__ */ dual(4, (self, key, hash2, f) => {
  const size2 = {
    value: self._size
  };
  const newRoot = self._root.modify(self._editable ? self._edit : NaN, 0, f, hash2, key, size2);
  return pipe(self, setTree(newRoot, size2.value));
});
const remove$2 = /* @__PURE__ */ dual(2, (self, key) => modifyAt$1(self, key, none$4));
const map$5 = /* @__PURE__ */ dual(2, (self, f) => reduce$5(self, empty$h(), (map2, value, key) => set$4(map2, key, f(value, key))));
const forEach$3 = /* @__PURE__ */ dual(2, (self, f) => reduce$5(self, void 0, (_, value, key) => f(value, key)));
const reduce$5 = /* @__PURE__ */ dual(3, (self, zero2, f) => {
  const root = self._root;
  if (root._tag === "LeafNode") {
    return isSome(root.value) ? f(zero2, root.value.value, root.key) : zero2;
  }
  if (root._tag === "EmptyNode") {
    return zero2;
  }
  const toVisit = [root.children];
  let children;
  while (children = toVisit.pop()) {
    for (let i = 0, len = children.length; i < len; ) {
      const child = children[i++];
      if (child && !isEmptyNode(child)) {
        if (child._tag === "LeafNode") {
          if (isSome(child.value)) {
            zero2 = f(zero2, child.value.value, child.key);
          }
        } else {
          toVisit.push(child.children);
        }
      }
    }
  }
  return zero2;
});
const HashSetSymbolKey = "effect/HashSet";
const HashSetTypeId = /* @__PURE__ */ Symbol.for(HashSetSymbolKey);
const HashSetProto = {
  [HashSetTypeId]: HashSetTypeId,
  [Symbol.iterator]() {
    return keys$1(this._keyMap);
  },
  [symbol$1]() {
    return cached(this, combine$5(hash(this._keyMap))(hash(HashSetSymbolKey)));
  },
  [symbol](that) {
    if (isHashSet(that)) {
      return size$4(this._keyMap) === size$4(that._keyMap) && equals$1(this._keyMap, that._keyMap);
    }
    return false;
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "HashSet",
      values: Array.from(this).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeImpl = (keyMap) => {
  const set2 = Object.create(HashSetProto);
  set2._keyMap = keyMap;
  return set2;
};
const isHashSet = (u) => hasProperty(u, HashSetTypeId);
const _empty$3 = /* @__PURE__ */ makeImpl(/* @__PURE__ */ empty$h());
const empty$g = () => _empty$3;
const fromIterable$3 = (elements) => {
  const set2 = beginMutation(empty$g());
  for (const value of elements) {
    add$1(set2, value);
  }
  return endMutation(set2);
};
const make$m = (...elements) => {
  const set2 = beginMutation(empty$g());
  for (const value of elements) {
    add$1(set2, value);
  }
  return endMutation(set2);
};
const has$2 = /* @__PURE__ */ dual(2, (self, value) => has$3(self._keyMap, value));
const size$3 = (self) => size$4(self._keyMap);
const beginMutation = (self) => makeImpl(beginMutation$1(self._keyMap));
const endMutation = (self) => {
  self._keyMap._editable = false;
  return self;
};
const mutate = /* @__PURE__ */ dual(2, (self, f) => {
  const transient = beginMutation(self);
  f(transient);
  return endMutation(transient);
});
const add$1 = /* @__PURE__ */ dual(2, (self, value) => self._keyMap._editable ? (set$4(value, true)(self._keyMap), self) : makeImpl(set$4(value, true)(self._keyMap)));
const remove$1 = /* @__PURE__ */ dual(2, (self, value) => self._keyMap._editable ? (remove$2(value)(self._keyMap), self) : makeImpl(remove$2(value)(self._keyMap)));
const difference$1 = /* @__PURE__ */ dual(2, (self, that) => mutate(self, (set2) => {
  for (const value of that) {
    remove$1(set2, value);
  }
}));
const union$1 = /* @__PURE__ */ dual(2, (self, that) => mutate(empty$g(), (set2) => {
  forEach$2(self, (value) => add$1(set2, value));
  for (const value of that) {
    add$1(set2, value);
  }
}));
const forEach$2 = /* @__PURE__ */ dual(2, (self, f) => forEach$3(self._keyMap, (_, k) => f(k)));
const reduce$4 = /* @__PURE__ */ dual(3, (self, zero2, f) => reduce$5(self._keyMap, zero2, (z, _, a) => f(z, a)));
const empty$f = empty$g;
const fromIterable$2 = fromIterable$3;
const make$l = make$m;
const has$1 = has$2;
const size$2 = size$3;
const add = add$1;
const remove = remove$1;
const difference = difference$1;
const union = union$1;
const reduce$3 = reduce$4;
const TypeId$7 = /* @__PURE__ */ Symbol.for("effect/MutableRef");
const MutableRefProto = {
  [TypeId$7]: TypeId$7,
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "MutableRef",
      current: toJSON(this.current)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const make$k = (value) => {
  const ref = Object.create(MutableRefProto);
  ref.current = value;
  return ref;
};
const get$5 = (self) => self.current;
const set$3 = /* @__PURE__ */ dual(2, (self, value) => {
  self.current = value;
  return self;
});
const FiberIdSymbolKey = "effect/FiberId";
const FiberIdTypeId = /* @__PURE__ */ Symbol.for(FiberIdSymbolKey);
const OP_NONE = "None";
const OP_RUNTIME = "Runtime";
const OP_COMPOSITE = "Composite";
const emptyHash = /* @__PURE__ */ string(`${FiberIdSymbolKey}-${OP_NONE}`);
let None$2 = class None {
  [FiberIdTypeId] = FiberIdTypeId;
  _tag = OP_NONE;
  id = -1;
  startTimeMillis = -1;
  [symbol$1]() {
    return emptyHash;
  }
  [symbol](that) {
    return isFiberId(that) && that._tag === OP_NONE;
  }
  toString() {
    return format$3(this.toJSON());
  }
  toJSON() {
    return {
      _id: "FiberId",
      _tag: this._tag
    };
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
class Runtime {
  id;
  startTimeMillis;
  [FiberIdTypeId] = FiberIdTypeId;
  _tag = OP_RUNTIME;
  constructor(id, startTimeMillis) {
    this.id = id;
    this.startTimeMillis = startTimeMillis;
  }
  [symbol$1]() {
    return cached(this, string(`${FiberIdSymbolKey}-${this._tag}-${this.id}-${this.startTimeMillis}`));
  }
  [symbol](that) {
    return isFiberId(that) && that._tag === OP_RUNTIME && this.id === that.id && this.startTimeMillis === that.startTimeMillis;
  }
  toString() {
    return format$3(this.toJSON());
  }
  toJSON() {
    return {
      _id: "FiberId",
      _tag: this._tag,
      id: this.id,
      startTimeMillis: this.startTimeMillis
    };
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
}
const none$3 = /* @__PURE__ */ new None$2();
const isFiberId = (self) => hasProperty(self, FiberIdTypeId);
const ids = (self) => {
  switch (self._tag) {
    case OP_NONE: {
      return empty$f();
    }
    case OP_RUNTIME: {
      return make$l(self.id);
    }
    case OP_COMPOSITE: {
      return pipe(ids(self.left), union(ids(self.right)));
    }
  }
};
const _fiberCounter = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Fiber/Id/_fiberCounter"), () => make$k(0));
const threadName$1 = (self) => {
  const identifiers = Array.from(ids(self)).map((n) => `#${n}`).join(",");
  return identifiers;
};
const unsafeMake$5 = () => {
  const id = get$5(_fiberCounter);
  pipe(_fiberCounter, set$3(id + 1));
  return new Runtime(id, Date.now());
};
const none$2 = none$3;
const threadName = threadName$1;
const unsafeMake$4 = unsafeMake$5;
const empty$e = empty$h;
const fromIterable$1 = fromIterable$4;
const isEmpty$3 = isEmpty$4;
const get$4 = get$6;
const set$2 = set$4;
const keys = keys$1;
const modifyAt = modifyAt$1;
const map$4 = map$5;
const reduce$2 = reduce$5;
const TypeId$6 = /* @__PURE__ */ Symbol.for("effect/List");
const toArray = (self) => fromIterable$6(self);
const getEquivalence = (isEquivalent) => mapInput$1(getEquivalence$2(isEquivalent), toArray);
const _equivalence = /* @__PURE__ */ getEquivalence(equals$1);
const ConsProto = {
  [TypeId$6]: TypeId$6,
  _tag: "Cons",
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "List",
      _tag: "Cons",
      values: toArray(this).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  [symbol](that) {
    return isList(that) && this._tag === that._tag && _equivalence(this, that);
  },
  [symbol$1]() {
    return cached(this, array(toArray(this)));
  },
  [Symbol.iterator]() {
    let done2 = false;
    let self = this;
    return {
      next() {
        if (done2) {
          return this.return();
        }
        if (self._tag === "Nil") {
          done2 = true;
          return this.return();
        }
        const value = self.head;
        self = self.tail;
        return {
          done: done2,
          value
        };
      },
      return(value) {
        if (!done2) {
          done2 = true;
        }
        return {
          done: true,
          value
        };
      }
    };
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeCons = (head2, tail) => {
  const cons2 = Object.create(ConsProto);
  cons2.head = head2;
  cons2.tail = tail;
  return cons2;
};
const NilHash = /* @__PURE__ */ string("Nil");
const NilProto = {
  [TypeId$6]: TypeId$6,
  _tag: "Nil",
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "List",
      _tag: "Nil"
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  [symbol$1]() {
    return NilHash;
  },
  [symbol](that) {
    return isList(that) && this._tag === that._tag;
  },
  [Symbol.iterator]() {
    return {
      next() {
        return {
          done: true,
          value: void 0
        };
      }
    };
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const _Nil = /* @__PURE__ */ Object.create(NilProto);
const isList = (u) => hasProperty(u, TypeId$6);
const isNil = (self) => self._tag === "Nil";
const isCons = (self) => self._tag === "Cons";
const nil = () => _Nil;
const cons = (head2, tail) => makeCons(head2, tail);
const empty$d = nil;
const of = (value) => makeCons(value, _Nil);
const appendAll = /* @__PURE__ */ dual(2, (self, that) => prependAll(that, self));
const prepend = /* @__PURE__ */ dual(2, (self, element) => cons(element, self));
const prependAll = /* @__PURE__ */ dual(2, (self, prefix) => {
  if (isNil(self)) {
    return prefix;
  } else if (isNil(prefix)) {
    return self;
  } else {
    const result = makeCons(prefix.head, self);
    let curr = result;
    let that = prefix.tail;
    while (!isNil(that)) {
      const temp = makeCons(that.head, self);
      curr.tail = temp;
      curr = temp;
      that = that.tail;
    }
    return result;
  }
});
const reduce$1 = /* @__PURE__ */ dual(3, (self, zero2, f) => {
  let acc = zero2;
  let these = self;
  while (!isNil(these)) {
    acc = f(acc, these.head);
    these = these.tail;
  }
  return acc;
});
const reverse = (self) => {
  let result = empty$d();
  let these = self;
  while (!isNil(these)) {
    result = prepend(result, these.head);
    these = these.tail;
  }
  return result;
};
const Structural = /* @__PURE__ */ function() {
  function Structural2(args2) {
    if (args2) {
      Object.assign(this, args2);
    }
  }
  Structural2.prototype = StructuralPrototype;
  return Structural2;
}();
const ContextPatchTypeId = /* @__PURE__ */ Symbol.for("effect/DifferContextPatch");
function variance$4(a) {
  return a;
}
const PatchProto$2 = {
  ...Structural.prototype,
  [ContextPatchTypeId]: {
    _Value: variance$4,
    _Patch: variance$4
  }
};
const EmptyProto$2 = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$2), {
  _tag: "Empty"
});
const _empty$2 = /* @__PURE__ */ Object.create(EmptyProto$2);
const empty$c = () => _empty$2;
const AndThenProto$2 = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$2), {
  _tag: "AndThen"
});
const makeAndThen$2 = (first, second) => {
  const o = Object.create(AndThenProto$2);
  o.first = first;
  o.second = second;
  return o;
};
const AddServiceProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$2), {
  _tag: "AddService"
});
const makeAddService = (key, service) => {
  const o = Object.create(AddServiceProto);
  o.key = key;
  o.service = service;
  return o;
};
const RemoveServiceProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$2), {
  _tag: "RemoveService"
});
const makeRemoveService = (key) => {
  const o = Object.create(RemoveServiceProto);
  o.key = key;
  return o;
};
const UpdateServiceProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$2), {
  _tag: "UpdateService"
});
const makeUpdateService = (key, update2) => {
  const o = Object.create(UpdateServiceProto);
  o.key = key;
  o.update = update2;
  return o;
};
const diff$6 = (oldValue, newValue) => {
  const missingServices = new Map(oldValue.unsafeMap);
  let patch2 = empty$c();
  for (const [tag, newService] of newValue.unsafeMap.entries()) {
    if (missingServices.has(tag)) {
      const old = missingServices.get(tag);
      missingServices.delete(tag);
      if (!equals$1(old, newService)) {
        patch2 = combine$4(makeUpdateService(tag, () => newService))(patch2);
      }
    } else {
      missingServices.delete(tag);
      patch2 = combine$4(makeAddService(tag, newService))(patch2);
    }
  }
  for (const [tag] of missingServices.entries()) {
    patch2 = combine$4(makeRemoveService(tag))(patch2);
  }
  return patch2;
};
const combine$4 = /* @__PURE__ */ dual(2, (self, that) => makeAndThen$2(self, that));
const patch$7 = /* @__PURE__ */ dual(2, (self, context2) => {
  if (self._tag === "Empty") {
    return context2;
  }
  let wasServiceUpdated = false;
  let patches = of$1(self);
  const updatedContext = new Map(context2.unsafeMap);
  while (isNonEmpty$2(patches)) {
    const head2 = headNonEmpty(patches);
    const tail = tailNonEmpty(patches);
    switch (head2._tag) {
      case "Empty": {
        patches = tail;
        break;
      }
      case "AddService": {
        updatedContext.set(head2.key, head2.service);
        patches = tail;
        break;
      }
      case "AndThen": {
        patches = prepend$1(prepend$1(tail, head2.second), head2.first);
        break;
      }
      case "RemoveService": {
        updatedContext.delete(head2.key);
        patches = tail;
        break;
      }
      case "UpdateService": {
        updatedContext.set(head2.key, head2.update(updatedContext.get(head2.key)));
        wasServiceUpdated = true;
        patches = tail;
        break;
      }
    }
  }
  if (!wasServiceUpdated) {
    return makeContext(updatedContext);
  }
  const map2 = /* @__PURE__ */ new Map();
  for (const [tag] of context2.unsafeMap) {
    if (updatedContext.has(tag)) {
      map2.set(tag, updatedContext.get(tag));
      updatedContext.delete(tag);
    }
  }
  for (const [tag, s] of updatedContext) {
    map2.set(tag, s);
  }
  return makeContext(map2);
});
const HashSetPatchTypeId = /* @__PURE__ */ Symbol.for("effect/DifferHashSetPatch");
function variance$3(a) {
  return a;
}
const PatchProto$1 = {
  ...Structural.prototype,
  [HashSetPatchTypeId]: {
    _Value: variance$3,
    _Key: variance$3,
    _Patch: variance$3
  }
};
const EmptyProto$1 = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$1), {
  _tag: "Empty"
});
const _empty$1 = /* @__PURE__ */ Object.create(EmptyProto$1);
const empty$b = () => _empty$1;
const AndThenProto$1 = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$1), {
  _tag: "AndThen"
});
const makeAndThen$1 = (first, second) => {
  const o = Object.create(AndThenProto$1);
  o.first = first;
  o.second = second;
  return o;
};
const AddProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$1), {
  _tag: "Add"
});
const makeAdd = (value) => {
  const o = Object.create(AddProto);
  o.value = value;
  return o;
};
const RemoveProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto$1), {
  _tag: "Remove"
});
const makeRemove = (value) => {
  const o = Object.create(RemoveProto);
  o.value = value;
  return o;
};
const diff$5 = (oldValue, newValue) => {
  const [removed, patch2] = reduce$3([oldValue, empty$b()], ([set2, patch3], value) => {
    if (has$1(value)(set2)) {
      return [remove(value)(set2), patch3];
    }
    return [set2, combine$3(makeAdd(value))(patch3)];
  })(newValue);
  return reduce$3(patch2, (patch3, value) => combine$3(makeRemove(value))(patch3))(removed);
};
const combine$3 = /* @__PURE__ */ dual(2, (self, that) => makeAndThen$1(self, that));
const patch$6 = /* @__PURE__ */ dual(2, (self, oldValue) => {
  if (self._tag === "Empty") {
    return oldValue;
  }
  let set2 = oldValue;
  let patches = of$1(self);
  while (isNonEmpty$2(patches)) {
    const head2 = headNonEmpty(patches);
    const tail = tailNonEmpty(patches);
    switch (head2._tag) {
      case "Empty": {
        patches = tail;
        break;
      }
      case "AndThen": {
        patches = prepend$1(head2.first)(prepend$1(head2.second)(tail));
        break;
      }
      case "Add": {
        set2 = add(head2.value)(set2);
        patches = tail;
        break;
      }
      case "Remove": {
        set2 = remove(head2.value)(set2);
        patches = tail;
      }
    }
  }
  return set2;
});
const ReadonlyArrayPatchTypeId = /* @__PURE__ */ Symbol.for("effect/DifferReadonlyArrayPatch");
function variance$2(a) {
  return a;
}
const PatchProto = {
  ...Structural.prototype,
  [ReadonlyArrayPatchTypeId]: {
    _Value: variance$2,
    _Patch: variance$2
  }
};
const EmptyProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto), {
  _tag: "Empty"
});
const _empty = /* @__PURE__ */ Object.create(EmptyProto);
const empty$a = () => _empty;
const AndThenProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto), {
  _tag: "AndThen"
});
const makeAndThen = (first, second) => {
  const o = Object.create(AndThenProto);
  o.first = first;
  o.second = second;
  return o;
};
const AppendProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto), {
  _tag: "Append"
});
const makeAppend = (values) => {
  const o = Object.create(AppendProto);
  o.values = values;
  return o;
};
const SliceProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto), {
  _tag: "Slice"
});
const makeSlice = (from, until) => {
  const o = Object.create(SliceProto);
  o.from = from;
  o.until = until;
  return o;
};
const UpdateProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(PatchProto), {
  _tag: "Update"
});
const makeUpdate = (index, patch2) => {
  const o = Object.create(UpdateProto);
  o.index = index;
  o.patch = patch2;
  return o;
};
const diff$4 = (options) => {
  let i = 0;
  let patch2 = empty$a();
  while (i < options.oldValue.length && i < options.newValue.length) {
    const oldElement = options.oldValue[i];
    const newElement = options.newValue[i];
    const valuePatch = options.differ.diff(oldElement, newElement);
    if (!equals$1(valuePatch, options.differ.empty)) {
      patch2 = combine$2(patch2, makeUpdate(i, valuePatch));
    }
    i = i + 1;
  }
  if (i < options.oldValue.length) {
    patch2 = combine$2(patch2, makeSlice(0, i));
  }
  if (i < options.newValue.length) {
    patch2 = combine$2(patch2, makeAppend(drop$1(i)(options.newValue)));
  }
  return patch2;
};
const combine$2 = /* @__PURE__ */ dual(2, (self, that) => makeAndThen(self, that));
const patch$5 = /* @__PURE__ */ dual(3, (self, oldValue, differ2) => {
  if (self._tag === "Empty") {
    return oldValue;
  }
  let readonlyArray2 = oldValue.slice();
  let patches = of$2(self);
  while (isNonEmptyArray(patches)) {
    const head2 = headNonEmpty$1(patches);
    const tail = tailNonEmpty$1(patches);
    switch (head2._tag) {
      case "Empty": {
        patches = tail;
        break;
      }
      case "AndThen": {
        tail.unshift(head2.first, head2.second);
        patches = tail;
        break;
      }
      case "Append": {
        for (const value of head2.values) {
          readonlyArray2.push(value);
        }
        patches = tail;
        break;
      }
      case "Slice": {
        readonlyArray2 = readonlyArray2.slice(head2.from, head2.until);
        patches = tail;
        break;
      }
      case "Update": {
        readonlyArray2[head2.index] = differ2.patch(head2.patch, readonlyArray2[head2.index]);
        patches = tail;
        break;
      }
    }
  }
  return readonlyArray2;
});
const DifferTypeId = /* @__PURE__ */ Symbol.for("effect/Differ");
const DifferProto = {
  [DifferTypeId]: {
    _P: identity,
    _V: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const make$j = (params) => {
  const differ2 = Object.create(DifferProto);
  differ2.empty = params.empty;
  differ2.diff = params.diff;
  differ2.combine = params.combine;
  differ2.patch = params.patch;
  return differ2;
};
const environment = () => make$j({
  empty: empty$c(),
  combine: (first, second) => combine$4(second)(first),
  diff: (oldValue, newValue) => diff$6(oldValue, newValue),
  patch: (patch2, oldValue) => patch$7(oldValue)(patch2)
});
const hashSet = () => make$j({
  empty: empty$b(),
  combine: (first, second) => combine$3(second)(first),
  diff: (oldValue, newValue) => diff$5(oldValue, newValue),
  patch: (patch2, oldValue) => patch$6(oldValue)(patch2)
});
const readonlyArray = (differ2) => make$j({
  empty: empty$a(),
  combine: (first, second) => combine$2(first, second),
  diff: (oldValue, newValue) => diff$4({
    oldValue,
    newValue,
    differ: differ2
  }),
  patch: (patch2, oldValue) => patch$5(patch2, oldValue, differ2)
});
const update$2 = () => updateWith((_, a) => a);
const updateWith = (f) => make$j({
  empty: identity,
  combine: (first, second) => {
    if (first === identity) {
      return second;
    }
    if (second === identity) {
      return first;
    }
    return (a) => second(first(a));
  },
  diff: (oldValue, newValue) => {
    if (equals$1(oldValue, newValue)) {
      return identity;
    }
    return constant(newValue);
  },
  patch: (patch2, oldValue) => f(oldValue, patch2(oldValue))
});
const BIT_MASK = 255;
const BIT_SHIFT = 8;
const active = (patch2) => patch2 & BIT_MASK;
const enabled = (patch2) => patch2 >> BIT_SHIFT & BIT_MASK;
const make$i = (active2, enabled2) => (active2 & BIT_MASK) + ((enabled2 & active2 & BIT_MASK) << BIT_SHIFT);
const empty$9 = /* @__PURE__ */ make$i(0, 0);
const enable$2 = (flag) => make$i(flag, flag);
const disable$1 = (flag) => make$i(flag, 0);
const exclude$1 = /* @__PURE__ */ dual(2, (self, flag) => make$i(active(self) & ~flag, enabled(self)));
const andThen$2 = /* @__PURE__ */ dual(2, (self, that) => self | that);
const invert = (n) => ~n >>> 0 & BIT_MASK;
const None$1 = 0;
const Interruption = 1 << 0;
const OpSupervision = 1 << 1;
const RuntimeMetrics = 1 << 2;
const WindDown = 1 << 4;
const CooperativeYielding = 1 << 5;
const cooperativeYielding = (self) => isEnabled(self, CooperativeYielding);
const enable$1 = /* @__PURE__ */ dual(2, (self, flag) => self | flag);
const interruptible$2 = (self) => interruption(self) && !windDown(self);
const interruption = (self) => isEnabled(self, Interruption);
const isEnabled = /* @__PURE__ */ dual(2, (self, flag) => (self & flag) !== 0);
const make$h = (...flags) => flags.reduce((a, b) => a | b, 0);
const none$1 = /* @__PURE__ */ make$h(None$1);
const runtimeMetrics = (self) => isEnabled(self, RuntimeMetrics);
const windDown = (self) => isEnabled(self, WindDown);
const diff$3 = /* @__PURE__ */ dual(2, (self, that) => make$i(self ^ that, that));
const patch$4 = /* @__PURE__ */ dual(2, (self, patch2) => self & (invert(active(patch2)) | enabled(patch2)) | active(patch2) & enabled(patch2));
const differ$1 = /* @__PURE__ */ make$j({
  empty: empty$9,
  diff: (oldValue, newValue) => diff$3(oldValue, newValue),
  combine: (first, second) => andThen$2(second)(first),
  patch: (_patch, oldValue) => patch$4(oldValue, _patch)
});
const enable = enable$2;
const disable = disable$1;
const exclude = exclude$1;
const par = (self, that) => ({
  _tag: "Par",
  left: self,
  right: that
});
const seq = (self, that) => ({
  _tag: "Seq",
  left: self,
  right: that
});
const flatten$1 = (self) => {
  let current = of(self);
  let updated = empty$d();
  while (1) {
    const [parallel2, sequential2] = reduce$1(current, [parallelCollectionEmpty(), empty$d()], ([parallel3, sequential3], blockedRequest) => {
      const [par2, seq2] = step$1(blockedRequest);
      return [parallelCollectionCombine(parallel3, par2), appendAll(sequential3, seq2)];
    });
    updated = merge$2(updated, parallel2);
    if (isNil(sequential2)) {
      return reverse(updated);
    }
    current = sequential2;
  }
  throw new Error("BUG: BlockedRequests.flatten - please report an issue at https://github.com/Effect-TS/effect/issues");
};
const step$1 = (requests) => {
  let current = requests;
  let parallel2 = parallelCollectionEmpty();
  let stack = empty$d();
  let sequential2 = empty$d();
  while (1) {
    switch (current._tag) {
      case "Empty": {
        if (isNil(stack)) {
          return [parallel2, sequential2];
        }
        current = stack.head;
        stack = stack.tail;
        break;
      }
      case "Par": {
        stack = cons(current.right, stack);
        current = current.left;
        break;
      }
      case "Seq": {
        const left2 = current.left;
        const right2 = current.right;
        switch (left2._tag) {
          case "Empty": {
            current = right2;
            break;
          }
          case "Par": {
            const l = left2.left;
            const r = left2.right;
            current = par(seq(l, right2), seq(r, right2));
            break;
          }
          case "Seq": {
            const l = left2.left;
            const r = left2.right;
            current = seq(l, seq(r, right2));
            break;
          }
          case "Single": {
            current = left2;
            sequential2 = cons(right2, sequential2);
            break;
          }
        }
        break;
      }
      case "Single": {
        parallel2 = parallelCollectionAdd(parallel2, current);
        if (isNil(stack)) {
          return [parallel2, sequential2];
        }
        current = stack.head;
        stack = stack.tail;
        break;
      }
    }
  }
  throw new Error("BUG: BlockedRequests.step - please report an issue at https://github.com/Effect-TS/effect/issues");
};
const merge$2 = (sequential2, parallel2) => {
  if (isNil(sequential2)) {
    return of(parallelCollectionToSequentialCollection(parallel2));
  }
  if (parallelCollectionIsEmpty(parallel2)) {
    return sequential2;
  }
  const seqHeadKeys = sequentialCollectionKeys(sequential2.head);
  const parKeys = parallelCollectionKeys(parallel2);
  if (seqHeadKeys.length === 1 && parKeys.length === 1 && equals$1(seqHeadKeys[0], parKeys[0])) {
    return cons(sequentialCollectionCombine(sequential2.head, parallelCollectionToSequentialCollection(parallel2)), sequential2.tail);
  }
  return cons(parallelCollectionToSequentialCollection(parallel2), sequential2);
};
const RequestBlockParallelTypeId = /* @__PURE__ */ Symbol.for("effect/RequestBlock/RequestBlockParallel");
const parallelVariance = {
  /* c8 ignore next */
  _R: (_) => _
};
class ParallelImpl {
  map;
  [RequestBlockParallelTypeId] = parallelVariance;
  constructor(map2) {
    this.map = map2;
  }
}
const parallelCollectionEmpty = () => new ParallelImpl(empty$e());
const parallelCollectionAdd = (self, blockedRequest) => new ParallelImpl(modifyAt(self.map, blockedRequest.dataSource, (_) => orElseSome(map$7(_, append(blockedRequest.blockedRequest)), () => of$1(blockedRequest.blockedRequest))));
const parallelCollectionCombine = (self, that) => new ParallelImpl(reduce$2(self.map, that.map, (map2, value, key) => set$2(map2, key, match$5(get$4(map2, key), {
  onNone: () => value,
  onSome: (other) => appendAll$1(value, other)
}))));
const parallelCollectionIsEmpty = (self) => isEmpty$3(self.map);
const parallelCollectionKeys = (self) => Array.from(keys(self.map));
const parallelCollectionToSequentialCollection = (self) => sequentialCollectionMake(map$4(self.map, (x) => of$1(x)));
const SequentialCollectionTypeId = /* @__PURE__ */ Symbol.for("effect/RequestBlock/RequestBlockSequential");
const sequentialVariance = {
  /* c8 ignore next */
  _R: (_) => _
};
class SequentialImpl {
  map;
  [SequentialCollectionTypeId] = sequentialVariance;
  constructor(map2) {
    this.map = map2;
  }
}
const sequentialCollectionMake = (map2) => new SequentialImpl(map2);
const sequentialCollectionCombine = (self, that) => new SequentialImpl(reduce$2(that.map, self.map, (map2, value, key) => set$2(map2, key, match$5(get$4(map2, key), {
  onNone: () => empty$i(),
  onSome: (a) => appendAll$1(a, value)
}))));
const sequentialCollectionKeys = (self) => Array.from(keys(self.map));
const sequentialCollectionToChunk = (self) => Array.from(self.map);
const OP_DIE = "Die";
const OP_EMPTY$2 = "Empty";
const OP_FAIL$1 = "Fail";
const OP_INTERRUPT = "Interrupt";
const OP_PARALLEL$1 = "Parallel";
const OP_SEQUENTIAL$1 = "Sequential";
const CauseSymbolKey = "effect/Cause";
const CauseTypeId = /* @__PURE__ */ Symbol.for(CauseSymbolKey);
const variance$1 = {
  /* c8 ignore next */
  _E: (_) => _
};
const proto$2 = {
  [CauseTypeId]: variance$1,
  [symbol$1]() {
    return pipe(hash(CauseSymbolKey), combine$5(hash(flattenCause(this))), cached(this));
  },
  [symbol](that) {
    return isCause(that) && causeEquals(this, that);
  },
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    switch (this._tag) {
      case "Empty":
        return {
          _id: "Cause",
          _tag: this._tag
        };
      case "Die":
        return {
          _id: "Cause",
          _tag: this._tag,
          defect: toJSON(this.defect)
        };
      case "Interrupt":
        return {
          _id: "Cause",
          _tag: this._tag,
          fiberId: this.fiberId.toJSON()
        };
      case "Fail":
        return {
          _id: "Cause",
          _tag: this._tag,
          failure: toJSON(this.error)
        };
      case "Sequential":
      case "Parallel":
        return {
          _id: "Cause",
          _tag: this._tag,
          left: toJSON(this.left),
          right: toJSON(this.right)
        };
    }
  },
  toString() {
    return pretty$1(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
const empty$8 = /* @__PURE__ */ (() => {
  const o = /* @__PURE__ */ Object.create(proto$2);
  o._tag = OP_EMPTY$2;
  return o;
})();
const fail$3 = (error) => {
  const o = Object.create(proto$2);
  o._tag = OP_FAIL$1;
  o.error = error;
  return o;
};
const die$2 = (defect) => {
  const o = Object.create(proto$2);
  o._tag = OP_DIE;
  o.defect = defect;
  return o;
};
const interrupt = (fiberId2) => {
  const o = Object.create(proto$2);
  o._tag = OP_INTERRUPT;
  o.fiberId = fiberId2;
  return o;
};
const parallel$2 = (left2, right2) => {
  const o = Object.create(proto$2);
  o._tag = OP_PARALLEL$1;
  o.left = left2;
  o.right = right2;
  return o;
};
const sequential$2 = (left2, right2) => {
  const o = Object.create(proto$2);
  o._tag = OP_SEQUENTIAL$1;
  o.left = left2;
  o.right = right2;
  return o;
};
const isCause = (u) => hasProperty(u, CauseTypeId);
const isEmptyType = (self) => self._tag === OP_EMPTY$2;
const isFailType$1 = (self) => self._tag === OP_FAIL$1;
const isDieType = (self) => self._tag === OP_DIE;
const isEmpty$2 = (self) => {
  if (self._tag === OP_EMPTY$2) {
    return true;
  }
  return reduce(self, true, (acc, cause) => {
    switch (cause._tag) {
      case OP_EMPTY$2: {
        return some(acc);
      }
      case OP_DIE:
      case OP_FAIL$1:
      case OP_INTERRUPT: {
        return some(false);
      }
      default: {
        return none$4();
      }
    }
  });
};
const isInterrupted = (self) => isSome(interruptOption(self));
const isInterruptedOnly = (self) => reduceWithContext(void 0, IsInterruptedOnlyCauseReducer)(self);
const failures = (self) => reverse$1(reduce(self, empty$i(), (list, cause) => cause._tag === OP_FAIL$1 ? some(pipe(list, prepend$1(cause.error))) : none$4()));
const defects = (self) => reverse$1(reduce(self, empty$i(), (list, cause) => cause._tag === OP_DIE ? some(pipe(list, prepend$1(cause.defect))) : none$4()));
const interruptors = (self) => reduce(self, empty$f(), (set2, cause) => cause._tag === OP_INTERRUPT ? some(pipe(set2, add(cause.fiberId))) : none$4());
const failureOption = (self) => find(self, (cause) => cause._tag === OP_FAIL$1 ? some(cause.error) : none$4());
const failureOrCause = (self) => {
  const option = failureOption(self);
  switch (option._tag) {
    case "None": {
      return right(self);
    }
    case "Some": {
      return left(option.value);
    }
  }
};
const interruptOption = (self) => find(self, (cause) => cause._tag === OP_INTERRUPT ? some(cause.fiberId) : none$4());
const keepDefectsAndElectFailures = (self) => match$3(self, {
  onEmpty: none$4(),
  onFail: (failure) => some(die$2(failure)),
  onDie: (defect) => some(die$2(defect)),
  onInterrupt: () => none$4(),
  onSequential: mergeWith(sequential$2),
  onParallel: mergeWith(parallel$2)
});
const stripFailures = (self) => match$3(self, {
  onEmpty: empty$8,
  onFail: () => empty$8,
  onDie: die$2,
  onInterrupt: interrupt,
  onSequential: sequential$2,
  onParallel: parallel$2
});
const electFailures = (self) => match$3(self, {
  onEmpty: empty$8,
  onFail: die$2,
  onDie: die$2,
  onInterrupt: interrupt,
  onSequential: sequential$2,
  onParallel: parallel$2
});
const causeEquals = (left2, right2) => {
  let leftStack = of$1(left2);
  let rightStack = of$1(right2);
  while (isNonEmpty$2(leftStack) && isNonEmpty$2(rightStack)) {
    const [leftParallel, leftSequential] = pipe(headNonEmpty(leftStack), reduce([empty$f(), empty$i()], ([parallel2, sequential2], cause) => {
      const [par2, seq2] = evaluateCause(cause);
      return some([pipe(parallel2, union(par2)), pipe(sequential2, appendAll$1(seq2))]);
    }));
    const [rightParallel, rightSequential] = pipe(headNonEmpty(rightStack), reduce([empty$f(), empty$i()], ([parallel2, sequential2], cause) => {
      const [par2, seq2] = evaluateCause(cause);
      return some([pipe(parallel2, union(par2)), pipe(sequential2, appendAll$1(seq2))]);
    }));
    if (!equals$1(leftParallel, rightParallel)) {
      return false;
    }
    leftStack = leftSequential;
    rightStack = rightSequential;
  }
  return true;
};
const flattenCause = (cause) => {
  return flattenCauseLoop(of$1(cause), empty$i());
};
const flattenCauseLoop = (causes, flattened) => {
  while (1) {
    const [parallel2, sequential2] = pipe(causes, reduce$6([empty$f(), empty$i()], ([parallel3, sequential3], cause) => {
      const [par2, seq2] = evaluateCause(cause);
      return [pipe(parallel3, union(par2)), pipe(sequential3, appendAll$1(seq2))];
    }));
    const updated = size$2(parallel2) > 0 ? pipe(flattened, prepend$1(parallel2)) : flattened;
    if (isEmpty$5(sequential2)) {
      return reverse$1(updated);
    }
    causes = sequential2;
    flattened = updated;
  }
  throw new Error(getBugErrorMessage("Cause.flattenCauseLoop"));
};
const find = /* @__PURE__ */ dual(2, (self, pf) => {
  const stack = [self];
  while (stack.length > 0) {
    const item = stack.pop();
    const option = pf(item);
    switch (option._tag) {
      case "None": {
        switch (item._tag) {
          case OP_SEQUENTIAL$1:
          case OP_PARALLEL$1: {
            stack.push(item.right);
            stack.push(item.left);
            break;
          }
        }
        break;
      }
      case "Some": {
        return option;
      }
    }
  }
  return none$4();
});
const evaluateCause = (self) => {
  let cause = self;
  const stack = [];
  let _parallel = empty$f();
  let _sequential = empty$i();
  while (cause !== void 0) {
    switch (cause._tag) {
      case OP_EMPTY$2: {
        if (stack.length === 0) {
          return [_parallel, _sequential];
        }
        cause = stack.pop();
        break;
      }
      case OP_FAIL$1: {
        _parallel = add(_parallel, make$p(cause._tag, cause.error));
        if (stack.length === 0) {
          return [_parallel, _sequential];
        }
        cause = stack.pop();
        break;
      }
      case OP_DIE: {
        _parallel = add(_parallel, make$p(cause._tag, cause.defect));
        if (stack.length === 0) {
          return [_parallel, _sequential];
        }
        cause = stack.pop();
        break;
      }
      case OP_INTERRUPT: {
        _parallel = add(_parallel, make$p(cause._tag, cause.fiberId));
        if (stack.length === 0) {
          return [_parallel, _sequential];
        }
        cause = stack.pop();
        break;
      }
      case OP_SEQUENTIAL$1: {
        switch (cause.left._tag) {
          case OP_EMPTY$2: {
            cause = cause.right;
            break;
          }
          case OP_SEQUENTIAL$1: {
            cause = sequential$2(cause.left.left, sequential$2(cause.left.right, cause.right));
            break;
          }
          case OP_PARALLEL$1: {
            cause = parallel$2(sequential$2(cause.left.left, cause.right), sequential$2(cause.left.right, cause.right));
            break;
          }
          default: {
            _sequential = prepend$1(_sequential, cause.right);
            cause = cause.left;
            break;
          }
        }
        break;
      }
      case OP_PARALLEL$1: {
        stack.push(cause.right);
        cause = cause.left;
        break;
      }
    }
  }
  throw new Error(getBugErrorMessage("Cause.evaluateCauseLoop"));
};
const IsInterruptedOnlyCauseReducer = {
  emptyCase: constTrue,
  failCase: constFalse,
  dieCase: constFalse,
  interruptCase: constTrue,
  sequentialCase: (_, left2, right2) => left2 && right2,
  parallelCase: (_, left2, right2) => left2 && right2
};
const OP_SEQUENTIAL_CASE = "SequentialCase";
const OP_PARALLEL_CASE = "ParallelCase";
const match$3 = /* @__PURE__ */ dual(2, (self, {
  onDie,
  onEmpty,
  onFail,
  onInterrupt: onInterrupt2,
  onParallel,
  onSequential
}) => {
  return reduceWithContext(self, void 0, {
    emptyCase: () => onEmpty,
    failCase: (_, error) => onFail(error),
    dieCase: (_, defect) => onDie(defect),
    interruptCase: (_, fiberId2) => onInterrupt2(fiberId2),
    sequentialCase: (_, left2, right2) => onSequential(left2, right2),
    parallelCase: (_, left2, right2) => onParallel(left2, right2)
  });
});
const reduce = /* @__PURE__ */ dual(3, (self, zero2, pf) => {
  let accumulator = zero2;
  let cause = self;
  const causes = [];
  while (cause !== void 0) {
    const option = pf(accumulator, cause);
    accumulator = isSome(option) ? option.value : accumulator;
    switch (cause._tag) {
      case OP_SEQUENTIAL$1: {
        causes.push(cause.right);
        cause = cause.left;
        break;
      }
      case OP_PARALLEL$1: {
        causes.push(cause.right);
        cause = cause.left;
        break;
      }
      default: {
        cause = void 0;
        break;
      }
    }
    if (cause === void 0 && causes.length > 0) {
      cause = causes.pop();
    }
  }
  return accumulator;
});
const reduceWithContext = /* @__PURE__ */ dual(3, (self, context2, reducer) => {
  const input = [self];
  const output = [];
  while (input.length > 0) {
    const cause = input.pop();
    switch (cause._tag) {
      case OP_EMPTY$2: {
        output.push(right(reducer.emptyCase(context2)));
        break;
      }
      case OP_FAIL$1: {
        output.push(right(reducer.failCase(context2, cause.error)));
        break;
      }
      case OP_DIE: {
        output.push(right(reducer.dieCase(context2, cause.defect)));
        break;
      }
      case OP_INTERRUPT: {
        output.push(right(reducer.interruptCase(context2, cause.fiberId)));
        break;
      }
      case OP_SEQUENTIAL$1: {
        input.push(cause.right);
        input.push(cause.left);
        output.push(left({
          _tag: OP_SEQUENTIAL_CASE
        }));
        break;
      }
      case OP_PARALLEL$1: {
        input.push(cause.right);
        input.push(cause.left);
        output.push(left({
          _tag: OP_PARALLEL_CASE
        }));
        break;
      }
    }
  }
  const accumulator = [];
  while (output.length > 0) {
    const either2 = output.pop();
    switch (either2._tag) {
      case "Left": {
        switch (either2.left._tag) {
          case OP_SEQUENTIAL_CASE: {
            const left2 = accumulator.pop();
            const right2 = accumulator.pop();
            const value = reducer.sequentialCase(context2, left2, right2);
            accumulator.push(value);
            break;
          }
          case OP_PARALLEL_CASE: {
            const left2 = accumulator.pop();
            const right2 = accumulator.pop();
            const value = reducer.parallelCase(context2, left2, right2);
            accumulator.push(value);
            break;
          }
        }
        break;
      }
      case "Right": {
        accumulator.push(either2.right);
        break;
      }
    }
  }
  if (accumulator.length === 0) {
    throw new Error("BUG: Cause.reduceWithContext - please report an issue at https://github.com/Effect-TS/effect/issues");
  }
  return accumulator.pop();
});
const pretty$1 = (cause, options) => {
  if (isInterruptedOnly(cause)) {
    return "All fibers interrupted without errors.";
  }
  return prettyErrors(cause).map(function(e) {
    if (options?.renderErrorCause !== true || e.cause === void 0) {
      return e.stack;
    }
    return `${e.stack} {
${renderErrorCause(e.cause, "  ")}
}`;
  }).join("\n");
};
const renderErrorCause = (cause, prefix) => {
  const lines = cause.stack.split("\n");
  let stack = `${prefix}[cause]: ${lines[0]}`;
  for (let i = 1, len = lines.length; i < len; i++) {
    stack += `
${prefix}${lines[i]}`;
  }
  if (cause.cause) {
    stack += ` {
${renderErrorCause(cause.cause, `${prefix}  `)}
${prefix}}`;
  }
  return stack;
};
class PrettyError extends globalThis.Error {
  span = void 0;
  constructor(originalError) {
    const originalErrorIsObject = typeof originalError === "object" && originalError !== null;
    const prevLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 1;
    super(prettyErrorMessage(originalError), originalErrorIsObject && "cause" in originalError && typeof originalError.cause !== "undefined" ? {
      cause: new PrettyError(originalError.cause)
    } : void 0);
    if (this.message === "") {
      this.message = "An error has occurred";
    }
    Error.stackTraceLimit = prevLimit;
    this.name = originalError instanceof Error ? originalError.name : "Error";
    if (originalErrorIsObject) {
      if (spanSymbol in originalError) {
        this.span = originalError[spanSymbol];
      }
      Object.keys(originalError).forEach((key) => {
        if (!(key in this)) {
          this[key] = originalError[key];
        }
      });
    }
    this.stack = prettyErrorStack(`${this.name}: ${this.message}`, originalError instanceof Error && originalError.stack ? originalError.stack : "", this.span);
  }
}
const prettyErrorMessage = (u) => {
  if (typeof u === "string") {
    return u;
  }
  if (typeof u === "object" && u !== null && u instanceof Error) {
    return u.message;
  }
  try {
    if (hasProperty(u, "toString") && isFunction(u["toString"]) && u["toString"] !== Object.prototype.toString && u["toString"] !== globalThis.Array.prototype.toString) {
      return u["toString"]();
    }
  } catch {
  }
  return stringifyCircular(u);
};
const locationRegex = /\((.*)\)/g;
const spanToTrace = /* @__PURE__ */ globalValue("effect/Tracer/spanToTrace", () => /* @__PURE__ */ new WeakMap());
const prettyErrorStack = (message, stack, span2) => {
  const out = [message];
  const lines = stack.startsWith(message) ? stack.slice(message.length).split("\n") : stack.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes("Generator.next")) {
      break;
    }
    if (lines[i].includes("effect_internal_function")) {
      out.pop();
      break;
    }
    out.push(lines[i].replace(/at .*effect_instruction_i.*\((.*)\)/, "at $1").replace(/EffectPrimitive\.\w+/, "<anonymous>"));
  }
  if (span2) {
    let current = span2;
    let i = 0;
    while (current && current._tag === "Span" && i < 10) {
      const stackFn = spanToTrace.get(current);
      if (typeof stackFn === "function") {
        const stack2 = stackFn();
        if (typeof stack2 === "string") {
          const locationMatchAll = stack2.matchAll(locationRegex);
          let match2 = false;
          for (const [, location] of locationMatchAll) {
            match2 = true;
            out.push(`    at ${current.name} (${location})`);
          }
          if (!match2) {
            out.push(`    at ${current.name} (${stack2.replace(/^at /, "")})`);
          }
        } else {
          out.push(`    at ${current.name}`);
        }
      } else {
        out.push(`    at ${current.name}`);
      }
      current = getOrUndefined(current.parent);
      i++;
    }
  }
  return out.join("\n");
};
const spanSymbol = /* @__PURE__ */ Symbol.for("effect/SpanAnnotation");
const prettyErrors = (cause) => reduceWithContext(cause, void 0, {
  emptyCase: () => [],
  dieCase: (_, unknownError) => {
    return [new PrettyError(unknownError)];
  },
  failCase: (_, error) => {
    return [new PrettyError(error)];
  },
  interruptCase: () => [],
  parallelCase: (_, l, r) => [...l, ...r],
  sequentialCase: (_, l, r) => [...l, ...r]
});
const OP_STATE_PENDING = "Pending";
const OP_STATE_DONE = "Done";
const DeferredSymbolKey = "effect/Deferred";
const DeferredTypeId = /* @__PURE__ */ Symbol.for(DeferredSymbolKey);
const deferredVariance = {
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _
};
const pending = (joiners) => {
  return {
    _tag: OP_STATE_PENDING,
    joiners
  };
};
const done$4 = (effect2) => {
  return {
    _tag: OP_STATE_DONE,
    effect: effect2
  };
};
class SingleShotGen2 {
  self;
  called = false;
  constructor(self) {
    this.self = self;
  }
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  return(a) {
    return {
      value: a,
      done: true
    };
  }
  throw(e) {
    throw e;
  }
  [Symbol.iterator]() {
    return new SingleShotGen2(this.self);
  }
}
const blocked = (blockedRequests, _continue2) => {
  const effect2 = new EffectPrimitive("Blocked");
  effect2.effect_instruction_i0 = blockedRequests;
  effect2.effect_instruction_i1 = _continue2;
  return effect2;
};
const runRequestBlock = (blockedRequests) => {
  const effect2 = new EffectPrimitive("RunBlocked");
  effect2.effect_instruction_i0 = blockedRequests;
  return effect2;
};
const EffectTypeId = /* @__PURE__ */ Symbol.for("effect/Effect");
class RevertFlags {
  patch;
  op;
  _op = OP_REVERT_FLAGS;
  constructor(patch2, op) {
    this.patch = patch2;
    this.op = op;
  }
}
class EffectPrimitive {
  _op;
  effect_instruction_i0 = void 0;
  effect_instruction_i1 = void 0;
  effect_instruction_i2 = void 0;
  trace = void 0;
  [EffectTypeId] = effectVariance;
  constructor(_op) {
    this._op = _op;
  }
  [symbol](that) {
    return this === that;
  }
  [symbol$1]() {
    return cached(this, random(this));
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Effect",
      _op: this._op,
      effect_instruction_i0: toJSON(this.effect_instruction_i0),
      effect_instruction_i1: toJSON(this.effect_instruction_i1),
      effect_instruction_i2: toJSON(this.effect_instruction_i2)
    };
  }
  toString() {
    return format$3(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [Symbol.iterator]() {
    return new SingleShotGen2(new YieldWrap(this));
  }
}
class EffectPrimitiveFailure {
  _op;
  effect_instruction_i0 = void 0;
  effect_instruction_i1 = void 0;
  effect_instruction_i2 = void 0;
  trace = void 0;
  [EffectTypeId] = effectVariance;
  constructor(_op) {
    this._op = _op;
    this._tag = _op;
  }
  [symbol](that) {
    return exitIsExit(that) && that._op === "Failure" && // @ts-expect-error
    equals$1(this.effect_instruction_i0, that.effect_instruction_i0);
  }
  [symbol$1]() {
    return pipe(
      // @ts-expect-error
      string(this._tag),
      // @ts-expect-error
      combine$5(hash(this.effect_instruction_i0)),
      cached(this)
    );
  }
  get cause() {
    return this.effect_instruction_i0;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Exit",
      _tag: this._op,
      cause: this.cause.toJSON()
    };
  }
  toString() {
    return format$3(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [Symbol.iterator]() {
    return new SingleShotGen2(new YieldWrap(this));
  }
}
class EffectPrimitiveSuccess {
  _op;
  effect_instruction_i0 = void 0;
  effect_instruction_i1 = void 0;
  effect_instruction_i2 = void 0;
  trace = void 0;
  [EffectTypeId] = effectVariance;
  constructor(_op) {
    this._op = _op;
    this._tag = _op;
  }
  [symbol](that) {
    return exitIsExit(that) && that._op === "Success" && // @ts-expect-error
    equals$1(this.effect_instruction_i0, that.effect_instruction_i0);
  }
  [symbol$1]() {
    return pipe(
      // @ts-expect-error
      string(this._tag),
      // @ts-expect-error
      combine$5(hash(this.effect_instruction_i0)),
      cached(this)
    );
  }
  get value() {
    return this.effect_instruction_i0;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Exit",
      _tag: this._op,
      value: toJSON(this.value)
    };
  }
  toString() {
    return format$3(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [Symbol.iterator]() {
    return new SingleShotGen2(new YieldWrap(this));
  }
}
const isEffect$1 = (u) => hasProperty(u, EffectTypeId);
const withFiberRuntime = (withRuntime) => {
  const effect2 = new EffectPrimitive(OP_WITH_RUNTIME);
  effect2.effect_instruction_i0 = withRuntime;
  return effect2;
};
const acquireUseRelease = /* @__PURE__ */ dual(3, (acquire, use, release) => uninterruptibleMask$1((restore) => flatMap$3(acquire, (a) => flatMap$3(exit(suspend$2(() => restore(use(a)))), (exit2) => {
  return suspend$2(() => release(a, exit2)).pipe(matchCauseEffect$1({
    onFailure: (cause) => {
      switch (exit2._tag) {
        case OP_FAILURE:
          return failCause$1(sequential$2(exit2.effect_instruction_i0, cause));
        case OP_SUCCESS:
          return failCause$1(cause);
      }
    },
    onSuccess: () => exit2
  }));
}))));
const as = /* @__PURE__ */ dual(2, (self, value) => flatMap$3(self, () => succeed$5(value)));
const asVoid$1 = (self) => as(self, void 0);
const custom = function() {
  const wrapper = new EffectPrimitive(OP_COMMIT);
  switch (arguments.length) {
    case 2: {
      wrapper.effect_instruction_i0 = arguments[0];
      wrapper.commit = arguments[1];
      break;
    }
    case 3: {
      wrapper.effect_instruction_i0 = arguments[0];
      wrapper.effect_instruction_i1 = arguments[1];
      wrapper.commit = arguments[2];
      break;
    }
    case 4: {
      wrapper.effect_instruction_i0 = arguments[0];
      wrapper.effect_instruction_i1 = arguments[1];
      wrapper.effect_instruction_i2 = arguments[2];
      wrapper.commit = arguments[3];
      break;
    }
    default: {
      throw new Error(getBugErrorMessage("you're not supposed to end up here"));
    }
  }
  return wrapper;
};
const unsafeAsync = (register, blockingOn = none$2) => {
  const effect2 = new EffectPrimitive(OP_ASYNC);
  let cancelerRef = void 0;
  effect2.effect_instruction_i0 = (resume2) => {
    cancelerRef = register(resume2);
  };
  effect2.effect_instruction_i1 = blockingOn;
  return onInterrupt(effect2, (_) => isEffect$1(cancelerRef) ? cancelerRef : void_$1);
};
const asyncInterrupt = (register, blockingOn = none$2) => suspend$2(() => unsafeAsync(register, blockingOn));
const async_ = (resume2, blockingOn = none$2) => {
  return custom(resume2, function() {
    let backingResume = void 0;
    let pendingEffect = void 0;
    function proxyResume(effect3) {
      if (backingResume) {
        backingResume(effect3);
      } else if (pendingEffect === void 0) {
        pendingEffect = effect3;
      }
    }
    const effect2 = new EffectPrimitive(OP_ASYNC);
    effect2.effect_instruction_i0 = (resume3) => {
      backingResume = resume3;
      if (pendingEffect) {
        resume3(pendingEffect);
      }
    };
    effect2.effect_instruction_i1 = blockingOn;
    let cancelerRef = void 0;
    let controllerRef = void 0;
    if (this.effect_instruction_i0.length !== 1) {
      controllerRef = new AbortController();
      cancelerRef = internalCall(() => this.effect_instruction_i0(proxyResume, controllerRef.signal));
    } else {
      cancelerRef = internalCall(() => this.effect_instruction_i0(proxyResume));
    }
    return cancelerRef || controllerRef ? onInterrupt(effect2, (_) => {
      if (controllerRef) {
        controllerRef.abort();
      }
      return cancelerRef ?? void_$1;
    }) : effect2;
  });
};
const catchAllCause = /* @__PURE__ */ dual(2, (self, f) => {
  const effect2 = new EffectPrimitive(OP_ON_FAILURE);
  effect2.effect_instruction_i0 = self;
  effect2.effect_instruction_i1 = f;
  return effect2;
});
const catchAll$1 = /* @__PURE__ */ dual(2, (self, f) => matchEffect(self, {
  onFailure: f,
  onSuccess: succeed$5
}));
const catchIf = /* @__PURE__ */ dual(3, (self, predicate, f) => catchAllCause(self, (cause) => {
  const either2 = failureOrCause(cause);
  switch (either2._tag) {
    case "Left":
      return predicate(either2.left) ? f(either2.left) : failCause$1(cause);
    case "Right":
      return failCause$1(either2.right);
  }
}));
const originalSymbol = /* @__PURE__ */ Symbol.for("effect/OriginalAnnotation");
const capture = (obj, span2) => {
  if (isSome(span2)) {
    return new Proxy(obj, {
      has(target, p) {
        return p === spanSymbol || p === originalSymbol || p in target;
      },
      get(target, p) {
        if (p === spanSymbol) {
          return span2.value;
        }
        if (p === originalSymbol) {
          return obj;
        }
        return target[p];
      }
    });
  }
  return obj;
};
const die$1 = (defect) => isObject(defect) && !(spanSymbol in defect) ? withFiberRuntime((fiber) => failCause$1(die$2(capture(defect, currentSpanFromFiber(fiber))))) : failCause$1(die$2(defect));
const dieMessage = (message) => failCauseSync(() => die$2(new RuntimeException(message)));
const either$1 = (self) => matchEffect(self, {
  onFailure: (e) => succeed$5(left(e)),
  onSuccess: (a) => succeed$5(right(a))
});
const exit = (self) => matchCause(self, {
  onFailure: exitFailCause$1,
  onSuccess: exitSucceed$1
});
const fail$2 = (error) => isObject(error) && !(spanSymbol in error) ? withFiberRuntime((fiber) => failCause$1(fail$3(capture(error, currentSpanFromFiber(fiber))))) : failCause$1(fail$3(error));
const failSync = (evaluate2) => flatMap$3(sync$1(evaluate2), fail$2);
const failCause$1 = (cause) => {
  const effect2 = new EffectPrimitiveFailure(OP_FAILURE);
  effect2.effect_instruction_i0 = cause;
  return effect2;
};
const failCauseSync = (evaluate2) => flatMap$3(sync$1(evaluate2), failCause$1);
const fiberId = /* @__PURE__ */ withFiberRuntime((state) => succeed$5(state.id()));
const fiberIdWith = (f) => withFiberRuntime((state) => f(state.id()));
const flatMap$3 = /* @__PURE__ */ dual(2, (self, f) => {
  const effect2 = new EffectPrimitive(OP_ON_SUCCESS);
  effect2.effect_instruction_i0 = self;
  effect2.effect_instruction_i1 = f;
  return effect2;
});
const andThen$1 = /* @__PURE__ */ dual(2, (self, f) => flatMap$3(self, (a) => {
  const b = typeof f === "function" ? f(a) : f;
  if (isEffect$1(b)) {
    return b;
  } else if (isPromiseLike(b)) {
    return unsafeAsync((resume2) => {
      b.then((a2) => resume2(succeed$5(a2)), (e) => resume2(fail$2(new UnknownException(e, "An unknown error occurred in Effect.andThen"))));
    });
  }
  return succeed$5(b);
}));
const step = (self) => {
  const effect2 = new EffectPrimitive("OnStep");
  effect2.effect_instruction_i0 = self;
  return effect2;
};
const flatten = (self) => flatMap$3(self, identity);
const matchCause = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect$1(self, {
  onFailure: (cause) => succeed$5(options.onFailure(cause)),
  onSuccess: (a) => succeed$5(options.onSuccess(a))
}));
const matchCauseEffect$1 = /* @__PURE__ */ dual(2, (self, options) => {
  const effect2 = new EffectPrimitive(OP_ON_SUCCESS_AND_FAILURE);
  effect2.effect_instruction_i0 = self;
  effect2.effect_instruction_i1 = options.onFailure;
  effect2.effect_instruction_i2 = options.onSuccess;
  return effect2;
});
const matchEffect = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect$1(self, {
  onFailure: (cause) => {
    const defects$1 = defects(cause);
    if (defects$1.length > 0) {
      return failCause$1(electFailures(cause));
    }
    const failures$1 = failures(cause);
    if (failures$1.length > 0) {
      return options.onFailure(unsafeHead(failures$1));
    }
    return failCause$1(cause);
  },
  onSuccess: options.onSuccess
}));
const forEachSequential = /* @__PURE__ */ dual(2, (self, f) => suspend$2(() => {
  const arr = fromIterable$6(self);
  const ret = allocate(arr.length);
  let i = 0;
  return as(whileLoop({
    while: () => i < arr.length,
    body: () => f(arr[i], i),
    step: (b) => {
      ret[i++] = b;
    }
  }), ret);
}));
const forEachSequentialDiscard = /* @__PURE__ */ dual(2, (self, f) => suspend$2(() => {
  const arr = fromIterable$6(self);
  let i = 0;
  return whileLoop({
    while: () => i < arr.length,
    body: () => f(arr[i], i),
    step: () => {
      i++;
    }
  });
}));
const interruptible$1 = (self) => {
  const effect2 = new EffectPrimitive(OP_UPDATE_RUNTIME_FLAGS);
  effect2.effect_instruction_i0 = enable(Interruption);
  effect2.effect_instruction_i1 = () => self;
  return effect2;
};
const map$3 = /* @__PURE__ */ dual(2, (self, f) => flatMap$3(self, (a) => sync$1(() => f(a))));
const mapBoth$2 = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (e) => failSync(() => options.onFailure(e)),
  onSuccess: (a) => sync$1(() => options.onSuccess(a))
}));
const mapError$2 = /* @__PURE__ */ dual(2, (self, f) => matchCauseEffect$1(self, {
  onFailure: (cause) => {
    const either2 = failureOrCause(cause);
    switch (either2._tag) {
      case "Left": {
        return failSync(() => f(either2.left));
      }
      case "Right": {
        return failCause$1(either2.right);
      }
    }
  },
  onSuccess: succeed$5
}));
const onExit$1 = /* @__PURE__ */ dual(2, (self, cleanup) => uninterruptibleMask$1((restore) => matchCauseEffect$1(restore(self), {
  onFailure: (cause1) => {
    const result = exitFailCause$1(cause1);
    return matchCauseEffect$1(cleanup(result), {
      onFailure: (cause2) => exitFailCause$1(sequential$2(cause1, cause2)),
      onSuccess: () => result
    });
  },
  onSuccess: (success) => {
    const result = exitSucceed$1(success);
    return zipRight$1(cleanup(result), result);
  }
})));
const onInterrupt = /* @__PURE__ */ dual(2, (self, cleanup) => onExit$1(self, exitMatch({
  onFailure: (cause) => isInterruptedOnly(cause) ? asVoid$1(cleanup(interruptors(cause))) : void_$1,
  onSuccess: () => void_$1
})));
const orElse$2 = /* @__PURE__ */ dual(2, (self, that) => attemptOrElse(self, that, succeed$5));
const orDie = (self) => orDieWith(self, identity);
const orDieWith = /* @__PURE__ */ dual(2, (self, f) => matchEffect(self, {
  onFailure: (e) => die$1(f(e)),
  onSuccess: succeed$5
}));
const succeed$5 = (value) => {
  const effect2 = new EffectPrimitiveSuccess(OP_SUCCESS);
  effect2.effect_instruction_i0 = value;
  return effect2;
};
const suspend$2 = (evaluate2) => {
  const effect2 = new EffectPrimitive(OP_COMMIT);
  effect2.commit = evaluate2;
  return effect2;
};
const sync$1 = (thunk) => {
  const effect2 = new EffectPrimitive(OP_SYNC);
  effect2.effect_instruction_i0 = thunk;
  return effect2;
};
const tap = /* @__PURE__ */ dual((args2) => args2.length === 3 || args2.length === 2 && !(isObject(args2[1]) && "onlyEffect" in args2[1]), (self, f) => flatMap$3(self, (a) => {
  const b = typeof f === "function" ? f(a) : f;
  if (isEffect$1(b)) {
    return as(b, a);
  } else if (isPromiseLike(b)) {
    return unsafeAsync((resume2) => {
      b.then((_) => resume2(succeed$5(a)), (e) => resume2(fail$2(new UnknownException(e, "An unknown error occurred in Effect.tap"))));
    });
  }
  return succeed$5(a);
}));
const transplant = (f) => withFiberRuntime((state) => {
  const scopeOverride = state.getFiberRef(currentForkScopeOverride);
  const scope = pipe(scopeOverride, getOrElse(() => state.scope()));
  return f(fiberRefLocally(currentForkScopeOverride, some(scope)));
});
const attemptOrElse = /* @__PURE__ */ dual(3, (self, that, onSuccess) => matchCauseEffect$1(self, {
  onFailure: (cause) => {
    const defects$1 = defects(cause);
    if (defects$1.length > 0) {
      return failCause$1(getOrThrow(keepDefectsAndElectFailures(cause)));
    }
    return that();
  },
  onSuccess
}));
const uninterruptible = (self) => {
  const effect2 = new EffectPrimitive(OP_UPDATE_RUNTIME_FLAGS);
  effect2.effect_instruction_i0 = disable(Interruption);
  effect2.effect_instruction_i1 = () => self;
  return effect2;
};
const uninterruptibleMask$1 = (f) => custom(f, function() {
  const effect2 = new EffectPrimitive(OP_UPDATE_RUNTIME_FLAGS);
  effect2.effect_instruction_i0 = disable(Interruption);
  effect2.effect_instruction_i1 = (oldFlags) => interruption(oldFlags) ? internalCall(() => this.effect_instruction_i0(interruptible$1)) : internalCall(() => this.effect_instruction_i0(uninterruptible));
  return effect2;
});
const void_$1 = /* @__PURE__ */ succeed$5(void 0);
const updateRuntimeFlags = (patch2) => {
  const effect2 = new EffectPrimitive(OP_UPDATE_RUNTIME_FLAGS);
  effect2.effect_instruction_i0 = patch2;
  effect2.effect_instruction_i1 = void 0;
  return effect2;
};
const whenEffect = /* @__PURE__ */ dual(2, (self, condition) => flatMap$3(condition, (b) => {
  if (b) {
    return pipe(self, map$3(some));
  }
  return succeed$5(none$4());
}));
const whileLoop = (options) => {
  const effect2 = new EffectPrimitive(OP_WHILE);
  effect2.effect_instruction_i0 = options.while;
  effect2.effect_instruction_i1 = options.body;
  effect2.effect_instruction_i2 = options.step;
  return effect2;
};
const fromIterator = (iterator) => suspend$2(() => {
  const effect2 = new EffectPrimitive(OP_ITERATOR);
  effect2.effect_instruction_i0 = iterator();
  return effect2;
});
const gen$1 = function() {
  const f = arguments.length === 1 ? arguments[0] : arguments[1].bind(arguments[0]);
  return fromIterator(() => f(pipe));
};
const yieldNow$2 = (options) => {
  const effect2 = new EffectPrimitive(OP_YIELD);
  return typeof options?.priority !== "undefined" ? withSchedulingPriority(effect2, options.priority) : effect2;
};
const zip = /* @__PURE__ */ dual(2, (self, that) => flatMap$3(self, (a) => map$3(that, (b) => [a, b])));
const zipLeft = /* @__PURE__ */ dual(2, (self, that) => flatMap$3(self, (a) => as(that, a)));
const zipRight$1 = /* @__PURE__ */ dual(2, (self, that) => flatMap$3(self, () => that));
const zipWith$1 = /* @__PURE__ */ dual(3, (self, that, f) => flatMap$3(self, (a) => map$3(that, (b) => f(a, b))));
const never = /* @__PURE__ */ asyncInterrupt(() => {
  const interval = setInterval(() => {
  }, 2 ** 31 - 1);
  return sync$1(() => clearInterval(interval));
});
const interruptFiber = (self) => flatMap$3(fiberId, (fiberId2) => pipe(self, interruptAsFiber(fiberId2)));
const interruptAsFiber = /* @__PURE__ */ dual(2, (self, fiberId2) => flatMap$3(self.interruptAsFork(fiberId2), () => self.await));
const logLevelAll = {
  _tag: "All",
  syslog: 0,
  label: "ALL",
  ordinal: Number.MIN_SAFE_INTEGER,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelFatal = {
  _tag: "Fatal",
  syslog: 2,
  label: "FATAL",
  ordinal: 5e4,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelError = {
  _tag: "Error",
  syslog: 3,
  label: "ERROR",
  ordinal: 4e4,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelWarning = {
  _tag: "Warning",
  syslog: 4,
  label: "WARN",
  ordinal: 3e4,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelInfo = {
  _tag: "Info",
  syslog: 6,
  label: "INFO",
  ordinal: 2e4,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelDebug = {
  _tag: "Debug",
  syslog: 7,
  label: "DEBUG",
  ordinal: 1e4,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelTrace = {
  _tag: "Trace",
  syslog: 7,
  label: "TRACE",
  ordinal: 0,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const logLevelNone = {
  _tag: "None",
  syslog: 7,
  label: "OFF",
  ordinal: Number.MAX_SAFE_INTEGER,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const FiberRefSymbolKey = "effect/FiberRef";
const FiberRefTypeId = /* @__PURE__ */ Symbol.for(FiberRefSymbolKey);
const fiberRefVariance = {
  /* c8 ignore next */
  _A: (_) => _
};
const fiberRefGet = (self) => withFiberRuntime((fiber) => exitSucceed$1(fiber.getFiberRef(self)));
const fiberRefGetWith = /* @__PURE__ */ dual(2, (self, f) => flatMap$3(fiberRefGet(self), f));
const fiberRefSet = /* @__PURE__ */ dual(2, (self, value) => fiberRefModify(self, () => [void 0, value]));
const fiberRefModify = /* @__PURE__ */ dual(2, (self, f) => withFiberRuntime((state) => {
  const [b, a] = f(state.getFiberRef(self));
  state.setFiberRef(self, a);
  return succeed$5(b);
}));
const fiberRefLocally = /* @__PURE__ */ dual(3, (use, self, value) => acquireUseRelease(zipLeft(fiberRefGet(self), fiberRefSet(self, value)), () => use, (oldValue) => fiberRefSet(self, oldValue)));
const fiberRefLocallyWith = /* @__PURE__ */ dual(3, (use, self, f) => fiberRefGetWith(self, (a) => fiberRefLocally(use, self, f(a))));
const fiberRefUnsafeMake = (initial, options) => fiberRefUnsafeMakePatch(initial, {
  differ: update$2(),
  fork: options?.fork ?? identity,
  join: options?.join
});
const fiberRefUnsafeMakeHashSet = (initial) => {
  const differ2 = hashSet();
  return fiberRefUnsafeMakePatch(initial, {
    differ: differ2,
    fork: differ2.empty
  });
};
const fiberRefUnsafeMakeReadonlyArray = (initial) => {
  const differ2 = readonlyArray(update$2());
  return fiberRefUnsafeMakePatch(initial, {
    differ: differ2,
    fork: differ2.empty
  });
};
const fiberRefUnsafeMakeContext = (initial) => {
  const differ2 = environment();
  return fiberRefUnsafeMakePatch(initial, {
    differ: differ2,
    fork: differ2.empty
  });
};
const fiberRefUnsafeMakePatch = (initial, options) => {
  const _fiberRef = {
    ...CommitPrototype,
    [FiberRefTypeId]: fiberRefVariance,
    initial,
    commit() {
      return fiberRefGet(this);
    },
    diff: (oldValue, newValue) => options.differ.diff(oldValue, newValue),
    combine: (first, second) => options.differ.combine(first, second),
    patch: (patch2) => (oldValue) => options.differ.patch(patch2, oldValue),
    fork: options.fork,
    join: options.join ?? ((_, n) => n)
  };
  return _fiberRef;
};
const fiberRefUnsafeMakeRuntimeFlags = (initial) => fiberRefUnsafeMakePatch(initial, {
  differ: differ$1,
  fork: differ$1.empty
});
const currentContext = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentContext"), () => fiberRefUnsafeMakeContext(empty$j()));
const currentSchedulingPriority = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentSchedulingPriority"), () => fiberRefUnsafeMake(0));
const currentMaxOpsBeforeYield = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentMaxOpsBeforeYield"), () => fiberRefUnsafeMake(2048));
const currentLogAnnotations = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentLogAnnotation"), () => fiberRefUnsafeMake(empty$e()));
const currentLogLevel = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentLogLevel"), () => fiberRefUnsafeMake(logLevelInfo));
const currentLogSpan = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentLogSpan"), () => fiberRefUnsafeMake(empty$d()));
const withSchedulingPriority = /* @__PURE__ */ dual(2, (self, scheduler) => fiberRefLocally(self, currentSchedulingPriority, scheduler));
const currentConcurrency = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentConcurrency"), () => fiberRefUnsafeMake("unbounded"));
const currentRequestBatching = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentRequestBatching"), () => fiberRefUnsafeMake(true));
const currentUnhandledErrorLogLevel = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentUnhandledErrorLogLevel"), () => fiberRefUnsafeMake(some(logLevelDebug)));
const currentMetricLabels = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentMetricLabels"), () => fiberRefUnsafeMakeReadonlyArray(empty$l()));
const currentForkScopeOverride = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentForkScopeOverride"), () => fiberRefUnsafeMake(none$4(), {
  fork: () => none$4(),
  join: (parent, _) => parent
}));
const currentInterruptedCause = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentInterruptedCause"), () => fiberRefUnsafeMake(empty$8, {
  fork: () => empty$8,
  join: (parent, _) => parent
}));
const ScopeTypeId = /* @__PURE__ */ Symbol.for("effect/Scope");
const CloseableScopeTypeId = /* @__PURE__ */ Symbol.for("effect/CloseableScope");
const scopeAddFinalizer = (self, finalizer) => self.addFinalizer(() => asVoid$1(finalizer));
const scopeAddFinalizerExit = (self, finalizer) => self.addFinalizer(finalizer);
const scopeClose = (self, exit2) => self.close(exit2);
const scopeFork = (self, strategy) => self.fork(strategy);
const YieldableError = /* @__PURE__ */ function() {
  class YieldableError2 extends globalThis.Error {
    commit() {
      return fail$2(this);
    }
    toJSON() {
      const obj = {
        ...this
      };
      if (this.message) obj.message = this.message;
      if (this.cause) obj.cause = this.cause;
      return obj;
    }
    [NodeInspectSymbol]() {
      if (this.toString !== globalThis.Error.prototype.toString) {
        return this.stack ? `${this.toString()}
${this.stack.split("\n").slice(1).join("\n")}` : this.toString();
      } else if ("Bun" in globalThis) {
        return pretty$1(fail$3(this), {
          renderErrorCause: true
        });
      }
      return this;
    }
  }
  Object.assign(YieldableError2.prototype, StructuralCommitPrototype);
  return YieldableError2;
}();
const makeException = (proto2, tag) => {
  class Base2 extends YieldableError {
    _tag = tag;
  }
  Object.assign(Base2.prototype, proto2);
  Base2.prototype.name = tag;
  return Base2;
};
const RuntimeExceptionTypeId = /* @__PURE__ */ Symbol.for("effect/Cause/errors/RuntimeException");
const RuntimeException = /* @__PURE__ */ makeException({
  [RuntimeExceptionTypeId]: RuntimeExceptionTypeId
}, "RuntimeException");
const InterruptedExceptionTypeId = /* @__PURE__ */ Symbol.for("effect/Cause/errors/InterruptedException");
const isInterruptedException = (u) => hasProperty(u, InterruptedExceptionTypeId);
const NoSuchElementExceptionTypeId = /* @__PURE__ */ Symbol.for("effect/Cause/errors/NoSuchElement");
const NoSuchElementException = /* @__PURE__ */ makeException({
  [NoSuchElementExceptionTypeId]: NoSuchElementExceptionTypeId
}, "NoSuchElementException");
const UnknownExceptionTypeId = /* @__PURE__ */ Symbol.for("effect/Cause/errors/UnknownException");
const UnknownException = /* @__PURE__ */ function() {
  class UnknownException2 extends YieldableError {
    _tag = "UnknownException";
    error;
    constructor(cause, message) {
      super(message ?? "An unknown error occurred", {
        cause
      });
      this.error = cause;
    }
  }
  Object.assign(UnknownException2.prototype, {
    [UnknownExceptionTypeId]: UnknownExceptionTypeId,
    name: "UnknownException"
  });
  return UnknownException2;
}();
const exitIsExit = (u) => isEffect$1(u) && "_tag" in u && (u._tag === "Success" || u._tag === "Failure");
const exitIsSuccess = (self) => self._tag === "Success";
const exitAs = /* @__PURE__ */ dual(2, (self, value) => {
  switch (self._tag) {
    case OP_FAILURE: {
      return exitFailCause$1(self.effect_instruction_i0);
    }
    case OP_SUCCESS: {
      return exitSucceed$1(value);
    }
  }
});
const exitAsVoid = (self) => exitAs(self, void 0);
const exitCollectAll = (exits, options) => exitCollectAllInternal(exits, options?.parallel ? parallel$2 : sequential$2);
const exitDie$1 = (defect) => exitFailCause$1(die$2(defect));
const exitFail = (error) => exitFailCause$1(fail$3(error));
const exitFailCause$1 = (cause) => {
  const effect2 = new EffectPrimitiveFailure(OP_FAILURE);
  effect2.effect_instruction_i0 = cause;
  return effect2;
};
const exitInterrupt$1 = (fiberId2) => exitFailCause$1(interrupt(fiberId2));
const exitMap = /* @__PURE__ */ dual(2, (self, f) => {
  switch (self._tag) {
    case OP_FAILURE:
      return exitFailCause$1(self.effect_instruction_i0);
    case OP_SUCCESS:
      return exitSucceed$1(f(self.effect_instruction_i0));
  }
});
const exitMatch = /* @__PURE__ */ dual(2, (self, {
  onFailure,
  onSuccess
}) => {
  switch (self._tag) {
    case OP_FAILURE:
      return onFailure(self.effect_instruction_i0);
    case OP_SUCCESS:
      return onSuccess(self.effect_instruction_i0);
  }
});
const exitMatchEffect = /* @__PURE__ */ dual(2, (self, {
  onFailure,
  onSuccess
}) => {
  switch (self._tag) {
    case OP_FAILURE:
      return onFailure(self.effect_instruction_i0);
    case OP_SUCCESS:
      return onSuccess(self.effect_instruction_i0);
  }
});
const exitSucceed$1 = (value) => {
  const effect2 = new EffectPrimitiveSuccess(OP_SUCCESS);
  effect2.effect_instruction_i0 = value;
  return effect2;
};
const exitVoid$1 = /* @__PURE__ */ exitSucceed$1(void 0);
const exitZipWith = /* @__PURE__ */ dual(3, (self, that, {
  onFailure,
  onSuccess
}) => {
  switch (self._tag) {
    case OP_FAILURE: {
      switch (that._tag) {
        case OP_SUCCESS:
          return exitFailCause$1(self.effect_instruction_i0);
        case OP_FAILURE: {
          return exitFailCause$1(onFailure(self.effect_instruction_i0, that.effect_instruction_i0));
        }
      }
    }
    case OP_SUCCESS: {
      switch (that._tag) {
        case OP_SUCCESS:
          return exitSucceed$1(onSuccess(self.effect_instruction_i0, that.effect_instruction_i0));
        case OP_FAILURE:
          return exitFailCause$1(that.effect_instruction_i0);
      }
    }
  }
});
const exitCollectAllInternal = (exits, combineCauses) => {
  const list = fromIterable$5(exits);
  if (!isNonEmpty$2(list)) {
    return none$4();
  }
  return pipe(tailNonEmpty(list), reduce$6(pipe(headNonEmpty(list), exitMap(of$1)), (accumulator, current) => pipe(accumulator, exitZipWith(current, {
    onSuccess: (list2, value) => pipe(list2, prepend$1(value)),
    onFailure: combineCauses
  }))), exitMap(reverse$1), exitMap((chunk) => toReadonlyArray(chunk)), some);
};
const deferredUnsafeMake = (fiberId2) => {
  const _deferred = {
    ...CommitPrototype,
    [DeferredTypeId]: deferredVariance,
    state: make$k(pending([])),
    commit() {
      return deferredAwait(this);
    },
    blockingOn: fiberId2
  };
  return _deferred;
};
const deferredMake = () => flatMap$3(fiberId, (id) => deferredMakeAs(id));
const deferredMakeAs = (fiberId2) => sync$1(() => deferredUnsafeMake(fiberId2));
const deferredAwait = (self) => asyncInterrupt((resume2) => {
  const state = get$5(self.state);
  switch (state._tag) {
    case OP_STATE_DONE: {
      return resume2(state.effect);
    }
    case OP_STATE_PENDING: {
      state.joiners.push(resume2);
      return deferredInterruptJoiner(self, resume2);
    }
  }
}, self.blockingOn);
const deferredCompleteWith = /* @__PURE__ */ dual(2, (self, effect2) => sync$1(() => {
  const state = get$5(self.state);
  switch (state._tag) {
    case OP_STATE_DONE: {
      return false;
    }
    case OP_STATE_PENDING: {
      set$3(self.state, done$4(effect2));
      for (let i = 0, len = state.joiners.length; i < len; i++) {
        state.joiners[i](effect2);
      }
      return true;
    }
  }
}));
const deferredFailCause = /* @__PURE__ */ dual(2, (self, cause) => deferredCompleteWith(self, failCause$1(cause)));
const deferredSucceed = /* @__PURE__ */ dual(2, (self, value) => deferredCompleteWith(self, succeed$5(value)));
const deferredUnsafeDone = (self, effect2) => {
  const state = get$5(self.state);
  if (state._tag === OP_STATE_PENDING) {
    set$3(self.state, done$4(effect2));
    for (let i = 0, len = state.joiners.length; i < len; i++) {
      state.joiners[i](effect2);
    }
  }
};
const deferredInterruptJoiner = (self, joiner) => sync$1(() => {
  const state = get$5(self.state);
  if (state._tag === OP_STATE_PENDING) {
    const index = state.joiners.indexOf(joiner);
    if (index >= 0) {
      state.joiners.splice(index, 1);
    }
  }
});
const constContext = /* @__PURE__ */ withFiberRuntime((fiber) => exitSucceed$1(fiber.currentContext));
const context$2 = () => constContext;
const contextWithEffect = (f) => flatMap$3(context$2(), f);
const provideContext$1 = /* @__PURE__ */ dual(2, (self, context2) => fiberRefLocally(currentContext, context2)(self));
const provideSomeContext = /* @__PURE__ */ dual(2, (self, context2) => fiberRefLocallyWith(currentContext, (parent) => merge$3(parent, context2))(self));
const mapInputContext = /* @__PURE__ */ dual(2, (self, f) => contextWithEffect((context2) => provideContext$1(self, f(context2))));
const currentSpanFromFiber = (fiber) => {
  const span2 = fiber.currentSpan;
  return span2 !== void 0 && span2._tag === "Span" ? some(span2) : none$4();
};
const isSuccess = exitIsSuccess;
const TypeId$5 = /* @__PURE__ */ Symbol.for("effect/MutableHashMap");
const MutableHashMapProto = {
  [TypeId$5]: TypeId$5,
  [Symbol.iterator]() {
    return new MutableHashMapIterator(this);
  },
  toString() {
    return format$3(this.toJSON());
  },
  toJSON() {
    return {
      _id: "MutableHashMap",
      values: Array.from(this).map(toJSON)
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
class MutableHashMapIterator {
  self;
  referentialIterator;
  bucketIterator;
  constructor(self) {
    this.self = self;
    this.referentialIterator = self.referential[Symbol.iterator]();
  }
  next() {
    if (this.bucketIterator !== void 0) {
      return this.bucketIterator.next();
    }
    const result = this.referentialIterator.next();
    if (result.done) {
      this.bucketIterator = new BucketIterator(this.self.buckets.values());
      return this.next();
    }
    return result;
  }
  [Symbol.iterator]() {
    return new MutableHashMapIterator(this.self);
  }
}
class BucketIterator {
  backing;
  constructor(backing) {
    this.backing = backing;
  }
  currentBucket;
  next() {
    if (this.currentBucket === void 0) {
      const result2 = this.backing.next();
      if (result2.done) {
        return result2;
      }
      this.currentBucket = result2.value[Symbol.iterator]();
    }
    const result = this.currentBucket.next();
    if (result.done) {
      this.currentBucket = void 0;
      return this.next();
    }
    return result;
  }
}
const empty$7 = () => {
  const self = Object.create(MutableHashMapProto);
  self.referential = /* @__PURE__ */ new Map();
  self.buckets = /* @__PURE__ */ new Map();
  self.bucketsSize = 0;
  return self;
};
const get$3 = /* @__PURE__ */ dual(2, (self, key) => {
  if (isEqual(key) === false) {
    return self.referential.has(key) ? some(self.referential.get(key)) : none$4();
  }
  const hash2 = key[symbol$1]();
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    return none$4();
  }
  return getFromBucket(self, bucket, key);
});
const getFromBucket = (self, bucket, key, remove2 = false) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (key[symbol](bucket[i][0])) {
      const value = bucket[i][1];
      if (remove2) {
        bucket.splice(i, 1);
        self.bucketsSize--;
      }
      return some(value);
    }
  }
  return none$4();
};
const has = /* @__PURE__ */ dual(2, (self, key) => isSome(get$3(self, key)));
const set$1 = /* @__PURE__ */ dual(3, (self, key, value) => {
  if (isEqual(key) === false) {
    self.referential.set(key, value);
    return self;
  }
  const hash2 = key[symbol$1]();
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    self.buckets.set(hash2, [[key, value]]);
    self.bucketsSize++;
    return self;
  }
  removeFromBucket(self, bucket, key);
  bucket.push([key, value]);
  self.bucketsSize++;
  return self;
});
const removeFromBucket = (self, bucket, key) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (key[symbol](bucket[i][0])) {
      bucket.splice(i, 1);
      self.bucketsSize--;
      return;
    }
  }
};
const ClockSymbolKey = "effect/Clock";
const ClockTypeId = /* @__PURE__ */ Symbol.for(ClockSymbolKey);
const clockTag = /* @__PURE__ */ GenericTag("effect/Clock");
const MAX_TIMER_MILLIS = 2 ** 31 - 1;
const globalClockScheduler = {
  unsafeSchedule(task, duration) {
    const millis2 = toMillis(duration);
    if (millis2 > MAX_TIMER_MILLIS) {
      return constFalse;
    }
    let completed = false;
    const handle = setTimeout(() => {
      completed = true;
      task();
    }, millis2);
    return () => {
      clearTimeout(handle);
      return !completed;
    };
  }
};
const performanceNowNanos = /* @__PURE__ */ function() {
  const bigint1e62 = /* @__PURE__ */ BigInt(1e6);
  if (typeof performance === "undefined") {
    return () => BigInt(Date.now()) * bigint1e62;
  } else if (typeof performance.timeOrigin === "number" && performance.timeOrigin === 0) {
    return () => BigInt(Math.round(performance.now() * 1e6));
  }
  const origin = /* @__PURE__ */ BigInt(/* @__PURE__ */ Date.now()) * bigint1e62 - /* @__PURE__ */ BigInt(/* @__PURE__ */ Math.round(/* @__PURE__ */ performance.now() * 1e6));
  return () => origin + BigInt(Math.round(performance.now() * 1e6));
}();
const processOrPerformanceNow = /* @__PURE__ */ function() {
  const processHrtime = typeof process === "object" && "hrtime" in process && typeof process.hrtime.bigint === "function" ? process.hrtime : void 0;
  if (!processHrtime) {
    return performanceNowNanos;
  }
  const origin = /* @__PURE__ */ performanceNowNanos() - /* @__PURE__ */ processHrtime.bigint();
  return () => origin + processHrtime.bigint();
}();
class ClockImpl {
  [ClockTypeId] = ClockTypeId;
  unsafeCurrentTimeMillis() {
    return Date.now();
  }
  unsafeCurrentTimeNanos() {
    return processOrPerformanceNow();
  }
  currentTimeMillis = /* @__PURE__ */ sync$1(() => this.unsafeCurrentTimeMillis());
  currentTimeNanos = /* @__PURE__ */ sync$1(() => this.unsafeCurrentTimeNanos());
  scheduler() {
    return succeed$5(globalClockScheduler);
  }
  sleep(duration) {
    return async_((resume2) => {
      const canceler = globalClockScheduler.unsafeSchedule(() => resume2(void_$1), duration);
      return asVoid$1(sync$1(canceler));
    });
  }
}
const make$g = () => new ClockImpl();
const OP_AND = "And";
const OP_OR = "Or";
const OP_INVALID_DATA = "InvalidData";
const OP_MISSING_DATA = "MissingData";
const OP_SOURCE_UNAVAILABLE = "SourceUnavailable";
const OP_UNSUPPORTED = "Unsupported";
const ConfigErrorSymbolKey = "effect/ConfigError";
const ConfigErrorTypeId = /* @__PURE__ */ Symbol.for(ConfigErrorSymbolKey);
const proto$1 = {
  _tag: "ConfigError",
  [ConfigErrorTypeId]: ConfigErrorTypeId
};
const And = (self, that) => {
  const error = Object.create(proto$1);
  error._op = OP_AND;
  error.left = self;
  error.right = that;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      return `${this.left} and ${this.right}`;
    }
  });
  return error;
};
const Or = (self, that) => {
  const error = Object.create(proto$1);
  error._op = OP_OR;
  error.left = self;
  error.right = that;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      return `${this.left} or ${this.right}`;
    }
  });
  return error;
};
const InvalidData = (path, message, options = {
  pathDelim: "."
}) => {
  const error = Object.create(proto$1);
  error._op = OP_INVALID_DATA;
  error.path = path;
  error.message = message;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      const path2 = pipe(this.path, join$1(options.pathDelim));
      return `(Invalid data at ${path2}: "${this.message}")`;
    }
  });
  return error;
};
const MissingData = (path, message, options = {
  pathDelim: "."
}) => {
  const error = Object.create(proto$1);
  error._op = OP_MISSING_DATA;
  error.path = path;
  error.message = message;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      const path2 = pipe(this.path, join$1(options.pathDelim));
      return `(Missing data at ${path2}: "${this.message}")`;
    }
  });
  return error;
};
const SourceUnavailable = (path, message, cause, options = {
  pathDelim: "."
}) => {
  const error = Object.create(proto$1);
  error._op = OP_SOURCE_UNAVAILABLE;
  error.path = path;
  error.message = message;
  error.cause = cause;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      const path2 = pipe(this.path, join$1(options.pathDelim));
      return `(Source unavailable at ${path2}: "${this.message}")`;
    }
  });
  return error;
};
const Unsupported = (path, message, options = {
  pathDelim: "."
}) => {
  const error = Object.create(proto$1);
  error._op = OP_UNSUPPORTED;
  error.path = path;
  error.message = message;
  Object.defineProperty(error, "toString", {
    enumerable: false,
    value() {
      const path2 = pipe(this.path, join$1(options.pathDelim));
      return `(Unsupported operation at ${path2}: "${this.message}")`;
    }
  });
  return error;
};
const prefixed = /* @__PURE__ */ dual(2, (self, prefix) => {
  switch (self._op) {
    case OP_AND: {
      return And(prefixed(self.left, prefix), prefixed(self.right, prefix));
    }
    case OP_OR: {
      return Or(prefixed(self.left, prefix), prefixed(self.right, prefix));
    }
    case OP_INVALID_DATA: {
      return InvalidData([...prefix, ...self.path], self.message);
    }
    case OP_MISSING_DATA: {
      return MissingData([...prefix, ...self.path], self.message);
    }
    case OP_SOURCE_UNAVAILABLE: {
      return SourceUnavailable([...prefix, ...self.path], self.message, self.cause);
    }
    case OP_UNSUPPORTED: {
      return Unsupported([...prefix, ...self.path], self.message);
    }
  }
});
const empty$6 = {
  _tag: "Empty"
};
const patch$3 = /* @__PURE__ */ dual(2, (path, patch2) => {
  let input = of(patch2);
  let output = path;
  while (isCons(input)) {
    const patch3 = input.head;
    switch (patch3._tag) {
      case "Empty": {
        input = input.tail;
        break;
      }
      case "AndThen": {
        input = cons(patch3.first, cons(patch3.second, input.tail));
        break;
      }
      case "MapName": {
        output = map$6(output, patch3.f);
        input = input.tail;
        break;
      }
      case "Nested": {
        output = prepend$2(output, patch3.name);
        input = input.tail;
        break;
      }
      case "Unnested": {
        const containsName = pipe(head$1(output), contains(patch3.name));
        if (containsName) {
          output = tailNonEmpty$1(output);
          input = input.tail;
        } else {
          return left(MissingData(output, `Expected ${patch3.name} to be in path in ConfigProvider#unnested`));
        }
        break;
      }
    }
  }
  return right(output);
});
const OP_CONSTANT = "Constant";
const OP_FAIL = "Fail";
const OP_FALLBACK = "Fallback";
const OP_DESCRIBED = "Described";
const OP_LAZY = "Lazy";
const OP_MAP_OR_FAIL = "MapOrFail";
const OP_NESTED = "Nested";
const OP_PRIMITIVE = "Primitive";
const OP_SEQUENCE = "Sequence";
const OP_HASHMAP = "HashMap";
const OP_ZIP_WITH$1 = "ZipWith";
const concat = (l, r) => [...l, ...r];
const ConfigProviderSymbolKey = "effect/ConfigProvider";
const ConfigProviderTypeId = /* @__PURE__ */ Symbol.for(ConfigProviderSymbolKey);
const configProviderTag = /* @__PURE__ */ GenericTag("effect/ConfigProvider");
const FlatConfigProviderSymbolKey = "effect/ConfigProviderFlat";
const FlatConfigProviderTypeId = /* @__PURE__ */ Symbol.for(FlatConfigProviderSymbolKey);
const make$f = (options) => ({
  [ConfigProviderTypeId]: ConfigProviderTypeId,
  pipe() {
    return pipeArguments(this, arguments);
  },
  ...options
});
const makeFlat = (options) => ({
  [FlatConfigProviderTypeId]: FlatConfigProviderTypeId,
  patch: options.patch,
  load: (path, config, split = true) => options.load(path, config, split),
  enumerateChildren: options.enumerateChildren
});
const fromFlat = (flat) => make$f({
  load: (config) => flatMap$3(fromFlatLoop(flat, empty$l(), config, false), (chunk) => match$5(head$1(chunk), {
    onNone: () => fail$2(MissingData(empty$l(), `Expected a single value having structure: ${config}`)),
    onSome: succeed$5
  })),
  flattened: flat
});
const fromEnv = (options) => {
  const {
    pathDelim,
    seqDelim
  } = Object.assign({}, {
    pathDelim: "_",
    seqDelim: ","
  }, options);
  const makePathString = (path) => pipe(path, join$1(pathDelim));
  const unmakePathString = (pathString) => pathString.split(pathDelim);
  const getEnv = () => typeof process !== "undefined" && "env" in process && typeof process.env === "object" ? process.env : {};
  const load = (path, primitive, split = true) => {
    const pathString = makePathString(path);
    const current = getEnv();
    const valueOpt = pathString in current ? some(current[pathString]) : none$4();
    return pipe(valueOpt, mapError$2(() => MissingData(path, `Expected ${pathString} to exist in the process context`)), flatMap$3((value) => parsePrimitive(value, path, primitive, seqDelim, split)));
  };
  const enumerateChildren = (path) => sync$1(() => {
    const current = getEnv();
    const keys2 = Object.keys(current);
    const keyPaths = keys2.map((value) => unmakePathString(value.toUpperCase()));
    const filteredKeyPaths = keyPaths.filter((keyPath) => {
      for (let i = 0; i < path.length; i++) {
        const pathComponent = pipe(path, unsafeGet$3(i));
        const currentElement = keyPath[i];
        if (currentElement === void 0 || pathComponent !== currentElement) {
          return false;
        }
      }
      return true;
    }).flatMap((keyPath) => keyPath.slice(path.length, path.length + 1));
    return fromIterable$2(filteredKeyPaths);
  });
  return fromFlat(makeFlat({
    load,
    enumerateChildren,
    patch: empty$6
  }));
};
const extend$2 = (leftDef, rightDef, left2, right2) => {
  const leftPad = unfold$1(left2.length, (index) => index >= right2.length ? none$4() : some([leftDef(index), index + 1]));
  const rightPad = unfold$1(right2.length, (index) => index >= left2.length ? none$4() : some([rightDef(index), index + 1]));
  const leftExtension = concat(left2, leftPad);
  const rightExtension = concat(right2, rightPad);
  return [leftExtension, rightExtension];
};
const appendConfigPath = (path, config) => {
  let op = config;
  if (op._tag === "Nested") {
    const out = path.slice();
    while (op._tag === "Nested") {
      out.push(op.name);
      op = op.config;
    }
    return out;
  }
  return path;
};
const fromFlatLoop = (flat, prefix, config, split) => {
  const op = config;
  switch (op._tag) {
    case OP_CONSTANT: {
      return succeed$5(of$2(op.value));
    }
    case OP_DESCRIBED: {
      return suspend$2(() => fromFlatLoop(flat, prefix, op.config, split));
    }
    case OP_FAIL: {
      return fail$2(MissingData(prefix, op.message));
    }
    case OP_FALLBACK: {
      return pipe(suspend$2(() => fromFlatLoop(flat, prefix, op.first, split)), catchAll$1((error1) => {
        if (op.condition(error1)) {
          return pipe(fromFlatLoop(flat, prefix, op.second, split), catchAll$1((error2) => fail$2(Or(error1, error2))));
        }
        return fail$2(error1);
      }));
    }
    case OP_LAZY: {
      return suspend$2(() => fromFlatLoop(flat, prefix, op.config(), split));
    }
    case OP_MAP_OR_FAIL: {
      return suspend$2(() => pipe(fromFlatLoop(flat, prefix, op.original, split), flatMap$3(forEachSequential((a) => pipe(op.mapOrFail(a), mapError$2(prefixed(appendConfigPath(prefix, op.original))))))));
    }
    case OP_NESTED: {
      return suspend$2(() => fromFlatLoop(flat, concat(prefix, of$2(op.name)), op.config, split));
    }
    case OP_PRIMITIVE: {
      return pipe(patch$3(prefix, flat.patch), flatMap$3((prefix2) => pipe(flat.load(prefix2, op, split), flatMap$3((values) => {
        if (values.length === 0) {
          const name = pipe(last(prefix2), getOrElse(() => "<n/a>"));
          return fail$2(MissingData([], `Expected ${op.description} with name ${name}`));
        }
        return succeed$5(values);
      }))));
    }
    case OP_SEQUENCE: {
      return pipe(patch$3(prefix, flat.patch), flatMap$3((patchedPrefix) => pipe(flat.enumerateChildren(patchedPrefix), flatMap$3(indicesFrom), flatMap$3((indices) => {
        if (indices.length === 0) {
          return suspend$2(() => map$3(fromFlatLoop(flat, prefix, op.config, true), of$2));
        }
        return pipe(forEachSequential(indices, (index) => fromFlatLoop(flat, append$1(prefix, `[${index}]`), op.config, true)), map$3((chunkChunk) => {
          const flattened = flatten$3(chunkChunk);
          if (flattened.length === 0) {
            return of$2(empty$l());
          }
          return of$2(flattened);
        }));
      }))));
    }
    case OP_HASHMAP: {
      return suspend$2(() => pipe(patch$3(prefix, flat.patch), flatMap$3((prefix2) => pipe(flat.enumerateChildren(prefix2), flatMap$3((keys2) => {
        return pipe(keys2, forEachSequential((key) => fromFlatLoop(flat, concat(prefix2, of$2(key)), op.valueConfig, split)), map$3((matrix) => {
          if (matrix.length === 0) {
            return of$2(empty$e());
          }
          return pipe(transpose(matrix), map$6((values) => fromIterable$1(zip$1(fromIterable$6(keys2), values))));
        }));
      })))));
    }
    case OP_ZIP_WITH$1: {
      return suspend$2(() => pipe(fromFlatLoop(flat, prefix, op.left, split), either$1, flatMap$3((left2) => pipe(fromFlatLoop(flat, prefix, op.right, split), either$1, flatMap$3((right$12) => {
        if (isLeft(left2) && isLeft(right$12)) {
          return fail$2(And(left2.left, right$12.left));
        }
        if (isLeft(left2) && isRight(right$12)) {
          return fail$2(left2.left);
        }
        if (isRight(left2) && isLeft(right$12)) {
          return fail$2(right$12.left);
        }
        if (isRight(left2) && isRight(right$12)) {
          const path = pipe(prefix, join$1("."));
          const fail2 = fromFlatLoopFail(prefix, path);
          const [lefts, rights] = extend$2(fail2, fail2, pipe(left2.right, map$6(right)), pipe(right$12.right, map$6(right)));
          return pipe(lefts, zip$1(rights), forEachSequential(([left3, right2]) => pipe(zip(left3, right2), map$3(([left4, right3]) => op.zip(left4, right3)))));
        }
        throw new Error("BUG: ConfigProvider.fromFlatLoop - please report an issue at https://github.com/Effect-TS/effect/issues");
      })))));
    }
  }
};
const fromFlatLoopFail = (prefix, path) => (index) => left(MissingData(prefix, `The element at index ${index} in a sequence at path "${path}" was missing`));
const splitPathString = (text, delim) => {
  const split = text.split(new RegExp(`\\s*${escape(delim)}\\s*`));
  return split;
};
const parsePrimitive = (text, path, primitive, delimiter, split) => {
  if (!split) {
    return pipe(primitive.parse(text), mapBoth$2({
      onFailure: prefixed(path),
      onSuccess: of$2
    }));
  }
  return pipe(splitPathString(text, delimiter), forEachSequential((char) => primitive.parse(char.trim())), mapError$2(prefixed(path)));
};
const transpose = (array2) => {
  return Object.keys(array2[0]).map((column) => array2.map((row) => row[column]));
};
const indicesFrom = (quotedIndices) => pipe(forEachSequential(quotedIndices, parseQuotedIndex), mapBoth$2({
  onFailure: () => empty$l(),
  onSuccess: sort(Order$1)
}), either$1, map$3(merge$5));
const QUOTED_INDEX_REGEX = /^(\[(\d+)\])$/;
const parseQuotedIndex = (str) => {
  const match2 = str.match(QUOTED_INDEX_REGEX);
  if (match2 !== null) {
    const matchedIndex = match2[2];
    return pipe(matchedIndex !== void 0 && matchedIndex.length > 0 ? some(matchedIndex) : none$4(), flatMap$5(parseInteger));
  }
  return none$4();
};
const parseInteger = (str) => {
  const parsedIndex = Number.parseInt(str);
  return Number.isNaN(parsedIndex) ? none$4() : some(parsedIndex);
};
const TypeId$4 = /* @__PURE__ */ Symbol.for("effect/Console");
const consoleTag = /* @__PURE__ */ GenericTag("effect/Console");
const defaultConsole = {
  [TypeId$4]: TypeId$4,
  assert(condition, ...args2) {
    return sync$1(() => {
      console.assert(condition, ...args2);
    });
  },
  clear: /* @__PURE__ */ sync$1(() => {
    console.clear();
  }),
  count(label) {
    return sync$1(() => {
      console.count(label);
    });
  },
  countReset(label) {
    return sync$1(() => {
      console.countReset(label);
    });
  },
  debug(...args2) {
    return sync$1(() => {
      console.debug(...args2);
    });
  },
  dir(item, options) {
    return sync$1(() => {
      console.dir(item, options);
    });
  },
  dirxml(...args2) {
    return sync$1(() => {
      console.dirxml(...args2);
    });
  },
  error(...args2) {
    return sync$1(() => {
      console.error(...args2);
    });
  },
  group(options) {
    return options?.collapsed ? sync$1(() => console.groupCollapsed(options?.label)) : sync$1(() => console.group(options?.label));
  },
  groupEnd: /* @__PURE__ */ sync$1(() => {
    console.groupEnd();
  }),
  info(...args2) {
    return sync$1(() => {
      console.info(...args2);
    });
  },
  log(...args2) {
    return sync$1(() => {
      console.log(...args2);
    });
  },
  table(tabularData, properties) {
    return sync$1(() => {
      console.table(tabularData, properties);
    });
  },
  time(label) {
    return sync$1(() => console.time(label));
  },
  timeEnd(label) {
    return sync$1(() => console.timeEnd(label));
  },
  timeLog(label, ...args2) {
    return sync$1(() => {
      console.timeLog(label, ...args2);
    });
  },
  trace(...args2) {
    return sync$1(() => {
      console.trace(...args2);
    });
  },
  warn(...args2) {
    return sync$1(() => {
      console.warn(...args2);
    });
  },
  unsafe: console
};
const RandomSymbolKey = "effect/Random";
const RandomTypeId = /* @__PURE__ */ Symbol.for(RandomSymbolKey);
const randomTag = /* @__PURE__ */ GenericTag("effect/Random");
class RandomImpl {
  seed;
  [RandomTypeId] = RandomTypeId;
  PRNG;
  constructor(seed) {
    this.seed = seed;
    this.PRNG = new PCGRandom(seed);
  }
  get next() {
    return sync$1(() => this.PRNG.number());
  }
  get nextBoolean() {
    return map$3(this.next, (n) => n > 0.5);
  }
  get nextInt() {
    return sync$1(() => this.PRNG.integer(Number.MAX_SAFE_INTEGER));
  }
  nextRange(min2, max) {
    return map$3(this.next, (n) => (max - min2) * n + min2);
  }
  nextIntBetween(min2, max) {
    return sync$1(() => this.PRNG.integer(max - min2) + min2);
  }
  shuffle(elements) {
    return shuffleWith(elements, (n) => this.nextIntBetween(0, n));
  }
}
const shuffleWith = (elements, nextIntBounded) => {
  return suspend$2(() => pipe(sync$1(() => Array.from(elements)), flatMap$3((buffer) => {
    const numbers = [];
    for (let i = buffer.length; i >= 2; i = i - 1) {
      numbers.push(i);
    }
    return pipe(numbers, forEachSequentialDiscard((n) => pipe(nextIntBounded(n), map$3((k) => swap(buffer, n - 1, k)))), as(fromIterable$5(buffer)));
  })));
};
const swap = (buffer, index1, index2) => {
  const tmp = buffer[index1];
  buffer[index1] = buffer[index2];
  buffer[index2] = tmp;
  return buffer;
};
const make$e = (seed) => new RandomImpl(hash(seed));
const TracerTypeId = /* @__PURE__ */ Symbol.for("effect/Tracer");
const make$d = (options) => ({
  [TracerTypeId]: TracerTypeId,
  ...options
});
const tracerTag = /* @__PURE__ */ GenericTag("effect/Tracer");
const spanTag = /* @__PURE__ */ GenericTag("effect/ParentSpan");
const randomHexString = /* @__PURE__ */ function() {
  const characters = "abcdef0123456789";
  const charactersLength = characters.length;
  return function(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
}();
class NativeSpan {
  name;
  parent;
  context;
  startTime;
  kind;
  _tag = "Span";
  spanId;
  traceId = "native";
  sampled = true;
  status;
  attributes;
  events = [];
  links;
  constructor(name, parent, context2, links, startTime, kind) {
    this.name = name;
    this.parent = parent;
    this.context = context2;
    this.startTime = startTime;
    this.kind = kind;
    this.status = {
      _tag: "Started",
      startTime
    };
    this.attributes = /* @__PURE__ */ new Map();
    this.traceId = parent._tag === "Some" ? parent.value.traceId : randomHexString(32);
    this.spanId = randomHexString(16);
    this.links = Array.from(links);
  }
  end(endTime, exit2) {
    this.status = {
      _tag: "Ended",
      endTime,
      exit: exit2,
      startTime: this.status.startTime
    };
  }
  attribute(key, value) {
    this.attributes.set(key, value);
  }
  event(name, startTime, attributes) {
    this.events.push([name, startTime, attributes ?? {}]);
  }
  addLinks(links) {
    this.links.push(...links);
  }
}
const nativeTracer = /* @__PURE__ */ make$d({
  span: (name, parent, context2, links, startTime, kind) => new NativeSpan(name, parent, context2, links, startTime, kind),
  context: (f) => f()
});
const liveServices = /* @__PURE__ */ pipe(/* @__PURE__ */ empty$j(), /* @__PURE__ */ add$2(clockTag, /* @__PURE__ */ make$g()), /* @__PURE__ */ add$2(consoleTag, defaultConsole), /* @__PURE__ */ add$2(randomTag, /* @__PURE__ */ make$e(/* @__PURE__ */ Math.random())), /* @__PURE__ */ add$2(configProviderTag, /* @__PURE__ */ fromEnv()), /* @__PURE__ */ add$2(tracerTag, nativeTracer));
const currentServices = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/DefaultServices/currentServices"), () => fiberRefUnsafeMakeContext(liveServices));
const sleep$2 = (duration) => {
  const decodedDuration = decode(duration);
  return clockWith((clock) => clock.sleep(decodedDuration));
};
const defaultServicesWith = (f) => withFiberRuntime((fiber) => f(fiber.currentDefaultServices));
const clockWith = (f) => defaultServicesWith((services) => f(services.unsafeMap.get(clockTag.key)));
const currentTimeMillis$1 = /* @__PURE__ */ clockWith((clock) => clock.currentTimeMillis);
const sleep$1 = sleep$2;
const currentTimeMillis = currentTimeMillis$1;
function unsafeMake$3(fiberRefLocals) {
  return new FiberRefsImpl(fiberRefLocals);
}
function empty$5() {
  return unsafeMake$3(/* @__PURE__ */ new Map());
}
const FiberRefsSym = /* @__PURE__ */ Symbol.for("effect/FiberRefs");
class FiberRefsImpl {
  locals;
  [FiberRefsSym] = FiberRefsSym;
  constructor(locals) {
    this.locals = locals;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const findAncestor = (_ref, _parentStack, _childStack, _childModified = false) => {
  const ref = _ref;
  let parentStack = _parentStack;
  let childStack = _childStack;
  let childModified = _childModified;
  let ret = void 0;
  while (ret === void 0) {
    if (isNonEmptyReadonlyArray(parentStack) && isNonEmptyReadonlyArray(childStack)) {
      const parentFiberId = headNonEmpty$1(parentStack)[0];
      const parentAncestors = tailNonEmpty$1(parentStack);
      const childFiberId = headNonEmpty$1(childStack)[0];
      const childRefValue = headNonEmpty$1(childStack)[1];
      const childAncestors = tailNonEmpty$1(childStack);
      if (parentFiberId.startTimeMillis < childFiberId.startTimeMillis) {
        childStack = childAncestors;
        childModified = true;
      } else if (parentFiberId.startTimeMillis > childFiberId.startTimeMillis) {
        parentStack = parentAncestors;
      } else {
        if (parentFiberId.id < childFiberId.id) {
          childStack = childAncestors;
          childModified = true;
        } else if (parentFiberId.id > childFiberId.id) {
          parentStack = parentAncestors;
        } else {
          ret = [childRefValue, childModified];
        }
      }
    } else {
      ret = [ref.initial, true];
    }
  }
  return ret;
};
const joinAs = /* @__PURE__ */ dual(3, (self, fiberId2, that) => {
  const parentFiberRefs = new Map(self.locals);
  that.locals.forEach((childStack, fiberRef) => {
    const childValue = childStack[0][1];
    if (!childStack[0][0][symbol](fiberId2)) {
      if (!parentFiberRefs.has(fiberRef)) {
        if (equals$1(childValue, fiberRef.initial)) {
          return;
        }
        parentFiberRefs.set(fiberRef, [[fiberId2, fiberRef.join(fiberRef.initial, childValue)]]);
        return;
      }
      const parentStack = parentFiberRefs.get(fiberRef);
      const [ancestor, wasModified] = findAncestor(fiberRef, parentStack, childStack);
      if (wasModified) {
        const patch2 = fiberRef.diff(ancestor, childValue);
        const oldValue = parentStack[0][1];
        const newValue = fiberRef.join(oldValue, fiberRef.patch(patch2)(oldValue));
        if (!equals$1(oldValue, newValue)) {
          let newStack;
          const parentFiberId = parentStack[0][0];
          if (parentFiberId[symbol](fiberId2)) {
            newStack = [[parentFiberId, newValue], ...parentStack.slice(1)];
          } else {
            newStack = [[fiberId2, newValue], ...parentStack];
          }
          parentFiberRefs.set(fiberRef, newStack);
        }
      }
    }
  });
  return new FiberRefsImpl(parentFiberRefs);
});
const forkAs = /* @__PURE__ */ dual(2, (self, childId) => {
  const map2 = /* @__PURE__ */ new Map();
  unsafeForkAs(self, map2, childId);
  return new FiberRefsImpl(map2);
});
const unsafeForkAs = (self, map2, fiberId2) => {
  self.locals.forEach((stack, fiberRef) => {
    const oldValue = stack[0][1];
    const newValue = fiberRef.patch(fiberRef.fork)(oldValue);
    if (equals$1(oldValue, newValue)) {
      map2.set(fiberRef, stack);
    } else {
      map2.set(fiberRef, [[fiberId2, newValue], ...stack]);
    }
  });
};
const delete_ = /* @__PURE__ */ dual(2, (self, fiberRef) => {
  const locals = new Map(self.locals);
  locals.delete(fiberRef);
  return new FiberRefsImpl(locals);
});
const get$2 = /* @__PURE__ */ dual(2, (self, fiberRef) => {
  if (!self.locals.has(fiberRef)) {
    return none$4();
  }
  return some(headNonEmpty$1(self.locals.get(fiberRef))[1]);
});
const getOrDefault$1 = /* @__PURE__ */ dual(2, (self, fiberRef) => pipe(get$2(self, fiberRef), getOrElse(() => fiberRef.initial)));
const updateAs = /* @__PURE__ */ dual(2, (self, {
  fiberId: fiberId2,
  fiberRef,
  value
}) => {
  if (self.locals.size === 0) {
    return new FiberRefsImpl(/* @__PURE__ */ new Map([[fiberRef, [[fiberId2, value]]]]));
  }
  const locals = new Map(self.locals);
  unsafeUpdateAs(locals, fiberId2, fiberRef, value);
  return new FiberRefsImpl(locals);
});
const unsafeUpdateAs = (locals, fiberId2, fiberRef, value) => {
  const oldStack = locals.get(fiberRef) ?? [];
  let newStack;
  if (isNonEmptyReadonlyArray(oldStack)) {
    const [currentId, currentValue] = headNonEmpty$1(oldStack);
    if (currentId[symbol](fiberId2)) {
      if (equals$1(currentValue, value)) {
        return;
      } else {
        newStack = [[fiberId2, value], ...oldStack.slice(1)];
      }
    } else {
      newStack = [[fiberId2, value], ...oldStack];
    }
  } else {
    newStack = [[fiberId2, value]];
  }
  locals.set(fiberRef, newStack);
};
const updateManyAs$1 = /* @__PURE__ */ dual(2, (self, {
  entries,
  forkAs: forkAs2
}) => {
  if (self.locals.size === 0) {
    return new FiberRefsImpl(new Map(entries));
  }
  const locals = new Map(self.locals);
  if (forkAs2 !== void 0) {
    unsafeForkAs(self, locals, forkAs2);
  }
  entries.forEach(([fiberRef, values]) => {
    if (values.length === 1) {
      unsafeUpdateAs(locals, values[0][0], fiberRef, values[0][1]);
    } else {
      values.forEach(([fiberId2, value]) => {
        unsafeUpdateAs(locals, fiberId2, fiberRef, value);
      });
    }
  });
  return new FiberRefsImpl(locals);
});
const getOrDefault = getOrDefault$1;
const updateManyAs = updateManyAs$1;
const empty$4 = empty$5;
const All = logLevelAll;
const Fatal = logLevelFatal;
const Error$2 = logLevelError;
const Warning = logLevelWarning;
const Info = logLevelInfo;
const Debug = logLevelDebug;
const Trace = logLevelTrace;
const None2 = logLevelNone;
const Order = /* @__PURE__ */ pipe(Order$1, /* @__PURE__ */ mapInput((level) => level.ordinal));
const greaterThan = /* @__PURE__ */ greaterThan$1(Order);
const fromLiteral = (literal) => {
  switch (literal) {
    case "All":
      return All;
    case "Debug":
      return Debug;
    case "Error":
      return Error$2;
    case "Fatal":
      return Fatal;
    case "Info":
      return Info;
    case "Trace":
      return Trace;
    case "None":
      return None2;
    case "Warning":
      return Warning;
  }
};
const formatLabel = (key) => key.replace(/[\s="]/g, "_");
const render = (now) => (self) => {
  const label = formatLabel(self.label);
  return `${label}=${now - self.startTime}ms`;
};
const EffectPrototype = EffectPrototype$1;
const Base = Base$1;
let Class$2 = class Class extends Base {
};
const TypeId$3 = /* @__PURE__ */ Symbol.for("effect/Readable");
const RefTypeId = /* @__PURE__ */ Symbol.for("effect/Ref");
const refVariance = {
  /* c8 ignore next */
  _A: (_) => _
};
class RefImpl extends Class$2 {
  ref;
  commit() {
    return this.get;
  }
  [RefTypeId] = refVariance;
  [TypeId$3] = TypeId$3;
  constructor(ref) {
    super();
    this.ref = ref;
    this.get = sync$1(() => get$5(this.ref));
  }
  get;
  modify(f) {
    return sync$1(() => {
      const current = get$5(this.ref);
      const [b, a] = f(current);
      if (current !== a) {
        set$3(a)(this.ref);
      }
      return b;
    });
  }
}
const unsafeMake$2 = (value) => new RefImpl(make$k(value));
const make$c = (value) => sync$1(() => unsafeMake$2(value));
const get$1 = (self) => self.get;
const set = /* @__PURE__ */ dual(2, (self, value) => self.modify(() => [void 0, value]));
const modify = /* @__PURE__ */ dual(2, (self, f) => self.modify(f));
const update$1 = /* @__PURE__ */ dual(2, (self, f) => self.modify((a) => [void 0, f(a)]));
const OP_EMPTY$1 = "Empty";
const OP_ADD = "Add";
const OP_REMOVE = "Remove";
const OP_UPDATE = "Update";
const OP_AND_THEN$1 = "AndThen";
const empty$3 = {
  _tag: OP_EMPTY$1
};
const diff$2 = (oldValue, newValue) => {
  const missingLocals = new Map(oldValue.locals);
  let patch2 = empty$3;
  for (const [fiberRef, pairs] of newValue.locals.entries()) {
    const newValue2 = headNonEmpty$1(pairs)[1];
    const old = missingLocals.get(fiberRef);
    if (old !== void 0) {
      const oldValue2 = headNonEmpty$1(old)[1];
      if (!equals$1(oldValue2, newValue2)) {
        patch2 = combine$1({
          _tag: OP_UPDATE,
          fiberRef,
          patch: fiberRef.diff(oldValue2, newValue2)
        })(patch2);
      }
    } else {
      patch2 = combine$1({
        _tag: OP_ADD,
        fiberRef,
        value: newValue2
      })(patch2);
    }
    missingLocals.delete(fiberRef);
  }
  for (const [fiberRef] of missingLocals.entries()) {
    patch2 = combine$1({
      _tag: OP_REMOVE,
      fiberRef
    })(patch2);
  }
  return patch2;
};
const combine$1 = /* @__PURE__ */ dual(2, (self, that) => ({
  _tag: OP_AND_THEN$1,
  first: self,
  second: that
}));
const patch$2 = /* @__PURE__ */ dual(3, (self, fiberId2, oldValue) => {
  let fiberRefs2 = oldValue;
  let patches = of$2(self);
  while (isNonEmptyReadonlyArray(patches)) {
    const head2 = headNonEmpty$1(patches);
    const tail = tailNonEmpty$1(patches);
    switch (head2._tag) {
      case OP_EMPTY$1: {
        patches = tail;
        break;
      }
      case OP_ADD: {
        fiberRefs2 = updateAs(fiberRefs2, {
          fiberId: fiberId2,
          fiberRef: head2.fiberRef,
          value: head2.value
        });
        patches = tail;
        break;
      }
      case OP_REMOVE: {
        fiberRefs2 = delete_(fiberRefs2, head2.fiberRef);
        patches = tail;
        break;
      }
      case OP_UPDATE: {
        const value = getOrDefault$1(fiberRefs2, head2.fiberRef);
        fiberRefs2 = updateAs(fiberRefs2, {
          fiberId: fiberId2,
          fiberRef: head2.fiberRef,
          value: head2.fiberRef.patch(head2.patch)(value)
        });
        patches = tail;
        break;
      }
      case OP_AND_THEN$1: {
        patches = prepend$2(head2.first)(prepend$2(head2.second)(tail));
        break;
      }
    }
  }
  return fiberRefs2;
});
const MetricLabelSymbolKey = "effect/MetricLabel";
const MetricLabelTypeId = /* @__PURE__ */ Symbol.for(MetricLabelSymbolKey);
class MetricLabelImpl {
  key;
  value;
  [MetricLabelTypeId] = MetricLabelTypeId;
  _hash;
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this._hash = string(MetricLabelSymbolKey + this.key + this.value);
  }
  [symbol$1]() {
    return this._hash;
  }
  [symbol](that) {
    return isMetricLabel(that) && this.key === that.key && this.value === that.value;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const make$b = (key, value) => {
  return new MetricLabelImpl(key, value);
};
const isMetricLabel = (u) => hasProperty(u, MetricLabelTypeId);
const asSome = (self) => map$3(self, some);
const try_$1 = (arg) => {
  let evaluate2;
  let onFailure = void 0;
  if (typeof arg === "function") {
    evaluate2 = arg;
  } else {
    evaluate2 = arg.try;
    onFailure = arg.catch;
  }
  return suspend$2(() => {
    try {
      return succeed$5(internalCall(evaluate2));
    } catch (error) {
      return fail$2(onFailure ? internalCall(() => onFailure(error)) : new UnknownException(error, "An unknown error occurred in Effect.try"));
    }
  });
};
const catchTag$1 = /* @__PURE__ */ dual(3, (self, k, f) => catchIf(self, isTagged(k), f));
const catchTags$1 = /* @__PURE__ */ dual(2, (self, cases) => {
  let keys2;
  return catchIf(self, (e) => {
    keys2 ??= Object.keys(cases);
    return hasProperty(e, "_tag") && isString(e["_tag"]) && keys2.includes(e["_tag"]);
  }, (e) => cases[e["_tag"]](e));
});
const delay$1 = /* @__PURE__ */ dual(2, (self, duration) => zipRight$1(sleep$1(duration), self));
const diffFiberRefs = (self) => summarized(self, fiberRefs, diff$2);
const filterOrElse = /* @__PURE__ */ dual(3, (self, predicate, orElse2) => flatMap$3(self, (a) => predicate(a) ? succeed$5(a) : orElse2(a)));
const filterOrFail$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, predicate, orFailWith) => filterOrElse(self, predicate, (a) => orFailWith === void 0 ? fail$2(new NoSuchElementException()) : failSync(() => orFailWith(a))));
const match$2 = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (e) => succeed$5(options.onFailure(e)),
  onSuccess: (a) => succeed$5(options.onSuccess(a))
}));
const fiberRefs = /* @__PURE__ */ withFiberRuntime((state) => succeed$5(state.getFiberRefs()));
const logWithLevel = (level) => (...message) => {
  const levelOption = fromNullable(level);
  let cause = void 0;
  for (let i = 0, len = message.length; i < len; i++) {
    const msg = message[i];
    if (isCause(msg)) {
      if (cause !== void 0) {
        cause = sequential$2(cause, msg);
      } else {
        cause = msg;
      }
      message = [...message.slice(0, i), ...message.slice(i + 1)];
      i--;
    }
  }
  if (cause === void 0) {
    cause = empty$8;
  }
  return withFiberRuntime((fiberState) => {
    fiberState.log(message, cause, levelOption);
    return void_$1;
  });
};
const logDebug$1 = /* @__PURE__ */ logWithLevel(Debug);
const logInfo$1 = /* @__PURE__ */ logWithLevel(Info);
const negate = (self) => map$3(self, (b) => !b);
const orElseSucceed$1 = /* @__PURE__ */ dual(2, (self, evaluate2) => orElse$2(self, () => sync$1(evaluate2)));
const patchFiberRefs = (patch2) => updateFiberRefs((fiberId2, fiberRefs2) => pipe(patch2, patch$2(fiberId2, fiberRefs2)));
const provideService = /* @__PURE__ */ dual(3, (self, tag, service) => contextWithEffect((env) => provideContext$1(self, add$2(env, tag, service))));
const sandbox$1 = (self) => matchCauseEffect$1(self, {
  onFailure: fail$2,
  onSuccess: succeed$5
});
const sleep = sleep$1;
const succeedNone = /* @__PURE__ */ succeed$5(/* @__PURE__ */ none$4());
const summarized = /* @__PURE__ */ dual(3, (self, summary2, f) => flatMap$3(summary2, (start2) => flatMap$3(self, (value) => map$3(summary2, (end2) => [f(start2, end2), value]))));
const tryPromise$1 = (arg) => {
  let evaluate2;
  let catcher = void 0;
  if (typeof arg === "function") {
    evaluate2 = arg;
  } else {
    evaluate2 = arg.try;
    catcher = arg.catch;
  }
  const fail2 = (e) => catcher ? failSync(() => catcher(e)) : fail$2(new UnknownException(e, "An unknown error occurred in Effect.tryPromise"));
  if (evaluate2.length >= 1) {
    return async_((resolve, signal) => {
      try {
        evaluate2(signal).then((a) => resolve(exitSucceed$1(a)), (e) => resolve(fail2(e)));
      } catch (e) {
        resolve(fail2(e));
      }
    });
  }
  return async_((resolve) => {
    try {
      evaluate2().then((a) => resolve(exitSucceed$1(a)), (e) => resolve(fail2(e)));
    } catch (e) {
      resolve(fail2(e));
    }
  });
};
const updateFiberRefs = (f) => withFiberRuntime((state) => {
  state.setFiberRefs(f(state.id(), state.getFiberRefs()));
  return void_$1;
});
const OP_SEQUENTIAL = "Sequential";
const OP_PARALLEL = "Parallel";
const OP_PARALLEL_N = "ParallelN";
const sequential$1 = {
  _tag: OP_SEQUENTIAL
};
const parallel$1 = {
  _tag: OP_PARALLEL
};
const parallelN$1 = (parallelism) => ({
  _tag: OP_PARALLEL_N,
  parallelism
});
const isSequential = (self) => self._tag === OP_SEQUENTIAL;
const isParallel = (self) => self._tag === OP_PARALLEL;
const sequential = sequential$1;
const parallel = parallel$1;
const parallelN = parallelN$1;
const diff$1 = diff$2;
const patch$1 = patch$2;
const FiberStatusSymbolKey = "effect/FiberStatus";
const FiberStatusTypeId = /* @__PURE__ */ Symbol.for(FiberStatusSymbolKey);
const OP_DONE$1 = "Done";
const OP_RUNNING = "Running";
const OP_SUSPENDED = "Suspended";
const DoneHash = /* @__PURE__ */ string(`${FiberStatusSymbolKey}-${OP_DONE$1}`);
class Done {
  [FiberStatusTypeId] = FiberStatusTypeId;
  _tag = OP_DONE$1;
  [symbol$1]() {
    return DoneHash;
  }
  [symbol](that) {
    return isFiberStatus(that) && that._tag === OP_DONE$1;
  }
}
class Running {
  runtimeFlags;
  [FiberStatusTypeId] = FiberStatusTypeId;
  _tag = OP_RUNNING;
  constructor(runtimeFlags) {
    this.runtimeFlags = runtimeFlags;
  }
  [symbol$1]() {
    return pipe(hash(FiberStatusSymbolKey), combine$5(hash(this._tag)), combine$5(hash(this.runtimeFlags)), cached(this));
  }
  [symbol](that) {
    return isFiberStatus(that) && that._tag === OP_RUNNING && this.runtimeFlags === that.runtimeFlags;
  }
}
class Suspended {
  runtimeFlags;
  blockingOn;
  [FiberStatusTypeId] = FiberStatusTypeId;
  _tag = OP_SUSPENDED;
  constructor(runtimeFlags, blockingOn) {
    this.runtimeFlags = runtimeFlags;
    this.blockingOn = blockingOn;
  }
  [symbol$1]() {
    return pipe(hash(FiberStatusSymbolKey), combine$5(hash(this._tag)), combine$5(hash(this.runtimeFlags)), combine$5(hash(this.blockingOn)), cached(this));
  }
  [symbol](that) {
    return isFiberStatus(that) && that._tag === OP_SUSPENDED && this.runtimeFlags === that.runtimeFlags && equals$1(this.blockingOn, that.blockingOn);
  }
}
const done$3 = /* @__PURE__ */ new Done();
const running$1 = (runtimeFlags) => new Running(runtimeFlags);
const suspended$1 = (runtimeFlags, blockingOn) => new Suspended(runtimeFlags, blockingOn);
const isFiberStatus = (u) => hasProperty(u, FiberStatusTypeId);
const isDone$3 = (self) => self._tag === OP_DONE$1;
const done$2 = done$3;
const running = running$1;
const suspended = suspended$1;
const isDone$2 = isDone$3;
const TypeId$2 = /* @__PURE__ */ Symbol.for("effect/Micro");
const MicroExitTypeId = /* @__PURE__ */ Symbol.for("effect/Micro/MicroExit");
const MicroCauseTypeId = /* @__PURE__ */ Symbol.for("effect/Micro/MicroCause");
const microCauseVariance = {
  _E: identity
};
class MicroCauseImpl extends globalThis.Error {
  _tag;
  traces;
  [MicroCauseTypeId];
  constructor(_tag, originalError, traces) {
    const causeName = `MicroCause.${_tag}`;
    let name;
    let message;
    let stack;
    if (originalError instanceof globalThis.Error) {
      name = `(${causeName}) ${originalError.name}`;
      message = originalError.message;
      const messageLines = message.split("\n").length;
      stack = originalError.stack ? `(${causeName}) ${originalError.stack.split("\n").slice(0, messageLines + 3).join("\n")}` : `${name}: ${message}`;
    } else {
      name = causeName;
      message = toStringUnknown(originalError, 0);
      stack = `${name}: ${message}`;
    }
    if (traces.length > 0) {
      stack += `
    ${traces.join("\n    ")}`;
    }
    super(message);
    this._tag = _tag;
    this.traces = traces;
    this[MicroCauseTypeId] = microCauseVariance;
    this.name = name;
    this.stack = stack;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return this.stack;
  }
  [NodeInspectSymbol]() {
    return this.stack;
  }
}
class Die extends MicroCauseImpl {
  defect;
  constructor(defect, traces = []) {
    super("Die", defect, traces);
    this.defect = defect;
  }
}
const causeDie = (defect, traces = []) => new Die(defect, traces);
class Interrupt extends MicroCauseImpl {
  constructor(traces = []) {
    super("Interrupt", "interrupted", traces);
  }
}
const causeInterrupt = (traces = []) => new Interrupt(traces);
const causeIsInterrupt = (self) => self._tag === "Interrupt";
const MicroFiberTypeId = /* @__PURE__ */ Symbol.for("effect/Micro/MicroFiber");
const fiberVariance$1 = {
  _A: identity,
  _E: identity
};
class MicroFiberImpl {
  context;
  interruptible;
  [MicroFiberTypeId];
  _stack = [];
  _observers = [];
  _exit;
  _children;
  currentOpCount = 0;
  constructor(context2, interruptible2 = true) {
    this.context = context2;
    this.interruptible = interruptible2;
    this[MicroFiberTypeId] = fiberVariance$1;
  }
  getRef(ref) {
    return unsafeGetReference(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    this._observers.push(cb);
    return () => {
      const index = this._observers.indexOf(cb);
      if (index >= 0) {
        this._observers.splice(index, 1);
      }
    };
  }
  _interrupted = false;
  unsafeInterrupt() {
    if (this._exit) {
      return;
    }
    this._interrupted = true;
    if (this.interruptible) {
      this.evaluate(exitInterrupt);
    }
  }
  unsafePoll() {
    return this._exit;
  }
  evaluate(effect2) {
    if (this._exit) {
      return;
    } else if (this._yielded !== void 0) {
      const yielded = this._yielded;
      this._yielded = void 0;
      yielded();
    }
    const exit2 = this.runLoop(effect2);
    if (exit2 === Yield) {
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== void 0) {
      return this.evaluate(flatMap$2(interruptChildren, () => exit2));
    }
    this._exit = exit2;
    for (let i = 0; i < this._observers.length; i++) {
      this._observers[i](exit2);
    }
    this._observers.length = 0;
  }
  runLoop(effect2) {
    let yielding = false;
    let current = effect2;
    this.currentOpCount = 0;
    try {
      while (true) {
        this.currentOpCount++;
        if (!yielding && this.getRef(CurrentScheduler).shouldYield(this)) {
          yielding = true;
          const prev = current;
          current = flatMap$2(yieldNow$1, () => prev);
        }
        current = current[evaluate](this);
        if (current === Yield) {
          const yielded = this._yielded;
          if (MicroExitTypeId in yielded) {
            this._yielded = void 0;
            return yielded;
          }
          return Yield;
        }
      }
    } catch (error) {
      if (!hasProperty(current, evaluate)) {
        return exitDie(`MicroFiber.runLoop: Not a valid effect: ${String(current)}`);
      }
      return exitDie(error);
    }
  }
  getCont(symbol2) {
    while (true) {
      const op = this._stack.pop();
      if (!op) return void 0;
      const cont = op[ensureCont] && op[ensureCont](this);
      if (cont) return {
        [symbol2]: cont
      };
      if (op[symbol2]) return op;
    }
  }
  // cancel the yielded operation, or for the yielded exit value
  _yielded = void 0;
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= /* @__PURE__ */ new Set();
  }
}
const fiberMiddleware = /* @__PURE__ */ globalValue("effect/Micro/fiberMiddleware", () => ({
  interruptChildren: void 0
}));
const identifier = /* @__PURE__ */ Symbol.for("effect/Micro/identifier");
const args = /* @__PURE__ */ Symbol.for("effect/Micro/args");
const evaluate = /* @__PURE__ */ Symbol.for("effect/Micro/evaluate");
const successCont = /* @__PURE__ */ Symbol.for("effect/Micro/successCont");
const failureCont = /* @__PURE__ */ Symbol.for("effect/Micro/failureCont");
const ensureCont = /* @__PURE__ */ Symbol.for("effect/Micro/ensureCont");
const Yield = /* @__PURE__ */ Symbol.for("effect/Micro/Yield");
const microVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
const MicroProto = {
  ...EffectPrototype,
  _op: "Micro",
  [TypeId$2]: microVariance,
  pipe() {
    return pipeArguments(this, arguments);
  },
  [Symbol.iterator]() {
    return new SingleShotGen$1(new YieldWrap(this));
  },
  toJSON() {
    return {
      _id: "Micro",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : void 0
    };
  },
  toString() {
    return format$3(this);
  },
  [NodeInspectSymbol]() {
    return format$3(this);
  }
};
function defaultEvaluate(_fiber) {
  return exitDie(`Micro.evaluate: Not implemented`);
}
const makePrimitiveProto = (options) => ({
  ...MicroProto,
  [identifier]: options.op,
  [evaluate]: options.eval ?? defaultEvaluate,
  [successCont]: options.contA,
  [failureCont]: options.contE,
  [ensureCont]: options.ensure
});
const makePrimitive = (options) => {
  const Proto = makePrimitiveProto(options);
  return function() {
    const self = Object.create(Proto);
    self[args] = options.single === false ? arguments : arguments[0];
    return self;
  };
};
const makeExit = (options) => {
  const Proto = {
    ...makePrimitiveProto(options),
    [MicroExitTypeId]: MicroExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    toJSON() {
      return {
        _id: "MicroExit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol](that) {
      return isMicroExit(that) && that._tag === options.op && equals$1(this[args], that[args]);
    },
    [symbol$1]() {
      return cached(this, combine$5(string(options.op))(hash(this[args])));
    }
  };
  return function(value) {
    const self = Object.create(Proto);
    self[args] = value;
    self[successCont] = void 0;
    self[failureCont] = void 0;
    self[ensureCont] = void 0;
    return self;
  };
};
const succeed$4 = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  eval(fiber) {
    const cont = fiber.getCont(successCont);
    return cont ? cont[successCont](this[args], fiber) : fiber.yieldWith(this);
  }
});
const failCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  eval(fiber) {
    let cont = fiber.getCont(failureCont);
    while (causeIsInterrupt(this[args]) && cont && fiber.interruptible) {
      cont = fiber.getCont(failureCont);
    }
    return cont ? cont[failureCont](this[args], fiber) : fiber.yieldWith(this);
  }
});
const yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  eval(fiber) {
    let resumed = false;
    fiber.getRef(CurrentScheduler).scheduleTask(() => {
      if (resumed) return;
      fiber.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber.yieldWith(() => {
      resumed = true;
    });
  }
});
const yieldNow$1 = /* @__PURE__ */ yieldNowWith(0);
const void_ = /* @__PURE__ */ succeed$4(void 0);
const withMicroFiber = /* @__PURE__ */ makePrimitive({
  op: "WithMicroFiber",
  eval(fiber) {
    return this[args](fiber);
  }
});
const flatMap$2 = /* @__PURE__ */ dual(2, (self, f) => {
  const onSuccess = Object.create(OnSuccessProto);
  onSuccess[args] = self;
  onSuccess[successCont] = f;
  return onSuccess;
});
const OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  eval(fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
const isMicroExit = (u) => hasProperty(u, MicroExitTypeId);
const exitSucceed = succeed$4;
const exitFailCause = failCause;
const exitInterrupt = /* @__PURE__ */ exitFailCause(/* @__PURE__ */ causeInterrupt());
const exitDie = (defect) => exitFailCause(causeDie(defect));
const exitVoid = /* @__PURE__ */ exitSucceed(void 0);
const setImmediate = "setImmediate" in globalThis ? globalThis.setImmediate : (f) => setTimeout(f, 0);
class MicroSchedulerDefault {
  tasks = [];
  running = false;
  /**
   * @since 3.5.9
   */
  scheduleTask(task, _priority) {
    this.tasks.push(task);
    if (!this.running) {
      this.running = true;
      setImmediate(this.afterScheduled);
    }
  }
  /**
   * @since 3.5.9
   */
  afterScheduled = () => {
    this.running = false;
    this.runTasks();
  };
  /**
   * @since 3.5.9
   */
  runTasks() {
    const tasks = this.tasks;
    this.tasks = [];
    for (let i = 0, len = tasks.length; i < len; i++) {
      tasks[i]();
    }
  }
  /**
   * @since 3.5.9
   */
  shouldYield(fiber) {
    return fiber.currentOpCount >= fiber.getRef(MaxOpsBeforeYield);
  }
  /**
   * @since 3.5.9
   */
  flush() {
    while (this.tasks.length > 0) {
      this.runTasks();
    }
  }
}
const updateContext = /* @__PURE__ */ dual(2, (self, f) => withMicroFiber((fiber) => {
  const prev = fiber.context;
  fiber.context = f(prev);
  return onExit(self, () => {
    fiber.context = prev;
    return void_;
  });
}));
const provideContext = /* @__PURE__ */ dual(2, (self, provided) => updateContext(self, merge$3(provided)));
class MaxOpsBeforeYield extends (/* @__PURE__ */ Reference()("effect/Micro/currentMaxOpsBeforeYield", {
  defaultValue: () => 2048
})) {
}
class CurrentScheduler extends (/* @__PURE__ */ Reference()("effect/Micro/currentScheduler", {
  defaultValue: () => new MicroSchedulerDefault()
})) {
}
const matchCauseEffect = /* @__PURE__ */ dual(2, (self, options) => {
  const primitive = Object.create(OnSuccessAndFailureProto);
  primitive[args] = self;
  primitive[successCont] = options.onSuccess;
  primitive[failureCont] = options.onFailure;
  return primitive;
});
const OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  eval(fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
const onExit = /* @__PURE__ */ dual(2, (self, f) => uninterruptibleMask((restore) => matchCauseEffect(restore(self), {
  onFailure: (cause) => flatMap$2(f(exitFailCause(cause)), () => failCause(cause)),
  onSuccess: (a) => flatMap$2(f(exitSucceed(a)), () => succeed$4(a))
})));
const setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  ensure(fiber) {
    fiber.interruptible = this[args];
    if (fiber._interrupted && fiber.interruptible) {
      return () => exitInterrupt;
    }
  }
});
const interruptible = (self) => withMicroFiber((fiber) => {
  if (fiber.interruptible) return self;
  fiber.interruptible = true;
  fiber._stack.push(setInterruptible(false));
  if (fiber._interrupted) return exitInterrupt;
  return self;
});
const uninterruptibleMask = (f) => withMicroFiber((fiber) => {
  if (!fiber.interruptible) return f(identity);
  fiber.interruptible = false;
  fiber._stack.push(setInterruptible(true));
  return f(interruptible);
});
const runFork$1 = (effect2, options) => {
  const fiber = new MicroFiberImpl(CurrentScheduler.context(new MicroSchedulerDefault()));
  fiber.evaluate(effect2);
  return fiber;
};
class PriorityBuckets {
  /**
   * @since 2.0.0
   */
  buckets = [];
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    const length = this.buckets.length;
    let bucket = void 0;
    let index = 0;
    for (; index < length; index++) {
      if (this.buckets[index][0] <= priority) {
        bucket = this.buckets[index];
      } else {
        break;
      }
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === length) {
      this.buckets.push([priority, [task]]);
    } else {
      this.buckets.splice(index, 0, [priority, [task]]);
    }
  }
}
class MixedScheduler {
  maxNextTickBeforeTimer;
  /**
   * @since 2.0.0
   */
  running = false;
  /**
   * @since 2.0.0
   */
  tasks = /* @__PURE__ */ new PriorityBuckets();
  constructor(maxNextTickBeforeTimer) {
    this.maxNextTickBeforeTimer = maxNextTickBeforeTimer;
  }
  /**
   * @since 2.0.0
   */
  starveInternal(depth) {
    const tasks = this.tasks.buckets;
    this.tasks.buckets = [];
    for (const [_, toRun] of tasks) {
      for (let i = 0; i < toRun.length; i++) {
        toRun[i]();
      }
    }
    if (this.tasks.buckets.length === 0) {
      this.running = false;
    } else {
      this.starve(depth);
    }
  }
  /**
   * @since 2.0.0
   */
  starve(depth = 0) {
    if (depth >= this.maxNextTickBeforeTimer) {
      setTimeout(() => this.starveInternal(0), 0);
    } else {
      Promise.resolve(void 0).then(() => this.starveInternal(depth + 1));
    }
  }
  /**
   * @since 2.0.0
   */
  shouldYield(fiber) {
    return fiber.currentOpCount > fiber.getFiberRef(currentMaxOpsBeforeYield) ? fiber.getFiberRef(currentSchedulingPriority) : false;
  }
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (!this.running) {
      this.running = true;
      this.starve();
    }
  }
}
const defaultScheduler = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Scheduler/defaultScheduler"), () => new MixedScheduler(2048));
class SyncScheduler {
  /**
   * @since 2.0.0
   */
  tasks = /* @__PURE__ */ new PriorityBuckets();
  /**
   * @since 2.0.0
   */
  deferred = false;
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    if (this.deferred) {
      defaultScheduler.scheduleTask(task, priority);
    } else {
      this.tasks.scheduleTask(task, priority);
    }
  }
  /**
   * @since 2.0.0
   */
  shouldYield(fiber) {
    return fiber.currentOpCount > fiber.getFiberRef(currentMaxOpsBeforeYield) ? fiber.getFiberRef(currentSchedulingPriority) : false;
  }
  /**
   * @since 2.0.0
   */
  flush() {
    while (this.tasks.buckets.length > 0) {
      const tasks = this.tasks.buckets;
      this.tasks.buckets = [];
      for (const [_, toRun] of tasks) {
        for (let i = 0; i < toRun.length; i++) {
          toRun[i]();
        }
      }
    }
    this.deferred = true;
  }
}
const currentScheduler = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentScheduler"), () => fiberRefUnsafeMake(defaultScheduler));
const currentRequestMap = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentRequestMap"), () => fiberRefUnsafeMake(/* @__PURE__ */ new Map()));
const match$1 = (concurrency, sequential2, unbounded, bounded) => {
  switch (concurrency) {
    case void 0:
      return sequential2();
    case "unbounded":
      return unbounded();
    case "inherit":
      return fiberRefGetWith(currentConcurrency, (concurrency2) => concurrency2 === "unbounded" ? unbounded() : concurrency2 > 1 ? bounded(concurrency2) : sequential2());
    default:
      return concurrency > 1 ? bounded(concurrency) : sequential2();
  }
};
const OP_INTERRUPT_SIGNAL = "InterruptSignal";
const OP_STATEFUL = "Stateful";
const OP_RESUME = "Resume";
const OP_YIELD_NOW = "YieldNow";
const interruptSignal = (cause) => ({
  _tag: OP_INTERRUPT_SIGNAL,
  cause
});
const stateful = (onFiber) => ({
  _tag: OP_STATEFUL,
  onFiber
});
const resume = (effect2) => ({
  _tag: OP_RESUME,
  effect: effect2
});
const yieldNow = () => ({
  _tag: OP_YIELD_NOW
});
const FiberScopeSymbolKey = "effect/FiberScope";
const FiberScopeTypeId = /* @__PURE__ */ Symbol.for(FiberScopeSymbolKey);
class Global {
  [FiberScopeTypeId] = FiberScopeTypeId;
  fiberId = none$2;
  roots = /* @__PURE__ */ new Set();
  add(_runtimeFlags, child) {
    this.roots.add(child);
    child.addObserver(() => {
      this.roots.delete(child);
    });
  }
}
class Local {
  fiberId;
  parent;
  [FiberScopeTypeId] = FiberScopeTypeId;
  constructor(fiberId2, parent) {
    this.fiberId = fiberId2;
    this.parent = parent;
  }
  add(_runtimeFlags, child) {
    this.parent.tell(stateful((parentFiber) => {
      parentFiber.addChild(child);
      child.addObserver(() => {
        parentFiber.removeChild(child);
      });
    }));
  }
}
const unsafeMake$1 = (fiber) => {
  return new Local(fiber.id(), fiber);
};
const globalScope = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberScope/Global"), () => new Global());
const FiberSymbolKey = "effect/Fiber";
const FiberTypeId = /* @__PURE__ */ Symbol.for(FiberSymbolKey);
const fiberVariance = {
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _
};
const fiberProto = {
  [FiberTypeId]: fiberVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const RuntimeFiberSymbolKey = "effect/Fiber";
const RuntimeFiberTypeId = /* @__PURE__ */ Symbol.for(RuntimeFiberSymbolKey);
const join = (self) => zipLeft(flatten(self.await), self.inheritAll);
({
  ...CommitPrototype,
  commit() {
    return join(this);
  },
  ...fiberProto,
  id: () => none$2,
  await: never,
  children: /* @__PURE__ */ succeed$5([]),
  inheritAll: never,
  poll: /* @__PURE__ */ succeed$5(/* @__PURE__ */ none$4()),
  interruptAsFork: () => never
});
const currentFiberURI = "effect/FiberCurrent";
const LoggerSymbolKey = "effect/Logger";
const LoggerTypeId = /* @__PURE__ */ Symbol.for(LoggerSymbolKey);
const loggerVariance = {
  /* c8 ignore next */
  _Message: (_) => _,
  /* c8 ignore next */
  _Output: (_) => _
};
const makeLogger = (log) => ({
  [LoggerTypeId]: loggerVariance,
  log,
  pipe() {
    return pipeArguments(this, arguments);
  }
});
const textOnly = /^[^\s"=]*$/;
const format$1 = (quoteValue, whitespace) => ({
  annotations: annotations2,
  cause,
  date,
  fiberId: fiberId2,
  logLevel,
  message,
  spans
}) => {
  const formatValue = (value) => value.match(textOnly) ? value : quoteValue(value);
  const format2 = (label, value) => `${formatLabel(label)}=${formatValue(value)}`;
  const append2 = (label, value) => " " + format2(label, value);
  let out = format2("timestamp", date.toISOString());
  out += append2("level", logLevel.label);
  out += append2("fiber", threadName$1(fiberId2));
  const messages = ensure(message);
  for (let i = 0; i < messages.length; i++) {
    out += append2("message", toStringUnknown(messages[i], whitespace));
  }
  if (!isEmptyType(cause)) {
    out += append2("cause", pretty$1(cause, {
      renderErrorCause: true
    }));
  }
  for (const span2 of spans) {
    out += " " + render(date.getTime())(span2);
  }
  for (const [label, value] of annotations2) {
    out += append2(label, toStringUnknown(value, whitespace));
  }
  return out;
};
const escapeDoubleQuotes = (s) => `"${s.replace(/\\([\s\S])|(")/g, "\\$1$2")}"`;
const stringLogger = /* @__PURE__ */ makeLogger(/* @__PURE__ */ format$1(escapeDoubleQuotes));
const hasProcessStdout = typeof process === "object" && process !== null && typeof process.stdout === "object" && process.stdout !== null;
hasProcessStdout && process.stdout.isTTY === true;
const MetricBoundariesSymbolKey = "effect/MetricBoundaries";
const MetricBoundariesTypeId = /* @__PURE__ */ Symbol.for(MetricBoundariesSymbolKey);
class MetricBoundariesImpl {
  values;
  [MetricBoundariesTypeId] = MetricBoundariesTypeId;
  constructor(values) {
    this.values = values;
    this._hash = pipe(string(MetricBoundariesSymbolKey), combine$5(array(this.values)));
  }
  _hash;
  [symbol$1]() {
    return this._hash;
  }
  [symbol](u) {
    return isMetricBoundaries(u) && equals$1(this.values, u.values);
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const isMetricBoundaries = (u) => hasProperty(u, MetricBoundariesTypeId);
const fromIterable = (iterable) => {
  const values = pipe(iterable, appendAll$2(of$1(Number.POSITIVE_INFINITY)), dedupe);
  return new MetricBoundariesImpl(values);
};
const exponential$2 = (options) => pipe(makeBy(options.count - 1, (i) => options.start * Math.pow(options.factor, i)), unsafeFromArray, fromIterable);
const MetricKeyTypeSymbolKey = "effect/MetricKeyType";
const MetricKeyTypeTypeId = /* @__PURE__ */ Symbol.for(MetricKeyTypeSymbolKey);
const CounterKeyTypeSymbolKey = "effect/MetricKeyType/Counter";
const CounterKeyTypeTypeId = /* @__PURE__ */ Symbol.for(CounterKeyTypeSymbolKey);
const FrequencyKeyTypeSymbolKey = "effect/MetricKeyType/Frequency";
const FrequencyKeyTypeTypeId = /* @__PURE__ */ Symbol.for(FrequencyKeyTypeSymbolKey);
const GaugeKeyTypeSymbolKey = "effect/MetricKeyType/Gauge";
const GaugeKeyTypeTypeId = /* @__PURE__ */ Symbol.for(GaugeKeyTypeSymbolKey);
const HistogramKeyTypeSymbolKey = "effect/MetricKeyType/Histogram";
const HistogramKeyTypeTypeId = /* @__PURE__ */ Symbol.for(HistogramKeyTypeSymbolKey);
const SummaryKeyTypeSymbolKey = "effect/MetricKeyType/Summary";
const SummaryKeyTypeTypeId = /* @__PURE__ */ Symbol.for(SummaryKeyTypeSymbolKey);
const metricKeyTypeVariance = {
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _Out: (_) => _
};
class CounterKeyType {
  incremental;
  bigint;
  [MetricKeyTypeTypeId] = metricKeyTypeVariance;
  [CounterKeyTypeTypeId] = CounterKeyTypeTypeId;
  constructor(incremental, bigint) {
    this.incremental = incremental;
    this.bigint = bigint;
    this._hash = string(CounterKeyTypeSymbolKey);
  }
  _hash;
  [symbol$1]() {
    return this._hash;
  }
  [symbol](that) {
    return isCounterKey(that);
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
class HistogramKeyType {
  boundaries;
  [MetricKeyTypeTypeId] = metricKeyTypeVariance;
  [HistogramKeyTypeTypeId] = HistogramKeyTypeTypeId;
  constructor(boundaries) {
    this.boundaries = boundaries;
    this._hash = pipe(string(HistogramKeyTypeSymbolKey), combine$5(hash(this.boundaries)));
  }
  _hash;
  [symbol$1]() {
    return this._hash;
  }
  [symbol](that) {
    return isHistogramKey(that) && equals$1(this.boundaries, that.boundaries);
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const counter$4 = (options) => new CounterKeyType(options?.incremental ?? false, options?.bigint ?? false);
const histogram$4 = (boundaries) => {
  return new HistogramKeyType(boundaries);
};
const isCounterKey = (u) => hasProperty(u, CounterKeyTypeTypeId);
const isFrequencyKey = (u) => hasProperty(u, FrequencyKeyTypeTypeId);
const isGaugeKey = (u) => hasProperty(u, GaugeKeyTypeTypeId);
const isHistogramKey = (u) => hasProperty(u, HistogramKeyTypeTypeId);
const isSummaryKey = (u) => hasProperty(u, SummaryKeyTypeTypeId);
const MetricKeySymbolKey = "effect/MetricKey";
const MetricKeyTypeId = /* @__PURE__ */ Symbol.for(MetricKeySymbolKey);
const metricKeyVariance = {
  /* c8 ignore next */
  _Type: (_) => _
};
const arrayEquivilence = /* @__PURE__ */ getEquivalence$2(equals$1);
class MetricKeyImpl {
  name;
  keyType;
  description;
  tags;
  [MetricKeyTypeId] = metricKeyVariance;
  constructor(name, keyType, description, tags = []) {
    this.name = name;
    this.keyType = keyType;
    this.description = description;
    this.tags = tags;
    this._hash = pipe(string(this.name + this.description), combine$5(hash(this.keyType)), combine$5(array(this.tags)));
  }
  _hash;
  [symbol$1]() {
    return this._hash;
  }
  [symbol](u) {
    return isMetricKey(u) && this.name === u.name && equals$1(this.keyType, u.keyType) && equals$1(this.description, u.description) && arrayEquivilence(this.tags, u.tags);
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const isMetricKey = (u) => hasProperty(u, MetricKeyTypeId);
const counter$3 = (name, options) => new MetricKeyImpl(name, counter$4(options), fromNullable(options?.description));
const histogram$3 = (name, boundaries, description) => new MetricKeyImpl(name, histogram$4(boundaries), fromNullable(description));
const taggedWithLabels$1 = /* @__PURE__ */ dual(2, (self, extraTags) => extraTags.length === 0 ? self : new MetricKeyImpl(self.name, self.keyType, self.description, union$2(self.tags, extraTags)));
const MetricStateSymbolKey = "effect/MetricState";
const MetricStateTypeId = /* @__PURE__ */ Symbol.for(MetricStateSymbolKey);
const CounterStateSymbolKey = "effect/MetricState/Counter";
const CounterStateTypeId = /* @__PURE__ */ Symbol.for(CounterStateSymbolKey);
const FrequencyStateSymbolKey = "effect/MetricState/Frequency";
const FrequencyStateTypeId = /* @__PURE__ */ Symbol.for(FrequencyStateSymbolKey);
const GaugeStateSymbolKey = "effect/MetricState/Gauge";
const GaugeStateTypeId = /* @__PURE__ */ Symbol.for(GaugeStateSymbolKey);
const HistogramStateSymbolKey = "effect/MetricState/Histogram";
const HistogramStateTypeId = /* @__PURE__ */ Symbol.for(HistogramStateSymbolKey);
const SummaryStateSymbolKey = "effect/MetricState/Summary";
const SummaryStateTypeId = /* @__PURE__ */ Symbol.for(SummaryStateSymbolKey);
const metricStateVariance = {
  /* c8 ignore next */
  _A: (_) => _
};
class CounterState {
  count;
  [MetricStateTypeId] = metricStateVariance;
  [CounterStateTypeId] = CounterStateTypeId;
  constructor(count) {
    this.count = count;
  }
  [symbol$1]() {
    return pipe(hash(CounterStateSymbolKey), combine$5(hash(this.count)), cached(this));
  }
  [symbol](that) {
    return isCounterState(that) && this.count === that.count;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const arrayEquals = /* @__PURE__ */ getEquivalence$2(equals$1);
class FrequencyState {
  occurrences;
  [MetricStateTypeId] = metricStateVariance;
  [FrequencyStateTypeId] = FrequencyStateTypeId;
  constructor(occurrences) {
    this.occurrences = occurrences;
  }
  _hash;
  [symbol$1]() {
    return pipe(string(FrequencyStateSymbolKey), combine$5(array(fromIterable$6(this.occurrences.entries()))), cached(this));
  }
  [symbol](that) {
    return isFrequencyState(that) && arrayEquals(fromIterable$6(this.occurrences.entries()), fromIterable$6(that.occurrences.entries()));
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
class GaugeState {
  value;
  [MetricStateTypeId] = metricStateVariance;
  [GaugeStateTypeId] = GaugeStateTypeId;
  constructor(value) {
    this.value = value;
  }
  [symbol$1]() {
    return pipe(hash(GaugeStateSymbolKey), combine$5(hash(this.value)), cached(this));
  }
  [symbol](u) {
    return isGaugeState(u) && this.value === u.value;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
class HistogramState {
  buckets;
  count;
  min;
  max;
  sum;
  [MetricStateTypeId] = metricStateVariance;
  [HistogramStateTypeId] = HistogramStateTypeId;
  constructor(buckets, count, min2, max, sum2) {
    this.buckets = buckets;
    this.count = count;
    this.min = min2;
    this.max = max;
    this.sum = sum2;
  }
  [symbol$1]() {
    return pipe(hash(HistogramStateSymbolKey), combine$5(hash(this.buckets)), combine$5(hash(this.count)), combine$5(hash(this.min)), combine$5(hash(this.max)), combine$5(hash(this.sum)), cached(this));
  }
  [symbol](that) {
    return isHistogramState(that) && equals$1(this.buckets, that.buckets) && this.count === that.count && this.min === that.min && this.max === that.max && this.sum === that.sum;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
class SummaryState {
  error;
  quantiles;
  count;
  min;
  max;
  sum;
  [MetricStateTypeId] = metricStateVariance;
  [SummaryStateTypeId] = SummaryStateTypeId;
  constructor(error, quantiles, count, min2, max, sum2) {
    this.error = error;
    this.quantiles = quantiles;
    this.count = count;
    this.min = min2;
    this.max = max;
    this.sum = sum2;
  }
  [symbol$1]() {
    return pipe(hash(SummaryStateSymbolKey), combine$5(hash(this.error)), combine$5(hash(this.quantiles)), combine$5(hash(this.count)), combine$5(hash(this.min)), combine$5(hash(this.max)), combine$5(hash(this.sum)), cached(this));
  }
  [symbol](that) {
    return isSummaryState(that) && this.error === that.error && equals$1(this.quantiles, that.quantiles) && this.count === that.count && this.min === that.min && this.max === that.max && this.sum === that.sum;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const counter$2 = (count) => new CounterState(count);
const frequency$1 = (occurrences) => {
  return new FrequencyState(occurrences);
};
const gauge$1 = (count) => new GaugeState(count);
const histogram$2 = (options) => new HistogramState(options.buckets, options.count, options.min, options.max, options.sum);
const summary$1 = (options) => new SummaryState(options.error, options.quantiles, options.count, options.min, options.max, options.sum);
const isCounterState = (u) => hasProperty(u, CounterStateTypeId);
const isFrequencyState = (u) => hasProperty(u, FrequencyStateTypeId);
const isGaugeState = (u) => hasProperty(u, GaugeStateTypeId);
const isHistogramState = (u) => hasProperty(u, HistogramStateTypeId);
const isSummaryState = (u) => hasProperty(u, SummaryStateTypeId);
const MetricHookSymbolKey = "effect/MetricHook";
const MetricHookTypeId = /* @__PURE__ */ Symbol.for(MetricHookSymbolKey);
const metricHookVariance = {
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _Out: (_) => _
};
const make$a = (options) => ({
  [MetricHookTypeId]: metricHookVariance,
  pipe() {
    return pipeArguments(this, arguments);
  },
  ...options
});
const bigint0 = /* @__PURE__ */ BigInt(0);
const counter$1 = (key) => {
  let sum2 = key.keyType.bigint ? bigint0 : 0;
  const canUpdate = key.keyType.incremental ? key.keyType.bigint ? (value) => value >= bigint0 : (value) => value >= 0 : (_value) => true;
  const update2 = (value) => {
    if (canUpdate(value)) {
      sum2 = sum2 + value;
    }
  };
  return make$a({
    get: () => counter$2(sum2),
    update: update2,
    modify: update2
  });
};
const frequency = (key) => {
  const values = /* @__PURE__ */ new Map();
  for (const word of key.keyType.preregisteredWords) {
    values.set(word, 0);
  }
  const update2 = (word) => {
    const slotCount = values.get(word) ?? 0;
    values.set(word, slotCount + 1);
  };
  return make$a({
    get: () => frequency$1(values),
    update: update2,
    modify: update2
  });
};
const gauge = (_key, startAt) => {
  let value = startAt;
  return make$a({
    get: () => gauge$1(value),
    update: (v) => {
      value = v;
    },
    modify: (v) => {
      value = value + v;
    }
  });
};
const histogram$1 = (key) => {
  const bounds = key.keyType.boundaries.values;
  const size2 = bounds.length;
  const values = new Uint32Array(size2 + 1);
  const boundaries = new Float32Array(size2);
  let count = 0;
  let sum2 = 0;
  let min2 = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  pipe(bounds, sort(Order$1), map$6((n, i) => {
    boundaries[i] = n;
  }));
  const update2 = (value) => {
    let from = 0;
    let to = size2;
    while (from !== to) {
      const mid = Math.floor(from + (to - from) / 2);
      const boundary = boundaries[mid];
      if (value <= boundary) {
        to = mid;
      } else {
        from = mid;
      }
      if (to === from + 1) {
        if (value <= boundaries[from]) {
          to = from;
        } else {
          from = to;
        }
      }
    }
    values[from] = values[from] + 1;
    count = count + 1;
    sum2 = sum2 + value;
    if (value < min2) {
      min2 = value;
    }
    if (value > max) {
      max = value;
    }
  };
  const getBuckets = () => {
    const builder = allocate(size2);
    let cumulated = 0;
    for (let i = 0; i < size2; i++) {
      const boundary = boundaries[i];
      const value = values[i];
      cumulated = cumulated + value;
      builder[i] = [boundary, cumulated];
    }
    return builder;
  };
  return make$a({
    get: () => histogram$2({
      buckets: getBuckets(),
      count,
      min: min2,
      max,
      sum: sum2
    }),
    update: update2,
    modify: update2
  });
};
const summary = (key) => {
  const {
    error,
    maxAge,
    maxSize,
    quantiles
  } = key.keyType;
  const sortedQuantiles = pipe(quantiles, sort(Order$1));
  const values = allocate(maxSize);
  let head2 = 0;
  let count = 0;
  let sum2 = 0;
  let min2 = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  const snapshot = (now) => {
    const builder = [];
    let i = 0;
    while (i !== maxSize - 1) {
      const item = values[i];
      if (item != null) {
        const [t, v] = item;
        const age = millis(now - t);
        if (greaterThanOrEqualTo(age, zero) && lessThanOrEqualTo(age, maxAge)) {
          builder.push(v);
        }
      }
      i = i + 1;
    }
    return calculateQuantiles(error, sortedQuantiles, sort(builder, Order$1));
  };
  const observe = (value, timestamp) => {
    if (maxSize > 0) {
      head2 = head2 + 1;
      const target = head2 % maxSize;
      values[target] = [timestamp, value];
    }
    count = count + 1;
    sum2 = sum2 + value;
    if (value < min2) {
      min2 = value;
    }
    if (value > max) {
      max = value;
    }
  };
  return make$a({
    get: () => summary$1({
      error,
      quantiles: snapshot(Date.now()),
      count,
      min: min2,
      max,
      sum: sum2
    }),
    update: ([value, timestamp]) => observe(value, timestamp),
    modify: ([value, timestamp]) => observe(value, timestamp)
  });
};
const calculateQuantiles = (error, sortedQuantiles, sortedSamples) => {
  const sampleCount = sortedSamples.length;
  if (!isNonEmptyReadonlyArray(sortedQuantiles)) {
    return empty$l();
  }
  const head2 = sortedQuantiles[0];
  const tail = sortedQuantiles.slice(1);
  const resolvedHead = resolveQuantile(error, sampleCount, none$4(), 0, head2, sortedSamples);
  const resolved = of$2(resolvedHead);
  tail.forEach((quantile) => {
    resolved.push(resolveQuantile(error, sampleCount, resolvedHead.value, resolvedHead.consumed, quantile, resolvedHead.rest));
  });
  return map$6(resolved, (rq) => [rq.quantile, rq.value]);
};
const resolveQuantile = (error, sampleCount, current, consumed, quantile, rest) => {
  let error_1 = error;
  let sampleCount_1 = sampleCount;
  let current_1 = current;
  let consumed_1 = consumed;
  let quantile_1 = quantile;
  let rest_1 = rest;
  let error_2 = error;
  let sampleCount_2 = sampleCount;
  let current_2 = current;
  let consumed_2 = consumed;
  let quantile_2 = quantile;
  let rest_2 = rest;
  while (1) {
    if (!isNonEmptyReadonlyArray(rest_1)) {
      return {
        quantile: quantile_1,
        value: none$4(),
        consumed: consumed_1,
        rest: []
      };
    }
    if (quantile_1 === 1) {
      return {
        quantile: quantile_1,
        value: some(lastNonEmpty(rest_1)),
        consumed: consumed_1 + rest_1.length,
        rest: []
      };
    }
    const sameHead = span(rest_1, (n) => n <= rest_1[0]);
    const desired = quantile_1 * sampleCount_1;
    const allowedError = error_1 / 2 * desired;
    const candConsumed = consumed_1 + sameHead[0].length;
    const candError = Math.abs(candConsumed - desired);
    if (candConsumed < desired - allowedError) {
      error_2 = error_1;
      sampleCount_2 = sampleCount_1;
      current_2 = head$1(rest_1);
      consumed_2 = candConsumed;
      quantile_2 = quantile_1;
      rest_2 = sameHead[1];
      error_1 = error_2;
      sampleCount_1 = sampleCount_2;
      current_1 = current_2;
      consumed_1 = consumed_2;
      quantile_1 = quantile_2;
      rest_1 = rest_2;
      continue;
    }
    if (candConsumed > desired + allowedError) {
      return {
        quantile: quantile_1,
        value: current_1,
        consumed: consumed_1,
        rest: rest_1
      };
    }
    switch (current_1._tag) {
      case "None": {
        error_2 = error_1;
        sampleCount_2 = sampleCount_1;
        current_2 = head$1(rest_1);
        consumed_2 = candConsumed;
        quantile_2 = quantile_1;
        rest_2 = sameHead[1];
        error_1 = error_2;
        sampleCount_1 = sampleCount_2;
        current_1 = current_2;
        consumed_1 = consumed_2;
        quantile_1 = quantile_2;
        rest_1 = rest_2;
        continue;
      }
      case "Some": {
        const prevError = Math.abs(desired - current_1.value);
        if (candError < prevError) {
          error_2 = error_1;
          sampleCount_2 = sampleCount_1;
          current_2 = head$1(rest_1);
          consumed_2 = candConsumed;
          quantile_2 = quantile_1;
          rest_2 = sameHead[1];
          error_1 = error_2;
          sampleCount_1 = sampleCount_2;
          current_1 = current_2;
          consumed_1 = consumed_2;
          quantile_1 = quantile_2;
          rest_1 = rest_2;
          continue;
        }
        return {
          quantile: quantile_1,
          value: some(current_1.value),
          consumed: consumed_1,
          rest: rest_1
        };
      }
    }
  }
  throw new Error("BUG: MetricHook.resolveQuantiles - please report an issue at https://github.com/Effect-TS/effect/issues");
};
const MetricPairSymbolKey = "effect/MetricPair";
const MetricPairTypeId = /* @__PURE__ */ Symbol.for(MetricPairSymbolKey);
const metricPairVariance = {
  /* c8 ignore next */
  _Type: (_) => _
};
const unsafeMake = (metricKey, metricState) => {
  return {
    [MetricPairTypeId]: metricPairVariance,
    metricKey,
    metricState,
    pipe() {
      return pipeArguments(this, arguments);
    }
  };
};
const MetricRegistrySymbolKey = "effect/MetricRegistry";
const MetricRegistryTypeId = /* @__PURE__ */ Symbol.for(MetricRegistrySymbolKey);
class MetricRegistryImpl {
  [MetricRegistryTypeId] = MetricRegistryTypeId;
  map = /* @__PURE__ */ empty$7();
  snapshot() {
    const result = [];
    for (const [key, hook] of this.map) {
      result.push(unsafeMake(key, hook.get()));
    }
    return result;
  }
  get(key) {
    const hook = pipe(this.map, get$3(key), getOrUndefined);
    if (hook == null) {
      if (isCounterKey(key.keyType)) {
        return this.getCounter(key);
      }
      if (isGaugeKey(key.keyType)) {
        return this.getGauge(key);
      }
      if (isFrequencyKey(key.keyType)) {
        return this.getFrequency(key);
      }
      if (isHistogramKey(key.keyType)) {
        return this.getHistogram(key);
      }
      if (isSummaryKey(key.keyType)) {
        return this.getSummary(key);
      }
      throw new Error("BUG: MetricRegistry.get - unknown MetricKeyType - please report an issue at https://github.com/Effect-TS/effect/issues");
    } else {
      return hook;
    }
  }
  getCounter(key) {
    let value = pipe(this.map, get$3(key), getOrUndefined);
    if (value == null) {
      const counter2 = counter$1(key);
      if (!pipe(this.map, has(key))) {
        pipe(this.map, set$1(key, counter2));
      }
      value = counter2;
    }
    return value;
  }
  getFrequency(key) {
    let value = pipe(this.map, get$3(key), getOrUndefined);
    if (value == null) {
      const frequency$12 = frequency(key);
      if (!pipe(this.map, has(key))) {
        pipe(this.map, set$1(key, frequency$12));
      }
      value = frequency$12;
    }
    return value;
  }
  getGauge(key) {
    let value = pipe(this.map, get$3(key), getOrUndefined);
    if (value == null) {
      const gauge$12 = gauge(key, key.keyType.bigint ? BigInt(0) : 0);
      if (!pipe(this.map, has(key))) {
        pipe(this.map, set$1(key, gauge$12));
      }
      value = gauge$12;
    }
    return value;
  }
  getHistogram(key) {
    let value = pipe(this.map, get$3(key), getOrUndefined);
    if (value == null) {
      const histogram2 = histogram$1(key);
      if (!pipe(this.map, has(key))) {
        pipe(this.map, set$1(key, histogram2));
      }
      value = histogram2;
    }
    return value;
  }
  getSummary(key) {
    let value = pipe(this.map, get$3(key), getOrUndefined);
    if (value == null) {
      const summary$12 = summary(key);
      if (!pipe(this.map, has(key))) {
        pipe(this.map, set$1(key, summary$12));
      }
      value = summary$12;
    }
    return value;
  }
}
const make$9 = () => {
  return new MetricRegistryImpl();
};
const MetricSymbolKey = "effect/Metric";
const MetricTypeId = /* @__PURE__ */ Symbol.for(MetricSymbolKey);
const metricVariance = {
  /* c8 ignore next */
  _Type: (_) => _,
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _Out: (_) => _
};
const globalMetricRegistry = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Metric/globalMetricRegistry"), () => make$9());
const make$8 = function(keyType, unsafeUpdate, unsafeValue, unsafeModify) {
  const metric = Object.assign((effect2) => tap(effect2, (a) => update(metric, a)), {
    [MetricTypeId]: metricVariance,
    keyType,
    unsafeUpdate,
    unsafeValue,
    unsafeModify,
    register() {
      this.unsafeValue([]);
      return this;
    },
    pipe() {
      return pipeArguments(this, arguments);
    }
  });
  return metric;
};
const counter = (name, options) => fromMetricKey(counter$3(name, options));
const fromMetricKey = (key) => {
  let untaggedHook;
  const hookCache = /* @__PURE__ */ new WeakMap();
  const hook = (extraTags) => {
    if (extraTags.length === 0) {
      if (untaggedHook !== void 0) {
        return untaggedHook;
      }
      untaggedHook = globalMetricRegistry.get(key);
      return untaggedHook;
    }
    let hook2 = hookCache.get(extraTags);
    if (hook2 !== void 0) {
      return hook2;
    }
    hook2 = globalMetricRegistry.get(taggedWithLabels$1(key, extraTags));
    hookCache.set(extraTags, hook2);
    return hook2;
  };
  return make$8(key.keyType, (input, extraTags) => hook(extraTags).update(input), (extraTags) => hook(extraTags).get(), (input, extraTags) => hook(extraTags).modify(input));
};
const histogram = (name, boundaries, description) => fromMetricKey(histogram$3(name, boundaries, description));
const tagged = /* @__PURE__ */ dual(3, (self, key, value) => taggedWithLabels(self, [make$b(key, value)]));
const taggedWithLabels = /* @__PURE__ */ dual(2, (self, extraTags) => {
  return make$8(self.keyType, (input, extraTags1) => self.unsafeUpdate(input, union$2(extraTags, extraTags1)), (extraTags1) => self.unsafeValue(union$2(extraTags, extraTags1)), (input, extraTags1) => self.unsafeModify(input, union$2(extraTags, extraTags1)));
});
const update = /* @__PURE__ */ dual(2, (self, input) => fiberRefGetWith(currentMetricLabels, (tags) => sync$1(() => self.unsafeUpdate(input, tags))));
const RequestSymbolKey = "effect/Request";
const RequestTypeId = /* @__PURE__ */ Symbol.for(RequestSymbolKey);
const requestVariance = {
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _
};
({
  ...StructuralPrototype,
  [RequestTypeId]: requestVariance
});
const complete = /* @__PURE__ */ dual(2, (self, result) => fiberRefGetWith(currentRequestMap, (map2) => sync$1(() => {
  if (map2.has(self)) {
    const entry = map2.get(self);
    if (!entry.state.completed) {
      entry.state.completed = true;
      deferredUnsafeDone(entry.result, result);
    }
  }
})));
const SupervisorSymbolKey = "effect/Supervisor";
const SupervisorTypeId = /* @__PURE__ */ Symbol.for(SupervisorSymbolKey);
const supervisorVariance = {
  /* c8 ignore next */
  _T: (_) => _
};
class ProxySupervisor {
  underlying;
  value0;
  [SupervisorTypeId] = supervisorVariance;
  constructor(underlying, value0) {
    this.underlying = underlying;
    this.value0 = value0;
  }
  get value() {
    return this.value0;
  }
  onStart(context2, effect2, parent, fiber) {
    this.underlying.onStart(context2, effect2, parent, fiber);
  }
  onEnd(value, fiber) {
    this.underlying.onEnd(value, fiber);
  }
  onEffect(fiber, effect2) {
    this.underlying.onEffect(fiber, effect2);
  }
  onSuspend(fiber) {
    this.underlying.onSuspend(fiber);
  }
  onResume(fiber) {
    this.underlying.onResume(fiber);
  }
  map(f) {
    return new ProxySupervisor(this, pipe(this.value, map$3(f)));
  }
  zip(right2) {
    return new Zip(this, right2);
  }
}
class Zip {
  left;
  right;
  _tag = "Zip";
  [SupervisorTypeId] = supervisorVariance;
  constructor(left2, right2) {
    this.left = left2;
    this.right = right2;
  }
  get value() {
    return zip(this.left.value, this.right.value);
  }
  onStart(context2, effect2, parent, fiber) {
    this.left.onStart(context2, effect2, parent, fiber);
    this.right.onStart(context2, effect2, parent, fiber);
  }
  onEnd(value, fiber) {
    this.left.onEnd(value, fiber);
    this.right.onEnd(value, fiber);
  }
  onEffect(fiber, effect2) {
    this.left.onEffect(fiber, effect2);
    this.right.onEffect(fiber, effect2);
  }
  onSuspend(fiber) {
    this.left.onSuspend(fiber);
    this.right.onSuspend(fiber);
  }
  onResume(fiber) {
    this.left.onResume(fiber);
    this.right.onResume(fiber);
  }
  map(f) {
    return new ProxySupervisor(this, pipe(this.value, map$3(f)));
  }
  zip(right2) {
    return new Zip(this, right2);
  }
}
const isZip = (self) => hasProperty(self, SupervisorTypeId) && isTagged(self, "Zip");
class Const {
  effect;
  [SupervisorTypeId] = supervisorVariance;
  constructor(effect2) {
    this.effect = effect2;
  }
  get value() {
    return this.effect;
  }
  onStart(_context, _effect, _parent, _fiber) {
  }
  onEnd(_value, _fiber) {
  }
  onEffect(_fiber, _effect) {
  }
  onSuspend(_fiber) {
  }
  onResume(_fiber) {
  }
  map(f) {
    return new ProxySupervisor(this, pipe(this.value, map$3(f)));
  }
  zip(right2) {
    return new Zip(this, right2);
  }
  onRun(execution, _fiber) {
    return execution();
  }
}
const fromEffect$1 = (effect2) => {
  return new Const(effect2);
};
const none = /* @__PURE__ */ globalValue("effect/Supervisor/none", () => fromEffect$1(void_$1));
const make$7 = make$j;
const OP_EMPTY = "Empty";
const OP_ADD_SUPERVISOR = "AddSupervisor";
const OP_REMOVE_SUPERVISOR = "RemoveSupervisor";
const OP_AND_THEN = "AndThen";
const empty$2 = {
  _tag: OP_EMPTY
};
const combine = (self, that) => {
  return {
    _tag: OP_AND_THEN,
    first: self,
    second: that
  };
};
const patch = (self, supervisor) => {
  return patchLoop(supervisor, of$1(self));
};
const patchLoop = (_supervisor, _patches) => {
  let supervisor = _supervisor;
  let patches = _patches;
  while (isNonEmpty$2(patches)) {
    const head2 = headNonEmpty(patches);
    switch (head2._tag) {
      case OP_EMPTY: {
        patches = tailNonEmpty(patches);
        break;
      }
      case OP_ADD_SUPERVISOR: {
        supervisor = supervisor.zip(head2.supervisor);
        patches = tailNonEmpty(patches);
        break;
      }
      case OP_REMOVE_SUPERVISOR: {
        supervisor = removeSupervisor(supervisor, head2.supervisor);
        patches = tailNonEmpty(patches);
        break;
      }
      case OP_AND_THEN: {
        patches = prepend$1(head2.first)(prepend$1(head2.second)(tailNonEmpty(patches)));
        break;
      }
    }
  }
  return supervisor;
};
const removeSupervisor = (self, that) => {
  if (equals$1(self, that)) {
    return none;
  } else {
    if (isZip(self)) {
      return removeSupervisor(self.left, that).zip(removeSupervisor(self.right, that));
    } else {
      return self;
    }
  }
};
const toSet = (self) => {
  if (equals$1(self, none)) {
    return empty$f();
  } else {
    if (isZip(self)) {
      return pipe(toSet(self.left), union(toSet(self.right)));
    } else {
      return make$l(self);
    }
  }
};
const diff = (oldValue, newValue) => {
  if (equals$1(oldValue, newValue)) {
    return empty$2;
  }
  const oldSupervisors = toSet(oldValue);
  const newSupervisors = toSet(newValue);
  const added = pipe(newSupervisors, difference(oldSupervisors), reduce$3(empty$2, (patch2, supervisor) => combine(patch2, {
    _tag: OP_ADD_SUPERVISOR,
    supervisor
  })));
  const removed = pipe(oldSupervisors, difference(newSupervisors), reduce$3(empty$2, (patch2, supervisor) => combine(patch2, {
    _tag: OP_REMOVE_SUPERVISOR,
    supervisor
  })));
  return combine(added, removed);
};
const differ = /* @__PURE__ */ make$7({
  empty: empty$2,
  patch,
  combine,
  diff
});
const fiberStarted = /* @__PURE__ */ counter("effect_fiber_started", {
  incremental: true
});
const fiberActive = /* @__PURE__ */ counter("effect_fiber_active");
const fiberSuccesses = /* @__PURE__ */ counter("effect_fiber_successes", {
  incremental: true
});
const fiberFailures = /* @__PURE__ */ counter("effect_fiber_failures", {
  incremental: true
});
const fiberLifetimes = /* @__PURE__ */ tagged(/* @__PURE__ */ histogram("effect_fiber_lifetimes", /* @__PURE__ */ exponential$2({
  start: 0.5,
  factor: 2,
  count: 35
})), "time_unit", "milliseconds");
const EvaluationSignalContinue = "Continue";
const EvaluationSignalDone = "Done";
const EvaluationSignalYieldNow = "Yield";
const runtimeFiberVariance = {
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _
};
const absurd = (_) => {
  throw new Error(`BUG: FiberRuntime - ${toStringUnknown(_)} - please report an issue at https://github.com/Effect-TS/effect/issues`);
};
const YieldedOp = /* @__PURE__ */ Symbol.for("effect/internal/fiberRuntime/YieldedOp");
const yieldedOpChannel = /* @__PURE__ */ globalValue("effect/internal/fiberRuntime/yieldedOpChannel", () => ({
  currentOp: null
}));
const contOpSuccess = {
  [OP_ON_SUCCESS]: (_, cont, value) => {
    return internalCall(() => cont.effect_instruction_i1(value));
  },
  ["OnStep"]: (_, _cont, value) => {
    return exitSucceed$1(exitSucceed$1(value));
  },
  [OP_ON_SUCCESS_AND_FAILURE]: (_, cont, value) => {
    return internalCall(() => cont.effect_instruction_i2(value));
  },
  [OP_REVERT_FLAGS]: (self, cont, value) => {
    self.patchRuntimeFlags(self.currentRuntimeFlags, cont.patch);
    if (interruptible$2(self.currentRuntimeFlags) && self.isInterrupted()) {
      return exitFailCause$1(self.getInterruptedCause());
    } else {
      return exitSucceed$1(value);
    }
  },
  [OP_WHILE]: (self, cont, value) => {
    internalCall(() => cont.effect_instruction_i2(value));
    if (internalCall(() => cont.effect_instruction_i0())) {
      self.pushStack(cont);
      return internalCall(() => cont.effect_instruction_i1());
    } else {
      return void_$1;
    }
  },
  [OP_ITERATOR]: (self, cont, value) => {
    const state = internalCall(() => cont.effect_instruction_i0.next(value));
    if (state.done) return exitSucceed$1(state.value);
    self.pushStack(cont);
    return yieldWrapGet(state.value);
  }
};
const drainQueueWhileRunningTable = {
  [OP_INTERRUPT_SIGNAL]: (self, runtimeFlags, cur, message) => {
    self.processNewInterruptSignal(message.cause);
    return interruptible$2(runtimeFlags) ? exitFailCause$1(message.cause) : cur;
  },
  [OP_RESUME]: (_self, _runtimeFlags, _cur, _message) => {
    throw new Error("It is illegal to have multiple concurrent run loops in a single fiber");
  },
  [OP_STATEFUL]: (self, runtimeFlags, cur, message) => {
    message.onFiber(self, running(runtimeFlags));
    return cur;
  },
  [OP_YIELD_NOW]: (_self, _runtimeFlags, cur, _message) => {
    return flatMap$3(yieldNow$2(), () => cur);
  }
};
const runBlockedRequests = (self) => forEachSequentialDiscard(flatten$1(self), (requestsByRequestResolver) => forEachConcurrentDiscard(sequentialCollectionToChunk(requestsByRequestResolver), ([dataSource, sequential2]) => {
  const map2 = /* @__PURE__ */ new Map();
  const arr = [];
  for (const block of sequential2) {
    arr.push(toReadonlyArray(block));
    for (const entry of block) {
      map2.set(entry.request, entry);
    }
  }
  const flat = arr.flat();
  return fiberRefLocally(invokeWithInterrupt(dataSource.runAll(arr), flat, () => flat.forEach((entry) => {
    entry.listeners.interrupted = true;
  })), currentRequestMap, map2);
}, false, false));
const _version = /* @__PURE__ */ getCurrentVersion();
class FiberRuntime extends Class$2 {
  [FiberTypeId] = fiberVariance;
  [RuntimeFiberTypeId] = runtimeFiberVariance;
  _fiberRefs;
  _fiberId;
  _queue = /* @__PURE__ */ new Array();
  _children = null;
  _observers = /* @__PURE__ */ new Array();
  _running = false;
  _stack = [];
  _asyncInterruptor = null;
  _asyncBlockingOn = null;
  _exitValue = null;
  _steps = [];
  _isYielding = false;
  currentRuntimeFlags;
  currentOpCount = 0;
  currentSupervisor;
  currentScheduler;
  currentTracer;
  currentSpan;
  currentContext;
  currentDefaultServices;
  constructor(fiberId2, fiberRefs0, runtimeFlags0) {
    super();
    this.currentRuntimeFlags = runtimeFlags0;
    this._fiberId = fiberId2;
    this._fiberRefs = fiberRefs0;
    if (runtimeMetrics(runtimeFlags0)) {
      const tags = this.getFiberRef(currentMetricLabels);
      fiberStarted.unsafeUpdate(1, tags);
      fiberActive.unsafeUpdate(1, tags);
    }
    this.refreshRefCache();
  }
  commit() {
    return join(this);
  }
  /**
   * The identity of the fiber.
   */
  id() {
    return this._fiberId;
  }
  /**
   * Begins execution of the effect associated with this fiber on in the
   * background. This can be called to "kick off" execution of a fiber after
   * it has been created.
   */
  resume(effect2) {
    this.tell(resume(effect2));
  }
  /**
   * The status of the fiber.
   */
  get status() {
    return this.ask((_, status) => status);
  }
  /**
   * Gets the fiber runtime flags.
   */
  get runtimeFlags() {
    return this.ask((state, status) => {
      if (isDone$2(status)) {
        return state.currentRuntimeFlags;
      }
      return status.runtimeFlags;
    });
  }
  /**
   * Returns the current `FiberScope` for the fiber.
   */
  scope() {
    return unsafeMake$1(this);
  }
  /**
   * Retrieves the immediate children of the fiber.
   */
  get children() {
    return this.ask((fiber) => Array.from(fiber.getChildren()));
  }
  /**
   * Gets the fiber's set of children.
   */
  getChildren() {
    if (this._children === null) {
      this._children = /* @__PURE__ */ new Set();
    }
    return this._children;
  }
  /**
   * Retrieves the interrupted cause of the fiber, which will be `Cause.empty`
   * if the fiber has not been interrupted.
   *
   * **NOTE**: This method is safe to invoke on any fiber, but if not invoked
   * on this fiber, then values derived from the fiber's state (including the
   * log annotations and log level) may not be up-to-date.
   */
  getInterruptedCause() {
    return this.getFiberRef(currentInterruptedCause);
  }
  /**
   * Retrieves the whole set of fiber refs.
   */
  fiberRefs() {
    return this.ask((fiber) => fiber.getFiberRefs());
  }
  /**
   * Returns an effect that will contain information computed from the fiber
   * state and status while running on the fiber.
   *
   * This allows the outside world to interact safely with mutable fiber state
   * without locks or immutable data.
   */
  ask(f) {
    return suspend$2(() => {
      const deferred = deferredUnsafeMake(this._fiberId);
      this.tell(stateful((fiber, status) => {
        deferredUnsafeDone(deferred, sync$1(() => f(fiber, status)));
      }));
      return deferredAwait(deferred);
    });
  }
  /**
   * Adds a message to be processed by the fiber on the fiber.
   */
  tell(message) {
    this._queue.push(message);
    if (!this._running) {
      this._running = true;
      this.drainQueueLaterOnExecutor();
    }
  }
  get await() {
    return async_((resume2) => {
      const cb = (exit2) => resume2(succeed$5(exit2));
      this.tell(stateful((fiber, _) => {
        if (fiber._exitValue !== null) {
          cb(this._exitValue);
        } else {
          fiber.addObserver(cb);
        }
      }));
      return sync$1(() => this.tell(stateful((fiber, _) => {
        fiber.removeObserver(cb);
      })));
    }, this.id());
  }
  get inheritAll() {
    return withFiberRuntime((parentFiber, parentStatus) => {
      const parentFiberId = parentFiber.id();
      const parentFiberRefs = parentFiber.getFiberRefs();
      const parentRuntimeFlags = parentStatus.runtimeFlags;
      const childFiberRefs = this.getFiberRefs();
      const updatedFiberRefs = joinAs(parentFiberRefs, parentFiberId, childFiberRefs);
      parentFiber.setFiberRefs(updatedFiberRefs);
      const updatedRuntimeFlags = parentFiber.getFiberRef(currentRuntimeFlags);
      const patch2 = pipe(
        diff$3(parentRuntimeFlags, updatedRuntimeFlags),
        // Do not inherit WindDown or Interruption!
        exclude(Interruption),
        exclude(WindDown)
      );
      return updateRuntimeFlags(patch2);
    });
  }
  /**
   * Tentatively observes the fiber, but returns immediately if it is not
   * already done.
   */
  get poll() {
    return sync$1(() => fromNullable(this._exitValue));
  }
  /**
   * Unsafely observes the fiber, but returns immediately if it is not
   * already done.
   */
  unsafePoll() {
    return this._exitValue;
  }
  /**
   * In the background, interrupts the fiber as if interrupted from the specified fiber.
   */
  interruptAsFork(fiberId2) {
    return sync$1(() => this.tell(interruptSignal(interrupt(fiberId2))));
  }
  /**
   * In the background, interrupts the fiber as if interrupted from the specified fiber.
   */
  unsafeInterruptAsFork(fiberId2) {
    this.tell(interruptSignal(interrupt(fiberId2)));
  }
  /**
   * Adds an observer to the list of observers.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  addObserver(observer) {
    if (this._exitValue !== null) {
      observer(this._exitValue);
    } else {
      this._observers.push(observer);
    }
  }
  /**
   * Removes the specified observer from the list of observers that will be
   * notified when the fiber exits.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  removeObserver(observer) {
    this._observers = this._observers.filter((o) => o !== observer);
  }
  /**
   * Retrieves all fiber refs of the fiber.
   *
   * **NOTE**: This method is safe to invoke on any fiber, but if not invoked
   * on this fiber, then values derived from the fiber's state (including the
   * log annotations and log level) may not be up-to-date.
   */
  getFiberRefs() {
    this.setFiberRef(currentRuntimeFlags, this.currentRuntimeFlags);
    return this._fiberRefs;
  }
  /**
   * Deletes the specified fiber ref.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  unsafeDeleteFiberRef(fiberRef) {
    this._fiberRefs = delete_(this._fiberRefs, fiberRef);
  }
  /**
   * Retrieves the state of the fiber ref, or else its initial value.
   *
   * **NOTE**: This method is safe to invoke on any fiber, but if not invoked
   * on this fiber, then values derived from the fiber's state (including the
   * log annotations and log level) may not be up-to-date.
   */
  getFiberRef(fiberRef) {
    if (this._fiberRefs.locals.has(fiberRef)) {
      return this._fiberRefs.locals.get(fiberRef)[0][1];
    }
    return fiberRef.initial;
  }
  /**
   * Sets the fiber ref to the specified value.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  setFiberRef(fiberRef, value) {
    this._fiberRefs = updateAs(this._fiberRefs, {
      fiberId: this._fiberId,
      fiberRef,
      value
    });
    this.refreshRefCache();
  }
  refreshRefCache() {
    this.currentDefaultServices = this.getFiberRef(currentServices);
    this.currentTracer = this.currentDefaultServices.unsafeMap.get(tracerTag.key);
    this.currentSupervisor = this.getFiberRef(currentSupervisor);
    this.currentScheduler = this.getFiberRef(currentScheduler);
    this.currentContext = this.getFiberRef(currentContext);
    this.currentSpan = this.currentContext.unsafeMap.get(spanTag.key);
  }
  /**
   * Wholesale replaces all fiber refs of this fiber.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  setFiberRefs(fiberRefs2) {
    this._fiberRefs = fiberRefs2;
    this.refreshRefCache();
  }
  /**
   * Adds a reference to the specified fiber inside the children set.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  addChild(child) {
    this.getChildren().add(child);
  }
  /**
   * Removes a reference to the specified fiber inside the children set.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  removeChild(child) {
    this.getChildren().delete(child);
  }
  /**
   * Transfers all children of this fiber that are currently running to the
   * specified fiber scope.
   *
   * **NOTE**: This method must be invoked by the fiber itself after it has
   * evaluated the effects but prior to exiting.
   */
  transferChildren(scope) {
    const children = this._children;
    this._children = null;
    if (children !== null && children.size > 0) {
      for (const child of children) {
        if (child._exitValue === null) {
          scope.add(this.currentRuntimeFlags, child);
        }
      }
    }
  }
  /**
   * On the current thread, executes all messages in the fiber's inbox. This
   * method may return before all work is done, in the event the fiber executes
   * an asynchronous operation.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  drainQueueOnCurrentThread() {
    let recurse = true;
    while (recurse) {
      let evaluationSignal = EvaluationSignalContinue;
      const prev = globalThis[currentFiberURI];
      globalThis[currentFiberURI] = this;
      try {
        while (evaluationSignal === EvaluationSignalContinue) {
          evaluationSignal = this._queue.length === 0 ? EvaluationSignalDone : this.evaluateMessageWhileSuspended(this._queue.splice(0, 1)[0]);
        }
      } finally {
        this._running = false;
        globalThis[currentFiberURI] = prev;
      }
      if (this._queue.length > 0 && !this._running) {
        this._running = true;
        if (evaluationSignal === EvaluationSignalYieldNow) {
          this.drainQueueLaterOnExecutor();
          recurse = false;
        } else {
          recurse = true;
        }
      } else {
        recurse = false;
      }
    }
  }
  /**
   * Schedules the execution of all messages in the fiber's inbox.
   *
   * This method will return immediately after the scheduling
   * operation is completed, but potentially before such messages have been
   * executed.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  drainQueueLaterOnExecutor() {
    this.currentScheduler.scheduleTask(this.run, this.getFiberRef(currentSchedulingPriority));
  }
  /**
   * Drains the fiber's message queue while the fiber is actively running,
   * returning the next effect to execute, which may be the input effect if no
   * additional effect needs to be executed.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  drainQueueWhileRunning(runtimeFlags, cur0) {
    let cur = cur0;
    while (this._queue.length > 0) {
      const message = this._queue.splice(0, 1)[0];
      cur = drainQueueWhileRunningTable[message._tag](this, runtimeFlags, cur, message);
    }
    return cur;
  }
  /**
   * Determines if the fiber is interrupted.
   *
   * **NOTE**: This method is safe to invoke on any fiber, but if not invoked
   * on this fiber, then values derived from the fiber's state (including the
   * log annotations and log level) may not be up-to-date.
   */
  isInterrupted() {
    return !isEmpty$2(this.getFiberRef(currentInterruptedCause));
  }
  /**
   * Adds an interruptor to the set of interruptors that are interrupting this
   * fiber.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  addInterruptedCause(cause) {
    const oldSC = this.getFiberRef(currentInterruptedCause);
    this.setFiberRef(currentInterruptedCause, sequential$2(oldSC, cause));
  }
  /**
   * Processes a new incoming interrupt signal.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  processNewInterruptSignal(cause) {
    this.addInterruptedCause(cause);
    this.sendInterruptSignalToAllChildren();
  }
  /**
   * Interrupts all children of the current fiber, returning an effect that will
   * await the exit of the children. This method will return null if the fiber
   * has no children.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  sendInterruptSignalToAllChildren() {
    if (this._children === null || this._children.size === 0) {
      return false;
    }
    let told = false;
    for (const child of this._children) {
      child.tell(interruptSignal(interrupt(this.id())));
      told = true;
    }
    return told;
  }
  /**
   * Interrupts all children of the current fiber, returning an effect that will
   * await the exit of the children. This method will return null if the fiber
   * has no children.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  interruptAllChildren() {
    if (this.sendInterruptSignalToAllChildren()) {
      const it = this._children.values();
      this._children = null;
      let isDone2 = false;
      const body = () => {
        const next = it.next();
        if (!next.done) {
          return asVoid$1(next.value.await);
        } else {
          return sync$1(() => {
            isDone2 = true;
          });
        }
      };
      return whileLoop({
        while: () => !isDone2,
        body,
        step: () => {
        }
      });
    }
    return null;
  }
  reportExitValue(exit2) {
    if (runtimeMetrics(this.currentRuntimeFlags)) {
      const tags = this.getFiberRef(currentMetricLabels);
      const startTimeMillis = this.id().startTimeMillis;
      const endTimeMillis = Date.now();
      fiberLifetimes.unsafeUpdate(endTimeMillis - startTimeMillis, tags);
      fiberActive.unsafeUpdate(-1, tags);
      switch (exit2._tag) {
        case OP_SUCCESS: {
          fiberSuccesses.unsafeUpdate(1, tags);
          break;
        }
        case OP_FAILURE: {
          fiberFailures.unsafeUpdate(1, tags);
          break;
        }
      }
    }
    if (exit2._tag === "Failure") {
      const level = this.getFiberRef(currentUnhandledErrorLogLevel);
      if (!isInterruptedOnly(exit2.cause) && level._tag === "Some") {
        this.log("Fiber terminated with an unhandled error", exit2.cause, level);
      }
    }
  }
  setExitValue(exit2) {
    this._exitValue = exit2;
    this.reportExitValue(exit2);
    for (let i = this._observers.length - 1; i >= 0; i--) {
      this._observers[i](exit2);
    }
    this._observers = [];
  }
  getLoggers() {
    return this.getFiberRef(currentLoggers);
  }
  log(message, cause, overrideLogLevel) {
    const logLevel = isSome(overrideLogLevel) ? overrideLogLevel.value : this.getFiberRef(currentLogLevel);
    const minimumLogLevel = this.getFiberRef(currentMinimumLogLevel);
    if (greaterThan(minimumLogLevel, logLevel)) {
      return;
    }
    const spans = this.getFiberRef(currentLogSpan);
    const annotations2 = this.getFiberRef(currentLogAnnotations);
    const loggers = this.getLoggers();
    const contextMap = this.getFiberRefs();
    if (size$2(loggers) > 0) {
      const clockService = get$8(this.getFiberRef(currentServices), clockTag);
      const date = new Date(clockService.unsafeCurrentTimeMillis());
      withRedactableContext(contextMap, () => {
        for (const logger of loggers) {
          logger.log({
            fiberId: this.id(),
            logLevel,
            message,
            cause,
            context: contextMap,
            spans,
            annotations: annotations2,
            date
          });
        }
      });
    }
  }
  /**
   * Evaluates a single message on the current thread, while the fiber is
   * suspended. This method should only be called while evaluation of the
   * fiber's effect is suspended due to an asynchronous operation.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  evaluateMessageWhileSuspended(message) {
    switch (message._tag) {
      case OP_YIELD_NOW: {
        return EvaluationSignalYieldNow;
      }
      case OP_INTERRUPT_SIGNAL: {
        this.processNewInterruptSignal(message.cause);
        if (this._asyncInterruptor !== null) {
          this._asyncInterruptor(exitFailCause$1(message.cause));
          this._asyncInterruptor = null;
        }
        return EvaluationSignalContinue;
      }
      case OP_RESUME: {
        this._asyncInterruptor = null;
        this._asyncBlockingOn = null;
        this.evaluateEffect(message.effect);
        return EvaluationSignalContinue;
      }
      case OP_STATEFUL: {
        message.onFiber(this, this._exitValue !== null ? done$2 : suspended(this.currentRuntimeFlags, this._asyncBlockingOn));
        return EvaluationSignalContinue;
      }
      default: {
        return absurd(message);
      }
    }
  }
  /**
   * Evaluates an effect until completion, potentially asynchronously.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  evaluateEffect(effect0) {
    this.currentSupervisor.onResume(this);
    try {
      let effect2 = interruptible$2(this.currentRuntimeFlags) && this.isInterrupted() ? exitFailCause$1(this.getInterruptedCause()) : effect0;
      while (effect2 !== null) {
        const eff = effect2;
        const exit2 = this.runLoop(eff);
        if (exit2 === YieldedOp) {
          const op = yieldedOpChannel.currentOp;
          yieldedOpChannel.currentOp = null;
          if (op._op === OP_YIELD) {
            if (cooperativeYielding(this.currentRuntimeFlags)) {
              this.tell(yieldNow());
              this.tell(resume(exitVoid$1));
              effect2 = null;
            } else {
              effect2 = exitVoid$1;
            }
          } else if (op._op === OP_ASYNC) {
            effect2 = null;
          }
        } else {
          this.currentRuntimeFlags = pipe(this.currentRuntimeFlags, enable$1(WindDown));
          const interruption2 = this.interruptAllChildren();
          if (interruption2 !== null) {
            effect2 = flatMap$3(interruption2, () => exit2);
          } else {
            if (this._queue.length === 0) {
              this.setExitValue(exit2);
            } else {
              this.tell(resume(exit2));
            }
            effect2 = null;
          }
        }
      }
    } finally {
      this.currentSupervisor.onSuspend(this);
    }
  }
  /**
   * Begins execution of the effect associated with this fiber on the current
   * thread. This can be called to "kick off" execution of a fiber after it has
   * been created, in hopes that the effect can be executed synchronously.
   *
   * This is not the normal way of starting a fiber, but it is useful when the
   * express goal of executing the fiber is to synchronously produce its exit.
   */
  start(effect2) {
    if (!this._running) {
      this._running = true;
      const prev = globalThis[currentFiberURI];
      globalThis[currentFiberURI] = this;
      try {
        this.evaluateEffect(effect2);
      } finally {
        this._running = false;
        globalThis[currentFiberURI] = prev;
        if (this._queue.length > 0) {
          this.drainQueueLaterOnExecutor();
        }
      }
    } else {
      this.tell(resume(effect2));
    }
  }
  /**
   * Begins execution of the effect associated with this fiber on in the
   * background, and on the correct thread pool. This can be called to "kick
   * off" execution of a fiber after it has been created, in hopes that the
   * effect can be executed synchronously.
   */
  startFork(effect2) {
    this.tell(resume(effect2));
  }
  /**
   * Takes the current runtime flags, patches them to return the new runtime
   * flags, and then makes any changes necessary to fiber state based on the
   * specified patch.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  patchRuntimeFlags(oldRuntimeFlags, patch2) {
    const newRuntimeFlags = patch$4(oldRuntimeFlags, patch2);
    globalThis[currentFiberURI] = this;
    this.currentRuntimeFlags = newRuntimeFlags;
    return newRuntimeFlags;
  }
  /**
   * Initiates an asynchronous operation, by building a callback that will
   * resume execution, and then feeding that callback to the registration
   * function, handling error cases and repeated resumptions appropriately.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  initiateAsync(runtimeFlags, asyncRegister) {
    let alreadyCalled = false;
    const callback = (effect2) => {
      if (!alreadyCalled) {
        alreadyCalled = true;
        this.tell(resume(effect2));
      }
    };
    if (interruptible$2(runtimeFlags)) {
      this._asyncInterruptor = callback;
    }
    try {
      asyncRegister(callback);
    } catch (e) {
      callback(failCause$1(die$2(e)));
    }
  }
  pushStack(cont) {
    this._stack.push(cont);
    if (cont._op === "OnStep") {
      this._steps.push({
        refs: this.getFiberRefs(),
        flags: this.currentRuntimeFlags
      });
    }
  }
  popStack() {
    const item = this._stack.pop();
    if (item) {
      if (item._op === "OnStep") {
        this._steps.pop();
      }
      return item;
    }
    return;
  }
  getNextSuccessCont() {
    let frame = this.popStack();
    while (frame) {
      if (frame._op !== OP_ON_FAILURE) {
        return frame;
      }
      frame = this.popStack();
    }
  }
  getNextFailCont() {
    let frame = this.popStack();
    while (frame) {
      if (frame._op !== OP_ON_SUCCESS && frame._op !== OP_WHILE && frame._op !== OP_ITERATOR) {
        return frame;
      }
      frame = this.popStack();
    }
  }
  [OP_TAG](op) {
    return sync$1(() => unsafeGet$1(this.currentContext, op));
  }
  ["Left"](op) {
    return fail$2(op.left);
  }
  ["None"](_) {
    return fail$2(new NoSuchElementException());
  }
  ["Right"](op) {
    return exitSucceed$1(op.right);
  }
  ["Some"](op) {
    return exitSucceed$1(op.value);
  }
  ["Micro"](op) {
    return unsafeAsync((microResume) => {
      let resume2 = microResume;
      const fiber = runFork$1(provideContext(op, this.currentContext));
      fiber.addObserver((exit2) => {
        if (exit2._tag === "Success") {
          return resume2(exitSucceed$1(exit2.value));
        }
        switch (exit2.cause._tag) {
          case "Interrupt": {
            return resume2(exitFailCause$1(interrupt(none$2)));
          }
          case "Fail": {
            return resume2(fail$2(exit2.cause.error));
          }
          case "Die": {
            return resume2(die$1(exit2.cause.defect));
          }
        }
      });
      return unsafeAsync((abortResume) => {
        resume2 = (_) => {
          abortResume(void_$1);
        };
        fiber.unsafeInterrupt();
      });
    });
  }
  [OP_SYNC](op) {
    const value = internalCall(() => op.effect_instruction_i0());
    const cont = this.getNextSuccessCont();
    if (cont !== void 0) {
      if (!(cont._op in contOpSuccess)) {
        absurd(cont);
      }
      return contOpSuccess[cont._op](this, cont, value);
    } else {
      yieldedOpChannel.currentOp = exitSucceed$1(value);
      return YieldedOp;
    }
  }
  [OP_SUCCESS](op) {
    const oldCur = op;
    const cont = this.getNextSuccessCont();
    if (cont !== void 0) {
      if (!(cont._op in contOpSuccess)) {
        absurd(cont);
      }
      return contOpSuccess[cont._op](this, cont, oldCur.effect_instruction_i0);
    } else {
      yieldedOpChannel.currentOp = oldCur;
      return YieldedOp;
    }
  }
  [OP_FAILURE](op) {
    const cause = op.effect_instruction_i0;
    const cont = this.getNextFailCont();
    if (cont !== void 0) {
      switch (cont._op) {
        case OP_ON_FAILURE:
        case OP_ON_SUCCESS_AND_FAILURE: {
          if (!(interruptible$2(this.currentRuntimeFlags) && this.isInterrupted())) {
            return internalCall(() => cont.effect_instruction_i1(cause));
          } else {
            return exitFailCause$1(stripFailures(cause));
          }
        }
        case "OnStep": {
          if (!(interruptible$2(this.currentRuntimeFlags) && this.isInterrupted())) {
            return exitSucceed$1(exitFailCause$1(cause));
          } else {
            return exitFailCause$1(stripFailures(cause));
          }
        }
        case OP_REVERT_FLAGS: {
          this.patchRuntimeFlags(this.currentRuntimeFlags, cont.patch);
          if (interruptible$2(this.currentRuntimeFlags) && this.isInterrupted()) {
            return exitFailCause$1(sequential$2(cause, this.getInterruptedCause()));
          } else {
            return exitFailCause$1(cause);
          }
        }
        default: {
          absurd(cont);
        }
      }
    } else {
      yieldedOpChannel.currentOp = exitFailCause$1(cause);
      return YieldedOp;
    }
  }
  [OP_WITH_RUNTIME](op) {
    return internalCall(() => op.effect_instruction_i0(this, running(this.currentRuntimeFlags)));
  }
  ["Blocked"](op) {
    const refs = this.getFiberRefs();
    const flags = this.currentRuntimeFlags;
    if (this._steps.length > 0) {
      const frames = [];
      const snap = this._steps[this._steps.length - 1];
      let frame = this.popStack();
      while (frame && frame._op !== "OnStep") {
        frames.push(frame);
        frame = this.popStack();
      }
      this.setFiberRefs(snap.refs);
      this.currentRuntimeFlags = snap.flags;
      const patchRefs = diff$1(snap.refs, refs);
      const patchFlags = diff$3(snap.flags, flags);
      return exitSucceed$1(blocked(op.effect_instruction_i0, withFiberRuntime((newFiber) => {
        while (frames.length > 0) {
          newFiber.pushStack(frames.pop());
        }
        newFiber.setFiberRefs(patch$1(newFiber.id(), newFiber.getFiberRefs())(patchRefs));
        newFiber.currentRuntimeFlags = patch$4(patchFlags)(newFiber.currentRuntimeFlags);
        return op.effect_instruction_i1;
      })));
    }
    return uninterruptibleMask$1((restore) => flatMap$3(forkDaemon(runRequestBlock(op.effect_instruction_i0)), () => restore(op.effect_instruction_i1)));
  }
  ["RunBlocked"](op) {
    return runBlockedRequests(op.effect_instruction_i0);
  }
  [OP_UPDATE_RUNTIME_FLAGS](op) {
    const updateFlags = op.effect_instruction_i0;
    const oldRuntimeFlags = this.currentRuntimeFlags;
    const newRuntimeFlags = patch$4(oldRuntimeFlags, updateFlags);
    if (interruptible$2(newRuntimeFlags) && this.isInterrupted()) {
      return exitFailCause$1(this.getInterruptedCause());
    } else {
      this.patchRuntimeFlags(this.currentRuntimeFlags, updateFlags);
      if (op.effect_instruction_i1) {
        const revertFlags = diff$3(newRuntimeFlags, oldRuntimeFlags);
        this.pushStack(new RevertFlags(revertFlags, op));
        return internalCall(() => op.effect_instruction_i1(oldRuntimeFlags));
      } else {
        return exitVoid$1;
      }
    }
  }
  [OP_ON_SUCCESS](op) {
    this.pushStack(op);
    return op.effect_instruction_i0;
  }
  ["OnStep"](op) {
    this.pushStack(op);
    return op.effect_instruction_i0;
  }
  [OP_ON_FAILURE](op) {
    this.pushStack(op);
    return op.effect_instruction_i0;
  }
  [OP_ON_SUCCESS_AND_FAILURE](op) {
    this.pushStack(op);
    return op.effect_instruction_i0;
  }
  [OP_ASYNC](op) {
    this._asyncBlockingOn = op.effect_instruction_i1;
    this.initiateAsync(this.currentRuntimeFlags, op.effect_instruction_i0);
    yieldedOpChannel.currentOp = op;
    return YieldedOp;
  }
  [OP_YIELD](op) {
    this._isYielding = false;
    yieldedOpChannel.currentOp = op;
    return YieldedOp;
  }
  [OP_WHILE](op) {
    const check2 = op.effect_instruction_i0;
    const body = op.effect_instruction_i1;
    if (check2()) {
      this.pushStack(op);
      return body();
    } else {
      return exitVoid$1;
    }
  }
  [OP_ITERATOR](op) {
    return contOpSuccess[OP_ITERATOR](this, op, void 0);
  }
  [OP_COMMIT](op) {
    return internalCall(() => op.commit());
  }
  /**
   * The main run-loop for evaluating effects.
   *
   * **NOTE**: This method must be invoked by the fiber itself.
   */
  runLoop(effect0) {
    let cur = effect0;
    this.currentOpCount = 0;
    while (true) {
      if ((this.currentRuntimeFlags & OpSupervision) !== 0) {
        this.currentSupervisor.onEffect(this, cur);
      }
      if (this._queue.length > 0) {
        cur = this.drainQueueWhileRunning(this.currentRuntimeFlags, cur);
      }
      if (!this._isYielding) {
        this.currentOpCount += 1;
        const shouldYield = this.currentScheduler.shouldYield(this);
        if (shouldYield !== false) {
          this._isYielding = true;
          this.currentOpCount = 0;
          const oldCur = cur;
          cur = flatMap$3(yieldNow$2({
            priority: shouldYield
          }), () => oldCur);
        }
      }
      try {
        cur = this.currentTracer.context(() => {
          if (_version !== cur[EffectTypeId]._V) {
            return dieMessage(`Cannot execute an Effect versioned ${cur[EffectTypeId]._V} with a Runtime of version ${getCurrentVersion()}`);
          }
          return this[cur._op](cur);
        }, this);
        if (cur === YieldedOp) {
          const op = yieldedOpChannel.currentOp;
          if (op._op === OP_YIELD || op._op === OP_ASYNC) {
            return YieldedOp;
          }
          yieldedOpChannel.currentOp = null;
          return op._op === OP_SUCCESS || op._op === OP_FAILURE ? op : exitFailCause$1(die$2(op));
        }
      } catch (e) {
        if (cur !== YieldedOp && !hasProperty(cur, "_op") || !(cur._op in this)) {
          cur = dieMessage(`Not a valid effect: ${toStringUnknown(cur)}`);
        } else if (isInterruptedException(e)) {
          cur = exitFailCause$1(sequential$2(die$2(e), interrupt(none$2)));
        } else {
          cur = die$1(e);
        }
      }
    }
  }
  run = () => {
    this.drainQueueOnCurrentThread();
  };
}
const currentMinimumLogLevel = /* @__PURE__ */ globalValue("effect/FiberRef/currentMinimumLogLevel", () => fiberRefUnsafeMake(fromLiteral("Info")));
const loggerWithConsoleLog = (self) => makeLogger((opts) => {
  const services = getOrDefault(opts.context, currentServices);
  get$8(services, consoleTag).unsafe.log(self.log(opts));
});
const defaultLogger = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Logger/defaultLogger"), () => loggerWithConsoleLog(stringLogger));
const tracerLogger = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/Logger/tracerLogger"), () => makeLogger(({
  annotations: annotations2,
  cause,
  context: context2,
  fiberId: fiberId2,
  logLevel,
  message
}) => {
  const span2 = getOption(getOrDefault$1(context2, currentContext), spanTag);
  if (span2._tag === "None" || span2.value._tag === "ExternalSpan") {
    return;
  }
  const clockService = unsafeGet$1(getOrDefault$1(context2, currentServices), clockTag);
  const attributes = {};
  for (const [key, value] of annotations2) {
    attributes[key] = value;
  }
  attributes["effect.fiberId"] = threadName(fiberId2);
  attributes["effect.logLevel"] = logLevel.label;
  if (cause !== null && cause._tag !== "Empty") {
    attributes["effect.cause"] = pretty$1(cause, {
      renderErrorCause: true
    });
  }
  span2.value.event(toStringUnknown(Array.isArray(message) ? message[0] : message), clockService.unsafeCurrentTimeNanos(), attributes);
}));
const currentLoggers = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/FiberRef/currentLoggers"), () => fiberRefUnsafeMakeHashSet(make$l(defaultLogger, tracerLogger)));
const allResolveInput = (input) => {
  if (Array.isArray(input) || isIterable(input)) {
    return [input, none$4()];
  }
  const keys2 = Object.keys(input);
  const size2 = keys2.length;
  return [keys2.map((k) => input[k]), some((values) => {
    const res = {};
    for (let i = 0; i < size2; i++) {
      res[keys2[i]] = values[i];
    }
    return res;
  })];
};
const allValidate = (effects, reconcile, options) => {
  const eitherEffects = [];
  for (const effect2 of effects) {
    eitherEffects.push(either$1(effect2));
  }
  return flatMap$3(forEach$1(eitherEffects, identity, {
    concurrency: options?.concurrency,
    batching: options?.batching,
    concurrentFinalizers: options?.concurrentFinalizers
  }), (eithers) => {
    const none2 = none$4();
    const size2 = eithers.length;
    const errors = new Array(size2);
    const successes = new Array(size2);
    let errored = false;
    for (let i = 0; i < size2; i++) {
      const either2 = eithers[i];
      if (either2._tag === "Left") {
        errors[i] = some(either2.left);
        errored = true;
      } else {
        successes[i] = either2.right;
        errors[i] = none2;
      }
    }
    if (errored) {
      return reconcile._tag === "Some" ? fail$2(reconcile.value(errors)) : fail$2(errors);
    } else if (options?.discard) {
      return void_$1;
    }
    return reconcile._tag === "Some" ? succeed$5(reconcile.value(successes)) : succeed$5(successes);
  });
};
const allEither = (effects, reconcile, options) => {
  const eitherEffects = [];
  for (const effect2 of effects) {
    eitherEffects.push(either$1(effect2));
  }
  if (options?.discard) {
    return forEach$1(eitherEffects, identity, {
      concurrency: options?.concurrency,
      batching: options?.batching,
      discard: true,
      concurrentFinalizers: options?.concurrentFinalizers
    });
  }
  return map$3(forEach$1(eitherEffects, identity, {
    concurrency: options?.concurrency,
    batching: options?.batching,
    concurrentFinalizers: options?.concurrentFinalizers
  }), (eithers) => reconcile._tag === "Some" ? reconcile.value(eithers) : eithers);
};
const all$1 = (arg, options) => {
  const [effects, reconcile] = allResolveInput(arg);
  if (options?.mode === "validate") {
    return allValidate(effects, reconcile, options);
  } else if (options?.mode === "either") {
    return allEither(effects, reconcile, options);
  }
  return options?.discard !== true && reconcile._tag === "Some" ? map$3(forEach$1(effects, identity, options), reconcile.value) : forEach$1(effects, identity, options);
};
const forEach$1 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]), (self, f, options) => withFiberRuntime((r) => {
  const isRequestBatchingEnabled = options?.batching === true || options?.batching === "inherit" && r.getFiberRef(currentRequestBatching);
  if (options?.discard) {
    return match$1(options.concurrency, () => finalizersMaskInternal(sequential, options?.concurrentFinalizers)((restore) => isRequestBatchingEnabled ? forEachConcurrentDiscard(self, (a, i) => restore(f(a, i)), true, false, 1) : forEachSequentialDiscard(self, (a, i) => restore(f(a, i)))), () => finalizersMaskInternal(parallel, options?.concurrentFinalizers)((restore) => forEachConcurrentDiscard(self, (a, i) => restore(f(a, i)), isRequestBatchingEnabled, false)), (n) => finalizersMaskInternal(parallelN(n), options?.concurrentFinalizers)((restore) => forEachConcurrentDiscard(self, (a, i) => restore(f(a, i)), isRequestBatchingEnabled, false, n)));
  }
  return match$1(options?.concurrency, () => finalizersMaskInternal(sequential, options?.concurrentFinalizers)((restore) => isRequestBatchingEnabled ? forEachParN(self, 1, (a, i) => restore(f(a, i)), true) : forEachSequential(self, (a, i) => restore(f(a, i)))), () => finalizersMaskInternal(parallel, options?.concurrentFinalizers)((restore) => forEachParUnbounded(self, (a, i) => restore(f(a, i)), isRequestBatchingEnabled)), (n) => finalizersMaskInternal(parallelN(n), options?.concurrentFinalizers)((restore) => forEachParN(self, n, (a, i) => restore(f(a, i)), isRequestBatchingEnabled)));
}));
const forEachParUnbounded = (self, f, batching) => suspend$2(() => {
  const as2 = fromIterable$6(self);
  const array2 = new Array(as2.length);
  const fn = (a, i) => flatMap$3(f(a, i), (b) => sync$1(() => array2[i] = b));
  return zipRight$1(forEachConcurrentDiscard(as2, fn, batching, false), succeed$5(array2));
});
const forEachConcurrentDiscard = (self, f, batching, processAll, n) => uninterruptibleMask$1((restore) => transplant((graft) => withFiberRuntime((parent) => {
  let todos = Array.from(self).reverse();
  let target = todos.length;
  if (target === 0) {
    return void_$1;
  }
  let counter2 = 0;
  let interrupted = false;
  const fibersCount = n ? Math.min(todos.length, n) : todos.length;
  const fibers = /* @__PURE__ */ new Set();
  const results = new Array();
  const interruptAll = () => fibers.forEach((fiber) => {
    fiber.currentScheduler.scheduleTask(() => {
      fiber.unsafeInterruptAsFork(parent.id());
    }, 0);
  });
  const startOrder = new Array();
  const joinOrder = new Array();
  const residual = new Array();
  const collectExits = () => {
    const exits = results.filter(({
      exit: exit2
    }) => exit2._tag === "Failure").sort((a, b) => a.index < b.index ? -1 : a.index === b.index ? 0 : 1).map(({
      exit: exit2
    }) => exit2);
    if (exits.length === 0) {
      exits.push(exitVoid$1);
    }
    return exits;
  };
  const runFiber = (eff, interruptImmediately = false) => {
    const runnable = uninterruptible(graft(eff));
    const fiber = unsafeForkUnstarted(runnable, parent, parent.currentRuntimeFlags, globalScope);
    parent.currentScheduler.scheduleTask(() => {
      if (interruptImmediately) {
        fiber.unsafeInterruptAsFork(parent.id());
      }
      fiber.resume(runnable);
    }, 0);
    return fiber;
  };
  const onInterruptSignal = () => {
    if (!processAll) {
      target -= todos.length;
      todos = [];
    }
    interrupted = true;
    interruptAll();
  };
  const stepOrExit = batching ? step : exit;
  const processingFiber = runFiber(async_((resume2) => {
    const pushResult = (res, index) => {
      if (res._op === "Blocked") {
        residual.push(res);
      } else {
        results.push({
          index,
          exit: res
        });
        if (res._op === "Failure" && !interrupted) {
          onInterruptSignal();
        }
      }
    };
    const next = () => {
      if (todos.length > 0) {
        const a = todos.pop();
        let index = counter2++;
        const returnNextElement = () => {
          const a2 = todos.pop();
          index = counter2++;
          return flatMap$3(yieldNow$2(), () => flatMap$3(stepOrExit(restore(f(a2, index))), onRes));
        };
        const onRes = (res) => {
          if (todos.length > 0) {
            pushResult(res, index);
            if (todos.length > 0) {
              return returnNextElement();
            }
          }
          return succeed$5(res);
        };
        const todo = flatMap$3(stepOrExit(restore(f(a, index))), onRes);
        const fiber = runFiber(todo);
        startOrder.push(fiber);
        fibers.add(fiber);
        if (interrupted) {
          fiber.currentScheduler.scheduleTask(() => {
            fiber.unsafeInterruptAsFork(parent.id());
          }, 0);
        }
        fiber.addObserver((wrapped) => {
          let exit2;
          if (wrapped._op === "Failure") {
            exit2 = wrapped;
          } else {
            exit2 = wrapped.effect_instruction_i0;
          }
          joinOrder.push(fiber);
          fibers.delete(fiber);
          pushResult(exit2, index);
          if (results.length === target) {
            resume2(succeed$5(getOrElse(exitCollectAll(collectExits(), {
              parallel: true
            }), () => exitVoid$1)));
          } else if (residual.length + results.length === target) {
            const exits = collectExits();
            const requests = residual.map((blocked2) => blocked2.effect_instruction_i0).reduce(par);
            resume2(succeed$5(blocked(requests, forEachConcurrentDiscard([getOrElse(exitCollectAll(exits, {
              parallel: true
            }), () => exitVoid$1), ...residual.map((blocked2) => blocked2.effect_instruction_i1)], (i) => i, batching, true, n))));
          } else {
            next();
          }
        });
      }
    };
    for (let i = 0; i < fibersCount; i++) {
      next();
    }
  }));
  return asVoid$1(onExit$1(flatten(restore(join(processingFiber))), exitMatch({
    onFailure: (cause) => {
      onInterruptSignal();
      const target2 = residual.length + 1;
      const concurrency = Math.min(typeof n === "number" ? n : residual.length, residual.length);
      const toPop = Array.from(residual);
      return async_((cb) => {
        let count = 0;
        let index = 0;
        const check2 = (index2, hitNext) => (exit2) => {
          count++;
          if (count === target2) {
            cb(exitSucceed$1(exitFailCause$1(cause)));
          }
          if (toPop.length > 0 && hitNext) {
            next();
          }
        };
        const next = () => {
          runFiber(toPop.pop(), true).addObserver(check2(index, true));
          index++;
        };
        processingFiber.addObserver(check2(index, false));
        index++;
        for (let i = 0; i < concurrency; i++) {
          next();
        }
      });
    },
    onSuccess: () => forEachSequential(joinOrder, (f2) => f2.inheritAll)
  })));
})));
const forEachParN = (self, n, f, batching) => suspend$2(() => {
  const as2 = fromIterable$6(self);
  const array2 = new Array(as2.length);
  const fn = (a, i) => map$3(f(a, i), (b) => array2[i] = b);
  return zipRight$1(forEachConcurrentDiscard(as2, fn, batching, false, n), succeed$5(array2));
});
const fork$2 = (self) => withFiberRuntime((state, status) => succeed$5(unsafeFork$1(self, state, status.runtimeFlags)));
const forkDaemon = (self) => forkWithScopeOverride(self, globalScope);
const unsafeFork$1 = (effect2, parentFiber, parentRuntimeFlags, overrideScope = null) => {
  const childFiber = unsafeMakeChildFiber(effect2, parentFiber, parentRuntimeFlags, overrideScope);
  childFiber.resume(effect2);
  return childFiber;
};
const unsafeForkUnstarted = (effect2, parentFiber, parentRuntimeFlags, overrideScope = null) => {
  const childFiber = unsafeMakeChildFiber(effect2, parentFiber, parentRuntimeFlags, overrideScope);
  return childFiber;
};
const unsafeMakeChildFiber = (effect2, parentFiber, parentRuntimeFlags, overrideScope = null) => {
  const childId = unsafeMake$4();
  const parentFiberRefs = parentFiber.getFiberRefs();
  const childFiberRefs = forkAs(parentFiberRefs, childId);
  const childFiber = new FiberRuntime(childId, childFiberRefs, parentRuntimeFlags);
  const childContext = getOrDefault$1(childFiberRefs, currentContext);
  const supervisor = childFiber.currentSupervisor;
  supervisor.onStart(childContext, effect2, some(parentFiber), childFiber);
  childFiber.addObserver((exit2) => supervisor.onEnd(exit2, childFiber));
  const parentScope = overrideScope !== null ? overrideScope : pipe(parentFiber.getFiberRef(currentForkScopeOverride), getOrElse(() => parentFiber.scope()));
  parentScope.add(parentRuntimeFlags, childFiber);
  return childFiber;
};
const forkWithScopeOverride = (self, scopeOverride) => withFiberRuntime((parentFiber, parentStatus) => succeed$5(unsafeFork$1(self, parentFiber, parentStatus.runtimeFlags, scopeOverride)));
const parallelFinalizers = (self) => contextWithEffect((context2) => match$5(getOption(context2, scopeTag), {
  onNone: () => self,
  onSome: (scope) => {
    switch (scope.strategy._tag) {
      case "Parallel":
        return self;
      case "Sequential":
      case "ParallelN":
        return flatMap$3(scopeFork(scope, parallel), (inner) => scopeExtend(self, inner));
    }
  }
}));
const parallelNFinalizers = (parallelism) => (self) => contextWithEffect((context2) => match$5(getOption(context2, scopeTag), {
  onNone: () => self,
  onSome: (scope) => {
    if (scope.strategy._tag === "ParallelN" && scope.strategy.parallelism === parallelism) {
      return self;
    }
    return flatMap$3(scopeFork(scope, parallelN(parallelism)), (inner) => scopeExtend(self, inner));
  }
}));
const finalizersMaskInternal = (strategy, concurrentFinalizers) => (self) => contextWithEffect((context2) => match$5(getOption(context2, scopeTag), {
  onNone: () => self(identity),
  onSome: (scope) => {
    if (concurrentFinalizers === true) {
      const patch2 = strategy._tag === "Parallel" ? parallelFinalizers : strategy._tag === "Sequential" ? sequentialFinalizers : parallelNFinalizers(strategy.parallelism);
      switch (scope.strategy._tag) {
        case "Parallel":
          return patch2(self(parallelFinalizers));
        case "Sequential":
          return patch2(self(sequentialFinalizers));
        case "ParallelN":
          return patch2(self(parallelNFinalizers(scope.strategy.parallelism)));
      }
    } else {
      return self(identity);
    }
  }
}));
const scopeWith = (f) => flatMap$3(scopeTag, f);
const scopedWith = (f) => flatMap$3(scopeMake(), (scope) => onExit$1(f(scope), (exit2) => scope.close(exit2)));
const sequentialFinalizers = (self) => contextWithEffect((context2) => match$5(getOption(context2, scopeTag), {
  onNone: () => self,
  onSome: (scope) => {
    switch (scope.strategy._tag) {
      case "Sequential":
        return self;
      case "Parallel":
      case "ParallelN":
        return flatMap$3(scopeFork(scope, sequential), (inner) => scopeExtend(self, inner));
    }
  }
}));
const zipRightOptions = /* @__PURE__ */ dual((args2) => isEffect$1(args2[1]), (self, that, options) => {
  if (options?.concurrent !== true && (options?.batching === void 0 || options.batching === false)) {
    return zipRight$1(self, that);
  }
  return zipWithOptions(self, that, (_, b) => b, options);
});
const zipWithOptions = /* @__PURE__ */ dual((args2) => isEffect$1(args2[1]), (self, that, f, options) => map$3(all$1([self, that], {
  concurrency: options?.concurrent ? 2 : 1,
  batching: options?.batching,
  concurrentFinalizers: options?.concurrentFinalizers
}), ([a, a2]) => f(a, a2)));
const scopeTag = /* @__PURE__ */ GenericTag("effect/Scope");
const scopeUnsafeAddFinalizer = (scope, fin) => {
  if (scope.state._tag === "Open") {
    scope.state.finalizers.set({}, fin);
  }
};
const ScopeImplProto = {
  [ScopeTypeId]: ScopeTypeId,
  [CloseableScopeTypeId]: CloseableScopeTypeId,
  pipe() {
    return pipeArguments(this, arguments);
  },
  fork(strategy) {
    return sync$1(() => {
      const newScope = scopeUnsafeMake(strategy);
      if (this.state._tag === "Closed") {
        newScope.state = this.state;
        return newScope;
      }
      const key = {};
      const fin = (exit2) => newScope.close(exit2);
      this.state.finalizers.set(key, fin);
      scopeUnsafeAddFinalizer(newScope, (_) => sync$1(() => {
        if (this.state._tag === "Open") {
          this.state.finalizers.delete(key);
        }
      }));
      return newScope;
    });
  },
  close(exit$1) {
    return suspend$2(() => {
      if (this.state._tag === "Closed") {
        return void_$1;
      }
      const finalizers = Array.from(this.state.finalizers.values()).reverse();
      this.state = {
        _tag: "Closed",
        exit: exit$1
      };
      if (finalizers.length === 0) {
        return void_$1;
      }
      return isSequential(this.strategy) ? pipe(forEachSequential(finalizers, (fin) => exit(fin(exit$1))), flatMap$3((results) => pipe(exitCollectAll(results), map$7(exitAsVoid), getOrElse(() => exitVoid$1)))) : isParallel(this.strategy) ? pipe(forEachParUnbounded(finalizers, (fin) => exit(fin(exit$1)), false), flatMap$3((results) => pipe(exitCollectAll(results, {
        parallel: true
      }), map$7(exitAsVoid), getOrElse(() => exitVoid$1)))) : pipe(forEachParN(finalizers, this.strategy.parallelism, (fin) => exit(fin(exit$1)), false), flatMap$3((results) => pipe(exitCollectAll(results, {
        parallel: true
      }), map$7(exitAsVoid), getOrElse(() => exitVoid$1))));
    });
  },
  addFinalizer(fin) {
    return suspend$2(() => {
      if (this.state._tag === "Closed") {
        return fin(this.state.exit);
      }
      this.state.finalizers.set({}, fin);
      return void_$1;
    });
  }
};
const scopeUnsafeMake = (strategy = sequential$1) => {
  const scope = Object.create(ScopeImplProto);
  scope.strategy = strategy;
  scope.state = {
    _tag: "Open",
    finalizers: /* @__PURE__ */ new Map()
  };
  return scope;
};
const scopeMake = (strategy = sequential$1) => sync$1(() => scopeUnsafeMake(strategy));
const scopeExtend = /* @__PURE__ */ dual(2, (effect2, scope) => mapInputContext(
  effect2,
  // @ts-expect-error
  merge$3(make$q(scopeTag, scope))
));
const fiberRefUnsafeMakeSupervisor = (initial) => fiberRefUnsafeMakePatch(initial, {
  differ,
  fork: empty$2
});
const currentRuntimeFlags = /* @__PURE__ */ fiberRefUnsafeMakeRuntimeFlags(none$1);
const currentSupervisor = /* @__PURE__ */ fiberRefUnsafeMakeSupervisor(none);
const ensuring = /* @__PURE__ */ dual(2, (self, finalizer) => uninterruptibleMask$1((restore) => matchCauseEffect$1(restore(self), {
  onFailure: (cause1) => matchCauseEffect$1(finalizer, {
    onFailure: (cause2) => failCause$1(sequential$2(cause1, cause2)),
    onSuccess: () => failCause$1(cause1)
  }),
  onSuccess: (a) => as(finalizer, a)
})));
const invokeWithInterrupt = (self, entries, onInterrupt2) => fiberIdWith((id) => flatMap$3(flatMap$3(forkDaemon(interruptible$1(self)), (processing) => async_((cb) => {
  const counts = entries.map((_) => _.listeners.count);
  const checkDone = () => {
    if (counts.every((count) => count === 0)) {
      if (entries.every((_) => {
        if (_.result.state.current._tag === "Pending") {
          return true;
        } else if (_.result.state.current._tag === "Done" && exitIsExit(_.result.state.current.effect) && _.result.state.current.effect._tag === "Failure" && isInterrupted(_.result.state.current.effect.cause)) {
          return true;
        } else {
          return false;
        }
      })) {
        cleanup.forEach((f) => f());
        onInterrupt2?.();
        cb(interruptFiber(processing));
      }
    }
  };
  processing.addObserver((exit2) => {
    cleanup.forEach((f) => f());
    cb(exit2);
  });
  const cleanup = entries.map((r, i) => {
    const observer = (count) => {
      counts[i] = count;
      checkDone();
    };
    r.listeners.addObserver(observer);
    return () => r.listeners.removeObserver(observer);
  });
  checkDone();
  return sync$1(() => {
    cleanup.forEach((f) => f());
  });
})), () => suspend$2(() => {
  const residual = entries.flatMap((entry) => {
    if (!entry.state.completed) {
      return [entry];
    }
    return [];
  });
  return forEachSequentialDiscard(residual, (entry) => complete(entry.request, exitInterrupt$1(id)));
})));
const isFailType = isFailType$1;
const pretty = pretty$1;
const IntervalSymbolKey = "effect/ScheduleInterval";
const IntervalTypeId = /* @__PURE__ */ Symbol.for(IntervalSymbolKey);
const empty$1 = {
  [IntervalTypeId]: IntervalTypeId,
  startMillis: 0,
  endMillis: 0
};
const make$6 = (startMillis, endMillis) => {
  if (startMillis > endMillis) {
    return empty$1;
  }
  return {
    [IntervalTypeId]: IntervalTypeId,
    startMillis,
    endMillis
  };
};
const lessThan$3 = /* @__PURE__ */ dual(2, (self, that) => min(self, that) === self);
const min = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.endMillis <= that.startMillis) return self;
  if (that.endMillis <= self.startMillis) return that;
  if (self.startMillis < that.startMillis) return self;
  if (that.startMillis < self.startMillis) return that;
  if (self.endMillis <= that.endMillis) return self;
  return that;
});
const isEmpty$1 = (self) => {
  return self.startMillis >= self.endMillis;
};
const intersect$5 = /* @__PURE__ */ dual(2, (self, that) => {
  const start2 = Math.max(self.startMillis, that.startMillis);
  const end2 = Math.min(self.endMillis, that.endMillis);
  return make$6(start2, end2);
});
const size$1 = (self) => {
  return millis(self.endMillis - self.startMillis);
};
const after$1 = (startMilliseconds) => {
  return make$6(startMilliseconds, Number.POSITIVE_INFINITY);
};
const make$5 = make$6;
const empty = empty$1;
const lessThan$2 = lessThan$3;
const isEmpty = isEmpty$1;
const intersect$4 = intersect$5;
const size = size$1;
const after = after$1;
const IntervalsSymbolKey = "effect/ScheduleIntervals";
const IntervalsTypeId = /* @__PURE__ */ Symbol.for(IntervalsSymbolKey);
const make$4 = (intervals) => {
  return {
    [IntervalsTypeId]: IntervalsTypeId,
    intervals
  };
};
const intersect$3 = /* @__PURE__ */ dual(2, (self, that) => intersectLoop(self.intervals, that.intervals, empty$i()));
const intersectLoop = (_left, _right, _acc) => {
  let left2 = _left;
  let right2 = _right;
  let acc = _acc;
  while (isNonEmpty$2(left2) && isNonEmpty$2(right2)) {
    const interval = pipe(headNonEmpty(left2), intersect$4(headNonEmpty(right2)));
    const intervals = isEmpty(interval) ? acc : pipe(acc, prepend$1(interval));
    if (pipe(headNonEmpty(left2), lessThan$2(headNonEmpty(right2)))) {
      left2 = tailNonEmpty(left2);
    } else {
      right2 = tailNonEmpty(right2);
    }
    acc = intervals;
  }
  return make$4(reverse$1(acc));
};
const start$1 = (self) => {
  return pipe(self.intervals, head, getOrElse(() => empty)).startMillis;
};
const end$1 = (self) => {
  return pipe(self.intervals, head, getOrElse(() => empty)).endMillis;
};
const lessThan$1 = /* @__PURE__ */ dual(2, (self, that) => start$1(self) < start$1(that));
const isNonEmpty$1 = (self) => {
  return isNonEmpty$2(self.intervals);
};
const make$3 = make$4;
const intersect$2 = intersect$3;
const start = start$1;
const end = end$1;
const lessThan = lessThan$1;
const isNonEmpty = isNonEmpty$1;
const OP_CONTINUE = "Continue";
const OP_DONE = "Done";
const _continue$1 = (intervals) => {
  return {
    _tag: OP_CONTINUE,
    intervals
  };
};
const continueWith$1 = (interval) => {
  return {
    _tag: OP_CONTINUE,
    intervals: make$3(of$1(interval))
  };
};
const done$1 = {
  _tag: OP_DONE
};
const isContinue$1 = (self) => {
  return self._tag === OP_CONTINUE;
};
const isDone$1 = (self) => {
  return self._tag === OP_DONE;
};
const _continue = _continue$1;
const continueWith = continueWith$1;
const done = done$1;
const isContinue = isContinue$1;
const isDone = isDone$1;
const close = scopeClose;
const extend$1 = scopeExtend;
const fork$1 = scopeFork;
const make$2 = scopeMake;
const Class$1 = Structural;
const Error$1 = /* @__PURE__ */ function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args2) {
      super(args2?.message, args2?.cause ? {
        cause: args2.cause
      } : void 0);
      if (args2) {
        Object.assign(this, args2);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args2,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
}();
const TaggedError$1 = (tag) => {
  class Base2 extends Error$1 {
    _tag = tag;
  }
  Base2.prototype.name = tag;
  return Base2;
};
const ScheduleSymbolKey = "effect/Schedule";
const ScheduleTypeId = /* @__PURE__ */ Symbol.for(ScheduleSymbolKey);
const isSchedule = (u) => hasProperty(u, ScheduleTypeId);
const ScheduleDriverSymbolKey = "effect/ScheduleDriver";
const ScheduleDriverTypeId = /* @__PURE__ */ Symbol.for(ScheduleDriverSymbolKey);
const scheduleVariance = {
  /* c8 ignore next */
  _Out: (_) => _,
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
};
const scheduleDriverVariance = {
  /* c8 ignore next */
  _Out: (_) => _,
  /* c8 ignore next */
  _In: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
};
class ScheduleImpl {
  initial;
  step;
  [ScheduleTypeId] = scheduleVariance;
  constructor(initial, step2) {
    this.initial = initial;
    this.step = step2;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
class ScheduleDriverImpl {
  schedule;
  ref;
  [ScheduleDriverTypeId] = scheduleDriverVariance;
  constructor(schedule2, ref) {
    this.schedule = schedule2;
    this.ref = ref;
  }
  get state() {
    return map$3(get$1(this.ref), (tuple) => tuple[1]);
  }
  get last() {
    return flatMap$3(get$1(this.ref), ([element, _]) => {
      switch (element._tag) {
        case "None": {
          return failSync(() => new NoSuchElementException());
        }
        case "Some": {
          return succeed$5(element.value);
        }
      }
    });
  }
  get reset() {
    return set(this.ref, [none$4(), this.schedule.initial]);
  }
  next(input) {
    return pipe(map$3(get$1(this.ref), (tuple) => tuple[1]), flatMap$3((state) => pipe(currentTimeMillis, flatMap$3((now) => pipe(suspend$2(() => this.schedule.step(now, input, state)), flatMap$3(([state2, out, decision]) => {
      const setState = set(this.ref, [some(out), state2]);
      if (isDone(decision)) {
        return zipRight$1(setState, fail$2(none$4()));
      }
      const millis$1 = start(decision.intervals) - now;
      if (millis$1 <= 0) {
        return as(setState, out);
      }
      return pipe(setState, zipRight$1(sleep(millis(millis$1))), as(out));
    }))))));
  }
}
const makeWithState = (initial, step2) => new ScheduleImpl(initial, step2);
const addDelay = /* @__PURE__ */ dual(2, (self, f) => addDelayEffect(self, (out) => sync$1(() => f(out))));
const addDelayEffect = /* @__PURE__ */ dual(2, (self, f) => modifyDelayEffect(self, (out, duration) => map$3(f(out), (delay2) => sum(duration, decode(delay2)))));
const check = /* @__PURE__ */ dual(2, (self, test) => checkEffect(self, (input, out) => sync$1(() => test(input, out))));
const checkEffect = /* @__PURE__ */ dual(2, (self, test) => makeWithState(self.initial, (now, input, state) => flatMap$3(self.step(now, input, state), ([state2, out, decision]) => {
  if (isDone(decision)) {
    return succeed$5([state2, out, done]);
  }
  return map$3(test(input, out), (cont) => cont ? [state2, out, decision] : [state2, out, done]);
})));
const delayedSchedule = (schedule2) => addDelay(schedule2, (x) => x);
const driver = (self) => pipe(make$c([none$4(), self.initial]), map$3((ref) => new ScheduleDriverImpl(self, ref)));
const exponential$1 = (baseInput, factor = 2) => {
  const base = decode(baseInput);
  return delayedSchedule(map$2(forever, (i) => times(base, Math.pow(factor, i))));
};
const intersect$1 = /* @__PURE__ */ dual(2, (self, that) => intersectWith(self, that, intersect$2));
const intersectWith = /* @__PURE__ */ dual(3, (self, that, f) => makeWithState([self.initial, that.initial], (now, input, state) => pipe(zipWith$1(self.step(now, input, state[0]), that.step(now, input, state[1]), (a, b) => [a, b]), flatMap$3(([[lState, out, lDecision], [rState, out2, rDecision]]) => {
  if (isContinue(lDecision) && isContinue(rDecision)) {
    return intersectWithLoop(self, that, input, lState, out, lDecision.intervals, rState, out2, rDecision.intervals, f);
  }
  return succeed$5([[lState, rState], [out, out2], done]);
}))));
const intersectWithLoop = (self, that, input, lState, out, lInterval, rState, out2, rInterval, f) => {
  const combined = f(lInterval, rInterval);
  if (isNonEmpty(combined)) {
    return succeed$5([[lState, rState], [out, out2], _continue(combined)]);
  }
  if (pipe(lInterval, lessThan(rInterval))) {
    return flatMap$3(self.step(end(lInterval), input, lState), ([lState2, out3, decision]) => {
      if (isDone(decision)) {
        return succeed$5([[lState2, rState], [out3, out2], done]);
      }
      return intersectWithLoop(self, that, input, lState2, out3, decision.intervals, rState, out2, rInterval, f);
    });
  }
  return flatMap$3(that.step(end(rInterval), input, rState), ([rState2, out22, decision]) => {
    if (isDone(decision)) {
      return succeed$5([[lState, rState2], [out, out22], done]);
    }
    return intersectWithLoop(self, that, input, lState, out, lInterval, rState2, out22, decision.intervals, f);
  });
};
const map$2 = /* @__PURE__ */ dual(2, (self, f) => mapEffect(self, (out) => sync$1(() => f(out))));
const mapEffect = /* @__PURE__ */ dual(2, (self, f) => makeWithState(self.initial, (now, input, state) => flatMap$3(self.step(now, input, state), ([state2, out, decision]) => map$3(f(out), (out2) => [state2, out2, decision]))));
const modifyDelayEffect = /* @__PURE__ */ dual(2, (self, f) => makeWithState(self.initial, (now, input, state) => flatMap$3(self.step(now, input, state), ([state2, out, decision]) => {
  if (isDone(decision)) {
    return succeed$5([state2, out, decision]);
  }
  const intervals = decision.intervals;
  const delay2 = size(make$5(now, start(intervals)));
  return map$3(f(out, delay2), (durationInput) => {
    const duration = decode(durationInput);
    const oldStart = start(intervals);
    const newStart = now + toMillis(duration);
    const delta = newStart - oldStart;
    const newEnd = Math.max(0, end(intervals) + delta);
    const newInterval = make$5(newStart, newEnd);
    return [state2, out, continueWith(newInterval)];
  });
})));
const recurs$1 = (n) => whileOutput(forever, (out) => out < n);
const unfold = (initial, f) => makeWithState(initial, (now, _, state) => sync$1(() => [f(state), state, continueWith(after(now))]));
const untilInputEffect = /* @__PURE__ */ dual(2, (self, f) => checkEffect(self, (input, _) => negate(f(input))));
const whileInputEffect = /* @__PURE__ */ dual(2, (self, f) => checkEffect(self, (input, _) => f(input)));
const whileOutput = /* @__PURE__ */ dual(2, (self, f) => check(self, (_, out) => f(out)));
const ScheduleDefectTypeId = /* @__PURE__ */ Symbol.for("effect/Schedule/ScheduleDefect");
class ScheduleDefect {
  error;
  [ScheduleDefectTypeId];
  constructor(error) {
    this.error = error;
    this[ScheduleDefectTypeId] = ScheduleDefectTypeId;
  }
}
const isScheduleDefect = (u) => hasProperty(u, ScheduleDefectTypeId);
const scheduleDefectWrap = (self) => catchAll$1(self, (e) => die$1(new ScheduleDefect(e)));
const scheduleDefectRefail = (self) => catchAllCause(self, (cause) => match$5(find(cause, (_) => isDieType(_) && isScheduleDefect(_.defect) ? some(_.defect) : none$4()), {
  onNone: () => failCause$1(cause),
  onSome: (error) => fail$2(error.error)
}));
const retry_Effect = /* @__PURE__ */ dual(2, (self, policy) => retryOrElse_Effect(self, policy, (e, _) => fail$2(e)));
const retry_combined = /* @__PURE__ */ dual(2, (self, options) => {
  if (isSchedule(options)) {
    return retry_Effect(self, options);
  }
  const base = options.schedule ?? forever;
  const withWhile = options.while ? whileInputEffect(base, (e) => {
    const applied = options.while(e);
    if (typeof applied === "boolean") {
      return succeed$5(applied);
    }
    return scheduleDefectWrap(applied);
  }) : base;
  const withUntil = options.until ? untilInputEffect(withWhile, (e) => {
    const applied = options.until(e);
    if (typeof applied === "boolean") {
      return succeed$5(applied);
    }
    return scheduleDefectWrap(applied);
  }) : withWhile;
  const withTimes = options.times ? intersect$1(withUntil, recurs$1(options.times)) : withUntil;
  return scheduleDefectRefail(retry_Effect(self, withTimes));
});
const retryOrElse_Effect = /* @__PURE__ */ dual(3, (self, policy, orElse2) => flatMap$3(driver(policy), (driver2) => retryOrElse_EffectLoop(self, driver2, orElse2)));
const retryOrElse_EffectLoop = (self, driver2, orElse2) => {
  return catchAll$1(self, (e) => matchEffect(driver2.next(e), {
    onFailure: () => pipe(driver2.last, orDie, flatMap$3((out) => orElse2(e, out))),
    onSuccess: () => retryOrElse_EffectLoop(self, driver2, orElse2)
  }));
};
const forever = /* @__PURE__ */ unfold(0, (n) => n + 1);
class Semaphore {
  permits;
  waiters = /* @__PURE__ */ new Set();
  taken = 0;
  constructor(permits) {
    this.permits = permits;
  }
  get free() {
    return this.permits - this.taken;
  }
  take = (n) => asyncInterrupt((resume2) => {
    if (this.free < n) {
      const observer = () => {
        if (this.free < n) {
          return;
        }
        this.waiters.delete(observer);
        this.taken += n;
        resume2(succeed$5(n));
      };
      this.waiters.add(observer);
      return sync$1(() => {
        this.waiters.delete(observer);
      });
    }
    this.taken += n;
    return resume2(succeed$5(n));
  });
  updateTaken = (f) => withFiberRuntime((fiber) => {
    this.taken = f(this.taken);
    if (this.waiters.size > 0) {
      fiber.getFiberRef(currentScheduler).scheduleTask(() => {
        const iter = this.waiters.values();
        let item = iter.next();
        while (item.done === false && this.free > 0) {
          item.value();
          item = iter.next();
        }
      }, fiber.getFiberRef(currentSchedulingPriority));
    }
    return succeed$5(this.free);
  });
  release = (n) => this.updateTaken((taken) => taken - n);
  releaseAll = /* @__PURE__ */ this.updateTaken((_) => 0);
  withPermits = (n) => (self) => uninterruptibleMask$1((restore) => flatMap$3(restore(this.take(n)), (permits) => ensuring(restore(self), this.release(permits))));
  withPermitsIfAvailable = (n) => (self) => uninterruptibleMask$1((restore) => suspend$2(() => {
    if (this.free < n) {
      return succeedNone;
    }
    this.taken += n;
    return ensuring(restore(asSome(self)), this.release(n));
  }));
}
const unsafeMakeSemaphore = (permits) => new Semaphore(permits);
const SynchronizedSymbolKey = "effect/Ref/SynchronizedRef";
const SynchronizedTypeId = /* @__PURE__ */ Symbol.for(SynchronizedSymbolKey);
const synchronizedVariance = {
  /* c8 ignore next */
  _A: (_) => _
};
class SynchronizedImpl extends Class$2 {
  ref;
  withLock;
  [SynchronizedTypeId] = synchronizedVariance;
  [RefTypeId] = refVariance;
  [TypeId$3] = TypeId$3;
  constructor(ref, withLock) {
    super();
    this.ref = ref;
    this.withLock = withLock;
    this.get = get$1(this.ref);
  }
  get;
  commit() {
    return this.get;
  }
  modify(f) {
    return this.modifyEffect((a) => succeed$5(f(a)));
  }
  modifyEffect(f) {
    return this.withLock(pipe(flatMap$3(get$1(this.ref), f), flatMap$3(([b, a]) => as(set(this.ref, a), b))));
  }
}
const makeSynchronized = (value) => sync$1(() => unsafeMakeSynchronized(value));
const unsafeMakeSynchronized = (value) => {
  const ref = unsafeMake$2(value);
  const sem = unsafeMakeSemaphore(1);
  return new SynchronizedImpl(ref, sem.withPermits(1));
};
const TypeId$1 = /* @__PURE__ */ Symbol.for("effect/ManagedRuntime");
const OP_FRESH = "Fresh";
const OP_FROM_EFFECT = "FromEffect";
const OP_SUSPEND = "Suspend";
const OP_PROVIDE = "Provide";
const OP_PROVIDE_MERGE = "ProvideMerge";
const OP_ZIP_WITH = "ZipWith";
const makeDual = (f) => function() {
  if (arguments.length === 1) {
    const runtime2 = arguments[0];
    return (effect2, ...args2) => f(runtime2, effect2, ...args2);
  }
  return f.apply(this, arguments);
};
const unsafeFork = /* @__PURE__ */ makeDual((runtime2, self, options) => {
  const fiberId2 = unsafeMake$4();
  const fiberRefUpdates = [[currentContext, [[fiberId2, runtime2.context]]]];
  if (options?.scheduler) {
    fiberRefUpdates.push([currentScheduler, [[fiberId2, options.scheduler]]]);
  }
  let fiberRefs2 = updateManyAs(runtime2.fiberRefs, {
    entries: fiberRefUpdates,
    forkAs: fiberId2
  });
  if (options?.updateRefs) {
    fiberRefs2 = options.updateRefs(fiberRefs2, fiberId2);
  }
  const fiberRuntime = new FiberRuntime(fiberId2, fiberRefs2, runtime2.runtimeFlags);
  let effect2 = self;
  if (options?.scope) {
    effect2 = flatMap$3(fork$1(options.scope, sequential$1), (closeableScope) => zipRight$1(scopeAddFinalizer(closeableScope, fiberIdWith((id) => equals$1(id, fiberRuntime.id()) ? void_$1 : interruptAsFiber(fiberRuntime, id))), onExit$1(self, (exit2) => close(closeableScope, exit2))));
  }
  const supervisor = fiberRuntime.currentSupervisor;
  if (supervisor !== none) {
    supervisor.onStart(runtime2.context, effect2, none$4(), fiberRuntime);
    fiberRuntime.addObserver((exit2) => supervisor.onEnd(exit2, fiberRuntime));
  }
  globalScope.add(runtime2.runtimeFlags, fiberRuntime);
  if (options?.immediate === false) {
    fiberRuntime.resume(effect2);
  } else {
    fiberRuntime.start(effect2);
  }
  return fiberRuntime;
});
const unsafeRunSync = /* @__PURE__ */ makeDual((runtime2, effect2) => {
  const result = unsafeRunSyncExit(runtime2)(effect2);
  if (result._tag === "Failure") {
    throw fiberFailure(result.effect_instruction_i0);
  }
  return result.effect_instruction_i0;
});
class AsyncFiberExceptionImpl extends Error {
  fiber;
  _tag = "AsyncFiberException";
  constructor(fiber) {
    super(`Fiber #${fiber.id().id} cannot be resolved synchronously. This is caused by using runSync on an effect that performs async work`);
    this.fiber = fiber;
    this.name = this._tag;
    this.stack = this.message;
  }
}
const asyncFiberException = (fiber) => {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  const error = new AsyncFiberExceptionImpl(fiber);
  Error.stackTraceLimit = limit;
  return error;
};
const FiberFailureId = /* @__PURE__ */ Symbol.for("effect/Runtime/FiberFailure");
const FiberFailureCauseId = /* @__PURE__ */ Symbol.for("effect/Runtime/FiberFailure/Cause");
class FiberFailureImpl extends Error {
  [FiberFailureId];
  [FiberFailureCauseId];
  constructor(cause) {
    const head2 = prettyErrors(cause)[0];
    super(head2?.message || "An error has occurred");
    this[FiberFailureId] = FiberFailureId;
    this[FiberFailureCauseId] = cause;
    this.name = head2 ? `(FiberFailure) ${head2.name}` : "FiberFailure";
    if (head2?.stack) {
      this.stack = head2.stack;
    }
  }
  toJSON() {
    return {
      _id: "FiberFailure",
      cause: this[FiberFailureCauseId].toJSON()
    };
  }
  toString() {
    return "(FiberFailure) " + pretty$1(this[FiberFailureCauseId], {
      renderErrorCause: true
    });
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
}
const fiberFailure = (cause) => {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  const error = new FiberFailureImpl(cause);
  Error.stackTraceLimit = limit;
  return error;
};
const fastPath = (effect2) => {
  const op = effect2;
  switch (op._op) {
    case "Failure":
    case "Success": {
      return op;
    }
    case "Left": {
      return exitFail(op.left);
    }
    case "Right": {
      return exitSucceed$1(op.right);
    }
    case "Some": {
      return exitSucceed$1(op.value);
    }
    case "None": {
      return exitFail(NoSuchElementException());
    }
  }
};
const unsafeRunSyncExit = /* @__PURE__ */ makeDual((runtime2, effect2) => {
  const op = fastPath(effect2);
  if (op) {
    return op;
  }
  const scheduler = new SyncScheduler();
  const fiberRuntime = unsafeFork(runtime2)(effect2, {
    scheduler
  });
  scheduler.flush();
  const result = fiberRuntime.unsafePoll();
  if (result) {
    return result;
  }
  return exitDie$1(capture(asyncFiberException(fiberRuntime), currentSpanFromFiber(fiberRuntime)));
});
const unsafeRunPromise = /* @__PURE__ */ makeDual((runtime2, effect2, options) => unsafeRunPromiseExit(runtime2, effect2, options).then((result) => {
  switch (result._tag) {
    case OP_SUCCESS: {
      return result.effect_instruction_i0;
    }
    case OP_FAILURE: {
      throw fiberFailure(result.effect_instruction_i0);
    }
  }
}));
const unsafeRunPromiseExit = /* @__PURE__ */ makeDual((runtime2, effect2, options) => new Promise((resolve) => {
  const op = fastPath(effect2);
  if (op) {
    resolve(op);
  }
  const fiber = unsafeFork(runtime2)(effect2);
  fiber.addObserver((exit2) => {
    resolve(exit2);
  });
  if (options?.signal !== void 0) {
    if (options.signal.aborted) {
      fiber.unsafeInterruptAsFork(fiber.id());
    } else {
      options.signal.addEventListener("abort", () => {
        fiber.unsafeInterruptAsFork(fiber.id());
      }, {
        once: true
      });
    }
  }
}));
class RuntimeImpl {
  context;
  runtimeFlags;
  fiberRefs;
  constructor(context2, runtimeFlags, fiberRefs2) {
    this.context = context2;
    this.runtimeFlags = runtimeFlags;
    this.fiberRefs = fiberRefs2;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
}
const make$1 = (options) => new RuntimeImpl(options.context, options.runtimeFlags, options.fiberRefs);
const runtime = () => withFiberRuntime((state, status) => succeed$5(new RuntimeImpl(state.getFiberRef(currentContext), status.runtimeFlags, state.getFiberRefs())));
const defaultRuntimeFlags = /* @__PURE__ */ make$h(Interruption, CooperativeYielding, RuntimeMetrics);
const defaultRuntime = /* @__PURE__ */ make$1({
  context: /* @__PURE__ */ empty$j(),
  runtimeFlags: defaultRuntimeFlags,
  fiberRefs: /* @__PURE__ */ empty$4()
});
const unsafeForkEffect = /* @__PURE__ */ unsafeFork(defaultRuntime);
const unsafeRunPromiseEffect = /* @__PURE__ */ unsafeRunPromise(defaultRuntime);
const unsafeRunSyncEffect = /* @__PURE__ */ unsafeRunSync(defaultRuntime);
const modifyEffect = /* @__PURE__ */ dual(2, (self, f) => self.modifyEffect(f));
const LayerSymbolKey = "effect/Layer";
const LayerTypeId = /* @__PURE__ */ Symbol.for(LayerSymbolKey);
const layerVariance = {
  /* c8 ignore next */
  _RIn: (_) => _,
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _ROut: (_) => _
};
const proto = {
  [LayerTypeId]: layerVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const MemoMapTypeIdKey = "effect/Layer/MemoMap";
const MemoMapTypeId = /* @__PURE__ */ Symbol.for(MemoMapTypeIdKey);
const CurrentMemoMap = /* @__PURE__ */ Reference()("effect/Layer/CurrentMemoMap", {
  defaultValue: () => unsafeMakeMemoMap()
});
const isLayer = (u) => hasProperty(u, LayerTypeId);
const isFresh = (self) => {
  return self._op_layer === OP_FRESH;
};
class MemoMapImpl {
  ref;
  [MemoMapTypeId];
  constructor(ref) {
    this.ref = ref;
    this[MemoMapTypeId] = MemoMapTypeId;
  }
  /**
   * Checks the memo map to see if a layer exists. If it is, immediately
   * returns it. Otherwise, obtains the layer, stores it in the memo map,
   * and adds a finalizer to the `Scope`.
   */
  getOrElseMemoize(layer, scope) {
    return pipe(modifyEffect(this.ref, (map2) => {
      const inMap = map2.get(layer);
      if (inMap !== void 0) {
        const [acquire, release] = inMap;
        const cached2 = pipe(acquire, flatMap$3(([patch2, b]) => pipe(patchFiberRefs(patch2), as(b))), onExit$1(exitMatch({
          onFailure: () => void_$1,
          onSuccess: () => scopeAddFinalizerExit(scope, release)
        })));
        return succeed$5([cached2, map2]);
      }
      return pipe(make$c(0), flatMap$3((observers) => pipe(deferredMake(), flatMap$3((deferred) => pipe(make$c(() => void_$1), map$3((finalizerRef) => {
        const resource = uninterruptibleMask$1((restore) => pipe(scopeMake(), flatMap$3((innerScope) => pipe(restore(flatMap$3(makeBuilder(layer, innerScope, true), (f) => diffFiberRefs(f(this)))), exit, flatMap$3((exit2) => {
          switch (exit2._tag) {
            case OP_FAILURE: {
              return pipe(deferredFailCause(deferred, exit2.effect_instruction_i0), zipRight$1(scopeClose(innerScope, exit2)), zipRight$1(failCause$1(exit2.effect_instruction_i0)));
            }
            case OP_SUCCESS: {
              return pipe(set(finalizerRef, (exit3) => pipe(scopeClose(innerScope, exit3), whenEffect(modify(observers, (n) => [n === 1, n - 1])), asVoid$1)), zipRight$1(update$1(observers, (n) => n + 1)), zipRight$1(scopeAddFinalizerExit(scope, (exit3) => pipe(sync$1(() => map2.delete(layer)), zipRight$1(get$1(finalizerRef)), flatMap$3((finalizer) => finalizer(exit3))))), zipRight$1(deferredSucceed(deferred, exit2.effect_instruction_i0)), as(exit2.effect_instruction_i0[1]));
            }
          }
        })))));
        const memoized = [pipe(deferredAwait(deferred), onExit$1(exitMatchEffect({
          onFailure: () => void_$1,
          onSuccess: () => update$1(observers, (n) => n + 1)
        }))), (exit2) => pipe(get$1(finalizerRef), flatMap$3((finalizer) => finalizer(exit2)))];
        return [resource, isFresh(layer) ? map2 : map2.set(layer, memoized)];
      }))))));
    }), flatten);
  }
}
const makeMemoMap = /* @__PURE__ */ suspend$2(() => map$3(makeSynchronized(/* @__PURE__ */ new Map()), (ref) => new MemoMapImpl(ref)));
const unsafeMakeMemoMap = () => new MemoMapImpl(unsafeMakeSynchronized(/* @__PURE__ */ new Map()));
const buildWithScope = /* @__PURE__ */ dual(2, (self, scope) => flatMap$3(makeMemoMap, (memoMap) => buildWithMemoMap(self, memoMap, scope)));
const buildWithMemoMap = /* @__PURE__ */ dual(3, (self, memoMap, scope) => flatMap$3(makeBuilder(self, scope), (run) => provideService(run(memoMap), CurrentMemoMap, memoMap)));
const makeBuilder = (self, scope, inMemoMap = false) => {
  const op = self;
  switch (op._op_layer) {
    case "Locally": {
      return sync$1(() => (memoMap) => op.f(memoMap.getOrElseMemoize(op.self, scope)));
    }
    case "ExtendScope": {
      return sync$1(() => (memoMap) => scopeWith((scope2) => memoMap.getOrElseMemoize(op.layer, scope2)));
    }
    case "Fold": {
      return sync$1(() => (memoMap) => pipe(memoMap.getOrElseMemoize(op.layer, scope), matchCauseEffect$1({
        onFailure: (cause) => memoMap.getOrElseMemoize(op.failureK(cause), scope),
        onSuccess: (value) => memoMap.getOrElseMemoize(op.successK(value), scope)
      })));
    }
    case "Fresh": {
      return sync$1(() => (_) => pipe(op.layer, buildWithScope(scope)));
    }
    case "FromEffect": {
      return inMemoMap ? sync$1(() => (_) => op.effect) : sync$1(() => (memoMap) => memoMap.getOrElseMemoize(self, scope));
    }
    case "Provide": {
      return sync$1(() => (memoMap) => pipe(memoMap.getOrElseMemoize(op.first, scope), flatMap$3((env) => pipe(memoMap.getOrElseMemoize(op.second, scope), provideContext$1(env)))));
    }
    case "Scoped": {
      return inMemoMap ? sync$1(() => (_) => scopeExtend(op.effect, scope)) : sync$1(() => (memoMap) => memoMap.getOrElseMemoize(self, scope));
    }
    case "Suspend": {
      return sync$1(() => (memoMap) => memoMap.getOrElseMemoize(op.evaluate(), scope));
    }
    case "ProvideMerge": {
      return sync$1(() => (memoMap) => pipe(memoMap.getOrElseMemoize(op.first, scope), zipWith$1(memoMap.getOrElseMemoize(op.second, scope), op.zipK)));
    }
    case "ZipWith": {
      return sync$1(() => (memoMap) => pipe(memoMap.getOrElseMemoize(op.first, scope), zipWithOptions(memoMap.getOrElseMemoize(op.second, scope), op.zipK, {
        concurrent: true
      })));
    }
  }
};
const context$1 = () => fromEffectContext(context$2());
const fromEffect = /* @__PURE__ */ dual(2, (a, b) => {
  const tagFirst = isTag(a);
  const tag = tagFirst ? a : b;
  const effect2 = tagFirst ? b : a;
  return fromEffectContext(map$3(effect2, (service) => make$q(tag, service)));
});
function fromEffectContext(effect2) {
  const fromEffect2 = Object.create(proto);
  fromEffect2._op_layer = OP_FROM_EFFECT;
  fromEffect2.effect = effect2;
  return fromEffect2;
}
const merge$1 = /* @__PURE__ */ dual(2, (self, that) => zipWith(self, that, (a, b) => merge$3(a, b)));
const mergeAll$1 = (...layers) => {
  let final = layers[0];
  for (let i = 1; i < layers.length; i++) {
    final = merge$1(final, layers[i]);
  }
  return final;
};
const succeed$3 = /* @__PURE__ */ dual(2, (a, b) => {
  const tagFirst = isTag(a);
  const tag = tagFirst ? a : b;
  const resource = tagFirst ? b : a;
  return fromEffectContext(succeed$5(make$q(tag, resource)));
});
const suspend$1 = (evaluate2) => {
  const suspend2 = Object.create(proto);
  suspend2._op_layer = OP_SUSPEND;
  suspend2.evaluate = evaluate2;
  return suspend2;
};
const toRuntime$1 = (self) => pipe(scopeWith((scope) => buildWithScope(self, scope)), flatMap$3((context2) => pipe(runtime(), provideContext$1(context2))));
const provide$2 = /* @__PURE__ */ dual(2, (self, that) => suspend$1(() => {
  const provideTo = Object.create(proto);
  provideTo._op_layer = OP_PROVIDE;
  provideTo.first = Object.create(proto, {
    _op_layer: {
      value: OP_PROVIDE_MERGE,
      enumerable: true
    },
    first: {
      value: context$1(),
      enumerable: true
    },
    second: {
      value: Array.isArray(that) ? mergeAll$1(...that) : that
    },
    zipK: {
      value: (a, b) => pipe(a, merge$3(b))
    }
  });
  provideTo.second = self;
  return provideTo;
}));
const zipWith = /* @__PURE__ */ dual(3, (self, that, f) => suspend$1(() => {
  const zipWith2 = Object.create(proto);
  zipWith2._op_layer = OP_ZIP_WITH;
  zipWith2.first = self;
  zipWith2.second = that;
  zipWith2.zipK = f;
  return zipWith2;
}));
const provideSomeLayer = /* @__PURE__ */ dual(2, (self, layer) => scopedWith((scope) => flatMap$3(buildWithScope(layer, scope), (context2) => provideSomeContext(self, context2))));
const provideSomeRuntime = /* @__PURE__ */ dual(2, (self, rt) => {
  const patchRefs = diff$1(defaultRuntime.fiberRefs, rt.fiberRefs);
  const patchFlags = diff$3(defaultRuntime.runtimeFlags, rt.runtimeFlags);
  return uninterruptibleMask$1((restore) => withFiberRuntime((fiber) => {
    const oldContext = fiber.getFiberRef(currentContext);
    const oldRefs = fiber.getFiberRefs();
    const newRefs = patch$1(fiber.id(), oldRefs)(patchRefs);
    const oldFlags = fiber.currentRuntimeFlags;
    const newFlags = patch$4(patchFlags)(oldFlags);
    const rollbackRefs = diff$1(newRefs, oldRefs);
    const rollbackFlags = diff$3(newFlags, oldFlags);
    fiber.setFiberRefs(newRefs);
    fiber.currentRuntimeFlags = newFlags;
    return ensuring(provideSomeContext(restore(self), merge$3(oldContext, rt.context)), withFiberRuntime((fiber2) => {
      fiber2.setFiberRefs(patch$1(fiber2.id(), fiber2.getFiberRefs())(rollbackRefs));
      fiber2.currentRuntimeFlags = patch$4(rollbackFlags)(fiber2.currentRuntimeFlags);
      return void_$1;
    }));
  }));
});
const effect_provide = /* @__PURE__ */ dual(2, (self, source) => {
  if (Array.isArray(source)) {
    return provideSomeLayer(self, mergeAll$1(...source));
  } else if (isLayer(source)) {
    return provideSomeLayer(self, source);
  } else if (isContext(source)) {
    return provideSomeContext(self, source);
  } else if (TypeId$1 in source) {
    return flatMap$3(source.runtimeEffect, (rt) => provideSomeRuntime(self, rt));
  } else {
    return provideSomeRuntime(self, source);
  }
});
const isEffect = isEffect$1;
const all = all$1;
const forEach = forEach$1;
const fail$1 = fail$2;
const die = die$1;
const gen = gen$1;
const succeed$2 = succeed$5;
const suspend = suspend$2;
const sync = sync$1;
const _void = void_$1;
const catchAll = catchAll$1;
const catchTag = catchTag$1;
const catchTags = catchTags$1;
const sandbox = sandbox$1;
const retry = retry_combined;
const try_ = try_$1;
const tryPromise = tryPromise$1;
const asVoid = asVoid$1;
const map$1 = map$3;
const mapBoth$1 = mapBoth$2;
const mapError$1 = mapError$2;
const fork = fork$2;
const delay = delay$1;
const context = context$2;
const provide$1 = effect_provide;
const either = either$1;
const filterOrFail = filterOrFail$1;
const flatMap$1 = flatMap$3;
const andThen = andThen$1;
const match = match$2;
const logDebug = logDebug$1;
const logInfo = logInfo$1;
const orElse$1 = orElse$2;
const orElseSucceed = orElseSucceed$1;
const runFork = unsafeForkEffect;
const runPromise$1 = unsafeRunPromiseEffect;
const runSync$1 = unsafeRunSyncEffect;
const zipRight = zipRightOptions;
const effect = fromEffect;
const merge = merge$1;
const mergeAll = mergeAll$1;
const succeed$1 = succeed$3;
const toRuntime = toRuntime$1;
const provide = provide$2;
const runSync = unsafeRunSync;
const runPromise = unsafeRunPromise;
const exponential = exponential$1;
const intersect = intersect$1;
const recurs = recurs$1;
class Pointer {
  path;
  actual;
  issue;
  /**
   * @since 3.10.0
   */
  _tag = "Pointer";
  constructor(path, actual, issue) {
    this.path = path;
    this.actual = actual;
    this.issue = issue;
  }
}
class Unexpected {
  actual;
  message;
  /**
   * @since 3.10.0
   */
  _tag = "Unexpected";
  constructor(actual, message) {
    this.actual = actual;
    this.message = message;
  }
}
class Missing {
  ast;
  message;
  /**
   * @since 3.10.0
   */
  _tag = "Missing";
  /**
   * @since 3.10.0
   */
  actual = void 0;
  constructor(ast, message) {
    this.ast = ast;
    this.message = message;
  }
}
class Composite {
  ast;
  actual;
  issues;
  output;
  /**
   * @since 3.10.0
   */
  _tag = "Composite";
  constructor(ast, actual, issues, output) {
    this.ast = ast;
    this.actual = actual;
    this.issues = issues;
    this.output = output;
  }
}
class Refinement2 {
  ast;
  actual;
  kind;
  issue;
  /**
   * @since 3.10.0
   */
  _tag = "Refinement";
  constructor(ast, actual, kind, issue) {
    this.ast = ast;
    this.actual = actual;
    this.kind = kind;
    this.issue = issue;
  }
}
class Transformation2 {
  ast;
  actual;
  kind;
  issue;
  /**
   * @since 3.10.0
   */
  _tag = "Transformation";
  constructor(ast, actual, kind, issue) {
    this.ast = ast;
    this.actual = actual;
    this.kind = kind;
    this.issue = issue;
  }
}
class Type2 {
  ast;
  actual;
  message;
  /**
   * @since 3.10.0
   */
  _tag = "Type";
  constructor(ast, actual, message) {
    this.ast = ast;
    this.actual = actual;
    this.message = message;
  }
}
let Forbidden$1 = class Forbidden {
  ast;
  actual;
  message;
  /**
   * @since 3.10.0
   */
  _tag = "Forbidden";
  constructor(ast, actual, message) {
    this.ast = ast;
    this.actual = actual;
    this.message = message;
  }
};
const ParseErrorTypeId = /* @__PURE__ */ Symbol.for("effect/Schema/ParseErrorTypeId");
class ParseError extends (/* @__PURE__ */ TaggedError$1("ParseError")) {
  /**
   * @since 3.10.0
   */
  [ParseErrorTypeId] = ParseErrorTypeId;
  get message() {
    return this.toString();
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return TreeFormatter.formatIssueSync(this.issue);
  }
  /**
   * @since 3.10.0
   */
  toJSON() {
    return {
      _id: "ParseError",
      message: this.toString()
    };
  }
  /**
   * @since 3.10.0
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
}
const parseError = (issue) => new ParseError({
  issue
});
const succeed = right;
const fail = left;
const isEither = isEither$1;
const flatMap = /* @__PURE__ */ dual(2, (self, f) => {
  return isEither(self) ? match$6(self, {
    onLeft: left,
    onRight: f
  }) : flatMap$1(self, f);
});
const map = /* @__PURE__ */ dual(2, (self, f) => {
  return isEither(self) ? map$8(self, f) : map$1(self, f);
});
const mapError = /* @__PURE__ */ dual(2, (self, f) => {
  return isEither(self) ? mapLeft(self, f) : mapError$1(self, f);
});
const mapBoth = /* @__PURE__ */ dual(2, (self, options) => {
  return isEither(self) ? mapBoth$3(self, {
    onLeft: options.onFailure,
    onRight: options.onSuccess
  }) : mapBoth$1(self, options);
});
const orElse = /* @__PURE__ */ dual(2, (self, f) => {
  return isEither(self) ? match$6(self, {
    onLeft: f,
    onRight: right
  }) : catchAll(self, f);
});
const mergeInternalOptions = (options, overrideOptions) => {
  if (overrideOptions === void 0 || isNumber(overrideOptions)) {
    return options;
  }
  if (options === void 0) {
    return overrideOptions;
  }
  return {
    ...options,
    ...overrideOptions
  };
};
const getEither = (ast, isDecoding, options) => {
  const parser = goMemo(ast, isDecoding);
  return (u, overrideOptions) => parser(u, mergeInternalOptions(options, overrideOptions));
};
const getSync = (ast, isDecoding, options) => {
  const parser = getEither(ast, isDecoding, options);
  return (input, overrideOptions) => getOrThrowWith$1(parser(input, overrideOptions), parseError);
};
const getEffect = (ast, isDecoding, options) => {
  const parser = goMemo(ast, isDecoding);
  return (input, overrideOptions) => parser(input, {
    ...mergeInternalOptions(options, overrideOptions),
    isEffectAllowed: true
  });
};
const decodeUnknown$1 = (schema, options) => getEffect(schema.ast, true, options);
const encodeUnknown$1 = (schema, options) => getEffect(schema.ast, false, options);
const validateSync = (schema, options) => getSync(typeAST(schema.ast), true, options);
const is = (schema, options) => {
  const parser = goMemo(typeAST(schema.ast), true);
  return (u, overrideOptions) => isRight(parser(u, {
    exact: true,
    ...mergeInternalOptions(options, overrideOptions)
  }));
};
const decodeMemoMap = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/ParseResult/decodeMemoMap"), () => /* @__PURE__ */ new WeakMap());
const encodeMemoMap = /* @__PURE__ */ globalValue(/* @__PURE__ */ Symbol.for("effect/ParseResult/encodeMemoMap"), () => /* @__PURE__ */ new WeakMap());
const goMemo = (ast, isDecoding) => {
  const memoMap = isDecoding ? decodeMemoMap : encodeMemoMap;
  const memo = memoMap.get(ast);
  if (memo) {
    return memo;
  }
  const raw = go(ast, isDecoding);
  const parseOptionsAnnotation = getParseOptionsAnnotation(ast);
  const parserWithOptions = isSome(parseOptionsAnnotation) ? (i, options) => raw(i, mergeInternalOptions(options, parseOptionsAnnotation.value)) : raw;
  const decodingFallbackAnnotation = getDecodingFallbackAnnotation(ast);
  const parser = isDecoding && isSome(decodingFallbackAnnotation) ? (i, options) => handleForbidden(orElse(parserWithOptions(i, options), decodingFallbackAnnotation.value), ast, i, options) : parserWithOptions;
  memoMap.set(ast, parser);
  return parser;
};
const getConcurrency = (ast) => getOrUndefined(getConcurrencyAnnotation(ast));
const getBatching = (ast) => getOrUndefined(getBatchingAnnotation(ast));
const go = (ast, isDecoding) => {
  switch (ast._tag) {
    case "Refinement": {
      if (isDecoding) {
        const from = goMemo(ast.from, true);
        return (i, options) => {
          options = options ?? defaultParseOption;
          const allErrors = options?.errors === "all";
          const result = flatMap(orElse(from(i, options), (ef) => {
            const issue = new Refinement2(ast, i, "From", ef);
            if (allErrors && hasStableFilter(ast) && isComposite(ef)) {
              return match$5(ast.filter(i, options, ast), {
                onNone: () => left(issue),
                onSome: (ep) => left(new Composite(ast, i, [issue, new Refinement2(ast, i, "Predicate", ep)]))
              });
            }
            return left(issue);
          }), (a) => match$5(ast.filter(a, options, ast), {
            onNone: () => right(a),
            onSome: (ep) => left(new Refinement2(ast, i, "Predicate", ep))
          }));
          return handleForbidden(result, ast, i, options);
        };
      } else {
        const from = goMemo(typeAST(ast), true);
        const to = goMemo(dropRightRefinement(ast.from), false);
        return (i, options) => handleForbidden(flatMap(from(i, options), (a) => to(a, options)), ast, i, options);
      }
    }
    case "Transformation": {
      const transform2 = getFinalTransformation(ast.transformation, isDecoding);
      const from = isDecoding ? goMemo(ast.from, true) : goMemo(ast.to, false);
      const to = isDecoding ? goMemo(ast.to, true) : goMemo(ast.from, false);
      return (i, options) => handleForbidden(flatMap(mapError(from(i, options), (e) => new Transformation2(ast, i, isDecoding ? "Encoded" : "Type", e)), (a) => flatMap(mapError(transform2(a, options ?? defaultParseOption, ast, i), (e) => new Transformation2(ast, i, "Transformation", e)), (i2) => mapError(to(i2, options), (e) => new Transformation2(ast, i, isDecoding ? "Type" : "Encoded", e)))), ast, i, options);
    }
    case "Declaration": {
      const parse = isDecoding ? ast.decodeUnknown(...ast.typeParameters) : ast.encodeUnknown(...ast.typeParameters);
      return (i, options) => handleForbidden(parse(i, options ?? defaultParseOption, ast), ast, i, options);
    }
    case "Literal":
      return fromRefinement(ast, (u) => u === ast.literal);
    case "UniqueSymbol":
      return fromRefinement(ast, (u) => u === ast.symbol);
    case "UndefinedKeyword":
      return fromRefinement(ast, isUndefined);
    case "NeverKeyword":
      return fromRefinement(ast, isNever);
    case "UnknownKeyword":
    case "AnyKeyword":
    case "VoidKeyword":
      return right;
    case "StringKeyword":
      return fromRefinement(ast, isString);
    case "NumberKeyword":
      return fromRefinement(ast, isNumber);
    case "BooleanKeyword":
      return fromRefinement(ast, isBoolean);
    case "BigIntKeyword":
      return fromRefinement(ast, isBigInt);
    case "SymbolKeyword":
      return fromRefinement(ast, isSymbol);
    case "ObjectKeyword":
      return fromRefinement(ast, isObject);
    case "Enums":
      return fromRefinement(ast, (u) => ast.enums.some(([_, value]) => value === u));
    case "TemplateLiteral": {
      const regex = getTemplateLiteralRegExp(ast);
      return fromRefinement(ast, (u) => isString(u) && regex.test(u));
    }
    case "TupleType": {
      const elements = ast.elements.map((e) => goMemo(e.type, isDecoding));
      const rest = ast.rest.map((annotatedAST) => goMemo(annotatedAST.type, isDecoding));
      let requiredTypes = ast.elements.filter((e) => !e.isOptional);
      if (ast.rest.length > 0) {
        requiredTypes = requiredTypes.concat(ast.rest.slice(1));
      }
      const requiredLen = requiredTypes.length;
      const expectedIndexes = ast.elements.length > 0 ? ast.elements.map((_, i) => i).join(" | ") : "never";
      const concurrency = getConcurrency(ast);
      const batching = getBatching(ast);
      return (input, options) => {
        if (!isArray(input)) {
          return left(new Type2(ast, input));
        }
        const allErrors = options?.errors === "all";
        const es = [];
        let stepKey = 0;
        const output = [];
        const len = input.length;
        for (let i2 = len; i2 <= requiredLen - 1; i2++) {
          const e = new Pointer(i2, input, new Missing(requiredTypes[i2 - len]));
          if (allErrors) {
            es.push([stepKey++, e]);
            continue;
          } else {
            return left(new Composite(ast, input, e, output));
          }
        }
        if (ast.rest.length === 0) {
          for (let i2 = ast.elements.length; i2 <= len - 1; i2++) {
            const e = new Pointer(i2, input, new Unexpected(input[i2], `is unexpected, expected: ${expectedIndexes}`));
            if (allErrors) {
              es.push([stepKey++, e]);
              continue;
            } else {
              return left(new Composite(ast, input, e, output));
            }
          }
        }
        let i = 0;
        let queue = void 0;
        for (; i < elements.length; i++) {
          if (len < i + 1) {
            if (ast.elements[i].isOptional) {
              continue;
            }
          } else {
            const parser = elements[i];
            const te = parser(input[i], options);
            if (isEither(te)) {
              if (isLeft(te)) {
                const e = new Pointer(i, input, te.left);
                if (allErrors) {
                  es.push([stepKey++, e]);
                  continue;
                } else {
                  return left(new Composite(ast, input, e, sortByIndex(output)));
                }
              }
              output.push([stepKey++, te.right]);
            } else {
              const nk = stepKey++;
              const index = i;
              if (!queue) {
                queue = [];
              }
              queue.push(({
                es: es2,
                output: output2
              }) => flatMap$1(either(te), (t) => {
                if (isLeft(t)) {
                  const e = new Pointer(index, input, t.left);
                  if (allErrors) {
                    es2.push([nk, e]);
                    return _void;
                  } else {
                    return left(new Composite(ast, input, e, sortByIndex(output2)));
                  }
                }
                output2.push([nk, t.right]);
                return _void;
              }));
            }
          }
        }
        if (isNonEmptyReadonlyArray(rest)) {
          const [head2, ...tail] = rest;
          for (; i < len - tail.length; i++) {
            const te = head2(input[i], options);
            if (isEither(te)) {
              if (isLeft(te)) {
                const e = new Pointer(i, input, te.left);
                if (allErrors) {
                  es.push([stepKey++, e]);
                  continue;
                } else {
                  return left(new Composite(ast, input, e, sortByIndex(output)));
                }
              } else {
                output.push([stepKey++, te.right]);
              }
            } else {
              const nk = stepKey++;
              const index = i;
              if (!queue) {
                queue = [];
              }
              queue.push(({
                es: es2,
                output: output2
              }) => flatMap$1(either(te), (t) => {
                if (isLeft(t)) {
                  const e = new Pointer(index, input, t.left);
                  if (allErrors) {
                    es2.push([nk, e]);
                    return _void;
                  } else {
                    return left(new Composite(ast, input, e, sortByIndex(output2)));
                  }
                } else {
                  output2.push([nk, t.right]);
                  return _void;
                }
              }));
            }
          }
          for (let j = 0; j < tail.length; j++) {
            i += j;
            if (len < i + 1) {
              continue;
            } else {
              const te = tail[j](input[i], options);
              if (isEither(te)) {
                if (isLeft(te)) {
                  const e = new Pointer(i, input, te.left);
                  if (allErrors) {
                    es.push([stepKey++, e]);
                    continue;
                  } else {
                    return left(new Composite(ast, input, e, sortByIndex(output)));
                  }
                }
                output.push([stepKey++, te.right]);
              } else {
                const nk = stepKey++;
                const index = i;
                if (!queue) {
                  queue = [];
                }
                queue.push(({
                  es: es2,
                  output: output2
                }) => flatMap$1(either(te), (t) => {
                  if (isLeft(t)) {
                    const e = new Pointer(index, input, t.left);
                    if (allErrors) {
                      es2.push([nk, e]);
                      return _void;
                    } else {
                      return left(new Composite(ast, input, e, sortByIndex(output2)));
                    }
                  }
                  output2.push([nk, t.right]);
                  return _void;
                }));
              }
            }
          }
        }
        const computeResult = ({
          es: es2,
          output: output2
        }) => isNonEmptyArray(es2) ? left(new Composite(ast, input, sortByIndex(es2), sortByIndex(output2))) : right(sortByIndex(output2));
        if (queue && queue.length > 0) {
          const cqueue = queue;
          return suspend(() => {
            const state = {
              es: copy$1(es),
              output: copy$1(output)
            };
            return flatMap$1(forEach(cqueue, (f) => f(state), {
              concurrency,
              batching,
              discard: true
            }), () => computeResult(state));
          });
        }
        return computeResult({
          output,
          es
        });
      };
    }
    case "TypeLiteral": {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
        return fromRefinement(ast, isNotNullable);
      }
      const propertySignatures = [];
      const expectedKeysMap = {};
      const expectedKeys = [];
      for (const ps of ast.propertySignatures) {
        propertySignatures.push([goMemo(ps.type, isDecoding), ps]);
        expectedKeysMap[ps.name] = null;
        expectedKeys.push(ps.name);
      }
      const indexSignatures = ast.indexSignatures.map((is2) => [goMemo(is2.parameter, isDecoding), goMemo(is2.type, isDecoding), is2.parameter]);
      const expectedAST = Union$1.make(ast.indexSignatures.map((is2) => is2.parameter).concat(expectedKeys.map((key) => isSymbol(key) ? new UniqueSymbol(key) : new Literal$1(key))));
      const expected = goMemo(expectedAST, isDecoding);
      const concurrency = getConcurrency(ast);
      const batching = getBatching(ast);
      return (input, options) => {
        if (!isRecord(input)) {
          return left(new Type2(ast, input));
        }
        const allErrors = options?.errors === "all";
        const es = [];
        let stepKey = 0;
        const onExcessPropertyError = options?.onExcessProperty === "error";
        const onExcessPropertyPreserve = options?.onExcessProperty === "preserve";
        const output = {};
        let inputKeys;
        if (onExcessPropertyError || onExcessPropertyPreserve) {
          inputKeys = ownKeys(input);
          for (const key of inputKeys) {
            const te = expected(key, options);
            if (isEither(te) && isLeft(te)) {
              if (onExcessPropertyError) {
                const e = new Pointer(key, input, new Unexpected(input[key], `is unexpected, expected: ${String(expectedAST)}`));
                if (allErrors) {
                  es.push([stepKey++, e]);
                  continue;
                } else {
                  return left(new Composite(ast, input, e, output));
                }
              } else {
                output[key] = input[key];
              }
            }
          }
        }
        let queue = void 0;
        const isExact = options?.exact === true;
        for (let i = 0; i < propertySignatures.length; i++) {
          const ps = propertySignatures[i][1];
          const name = ps.name;
          const hasKey = Object.prototype.hasOwnProperty.call(input, name);
          if (!hasKey) {
            if (ps.isOptional) {
              continue;
            } else if (isExact) {
              const e = new Pointer(name, input, new Missing(ps));
              if (allErrors) {
                es.push([stepKey++, e]);
                continue;
              } else {
                return left(new Composite(ast, input, e, output));
              }
            }
          }
          const parser = propertySignatures[i][0];
          const te = parser(input[name], options);
          if (isEither(te)) {
            if (isLeft(te)) {
              const e = new Pointer(name, input, hasKey ? te.left : new Missing(ps));
              if (allErrors) {
                es.push([stepKey++, e]);
                continue;
              } else {
                return left(new Composite(ast, input, e, output));
              }
            }
            output[name] = te.right;
          } else {
            const nk = stepKey++;
            const index = name;
            if (!queue) {
              queue = [];
            }
            queue.push(({
              es: es2,
              output: output2
            }) => flatMap$1(either(te), (t) => {
              if (isLeft(t)) {
                const e = new Pointer(index, input, hasKey ? t.left : new Missing(ps));
                if (allErrors) {
                  es2.push([nk, e]);
                  return _void;
                } else {
                  return left(new Composite(ast, input, e, output2));
                }
              }
              output2[index] = t.right;
              return _void;
            }));
          }
        }
        for (let i = 0; i < indexSignatures.length; i++) {
          const indexSignature = indexSignatures[i];
          const parameter = indexSignature[0];
          const type = indexSignature[1];
          const keys2 = getKeysForIndexSignature(input, indexSignature[2]);
          for (const key of keys2) {
            const keu = parameter(key, options);
            if (isEither(keu) && isRight(keu)) {
              const vpr = type(input[key], options);
              if (isEither(vpr)) {
                if (isLeft(vpr)) {
                  const e = new Pointer(key, input, vpr.left);
                  if (allErrors) {
                    es.push([stepKey++, e]);
                    continue;
                  } else {
                    return left(new Composite(ast, input, e, output));
                  }
                } else {
                  if (!Object.prototype.hasOwnProperty.call(expectedKeysMap, key)) {
                    output[key] = vpr.right;
                  }
                }
              } else {
                const nk = stepKey++;
                const index = key;
                if (!queue) {
                  queue = [];
                }
                queue.push(({
                  es: es2,
                  output: output2
                }) => flatMap$1(either(vpr), (tv) => {
                  if (isLeft(tv)) {
                    const e = new Pointer(index, input, tv.left);
                    if (allErrors) {
                      es2.push([nk, e]);
                      return _void;
                    } else {
                      return left(new Composite(ast, input, e, output2));
                    }
                  } else {
                    if (!Object.prototype.hasOwnProperty.call(expectedKeysMap, key)) {
                      output2[key] = tv.right;
                    }
                    return _void;
                  }
                }));
              }
            }
          }
        }
        const computeResult = ({
          es: es2,
          output: output2
        }) => {
          if (isNonEmptyArray(es2)) {
            return left(new Composite(ast, input, sortByIndex(es2), output2));
          }
          if (options?.propertyOrder === "original") {
            const keys2 = inputKeys || ownKeys(input);
            for (const name of expectedKeys) {
              if (keys2.indexOf(name) === -1) {
                keys2.push(name);
              }
            }
            const out = {};
            for (const key of keys2) {
              if (Object.prototype.hasOwnProperty.call(output2, key)) {
                out[key] = output2[key];
              }
            }
            return right(out);
          }
          return right(output2);
        };
        if (queue && queue.length > 0) {
          const cqueue = queue;
          return suspend(() => {
            const state = {
              es: copy$1(es),
              output: Object.assign({}, output)
            };
            return flatMap$1(forEach(cqueue, (f) => f(state), {
              concurrency,
              batching,
              discard: true
            }), () => computeResult(state));
          });
        }
        return computeResult({
          es,
          output
        });
      };
    }
    case "Union": {
      const searchTree = getSearchTree(ast.types, isDecoding);
      const ownKeys$1 = ownKeys(searchTree.keys);
      const ownKeysLen = ownKeys$1.length;
      const astTypesLen = ast.types.length;
      const map2 = /* @__PURE__ */ new Map();
      for (let i = 0; i < astTypesLen; i++) {
        map2.set(ast.types[i], goMemo(ast.types[i], isDecoding));
      }
      const concurrency = getConcurrency(ast) ?? 1;
      const batching = getBatching(ast);
      return (input, options) => {
        const es = [];
        let stepKey = 0;
        let candidates = [];
        if (ownKeysLen > 0) {
          if (isRecordOrArray(input)) {
            for (let i = 0; i < ownKeysLen; i++) {
              const name = ownKeys$1[i];
              const buckets = searchTree.keys[name].buckets;
              if (Object.prototype.hasOwnProperty.call(input, name)) {
                const literal = String(input[name]);
                if (Object.prototype.hasOwnProperty.call(buckets, literal)) {
                  candidates = candidates.concat(buckets[literal]);
                } else {
                  const {
                    candidates: candidates2,
                    literals
                  } = searchTree.keys[name];
                  const literalsUnion = Union$1.make(literals);
                  const errorAst = candidates2.length === astTypesLen ? new TypeLiteral([new PropertySignature(name, literalsUnion, false, true)], []) : Union$1.make(candidates2);
                  es.push([stepKey++, new Composite(errorAst, input, new Pointer(name, input, new Type2(literalsUnion, input[name])))]);
                }
              } else {
                const {
                  candidates: candidates2,
                  literals
                } = searchTree.keys[name];
                const fakePropertySignature = new PropertySignature(name, Union$1.make(literals), false, true);
                const errorAst = candidates2.length === astTypesLen ? new TypeLiteral([fakePropertySignature], []) : Union$1.make(candidates2);
                es.push([stepKey++, new Composite(errorAst, input, new Pointer(name, input, new Missing(fakePropertySignature)))]);
              }
            }
          } else {
            const errorAst = searchTree.candidates.length === astTypesLen ? ast : Union$1.make(searchTree.candidates);
            es.push([stepKey++, new Type2(errorAst, input)]);
          }
        }
        if (searchTree.otherwise.length > 0) {
          candidates = candidates.concat(searchTree.otherwise);
        }
        let queue = void 0;
        for (let i = 0; i < candidates.length; i++) {
          const candidate = candidates[i];
          const pr = map2.get(candidate)(input, options);
          if (isEither(pr) && (!queue || queue.length === 0)) {
            if (isRight(pr)) {
              return pr;
            } else {
              es.push([stepKey++, pr.left]);
            }
          } else {
            const nk = stepKey++;
            if (!queue) {
              queue = [];
            }
            queue.push((state) => suspend(() => {
              if ("finalResult" in state) {
                return _void;
              } else {
                return flatMap$1(either(pr), (t) => {
                  if (isRight(t)) {
                    state.finalResult = t;
                  } else {
                    state.es.push([nk, t.left]);
                  }
                  return _void;
                });
              }
            }));
          }
        }
        const computeResult = (es2) => isNonEmptyArray(es2) ? es2.length === 1 && es2[0][1]._tag === "Type" ? left(es2[0][1]) : left(new Composite(ast, input, sortByIndex(es2))) : (
          // this should never happen
          left(new Type2(ast, input))
        );
        if (queue && queue.length > 0) {
          const cqueue = queue;
          return suspend(() => {
            const state = {
              es: copy$1(es)
            };
            return flatMap$1(forEach(cqueue, (f) => f(state), {
              concurrency,
              batching,
              discard: true
            }), () => {
              if ("finalResult" in state) {
                return state.finalResult;
              }
              return computeResult(state.es);
            });
          });
        }
        return computeResult(es);
      };
    }
    case "Suspend": {
      const get2 = memoizeThunk(() => goMemo(annotations(ast.f(), ast.annotations), isDecoding));
      return (a, options) => get2()(a, options);
    }
  }
};
const fromRefinement = (ast, refinement) => (u) => refinement(u) ? right(u) : left(new Type2(ast, u));
const getLiterals = (ast, isDecoding) => {
  switch (ast._tag) {
    case "Declaration": {
      const annotation = getSurrogateAnnotation(ast);
      if (isSome(annotation)) {
        return getLiterals(annotation.value, isDecoding);
      }
      break;
    }
    case "TypeLiteral": {
      const out = [];
      for (let i = 0; i < ast.propertySignatures.length; i++) {
        const propertySignature2 = ast.propertySignatures[i];
        const type = isDecoding ? encodedAST(propertySignature2.type) : typeAST(propertySignature2.type);
        if (isLiteral(type) && !propertySignature2.isOptional) {
          out.push([propertySignature2.name, type]);
        }
      }
      return out;
    }
    case "TupleType": {
      const out = [];
      for (let i = 0; i < ast.elements.length; i++) {
        const element = ast.elements[i];
        const type = isDecoding ? encodedAST(element.type) : typeAST(element.type);
        if (isLiteral(type) && !element.isOptional) {
          out.push([i, type]);
        }
      }
      return out;
    }
    case "Refinement":
      return getLiterals(ast.from, isDecoding);
    case "Suspend":
      return getLiterals(ast.f(), isDecoding);
    case "Transformation":
      return getLiterals(isDecoding ? ast.from : ast.to, isDecoding);
  }
  return [];
};
const getSearchTree = (members, isDecoding) => {
  const keys2 = {};
  const otherwise = [];
  const candidates = [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const tags = getLiterals(member, isDecoding);
    if (tags.length > 0) {
      candidates.push(member);
      for (let j = 0; j < tags.length; j++) {
        const [key, literal] = tags[j];
        const hash2 = String(literal.literal);
        keys2[key] = keys2[key] || {
          buckets: {},
          literals: [],
          candidates: []
        };
        const buckets = keys2[key].buckets;
        if (Object.prototype.hasOwnProperty.call(buckets, hash2)) {
          if (j < tags.length - 1) {
            continue;
          }
          buckets[hash2].push(member);
          keys2[key].literals.push(literal);
          keys2[key].candidates.push(member);
        } else {
          buckets[hash2] = [member];
          keys2[key].literals.push(literal);
          keys2[key].candidates.push(member);
          break;
        }
      }
    } else {
      otherwise.push(member);
    }
  }
  return {
    keys: keys2,
    otherwise,
    candidates
  };
};
const dropRightRefinement = (ast) => isRefinement$1(ast) ? dropRightRefinement(ast.from) : ast;
const handleForbidden = (effect2, ast, actual, options) => {
  if (options?.isEffectAllowed === true) {
    return effect2;
  }
  if (isEither(effect2)) {
    return effect2;
  }
  const scheduler = new SyncScheduler();
  const fiber = runFork(effect2, {
    scheduler
  });
  scheduler.flush();
  const exit2 = fiber.unsafePoll();
  if (exit2) {
    if (isSuccess(exit2)) {
      return right(exit2.value);
    }
    const cause = exit2.cause;
    if (isFailType(cause)) {
      return left(cause.error);
    }
    return left(new Forbidden$1(ast, actual, pretty(cause)));
  }
  return left(new Forbidden$1(ast, actual, "cannot be be resolved synchronously, this is caused by using runSync on an effect that performs async work"));
};
const compare = ([a], [b]) => a > b ? 1 : a < b ? -1 : 0;
function sortByIndex(es) {
  return es.sort(compare).map((t) => t[1]);
}
const getFinalTransformation = (transformation, isDecoding) => {
  switch (transformation._tag) {
    case "FinalTransformation":
      return isDecoding ? transformation.decode : transformation.encode;
    case "ComposeTransformation":
      return right;
    case "TypeLiteralTransformation":
      return (input) => {
        let out = right(input);
        for (const pst of transformation.propertySignatureTransformations) {
          const [from, to] = isDecoding ? [pst.from, pst.to] : [pst.to, pst.from];
          const transformation2 = isDecoding ? pst.decode : pst.encode;
          const f = (input2) => {
            const o = transformation2(Object.prototype.hasOwnProperty.call(input2, from) ? some(input2[from]) : none$4());
            delete input2[from];
            if (isSome(o)) {
              input2[to] = o.value;
            }
            return input2;
          };
          out = map(out, f);
        }
        return out;
      };
  }
};
const makeTree = (value, forest = []) => ({
  value,
  forest
});
const TreeFormatter = {
  formatIssue: (issue) => map(formatTree(issue), drawTree),
  formatIssueSync: (issue) => {
    const e = TreeFormatter.formatIssue(issue);
    return isEither(e) ? getOrThrow$1(e) : runSync$1(e);
  },
  formatError: (error) => TreeFormatter.formatIssue(error.issue),
  formatErrorSync: (error) => TreeFormatter.formatIssueSync(error.issue)
};
const drawTree = (tree) => tree.value + draw("\n", tree.forest);
const draw = (indentation, forest) => {
  let r = "";
  const len = forest.length;
  let tree;
  for (let i = 0; i < len; i++) {
    tree = forest[i];
    const isLast = i === len - 1;
    r += indentation + (isLast ? "└" : "├") + "─ " + tree.value;
    r += draw(indentation + (len > 1 && !isLast ? "│  " : "   "), tree.forest);
  }
  return r;
};
const formatTransformationKind = (kind) => {
  switch (kind) {
    case "Encoded":
      return "Encoded side transformation failure";
    case "Transformation":
      return "Transformation process failure";
    case "Type":
      return "Type side transformation failure";
  }
};
const formatRefinementKind = (kind) => {
  switch (kind) {
    case "From":
      return "From side refinement failure";
    case "Predicate":
      return "Predicate refinement failure";
  }
};
const getAnnotated = (issue) => "ast" in issue ? some(issue.ast) : none$4();
const Either_void = /* @__PURE__ */ right(void 0);
const getCurrentMessage = (issue) => getAnnotated(issue).pipe(flatMap$5(getMessageAnnotation), match$5({
  onNone: () => Either_void,
  onSome: (messageAnnotation) => {
    const union2 = messageAnnotation(issue);
    if (isString(union2)) {
      return right({
        message: union2,
        override: false
      });
    }
    if (isEffect(union2)) {
      return map$1(union2, (message) => ({
        message,
        override: false
      }));
    }
    if (isString(union2.message)) {
      return right({
        message: union2.message,
        override: union2.override
      });
    }
    return map$1(union2.message, (message) => ({
      message,
      override: union2.override
    }));
  }
}));
const createParseIssueGuard = (tag) => (issue) => issue._tag === tag;
const isComposite = /* @__PURE__ */ createParseIssueGuard("Composite");
const isRefinement = /* @__PURE__ */ createParseIssueGuard("Refinement");
const isTransformation = /* @__PURE__ */ createParseIssueGuard("Transformation");
const getMessage = (issue) => flatMap(getCurrentMessage(issue), (currentMessage) => {
  if (currentMessage !== void 0) {
    const useInnerMessage = !currentMessage.override && (isComposite(issue) || isRefinement(issue) && issue.kind === "From" || isTransformation(issue) && issue.kind !== "Transformation");
    return useInnerMessage ? isTransformation(issue) || isRefinement(issue) ? getMessage(issue.issue) : Either_void : right(currentMessage.message);
  }
  return Either_void;
});
const getParseIssueTitleAnnotation = (issue) => getAnnotated(issue).pipe(flatMap$5(getParseIssueTitleAnnotation$1), flatMapNullable((annotation) => annotation(issue)), getOrUndefined);
function getRefinementExpected(ast) {
  return getDescriptionAnnotation(ast).pipe(orElse$3(() => getTitleAnnotation(ast)), orElse$3(() => getAutoTitleAnnotation(ast)), orElse$3(() => getIdentifierAnnotation(ast)), getOrElse(() => `{ ${ast.from} | filter }`));
}
function getDefaultTypeMessage(issue) {
  if (issue.message !== void 0) {
    return issue.message;
  }
  const expected = isRefinement$1(issue.ast) ? getRefinementExpected(issue.ast) : String(issue.ast);
  return `Expected ${expected}, actual ${formatUnknown(issue.actual)}`;
}
const formatTypeMessage = (issue) => map(getMessage(issue), (message) => message ?? getParseIssueTitleAnnotation(issue) ?? getDefaultTypeMessage(issue));
const getParseIssueTitle = (issue) => getParseIssueTitleAnnotation(issue) ?? String(issue.ast);
const formatForbiddenMessage = (issue) => issue.message ?? "is forbidden";
const formatUnexpectedMessage = (issue) => issue.message ?? "is unexpected";
const formatMissingMessage = (issue) => {
  const missingMessageAnnotation = getMissingMessageAnnotation(issue.ast);
  if (isSome(missingMessageAnnotation)) {
    const annotation = missingMessageAnnotation.value();
    return isString(annotation) ? right(annotation) : annotation;
  }
  return right(issue.message ?? "is missing");
};
const formatTree = (issue) => {
  switch (issue._tag) {
    case "Type":
      return map(formatTypeMessage(issue), makeTree);
    case "Forbidden":
      return right(makeTree(getParseIssueTitle(issue), [makeTree(formatForbiddenMessage(issue))]));
    case "Unexpected":
      return right(makeTree(formatUnexpectedMessage(issue)));
    case "Missing":
      return map(formatMissingMessage(issue), makeTree);
    case "Transformation":
      return flatMap(getMessage(issue), (message) => {
        if (message !== void 0) {
          return right(makeTree(message));
        }
        return map(formatTree(issue.issue), (tree) => makeTree(getParseIssueTitle(issue), [makeTree(formatTransformationKind(issue.kind), [tree])]));
      });
    case "Refinement":
      return flatMap(getMessage(issue), (message) => {
        if (message !== void 0) {
          return right(makeTree(message));
        }
        return map(formatTree(issue.issue), (tree) => makeTree(getParseIssueTitle(issue), [makeTree(formatRefinementKind(issue.kind), [tree])]));
      });
    case "Pointer":
      return map(formatTree(issue.issue), (tree) => makeTree(formatPath(issue.path), [tree]));
    case "Composite":
      return flatMap(getMessage(issue), (message) => {
        if (message !== void 0) {
          return right(makeTree(message));
        }
        const parseIssueTitle = getParseIssueTitle(issue);
        return isNonEmpty$3(issue.issues) ? map(forEach(issue.issues, formatTree), (forest) => makeTree(parseIssueTitle, forest)) : map(formatTree(issue.issues), (tree) => makeTree(parseIssueTitle, [tree]));
      });
  }
};
const pick = /* @__PURE__ */ dual((args2) => isObject(args2[0]), (s, ...keys2) => {
  const out = {};
  for (const k of keys2) {
    if (k in s) {
      out[k] = s[k];
    }
  }
  return out;
});
const omit = /* @__PURE__ */ dual((args2) => isObject(args2[0]), (s, ...keys2) => {
  const out = {
    ...s
  };
  for (const k of keys2) {
    delete out[k];
  }
  return out;
});
const TypeId = /* @__PURE__ */ Symbol.for("effect/Schema");
function make(ast) {
  return class SchemaClass {
    [TypeId] = variance;
    static ast = ast;
    static annotations(annotations2) {
      return make(mergeSchemaAnnotations(this.ast, annotations2));
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static toString() {
      return String(ast);
    }
    static Type;
    static Encoded;
    static Context;
    static [TypeId] = variance;
  };
}
const variance = {
  /* c8 ignore next */
  _A: (_) => _,
  /* c8 ignore next */
  _I: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
};
const builtInAnnotations = {
  schemaId: SchemaIdAnnotationId,
  message: MessageAnnotationId,
  missingMessage: MissingMessageAnnotationId,
  identifier: IdentifierAnnotationId,
  title: TitleAnnotationId,
  description: DescriptionAnnotationId,
  examples: ExamplesAnnotationId,
  default: DefaultAnnotationId,
  documentation: DocumentationAnnotationId,
  jsonSchema: JSONSchemaAnnotationId,
  arbitrary: ArbitraryAnnotationId,
  pretty: PrettyAnnotationId,
  equivalence: EquivalenceAnnotationId,
  concurrency: ConcurrencyAnnotationId,
  batching: BatchingAnnotationId,
  parseIssueTitle: ParseIssueTitleAnnotationId,
  parseOptions: ParseOptionsAnnotationId,
  decodingFallback: DecodingFallbackAnnotationId
};
const toASTAnnotations = (annotations2) => {
  if (!annotations2) {
    return {};
  }
  const out = {
    ...annotations2
  };
  for (const key in builtInAnnotations) {
    if (key in annotations2) {
      const id = builtInAnnotations[key];
      out[id] = annotations2[key];
      delete out[key];
    }
  }
  return out;
};
const mergeSchemaAnnotations = (ast, annotations$1) => annotations(ast, toASTAnnotations(annotations$1));
function asSchema(schema) {
  return schema;
}
const format = (schema) => String(schema.ast);
const encodedSchema = (schema) => make(encodedAST(schema.ast));
const typeSchema = (schema) => make(typeAST(schema.ast));
const encodeUnknown = (schema, options) => {
  const encodeUnknown2 = encodeUnknown$1(schema, options);
  return (u, overrideOptions) => mapError(encodeUnknown2(u, overrideOptions), parseError);
};
const encode = encodeUnknown;
const decodeUnknown = (schema, options) => {
  const decodeUnknown2 = decodeUnknown$1(schema, options);
  return (u, overrideOptions) => mapError(decodeUnknown2(u, overrideOptions), parseError);
};
const isSchema = (u) => hasProperty(u, TypeId) && isObject(u[TypeId]);
function getDefaultLiteralAST(literals) {
  return isMembers(literals) ? Union$1.make(mapMembers(literals, (literal) => new Literal$1(literal))) : new Literal$1(literals[0]);
}
function makeLiteralClass(literals, ast = getDefaultLiteralAST(literals)) {
  return class LiteralClass extends make(ast) {
    static annotations(annotations2) {
      return makeLiteralClass(this.literals, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static literals = [...literals];
  };
}
function Literal2(...literals) {
  return isNonEmptyReadonlyArray(literals) ? makeLiteralClass(literals) : Never;
}
const declareConstructor = (typeParameters, options, annotations2) => makeDeclareClass(typeParameters, new Declaration(typeParameters.map((tp) => tp.ast), (...typeParameters2) => options.decode(...typeParameters2.map(make)), (...typeParameters2) => options.encode(...typeParameters2.map(make)), toASTAnnotations(annotations2)));
const declarePrimitive = (is2, annotations2) => {
  const decodeUnknown2 = () => (input, _, ast) => is2(input) ? succeed(input) : fail(new Type2(ast, input));
  const encodeUnknown2 = decodeUnknown2;
  return makeDeclareClass([], new Declaration([], decodeUnknown2, encodeUnknown2, toASTAnnotations(annotations2)));
};
function makeDeclareClass(typeParameters, ast) {
  return class DeclareClass extends make(ast) {
    static annotations(annotations2) {
      return makeDeclareClass(this.typeParameters, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static typeParameters = [...typeParameters];
  };
}
const declare = function() {
  if (Array.isArray(arguments[0])) {
    const typeParameters = arguments[0];
    const options = arguments[1];
    const annotations3 = arguments[2];
    return declareConstructor(typeParameters, options, annotations3);
  }
  const is2 = arguments[0];
  const annotations2 = arguments[1];
  return declarePrimitive(is2, annotations2);
};
class Undefined extends (/* @__PURE__ */ make(undefinedKeyword)) {
}
class Null extends (/* @__PURE__ */ make($null)) {
}
class Never extends (/* @__PURE__ */ make(neverKeyword)) {
}
class String$ extends (/* @__PURE__ */ make(stringKeyword)) {
}
class Number$ extends (/* @__PURE__ */ make(numberKeyword)) {
}
class Boolean$ extends (/* @__PURE__ */ make(booleanKeyword)) {
}
const getDefaultUnionAST = (members) => Union$1.make(members.map((m) => m.ast));
function makeUnionClass(members, ast = getDefaultUnionAST(members)) {
  return class UnionClass extends make(ast) {
    static annotations(annotations2) {
      return makeUnionClass(this.members, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static members = [...members];
  };
}
function Union2(...members) {
  return isMembers(members) ? makeUnionClass(members) : isNonEmptyReadonlyArray(members) ? members[0] : Never;
}
const NullOr = (self) => Union2(self, Null);
const UndefinedOr = (self) => Union2(self, Undefined);
const NullishOr = (self) => Union2(self, Null, Undefined);
const getDefaultTupleTypeAST = (elements, rest) => new TupleType(elements.map((el) => isSchema(el) ? new OptionalType(el.ast, false) : el.ast), rest.map((el) => isSchema(el) ? new Type$1(el.ast) : el.ast), true);
function makeTupleTypeClass(elements, rest, ast = getDefaultTupleTypeAST(elements, rest)) {
  return class TupleTypeClass extends make(ast) {
    static annotations(annotations2) {
      return makeTupleTypeClass(this.elements, this.rest, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static elements = [...elements];
    static rest = [...rest];
  };
}
function makeArrayClass(value, ast) {
  return class ArrayClass extends makeTupleTypeClass([], [value], ast) {
    static annotations(annotations2) {
      return makeArrayClass(this.value, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static value = value;
  };
}
const Array$ = (value) => makeArrayClass(value);
const formatPropertySignatureToken = (isOptional) => isOptional ? '"?:"' : '":"';
class PropertySignatureDeclaration extends OptionalType {
  isReadonly;
  defaultValue;
  /**
   * @since 3.10.0
   */
  _tag = "PropertySignatureDeclaration";
  constructor(type, isOptional, isReadonly, annotations2, defaultValue) {
    super(type, isOptional, annotations2);
    this.isReadonly = isReadonly;
    this.defaultValue = defaultValue;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    const token = formatPropertySignatureToken(this.isOptional);
    const type = String(this.type);
    return `PropertySignature<${token}, ${type}, never, ${token}, ${type}>`;
  }
}
class FromPropertySignature extends OptionalType {
  isReadonly;
  fromKey;
  constructor(type, isOptional, isReadonly, annotations2, fromKey) {
    super(type, isOptional, annotations2);
    this.isReadonly = isReadonly;
    this.fromKey = fromKey;
  }
}
class ToPropertySignature extends OptionalType {
  isReadonly;
  defaultValue;
  constructor(type, isOptional, isReadonly, annotations2, defaultValue) {
    super(type, isOptional, annotations2);
    this.isReadonly = isReadonly;
    this.defaultValue = defaultValue;
  }
}
const formatPropertyKey = (p) => {
  if (p === void 0) {
    return "never";
  }
  if (isString(p)) {
    return JSON.stringify(p);
  }
  return String(p);
};
class PropertySignatureTransformation2 {
  from;
  to;
  decode;
  encode;
  /**
   * @since 3.10.0
   */
  _tag = "PropertySignatureTransformation";
  constructor(from, to, decode2, encode2) {
    this.from = from;
    this.to = to;
    this.decode = decode2;
    this.encode = encode2;
  }
  /**
   * @since 3.10.0
   */
  toString() {
    return `PropertySignature<${formatPropertySignatureToken(this.to.isOptional)}, ${this.to.type}, ${formatPropertyKey(this.from.fromKey)}, ${formatPropertySignatureToken(this.from.isOptional)}, ${this.from.type}>`;
  }
}
const mergeSignatureAnnotations = (ast, annotations2) => {
  switch (ast._tag) {
    case "PropertySignatureDeclaration": {
      return new PropertySignatureDeclaration(ast.type, ast.isOptional, ast.isReadonly, {
        ...ast.annotations,
        ...annotations2
      }, ast.defaultValue);
    }
    case "PropertySignatureTransformation": {
      return new PropertySignatureTransformation2(new FromPropertySignature(ast.from.type, ast.from.isOptional, ast.from.isReadonly, ast.from.annotations), new ToPropertySignature(ast.to.type, ast.to.isOptional, ast.to.isReadonly, {
        ...ast.to.annotations,
        ...annotations2
      }, ast.to.defaultValue), ast.decode, ast.encode);
    }
  }
};
const PropertySignatureTypeId = /* @__PURE__ */ Symbol.for("effect/PropertySignature");
const isPropertySignature = (u) => hasProperty(u, PropertySignatureTypeId);
class PropertySignatureImpl {
  ast;
  [TypeId];
  [PropertySignatureTypeId] = null;
  _TypeToken;
  _Key;
  _EncodedToken;
  _HasDefault;
  constructor(ast) {
    this.ast = ast;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  annotations(annotations2) {
    return new PropertySignatureImpl(mergeSignatureAnnotations(this.ast, toASTAnnotations(annotations2)));
  }
  toString() {
    return String(this.ast);
  }
}
const makePropertySignature = (ast) => new PropertySignatureImpl(ast);
class PropertySignatureWithFromImpl extends PropertySignatureImpl {
  from;
  constructor(ast, from) {
    super(ast);
    this.from = from;
  }
  annotations(annotations2) {
    return new PropertySignatureWithFromImpl(mergeSignatureAnnotations(this.ast, toASTAnnotations(annotations2)), this.from);
  }
}
const propertySignature = (self) => new PropertySignatureWithFromImpl(new PropertySignatureDeclaration(self.ast, false, true, {}, void 0), self);
const withConstructorDefault = /* @__PURE__ */ dual(2, (self, defaultValue) => {
  const ast = self.ast;
  switch (ast._tag) {
    case "PropertySignatureDeclaration":
      return makePropertySignature(new PropertySignatureDeclaration(ast.type, ast.isOptional, ast.isReadonly, ast.annotations, defaultValue));
    case "PropertySignatureTransformation":
      return makePropertySignature(new PropertySignatureTransformation2(ast.from, new ToPropertySignature(ast.to.type, ast.to.isOptional, ast.to.isReadonly, ast.to.annotations, defaultValue), ast.decode, ast.encode));
  }
});
const optionalToRequired = (from, to, options) => makePropertySignature(new PropertySignatureTransformation2(new FromPropertySignature(from.ast, true, true, {}, void 0), new ToPropertySignature(to.ast, false, true, {}, void 0), (o) => some(options.decode(o)), flatMap$5(options.encode)));
const optionalToOptional = (from, to, options) => makePropertySignature(new PropertySignatureTransformation2(new FromPropertySignature(from.ast, true, true, {}, void 0), new ToPropertySignature(to.ast, true, true, {}, void 0), options.decode, options.encode));
const optionalPropertySignatureAST = (self, options) => {
  const isExact = options?.exact;
  const defaultValue = options?.default;
  const isNullable2 = options?.nullable;
  const asOption = options?.as == "Option";
  const asOptionEncode = options?.onNoneEncoding ? orElse$3(options.onNoneEncoding) : identity;
  if (isExact) {
    if (defaultValue) {
      if (isNullable2) {
        return withConstructorDefault(optionalToRequired(NullOr(self), typeSchema(self), {
          decode: match$5({
            onNone: defaultValue,
            onSome: (a) => a === null ? defaultValue() : a
          }),
          encode: some
        }), defaultValue).ast;
      } else {
        return withConstructorDefault(optionalToRequired(self, typeSchema(self), {
          decode: match$5({
            onNone: defaultValue,
            onSome: identity
          }),
          encode: some
        }), defaultValue).ast;
      }
    } else if (asOption) {
      if (isNullable2) {
        return optionalToRequired(NullOr(self), OptionFromSelf(typeSchema(self)), {
          decode: filter(isNotNull),
          encode: asOptionEncode
        }).ast;
      } else {
        return optionalToRequired(self, OptionFromSelf(typeSchema(self)), {
          decode: identity,
          encode: identity
        }).ast;
      }
    } else {
      if (isNullable2) {
        return optionalToOptional(NullOr(self), typeSchema(self), {
          decode: filter(isNotNull),
          encode: identity
        }).ast;
      } else {
        return new PropertySignatureDeclaration(self.ast, true, true, {}, void 0);
      }
    }
  } else {
    if (defaultValue) {
      if (isNullable2) {
        return withConstructorDefault(optionalToRequired(NullishOr(self), typeSchema(self), {
          decode: match$5({
            onNone: defaultValue,
            onSome: (a) => a == null ? defaultValue() : a
          }),
          encode: some
        }), defaultValue).ast;
      } else {
        return withConstructorDefault(optionalToRequired(UndefinedOr(self), typeSchema(self), {
          decode: match$5({
            onNone: defaultValue,
            onSome: (a) => a === void 0 ? defaultValue() : a
          }),
          encode: some
        }), defaultValue).ast;
      }
    } else if (asOption) {
      if (isNullable2) {
        return optionalToRequired(NullishOr(self), OptionFromSelf(typeSchema(self)), {
          decode: filter((a) => a != null),
          encode: asOptionEncode
        }).ast;
      } else {
        return optionalToRequired(UndefinedOr(self), OptionFromSelf(typeSchema(self)), {
          decode: filter(isNotUndefined),
          encode: asOptionEncode
        }).ast;
      }
    } else {
      if (isNullable2) {
        return optionalToOptional(NullishOr(self), UndefinedOr(typeSchema(self)), {
          decode: filter(isNotNull),
          encode: identity
        }).ast;
      } else {
        return new PropertySignatureDeclaration(UndefinedOr(self).ast, true, true, {}, void 0);
      }
    }
  }
};
const optional$2 = (self) => {
  const ast = self.ast === undefinedKeyword || self.ast === neverKeyword ? undefinedKeyword : UndefinedOr(self).ast;
  return new PropertySignatureWithFromImpl(new PropertySignatureDeclaration(ast, true, true, {}, void 0), self);
};
const optionalWith = /* @__PURE__ */ dual((args2) => isSchema(args2[0]), (self, options) => {
  return new PropertySignatureWithFromImpl(optionalPropertySignatureAST(self, options), self);
});
const preserveMissingMessageAnnotation = /* @__PURE__ */ pickAnnotations([MissingMessageAnnotationId]);
const getDefaultTypeLiteralAST = (fields, records) => {
  const ownKeys$1 = ownKeys(fields);
  const pss = [];
  if (ownKeys$1.length > 0) {
    const from = [];
    const to = [];
    const transformations = [];
    for (let i = 0; i < ownKeys$1.length; i++) {
      const key = ownKeys$1[i];
      const field = fields[key];
      if (isPropertySignature(field)) {
        const ast = field.ast;
        switch (ast._tag) {
          case "PropertySignatureDeclaration": {
            const type = ast.type;
            const isOptional = ast.isOptional;
            const toAnnotations = ast.annotations;
            from.push(new PropertySignature(key, type, isOptional, true, preserveMissingMessageAnnotation(ast)));
            to.push(new PropertySignature(key, typeAST(type), isOptional, true, toAnnotations));
            pss.push(new PropertySignature(key, type, isOptional, true, toAnnotations));
            break;
          }
          case "PropertySignatureTransformation": {
            const fromKey = ast.from.fromKey ?? key;
            from.push(new PropertySignature(fromKey, ast.from.type, ast.from.isOptional, true, ast.from.annotations));
            to.push(new PropertySignature(key, ast.to.type, ast.to.isOptional, true, ast.to.annotations));
            transformations.push(new PropertySignatureTransformation$1(fromKey, key, ast.decode, ast.encode));
            break;
          }
        }
      } else {
        from.push(new PropertySignature(key, field.ast, false, true));
        to.push(new PropertySignature(key, typeAST(field.ast), false, true));
        pss.push(new PropertySignature(key, field.ast, false, true));
      }
    }
    if (isNonEmptyReadonlyArray(transformations)) {
      const issFrom = [];
      const issTo = [];
      for (const r of records) {
        const {
          indexSignatures,
          propertySignatures
        } = record(r.key.ast, r.value.ast);
        propertySignatures.forEach((ps) => {
          from.push(ps);
          to.push(new PropertySignature(ps.name, typeAST(ps.type), ps.isOptional, ps.isReadonly, ps.annotations));
        });
        indexSignatures.forEach((is2) => {
          issFrom.push(is2);
          issTo.push(new IndexSignature(is2.parameter, typeAST(is2.type), is2.isReadonly));
        });
      }
      return new Transformation$1(new TypeLiteral(from, issFrom, {
        [AutoTitleAnnotationId]: "Struct (Encoded side)"
      }), new TypeLiteral(to, issTo, {
        [AutoTitleAnnotationId]: "Struct (Type side)"
      }), new TypeLiteralTransformation(transformations));
    }
  }
  const iss = [];
  for (const r of records) {
    const {
      indexSignatures,
      propertySignatures
    } = record(r.key.ast, r.value.ast);
    propertySignatures.forEach((ps) => pss.push(ps));
    indexSignatures.forEach((is2) => iss.push(is2));
  }
  return new TypeLiteral(pss, iss);
};
const lazilyMergeDefaults = (fields, out) => {
  const ownKeys$1 = ownKeys(fields);
  for (const key of ownKeys$1) {
    const field = fields[key];
    if (out[key] === void 0 && isPropertySignature(field)) {
      const ast = field.ast;
      const defaultValue = ast._tag === "PropertySignatureDeclaration" ? ast.defaultValue : ast.to.defaultValue;
      if (defaultValue !== void 0) {
        out[key] = defaultValue();
      }
    }
  }
  return out;
};
function makeTypeLiteralClass(fields, records, ast = getDefaultTypeLiteralAST(fields, records)) {
  return class TypeLiteralClass extends make(ast) {
    static annotations(annotations2) {
      return makeTypeLiteralClass(this.fields, this.records, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static fields = {
      ...fields
    };
    static records = [...records];
    static make = (props, options) => {
      const propsWithDefaults = lazilyMergeDefaults(fields, {
        ...props
      });
      return getDisableValidationMakeOption(options) ? propsWithDefaults : validateSync(this)(propsWithDefaults);
    };
    static pick(...keys2) {
      return Struct(pick(fields, ...keys2));
    }
    static omit(...keys2) {
      return Struct(omit(fields, ...keys2));
    }
  };
}
function Struct(fields, ...records) {
  return makeTypeLiteralClass(fields, records);
}
const mutable = (schema) => make(mutable$1(schema.ast));
const intersectTypeLiterals = (x, y, path) => {
  if (isTypeLiteral(x) && isTypeLiteral(y)) {
    const propertySignatures = [...x.propertySignatures];
    for (const ps of y.propertySignatures) {
      const name = ps.name;
      const i = propertySignatures.findIndex((ps2) => ps2.name === name);
      if (i === -1) {
        propertySignatures.push(ps);
      } else {
        const {
          isOptional,
          type
        } = propertySignatures[i];
        propertySignatures[i] = new PropertySignature(name, extendAST(type, ps.type, path.concat(name)), isOptional, true);
      }
    }
    return new TypeLiteral(propertySignatures, x.indexSignatures.concat(y.indexSignatures));
  }
  throw new Error(getSchemaExtendErrorMessage(x, y, path));
};
const preserveRefinementAnnotations = /* @__PURE__ */ omitAnnotations([IdentifierAnnotationId]);
const addRefinementToMembers = (refinement, asts) => asts.map((ast) => new Refinement$1(ast, refinement.filter, preserveRefinementAnnotations(refinement)));
const extendAST = (x, y, path) => Union$1.make(intersectUnionMembers([x], [y], path));
const getTypes = (ast) => isUnion(ast) ? ast.types : [ast];
const intersectUnionMembers = (xs, ys, path) => flatMap$4(xs, (x) => flatMap$4(ys, (y) => {
  switch (y._tag) {
    case "Literal": {
      if (isString(y.literal) && isStringKeyword(x) || isNumber(y.literal) && isNumberKeyword(x) || isBoolean(y.literal) && isBooleanKeyword(x)) {
        return [y];
      }
      break;
    }
    case "StringKeyword": {
      if (y === stringKeyword) {
        if (isStringKeyword(x) || isLiteral(x) && isString(x.literal)) {
          return [x];
        } else if (isRefinement$1(x)) {
          return addRefinementToMembers(x, intersectUnionMembers(getTypes(x.from), [y], path));
        }
      } else if (x === stringKeyword) {
        return [y];
      }
      break;
    }
    case "NumberKeyword": {
      if (y === numberKeyword) {
        if (isNumberKeyword(x) || isLiteral(x) && isNumber(x.literal)) {
          return [x];
        } else if (isRefinement$1(x)) {
          return addRefinementToMembers(x, intersectUnionMembers(getTypes(x.from), [y], path));
        }
      } else if (x === numberKeyword) {
        return [y];
      }
      break;
    }
    case "BooleanKeyword": {
      if (y === booleanKeyword) {
        if (isBooleanKeyword(x) || isLiteral(x) && isBoolean(x.literal)) {
          return [x];
        } else if (isRefinement$1(x)) {
          return addRefinementToMembers(x, intersectUnionMembers(getTypes(x.from), [y], path));
        }
      } else if (x === booleanKeyword) {
        return [y];
      }
      break;
    }
    case "Union":
      return intersectUnionMembers(getTypes(x), y.types, path);
    case "Suspend":
      return [new Suspend(() => extendAST(x, y.f(), path))];
    case "Refinement":
      return addRefinementToMembers(y, intersectUnionMembers(getTypes(x), getTypes(y.from), path));
    case "TypeLiteral": {
      switch (x._tag) {
        case "Union":
          return intersectUnionMembers(x.types, [y], path);
        case "Suspend":
          return [new Suspend(() => extendAST(x.f(), y, path))];
        case "Refinement":
          return addRefinementToMembers(x, intersectUnionMembers(getTypes(x.from), [y], path));
        case "TypeLiteral":
          return [intersectTypeLiterals(x, y, path)];
        case "Transformation": {
          const transformation = x.transformation;
          const from = intersectTypeLiterals(x.from, y, path);
          const to = intersectTypeLiterals(x.to, typeAST(y), path);
          switch (transformation._tag) {
            case "TypeLiteralTransformation":
              return [new Transformation$1(from, to, new TypeLiteralTransformation(transformation.propertySignatureTransformations))];
            case "ComposeTransformation":
              return [new Transformation$1(from, to, composeTransformation)];
            case "FinalTransformation":
              return [new Transformation$1(from, to, new FinalTransformation((fromA, options, ast, fromI) => map(transformation.decode(fromA, options, ast, fromI), (partial) => ({
                ...fromA,
                ...partial
              })), (toI, options, ast, toA) => map(transformation.encode(toI, options, ast, toA), (partial) => ({
                ...toI,
                ...partial
              }))))];
          }
        }
      }
      break;
    }
    case "Transformation": {
      if (isTransformation$1(x)) {
        if (isTypeLiteralTransformation(y.transformation) && isTypeLiteralTransformation(x.transformation)) {
          return [new Transformation$1(intersectTypeLiterals(x.from, y.from, path), intersectTypeLiterals(x.to, y.to, path), new TypeLiteralTransformation(y.transformation.propertySignatureTransformations.concat(x.transformation.propertySignatureTransformations)))];
        }
      } else {
        return intersectUnionMembers([y], [x], path);
      }
      break;
    }
  }
  throw new Error(getSchemaExtendErrorMessage(x, y, path));
}));
const extend = /* @__PURE__ */ dual(2, (self, that) => make(extendAST(self.ast, that.ast, [])));
const RefineSchemaId = /* @__PURE__ */ Symbol.for("effect/SchemaId/Refine");
function makeTransformationClass(from, to, ast) {
  return class TransformationClass extends make(ast) {
    static annotations(annotations2) {
      return makeTransformationClass(this.from, this.to, mergeSchemaAnnotations(this.ast, annotations2));
    }
    static from = from;
    static to = to;
  };
}
const transformOrFail = /* @__PURE__ */ dual((args2) => isSchema(args2[0]) && isSchema(args2[1]), (from, to, options) => makeTransformationClass(from, to, new Transformation$1(from.ast, to.ast, new FinalTransformation(options.decode, options.encode))));
const transform = /* @__PURE__ */ dual((args2) => isSchema(args2[0]) && isSchema(args2[1]), (from, to, options) => transformOrFail(from, to, {
  strict: true,
  decode: (fromA, _options, _ast, toA) => succeed(options.decode(fromA, toA)),
  encode: (toI, _options, _ast, toA) => succeed(options.encode(toI, toA))
}));
const toComposite = (eff, onSuccess, ast, actual) => mapBoth(eff, {
  onFailure: (e) => new Composite(ast, actual, e),
  onSuccess
});
const DateFromSelfSchemaId = DateFromSelfSchemaId$1;
class DateFromSelf extends (/* @__PURE__ */ declare(isDate, {
  identifier: "DateFromSelf",
  schemaId: DateFromSelfSchemaId,
  [DateFromSelfSchemaId]: {
    noInvalidDate: false
  },
  description: "a potentially invalid Date instance",
  pretty: () => (date) => `new Date(${JSON.stringify(date)})`,
  arbitrary: () => (fc) => fc.date({
    noInvalidDate: false
  }),
  equivalence: () => Date$1
})) {
}
const optionDecode = (input) => input._tag === "None" ? none$4() : some(input.value);
const optionArbitrary = (value, ctx) => (fc) => fc.oneof(ctx, fc.record({
  _tag: fc.constant("None")
}), fc.record({
  _tag: fc.constant("Some"),
  value: value(fc)
})).map(optionDecode);
const optionPretty = (value) => match$5({
  onNone: () => "none()",
  onSome: (a) => `some(${value(a)})`
});
const optionParse = (decodeUnknown2) => (u, options, ast) => isOption(u) ? isNone(u) ? succeed(none$4()) : toComposite(decodeUnknown2(u.value, options), some, ast, u) : fail(new Type2(ast, u));
const OptionFromSelf = (value) => {
  return declare([value], {
    decode: (value2) => optionParse(decodeUnknown$1(value2)),
    encode: (value2) => optionParse(encodeUnknown$1(value2))
  }, {
    description: `Option<${format(value)}>`,
    pretty: optionPretty,
    arbitrary: optionArbitrary,
    equivalence: getEquivalence$3
  });
};
function OptionFromUndefinedOr(value) {
  return transform(UndefinedOr(value), OptionFromSelf(typeSchema(asSchema(value))), {
    strict: true,
    decode: (i) => fromNullable(i),
    encode: (a) => getOrUndefined(a)
  });
}
const isField = (u) => isSchema(u) || isPropertySignature(u);
const isFields = (fields) => ownKeys(fields).every((key) => isField(fields[key]));
const getFields = (hasFields) => "fields" in hasFields ? hasFields.fields : getFields(hasFields[RefineSchemaId]);
const getSchemaFromFieldsOr = (fieldsOr) => isFields(fieldsOr) ? Struct(fieldsOr) : isSchema(fieldsOr) ? fieldsOr : Struct(getFields(fieldsOr));
const getFieldsFromFieldsOr = (fieldsOr) => isFields(fieldsOr) ? fieldsOr : getFields(fieldsOr);
const Class2 = (identifier2) => (fieldsOr, annotations2) => makeClass({
  kind: "Class",
  identifier: identifier2,
  schema: getSchemaFromFieldsOr(fieldsOr),
  fields: getFieldsFromFieldsOr(fieldsOr),
  Base: Class$1,
  annotations: annotations2
});
const getClassTag = (tag) => withConstructorDefault(propertySignature(Literal2(tag)), () => tag);
const TaggedError = (identifier2) => (tag, fieldsOr, annotations2) => {
  class Base2 extends Error$1 {
  }
  Base2.prototype.name = tag;
  const fields = getFieldsFromFieldsOr(fieldsOr);
  const schema = getSchemaFromFieldsOr(fieldsOr);
  const newFields = {
    _tag: getClassTag(tag)
  };
  const taggedFields = extendFields(newFields, fields);
  return class TaggedErrorClass extends makeClass({
    kind: "TaggedError",
    identifier: tag,
    schema: extend(schema, Struct(newFields)),
    fields: taggedFields,
    Base: Base2,
    annotations: annotations2,
    disableToString: true
  }) {
    static _tag = tag;
    get message() {
      return `{ ${ownKeys(fields).map((p) => `${formatPropertyKey$1(p)}: ${formatUnknown(this[p])}`).join(", ")} }`;
    }
  };
};
const extendFields = (a, b) => {
  const out = {
    ...a
  };
  for (const key of ownKeys(b)) {
    if (key in a) {
      throw new Error(getASTDuplicatePropertySignatureErrorMessage(key));
    }
    out[key] = b[key];
  }
  return out;
};
function getDisableValidationMakeOption(options) {
  return isBoolean(options) ? options : options?.disableValidation ?? false;
}
const astCache = /* @__PURE__ */ globalValue("effect/Schema/astCache", () => /* @__PURE__ */ new WeakMap());
const getClassAnnotations = (annotations2) => {
  if (annotations2 === void 0) {
    return [];
  } else if (Array.isArray(annotations2)) {
    return annotations2;
  } else {
    return [annotations2];
  }
};
const makeClass = ({
  Base: Base2,
  annotations: annotations2,
  disableToString,
  fields,
  identifier: identifier2,
  kind,
  schema
}) => {
  const classSymbol = Symbol.for(`effect/Schema/${kind}/${identifier2}`);
  const [typeAnnotations, transformationAnnotations, encodedAnnotations] = getClassAnnotations(annotations2);
  const typeSchema_ = typeSchema(schema);
  const declarationSurrogate = typeSchema_.annotations({
    identifier: identifier2,
    ...typeAnnotations
  });
  const typeSide = typeSchema_.annotations({
    [AutoTitleAnnotationId]: `${identifier2} (Type side)`,
    ...typeAnnotations
  });
  const constructorSchema = schema.annotations({
    [AutoTitleAnnotationId]: `${identifier2} (Constructor)`,
    ...typeAnnotations
  });
  const encodedSide = schema.annotations({
    [AutoTitleAnnotationId]: `${identifier2} (Encoded side)`,
    ...encodedAnnotations
  });
  const transformationSurrogate = schema.annotations({
    [JSONIdentifierAnnotationId]: identifier2,
    ...encodedAnnotations,
    ...typeAnnotations,
    ...transformationAnnotations
  });
  const fallbackInstanceOf = (u) => hasProperty(u, classSymbol) && is(typeSide)(u);
  const klass = class extends Base2 {
    constructor(props = {}, options = false) {
      props = {
        ...props
      };
      if (kind !== "Class") {
        delete props["_tag"];
      }
      props = lazilyMergeDefaults(fields, props);
      if (!getDisableValidationMakeOption(options)) {
        props = validateSync(constructorSchema)(props);
      }
      super(props, true);
    }
    // ----------------
    // Schema interface
    // ----------------
    static [TypeId] = variance;
    static get ast() {
      let out = astCache.get(this);
      if (out) {
        return out;
      }
      const declaration = declare([schema], {
        decode: () => (input, _, ast) => input instanceof this || fallbackInstanceOf(input) ? succeed(input) : fail(new Type2(ast, input)),
        encode: () => (input, options) => input instanceof this ? succeed(input) : map(encodeUnknown$1(typeSide)(input, options), (props) => new this(props, true))
      }, {
        identifier: identifier2,
        pretty: (pretty2) => (self) => `${identifier2}(${pretty2(self)})`,
        // @ts-expect-error
        arbitrary: (arb) => (fc) => arb(fc).map((props) => new this(props)),
        equivalence: identity,
        [SurrogateAnnotationId]: declarationSurrogate.ast,
        ...typeAnnotations
      });
      out = transform(encodedSide, declaration, {
        strict: true,
        decode: (i) => new this(i, true),
        encode: identity
      }).annotations({
        [SurrogateAnnotationId]: transformationSurrogate.ast,
        ...transformationAnnotations
      }).ast;
      astCache.set(this, out);
      return out;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static annotations(annotations3) {
      return make(this.ast).annotations(annotations3);
    }
    static toString() {
      return `(${String(encodedSide)} <-> ${identifier2})`;
    }
    // ----------------
    // Class interface
    // ----------------
    static make(...args2) {
      return new this(...args2);
    }
    static fields = {
      ...fields
    };
    static identifier = identifier2;
    static extend(identifier3) {
      return (newFieldsOr, annotations3) => {
        const newFields = getFieldsFromFieldsOr(newFieldsOr);
        const newSchema = getSchemaFromFieldsOr(newFieldsOr);
        const extendedFields = extendFields(fields, newFields);
        return makeClass({
          kind,
          identifier: identifier3,
          schema: extend(schema, newSchema),
          fields: extendedFields,
          Base: this,
          annotations: annotations3
        });
      };
    }
    static transformOrFail(identifier3) {
      return (newFieldsOr, options, annotations3) => {
        const transformedFields = extendFields(fields, newFieldsOr);
        return makeClass({
          kind,
          identifier: identifier3,
          schema: transformOrFail(schema, typeSchema(Struct(transformedFields)), options),
          fields: transformedFields,
          Base: this,
          annotations: annotations3
        });
      };
    }
    static transformOrFailFrom(identifier3) {
      return (newFields, options, annotations3) => {
        const transformedFields = extendFields(fields, newFields);
        return makeClass({
          kind,
          identifier: identifier3,
          schema: transformOrFail(encodedSchema(schema), Struct(transformedFields), options),
          fields: transformedFields,
          Base: this,
          annotations: annotations3
        });
      };
    }
    // ----------------
    // other
    // ----------------
    get [classSymbol]() {
      return classSymbol;
    }
  };
  if (disableToString !== true) {
    Object.defineProperty(klass.prototype, "toString", {
      value() {
        return `${identifier2}({ ${ownKeys(fields).map((p) => `${formatPropertyKey$1(p)}: ${formatUnknown(this[p])}`).join(", ")} })`;
      },
      configurable: true,
      writable: true
    });
  }
  return klass;
};
const ErrorCode = {
  NotSupported: "NotSupported",
  BadRequest: "BadRequest",
  Duplicate: "Duplicate",
  Forbidden: "Forbidden",
  InternalBrowserError: "InternalBrowserError",
  InternalServerError: "InternalServerError",
  NetworkError: "NetworkError",
  NotFound: "NotFound",
  Disabled: "Disabled",
  Unauthorized: "Unauthorized"
};
class NotSupported extends TaggedError$1(ErrorCode.NotSupported) {
}
class InternalBrowserError extends TaggedError()(ErrorCode.InternalBrowserError, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class BadRequest extends TaggedError()(ErrorCode.BadRequest, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class Duplicate extends TaggedError()(ErrorCode.Duplicate, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class NotFound extends TaggedError()(ErrorCode.NotFound, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class Disabled extends TaggedError()(ErrorCode.Disabled, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class Unauthorized extends TaggedError()(ErrorCode.Unauthorized, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class Forbidden2 extends TaggedError()(ErrorCode.Forbidden, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class NetworkError extends TaggedError()(ErrorCode.NetworkError, {
  message: String$,
  detail: optional$2(String$)
}) {
}
class InternalServerError extends TaggedError()(ErrorCode.InternalServerError, {
  message: String$,
  detail: optional$2(String$)
}) {
  toString() {
    return this.detail ? `${this.name} - ${this.message} (${this.detail})` : `${this.name} - ${this.message}`;
  }
}
const optional$1 = (s) => optionalWith(s, { exact: true });
class ParsingError extends TaggedError()("ParsingError", {
  message: String$,
  detail: String$
}) {
}
const AuthenticatorType = Literal2("email", "apple", "google", "passkey");
Struct({
  id: String$,
  givenName: String$,
  familyName: String$,
  email: String$,
  emailVerified: Boolean$
});
Struct({
  requiredAuthType: AuthenticatorType
});
const DateFromSeconds = transform(Number$, DateFromSelf, {
  encode: (date) => Math.round(date.getTime() / 1e3),
  decode: (dateNum) => new Date(dateNum * 1e3)
});
const BasePrincipal = Struct({
  // jwt stuff
  iss: String$,
  aud: String$,
  sub: String$,
  iat: DateFromSeconds,
  nbf: DateFromSeconds,
  exp: DateFromSeconds,
  jti: String$,
  // custom
  token: String$,
  userId: String$,
  userVerified: Boolean$,
  authenticatorType: AuthenticatorType,
  authenticatorId: String$
});
const Principal = Struct({
  ...BasePrincipal.fields,
  givenName: optional$1(String$),
  familyName: optional$1(String$),
  email: optional$1(String$),
  emailVerified: optional$1(Boolean$)
});
const UserPrincipal = Struct({
  ...BasePrincipal.fields,
  givenName: String$,
  familyName: String$,
  email: String$,
  emailVerified: Boolean$
});
const decodePrincipal = decodeUnknown(Union2(Principal, UserPrincipal));
const isPrincipal = is(Principal);
const isUserPrincipal = is(UserPrincipal);
function base64urlToBuffer(baseurl64String) {
  const padding = "==".slice(0, (4 - baseurl64String.length % 4) % 4);
  const base64String = baseurl64String.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const str = atob(base64String);
  const buffer = new ArrayBuffer(str.length);
  const byteView = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    byteView[i] = str.charCodeAt(i);
  }
  return buffer;
}
function bufferToBase64url(buffer) {
  const byteView = new Uint8Array(buffer);
  let str = "";
  for (const charCode of byteView) {
    str += String.fromCharCode(charCode);
  }
  const base64String = btoa(str);
  const base64urlString = base64String.replace(/\+/g, "-").replace(
    /\//g,
    "_"
  ).replace(/=/g, "");
  return base64urlString;
}
var copyValue = "copy";
var convertValue = "convert";
function convert(conversionFn, schema, input) {
  if (schema === copyValue) {
    return input;
  }
  if (schema === convertValue) {
    return conversionFn(input);
  }
  if (schema instanceof Array) {
    return input.map((v) => convert(conversionFn, schema[0], v));
  }
  if (schema instanceof Object) {
    const output = {};
    for (const [key, schemaField] of Object.entries(schema)) {
      if (schemaField.derive) {
        const v = schemaField.derive(input);
        if (v !== void 0) {
          input[key] = v;
        }
      }
      if (!(key in input)) {
        if (schemaField.required) {
          throw new Error(`Missing key: ${key}`);
        }
        continue;
      }
      if (input[key] == null) {
        output[key] = null;
        continue;
      }
      output[key] = convert(
        conversionFn,
        schemaField.schema,
        input[key]
      );
    }
    return output;
  }
}
function derived(schema, derive) {
  return {
    required: true,
    schema,
    derive
  };
}
function required(schema) {
  return {
    required: true,
    schema
  };
}
function optional(schema) {
  return {
    required: false,
    schema
  };
}
var publicKeyCredentialDescriptorSchema = {
  type: required(copyValue),
  id: required(convertValue),
  transports: optional(copyValue)
};
var simplifiedExtensionsSchema = {
  appid: optional(copyValue),
  appidExclude: optional(copyValue),
  credProps: optional(copyValue)
};
var simplifiedClientExtensionResultsSchema = {
  appid: optional(copyValue),
  appidExclude: optional(copyValue),
  credProps: optional(copyValue)
};
var credentialCreationOptions = {
  publicKey: required({
    rp: required(copyValue),
    user: required({
      id: required(convertValue),
      name: required(copyValue),
      displayName: required(copyValue)
    }),
    challenge: required(convertValue),
    pubKeyCredParams: required(copyValue),
    timeout: optional(copyValue),
    excludeCredentials: optional([publicKeyCredentialDescriptorSchema]),
    authenticatorSelection: optional(copyValue),
    attestation: optional(copyValue),
    extensions: optional(simplifiedExtensionsSchema)
  }),
  signal: optional(copyValue)
};
var publicKeyCredentialWithAttestation = {
  type: required(copyValue),
  id: required(copyValue),
  rawId: required(convertValue),
  authenticatorAttachment: optional(copyValue),
  response: required({
    clientDataJSON: required(convertValue),
    attestationObject: required(convertValue),
    transports: derived(
      copyValue,
      (response) => {
        var _a;
        return ((_a = response.getTransports) == null ? void 0 : _a.call(response)) || [];
      }
    )
  }),
  clientExtensionResults: derived(
    simplifiedClientExtensionResultsSchema,
    (pkc) => pkc.getClientExtensionResults()
  )
};
var credentialRequestOptions = {
  mediation: optional(copyValue),
  publicKey: required({
    challenge: required(convertValue),
    timeout: optional(copyValue),
    rpId: optional(copyValue),
    allowCredentials: optional([publicKeyCredentialDescriptorSchema]),
    userVerification: optional(copyValue),
    extensions: optional(simplifiedExtensionsSchema)
  }),
  signal: optional(copyValue)
};
var publicKeyCredentialWithAssertion = {
  type: required(copyValue),
  id: required(copyValue),
  rawId: required(convertValue),
  authenticatorAttachment: optional(copyValue),
  response: required({
    clientDataJSON: required(convertValue),
    authenticatorData: required(convertValue),
    signature: required(convertValue),
    userHandle: required(convertValue)
  }),
  clientExtensionResults: derived(
    simplifiedClientExtensionResultsSchema,
    (pkc) => pkc.getClientExtensionResults()
  )
};
function createRequestFromJSON(requestJSON) {
  return convert(base64urlToBuffer, credentialCreationOptions, requestJSON);
}
function createResponseToJSON(credential) {
  return convert(
    bufferToBase64url,
    publicKeyCredentialWithAttestation,
    credential
  );
}
function getRequestFromJSON(requestJSON) {
  return convert(base64urlToBuffer, credentialRequestOptions, requestJSON);
}
function getResponseToJSON(credential) {
  return convert(
    bufferToBase64url,
    publicKeyCredentialWithAssertion,
    credential
  );
}
async function create(options) {
  const response = await navigator.credentials.create(
    options
  );
  response.toJSON = () => createResponseToJSON(response);
  return response;
}
async function get(options) {
  const response = await navigator.credentials.get(
    options
  );
  response.toJSON = () => getResponseToJSON(response);
  return response;
}
const PublicKey = Literal2("public-key");
const PubKeyCredParams = Struct({
  alg: Number$,
  type: PublicKey
});
const AuthenticatorAttachment = Union2(Literal2("cross-platform"), Literal2("platform"));
const base64url = String$;
const Transport = Union2(Literal2("ble"), Literal2("hybrid"), Literal2("internal"), Literal2("nfc"), Literal2("usb"));
const Credential = Struct({
  id: base64url,
  type: PublicKey,
  transports: optional$1(mutable(Array$(Transport)))
});
const UserVerification = Union2(Literal2("discouraged"), Literal2("preferred"), Literal2("required"));
const ResidentKey = Union2(Literal2("discouraged"), Literal2("preferred"), Literal2("required"));
const AuthenticatorSelection = Struct({
  authenticatorAttachment: optional$1(AuthenticatorAttachment),
  requireResidentKey: optional$1(Boolean$),
  residentKey: optional$1(ResidentKey),
  userVerification: optional$1(UserVerification)
});
const RegistrationOptions = Struct({
  rp: Struct({
    name: String$,
    id: optional$1(base64url)
  }),
  user: Struct({
    id: base64url,
    name: String$,
    displayName: String$
  }),
  challenge: base64url,
  pubKeyCredParams: mutable(Array$(PubKeyCredParams)),
  timeout: optional$1(Number$),
  excludeCredentials: optional$1(mutable(Array$(Credential))),
  authenticatorSelection: optional$1(AuthenticatorSelection),
  attestation: optional$1(Union2(Literal2("direct"), Literal2("enterprise"), Literal2("indirect"), Literal2("none"))),
  extensions: optional$1(Struct({
    appid: optional$1(String$),
    appidExclude: optional$1(String$),
    credProps: optional$1(Boolean$)
  }))
});
const RegistrationCredential = Struct({
  id: String$,
  type: PublicKey,
  rawId: String$,
  authenticatorAttachment: optional$2(NullishOr(AuthenticatorAttachment)),
  response: Struct({
    clientDataJSON: String$,
    attestationObject: String$,
    transports: mutable(Array$(Transport))
  }),
  clientExtensionResults: Struct({
    appid: optional$2(Boolean$),
    appidExclude: optional$2(Boolean$),
    credProps: optional$2(Struct({ rk: Boolean$ }))
  })
});
const AuthenticationOptions = Struct({
  challenge: String$,
  timeout: optional$1(Number$),
  rpId: optional$1(String$),
  allowCredentials: optional$1(mutable(Array$(Credential))),
  userVerification: optional$1(UserVerification),
  extensions: optional$1(Struct({
    appid: optional$1(String$),
    credProps: optional$1(Boolean$),
    hmacCreateSecret: optional$1(Boolean$)
  }))
});
const AuthenticationCredential = Struct({
  id: String$,
  type: PublicKey,
  rawId: String$,
  authenticatorAttachment: optional$2(NullishOr(String$)),
  response: Struct({
    clientDataJSON: String$,
    authenticatorData: String$,
    signature: String$,
    userHandle: NullishOr(String$)
  }),
  clientExtensionResults: Struct({
    appid: optional$2(Boolean$),
    appidExclude: optional$2(Boolean$),
    credProps: optional$2(Struct({
      rk: Boolean$
    }))
  })
});
let OptionsRequest$1 = class OptionsRequest extends Class2(`@passkey/authentication/options/request`)({
  email: OptionFromUndefinedOr(String$),
  userVerification: OptionFromUndefinedOr(UserVerification)
}) {
};
let OptionsResponse$1 = class OptionsResponse extends Class2("@passkey/authentication/options/response")({
  session: String$,
  publicKey: AuthenticationOptions
}) {
};
const OptionsErrors$1 = Union2(BadRequest, NotFound);
let VerificationRequest$1 = class VerificationRequest extends Class2("@passkey/authentication/verification/request")({
  session: String$,
  credential: AuthenticationCredential
}) {
};
let VerificationResponse$1 = class VerificationResponse extends Class2("@passkey/authentication/verification/response")({
  principal: Principal
}) {
};
const VerificationErrors$1 = Union2(BadRequest, Unauthorized, Forbidden2, Disabled);
const OPTIONS_ENDPOINT$1 = "/passkey/authentication/options";
const VERIFICATION_ENDPOINT$1 = "/passkey/authentication/verification";
class AuthenticationHandler extends Tag("@passkey/authentication/handler")() {
}
const PASSLOCK_CLIENT_VERSION = "#{LATEST}#";
class RpcConfig extends Tag("@rpc/RpcConfig")() {
}
class RetrySchedule extends Tag("@rpc/RetrySchedule")() {
}
class Dispatcher extends Tag("@rpc/Dispatcher")() {
}
const DispatcherLive = effect(Dispatcher, gen(function* (_) {
  const { schedule: schedule2 } = yield* RetrySchedule;
  const { tenancyId, clientId, endpoint: maybeEndpoint } = yield* RpcConfig;
  const parseJson = (response, url) => tryPromise({
    try: () => response.json(),
    catch: (e) => new NetworkError({
      message: "Unable to extract json response from " + url,
      detail: String(e)
    })
  });
  const assertNo500s = (response, url) => {
    if (response.status >= 500) {
      return fail$1(new NetworkError({
        message: "Received 500 response code from " + url
      }));
    } else
      return _void;
  };
  const parseJsonObject = (json) => {
    return typeof json === "object" && json !== null ? succeed$2(json) : fail$1(new NetworkError({
      message: `Expected JSON object to be returned from RPC endpoint, actual ${typeof json}`
    }));
  };
  const buildUrl = (_path) => {
    const endpoint = maybeEndpoint || "https://api.passlock.dev";
    const path = _path.replace(/^\//, "");
    return `${endpoint}/${tenancyId}/${path}`;
  };
  return {
    get: (path) => {
      const effect2 = gen(function* (_2) {
        const headers = {
          "Accept": "application/json",
          "X-CLIENT-ID": clientId,
          "X-PASSLOCK-CLIENT-VERSION": PASSLOCK_CLIENT_VERSION
        };
        const url = buildUrl(path);
        const response = yield* tryPromise({
          try: () => fetch(url, { method: "GET", headers }),
          catch: (e) => new NetworkError({ message: "Unable to fetch from " + url, detail: String(e) })
        });
        const json = yield* parseJson(response, url);
        yield* assertNo500s(response, url);
        const jsonObject = yield* parseJsonObject(json);
        return { status: response.status, body: jsonObject };
      });
      return retry(effect2, { schedule: schedule2 });
    },
    post: (path) => (body) => {
      const effect2 = gen(function* (_2) {
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CLIENT-ID": clientId,
          "X-PASSLOCK-CLIENT-VERSION": PASSLOCK_CLIENT_VERSION
        };
        const url = buildUrl(path);
        const response = yield* tryPromise({
          try: () => fetch(url, { method: "POST", headers, body }),
          catch: (e) => new NetworkError({ message: "Unable to fetch from " + url, detail: String(e) })
        });
        const json = yield* parseJson(response, url);
        yield* assertNo500s(response, url);
        const jsonObject = yield* parseJsonObject(json);
        return { status: response.status, body: jsonObject };
      });
      return retry(effect2, { schedule: schedule2 });
    }
  };
}));
const makeGetRequest = (responseSchema, errorSchema, dispatcher) => (path) => pipe(dispatcher.get(path), flatMap$1((response) => {
  if (response.status === 200)
    return decodeUnknown(responseSchema)(response.body);
  return pipe(decodeUnknown(errorSchema)(response.body), flatMap$1((err) => fail$1(err)));
}), catchTag("ParseError", (e) => die(e)), catchTag("NetworkError", (e) => die(e)));
const makePostRequest = (requestSchema, responseSchema, errorSchema, dispatcher) => (path, request) => {
  return pipe(request, encode(requestSchema), map$1((encRequest) => JSON.stringify(encRequest)), flatMap$1(dispatcher.post(path)), flatMap$1((response) => {
    if (response.status === 200)
      return decodeUnknown(responseSchema)(response.body);
    return pipe(decodeUnknown(errorSchema)(response.body), flatMap$1((err) => fail$1(err)));
  }), catchTag("ParseError", (e) => die(e)), catchTag("NetworkError", (e) => die(e)));
};
class AuthenticationClient extends Tag("@passkey/authentication/client")() {
}
const AuthenticationClientLive = effect(AuthenticationClient, gen(function* (_) {
  const dispatcher = yield* Dispatcher;
  const optionsResolver = makePostRequest(OptionsRequest$1, OptionsResponse$1, OptionsErrors$1, dispatcher);
  const verifyResolver = makePostRequest(VerificationRequest$1, VerificationResponse$1, VerificationErrors$1, dispatcher);
  return {
    getAuthenticationOptions: (request) => optionsResolver(OPTIONS_ENDPOINT$1, request),
    verifyAuthenticationCredential: (request) => verifyResolver(VERIFICATION_ENDPOINT$1, request)
  };
}));
class CapabilitiesService extends Tag("@services/CapabilitiesService")() {
}
const assertWebAuthnSuppored = suspend(() => typeof window.PublicKeyCredential === "function" ? _void : new NotSupported({ message: "WebAuthn API is not supported on this device" }));
const assertPlatformAuthSupported = pipe(tryPromise(() => window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()), filterOrFail(identity, () => new NotSupported({ message: "No platform authenticator available on this device" })), asVoid);
const assertConditionalUiSupported = pipe(tryPromise({
  try: () => window.PublicKeyCredential.isConditionalMediationAvailable(),
  catch: () => new NotSupported({ message: "Conditional mediation not available on this device" })
}), filterOrFail(identity, () => new NotSupported({ message: "Conditional mediation not available on this device" })), asVoid);
const assertPasskeysSupported = pipe(assertWebAuthnSuppored, andThen(assertPlatformAuthSupported), catchTag("UnknownException", (e) => die(e)));
const arePasskeysSupported$1 = pipe(assertPasskeysSupported, match({
  onFailure: () => false,
  onSuccess: () => true
}));
const assertAutofillSupported = pipe(assertPasskeysSupported, andThen(assertConditionalUiSupported));
const isAutofillSupported = pipe(assertAutofillSupported, match({
  onFailure: () => false,
  onSuccess: () => true
}));
const capabilitiesLive = succeed$1(CapabilitiesService, {
  assertPasskeysSupported,
  arePasskeysSupported: arePasskeysSupported$1,
  assertAutofillSupported,
  isAutofillSupported
});
class StorageService extends Tag("@services/StorageService")() {
}
class BrowserStorage extends Tag("@services/Storage")() {
}
const buildKey = (authenticatorType) => `passlock:${authenticatorType}:token`;
const compressToken = (principal) => {
  const expireAt = principal.exp.getTime();
  const token = principal.jti;
  return `${token}:${expireAt.toFixed(0)}`;
};
const expandToken = (authenticatorType) => (s) => {
  const tokens = s.split(":");
  if (tokens.length !== 2)
    return none$4();
  const [token, expireAtString] = tokens;
  if (token === void 0 || expireAtString === void 0)
    return none$4();
  const parse = liftThrowable(Number.parseInt);
  const expireAt = parse(expireAtString);
  return map$7(expireAt, (expiry) => ({ authenticatorType, token, expiry }));
};
const storeToken = (principal) => {
  return gen(function* (_) {
    const localStorage = yield* BrowserStorage;
    const storeEffect = try_(() => {
      const compressed = compressToken(principal);
      const key = buildKey(principal.authenticatorType);
      localStorage.setItem(key, compressed);
    }).pipe(orElse$1(() => _void));
    return yield* storeEffect;
  });
};
const getToken = (authenticator) => {
  return gen(function* (_) {
    const localStorage = yield* BrowserStorage;
    const getEffect2 = pipe(some(buildKey(authenticator)), flatMap$5((key) => pipe(localStorage.getItem(key), fromNullable)), flatMap$5(expandToken(authenticator)), filter(({ expiry }) => expiry > Date.now()));
    return yield* getEffect2;
  });
};
const clearToken = (authenticatorType) => {
  return gen(function* (_) {
    const localStorage = yield* BrowserStorage;
    localStorage.removeItem(buildKey(authenticatorType));
  });
};
const clearExpiredToken = (authenticatorType) => {
  const key = buildKey(authenticatorType);
  const effect2 = gen(function* (_) {
    const storage = yield* BrowserStorage;
    const item = yield* fromNullable(storage.getItem(key));
    const token = yield* expandToken(authenticatorType)(item);
    if (token.expiry < Date.now()) {
      storage.removeItem(key);
    }
  });
  return pipe(effect2, match({
    onSuccess: () => _void,
    onFailure: () => _void
  }));
};
const clearExpiredTokens = all([
  clearExpiredToken("passkey"),
  clearExpiredToken("email"),
  clearExpiredToken("google"),
  clearExpiredToken("apple")
]);
const StorageServiceLive = effect(StorageService, gen(function* (_) {
  const context$12 = yield* context();
  return {
    storeToken: flow(storeToken, provide$1(context$12)),
    getToken: flow(getToken, provide$1(context$12)),
    clearToken: flow(clearToken, provide$1(context$12)),
    clearExpiredToken: flow(clearExpiredToken, provide$1(context$12)),
    clearExpiredTokens: pipe(clearExpiredTokens, provide$1(context$12))
  };
}));
class GetCredential extends Tag("@services/GetCredential")() {
}
class AuthenticationService extends Tag("@services/AuthenticationService")() {
}
const fetchOptions$1 = (request) => {
  return gen(function* (_) {
    yield* logDebug("Making request");
    const rpcClient = yield* AuthenticationClient;
    const { publicKey, session } = yield* rpcClient.getAuthenticationOptions(request);
    yield* logDebug("Converting Passlock options to CredentialRequestOptions");
    const options = yield* toRequestOptions({ publicKey });
    return { options, session };
  });
};
const toRequestOptions = (request) => {
  return pipe(try_(() => getRequestFromJSON(request)), mapError$1((error) => new InternalBrowserError({
    message: "Browser was unable to create credential request options",
    detail: String(error.error)
  })));
};
const verifyCredential$1 = (request) => {
  return gen(function* (_) {
    yield* logDebug("Making request");
    const rpcClient = yield* AuthenticationClient;
    const { principal } = yield* rpcClient.verifyAuthenticationCredential(request);
    return principal;
  });
};
const authenticatePasskey$1 = (request) => {
  const effect2 = gen(function* (_) {
    yield* logInfo("Checking if browser supports Passkeys");
    const capabilities = yield* CapabilitiesService;
    yield* capabilities.assertPasskeysSupported;
    yield* logInfo("Fetching authentication options from Passlock");
    const { options, session } = yield* fetchOptions$1(request);
    yield* logInfo("Looking up credential");
    const { getCredential } = yield* GetCredential;
    const credential = yield* getCredential(options);
    yield* logInfo("Verifying credential with Passlock");
    const principal = yield* verifyCredential$1(new VerificationRequest$1({ credential, session }));
    const storageService = yield* StorageService;
    yield* storageService.storeToken(principal);
    yield* logDebug("Stored token in local storage");
    yield* logDebug("Defering local token deletion");
    const delayedClearTokenE = pipe(storageService.clearExpiredToken("passkey"), delay("6 minutes"), fork);
    yield* delayedClearTokenE;
    return principal;
  });
  return catchTag(effect2, "InternalBrowserError", (e) => die(e));
};
const AuthenticateServiceLive = effect(AuthenticationService, gen(function* (_) {
  const context$12 = yield* context();
  return AuthenticationService.of({
    authenticatePasskey: flow(authenticatePasskey$1, provide$1(context$12))
  });
}));
class ConnectResponse extends Class2("@connection/connect/response")({
  warmed: Boolean$
}) {
}
const CONNECT_ENDPOINT = "/connection/pre-connect";
class ConnectionHandler extends Tag("@connection/handler")() {
}
class ConnectionClient extends Tag("@connection/client")() {
}
const ConnectionClientLive = effect(ConnectionClient, gen(function* (_) {
  const dispatcher = yield* Dispatcher;
  const preConnectResolver = makeGetRequest(ConnectResponse, Never, dispatcher);
  return {
    preConnect: () => preConnectResolver(CONNECT_ENDPOINT)
  };
}));
class ConnectionService extends Tag("@services/ConnectionService")() {
}
const hitPrincipal = pipe(logInfo("Pre-connecting to Principal endpoint"), zipRight(Dispatcher), flatMap$1((dispatcher) => dispatcher.get("/token/token?warm=true")), asVoid, catchAll(() => _void));
const hitRpc = pipe(logInfo("Pre-connecting to RPC endpoint"), zipRight(ConnectionClient), flatMap$1((rpcClient) => rpcClient.preConnect()), asVoid);
const preConnect$1 = () => pipe(all([hitPrincipal, hitRpc], { concurrency: 2 }), asVoid);
const ConnectionServiceLive = effect(ConnectionService, gen(function* (_) {
  const context$12 = yield* context();
  return ConnectionService.of({
    preConnect: flow(preConnect$1, provide$1(context$12))
  });
}));
class OptionsRequest2 extends Class2("@passkey/registration/options/request")({
  email: String$,
  givenName: OptionFromUndefinedOr(String$),
  familyName: OptionFromUndefinedOr(String$),
  userVerification: OptionFromUndefinedOr(UserVerification)
}) {
}
class OptionsResponse2 extends Class2("@passkey/registration/options/response")({
  session: String$,
  publicKey: RegistrationOptions
}) {
}
const OptionsErrors = Union2(BadRequest, Duplicate);
class VerificationRequest2 extends Class2("@passkey/registration/verification/request")({
  session: String$,
  credential: RegistrationCredential
}) {
}
class VerificationResponse2 extends Class2("@passkey/registration/verification/response")({
  principal: Principal
}) {
}
const VerificationErrors = Union2(BadRequest, Duplicate, Unauthorized, Forbidden2);
const OPTIONS_ENDPOINT = "/passkey/registration/options";
const VERIFICATION_ENDPOINT = "/passkey/registration/verification";
class RegistrationHandler extends Tag("@passkey/registration/handler")() {
}
class RegistrationClient extends Tag("@passkey/register/client")() {
}
const RegistrationClientLive = effect(RegistrationClient, gen(function* (_) {
  const dispatcher = yield* Dispatcher;
  const optionsResolver = makePostRequest(OptionsRequest2, OptionsResponse2, OptionsErrors, dispatcher);
  const verifyResolver = makePostRequest(VerificationRequest2, VerificationResponse2, VerificationErrors, dispatcher);
  return {
    getRegistrationOptions: (request) => optionsResolver(OPTIONS_ENDPOINT, request),
    verifyRegistrationCredential: (request) => verifyResolver(VERIFICATION_ENDPOINT, request)
  };
}));
class CreateCredential extends Tag("@services/CreateCredential")() {
}
class RegistrationService extends Tag("@services/RegistrationService")() {
}
const fetchOptions = (request) => {
  return gen(function* (_) {
    yield* logDebug("Making request");
    const rpcClient = yield* RegistrationClient;
    const { publicKey, session } = yield* rpcClient.getRegistrationOptions(request);
    yield* logDebug("Converting Passlock options to CredentialCreationOptions");
    const options = yield* toCreationOptions({ publicKey });
    return { options, session };
  });
};
const toCreationOptions = (jsonOptions) => {
  return pipe(try_(() => createRequestFromJSON(jsonOptions)), mapError$1((error) => new InternalBrowserError({
    message: "Browser was unable to create credential creation options",
    detail: String(error.error)
  })));
};
const verifyCredential = (request) => {
  return gen(function* (_) {
    yield* logDebug("Making request");
    const rpcClient = yield* RegistrationClient;
    const { principal } = yield* rpcClient.verifyRegistrationCredential(request);
    return principal;
  });
};
const registerPasskey$1 = (request) => {
  const effect2 = gen(function* (_) {
    yield* logInfo("Checking if browser supports Passkeys");
    const capabilities = yield* CapabilitiesService;
    yield* capabilities.assertPasskeysSupported;
    yield* logInfo("Fetching registration options from Passlock");
    const { options, session } = yield* fetchOptions(new OptionsRequest2(request));
    yield* logInfo("Building new credential");
    const { createCredential } = yield* CreateCredential;
    const credential = yield* createCredential(options);
    yield* logInfo("Storing credential public key in Passlock");
    const verificationRequest = new VerificationRequest2({
      ...request,
      credential,
      session
    });
    const principal = yield* verifyCredential(verificationRequest);
    const storageService = yield* StorageService;
    yield* storageService.storeToken(principal);
    yield* logDebug("Storing token in local storage");
    yield* logDebug("Defering local token deletion");
    const delayedClearTokenE = pipe(storageService.clearExpiredToken("passkey"), delay("6 minutes"), fork);
    yield* delayedClearTokenE;
    return principal;
  });
  return catchTag(effect2, "InternalBrowserError", (e) => die(e));
};
const RegistrationServiceLive = effect(RegistrationService, gen(function* (_) {
  const context$12 = yield* context();
  return RegistrationService.of({
    registerPasskey: flow(registerPasskey$1, provide$1(context$12))
  });
}));
const Provider = Literal2("apple", "google");
class PrincipalResponse extends Class2("@social/principal/response")({
  principal: Principal
}) {
}
class OIDCRegistrationRequest extends Class2("@social/oidc/registration/request")({
  provider: Provider,
  idToken: String$,
  givenName: OptionFromUndefinedOr(String$),
  familyName: OptionFromUndefinedOr(String$),
  nonce: String$
}) {
}
const OIDCRegistrationErrors = Union2(BadRequest, Unauthorized, Forbidden2, Disabled, Duplicate);
class OIDCAuthenticationRequest extends Class2("@social/oidc/authentication/request")({
  provider: Provider,
  idToken: String$,
  nonce: String$
}) {
}
const OIDCAuthenticationErrors = Union2(BadRequest, Unauthorized, Forbidden2, Disabled, NotFound);
const OIDC_REGISTRATION_ENDPOINT = "/social/oidc/registration";
const OIDC_AUTHENTICATION_ENDPOINT = "/social/oidc/authentication";
class SocialHandler extends Tag("@social/handler")() {
}
class SocialClient extends Tag("@social/client")() {
}
const SocialClientLive = effect(SocialClient, gen(function* (_) {
  const dispatcher = yield* Dispatcher;
  const registerResolver = makePostRequest(OIDCRegistrationRequest, PrincipalResponse, OIDCRegistrationErrors, dispatcher);
  const authenticateResolver = makePostRequest(OIDCAuthenticationRequest, PrincipalResponse, OIDCAuthenticationErrors, dispatcher);
  return {
    oidcRegistration: (request) => registerResolver(OIDC_REGISTRATION_ENDPOINT, request),
    oidcAuthentication: (request) => authenticateResolver(OIDC_AUTHENTICATION_ENDPOINT, request)
  };
}));
class IsExistingUserRequest extends Class2("@user/isExistingUser/request")({
  email: String$
}) {
}
class IsExistingUserResponse extends Class2("@user/isExistingUser/response")({
  existingUser: Boolean$,
  detail: OptionFromUndefinedOr(String$)
}) {
}
const USER_STATUS_ENDPOINT = "/user/status";
class UserHandler extends Tag("@user/handler")() {
}
class UserClient extends Tag("@user/client")() {
}
const UserClientLive = effect(UserClient, gen(function* (_) {
  const dispatcher = yield* Dispatcher;
  const isExistingUserResolver = makePostRequest(IsExistingUserRequest, IsExistingUserResponse, Never, dispatcher);
  return {
    isExistingUser: (request) => isExistingUserResolver(USER_STATUS_ENDPOINT, request)
  };
}));
class SocialService extends Tag("@services/SocialService")() {
}
const registerOidc$1 = (request) => {
  return gen(function* (_) {
    yield* logInfo("Registering social account");
    const rpcClient = yield* SocialClient;
    const rpcRequest = new OIDCRegistrationRequest(request);
    const { principal } = yield* rpcClient.oidcRegistration(rpcRequest);
    return principal;
  });
};
const authenticateOidc$1 = (request) => {
  return gen(function* (_) {
    yield* logInfo("Authenticating with social account");
    const rpcClient = yield* SocialClient;
    const rpcRequest = new OIDCAuthenticationRequest(request);
    const { principal } = yield* rpcClient.oidcAuthentication(rpcRequest);
    return principal;
  });
};
const SocialServiceLive = effect(SocialService, gen(function* (_) {
  const context$12 = yield* context();
  return SocialService.of({
    registerOidc: flow(registerOidc$1, provide$1(context$12)),
    authenticateOidc: flow(authenticateOidc$1, provide$1(context$12))
  });
}));
class UserService extends Tag("@services/UserService")() {
}
const isExistingUser$1 = (request) => {
  return gen(function* (_) {
    yield* logInfo("Checking registration status");
    const rpcClient = yield* UserClient;
    yield* logDebug("Making RPC request");
    const { existingUser } = yield* rpcClient.isExistingUser(new IsExistingUserRequest(request));
    return existingUser;
  });
};
const UserServiceLive = effect(UserService, gen(function* (_) {
  const context$12 = yield* context();
  return UserService.of({
    isExistingUser: flow(isExistingUser$1, provide$1(context$12))
  });
}));
const createCredentialLive = succeed$1(CreateCredential, CreateCredential.of({
  createCredential: (options) => pipe(tryPromise({
    try: () => create(options),
    catch: (e) => {
      if (e instanceof Error && e.message.includes("excludeCredentials")) {
        return new Duplicate({
          message: "Passkey already registered to this device or cloud account"
        });
      } else {
        return new InternalBrowserError({
          message: "Unable to create credential",
          detail: String(e)
        });
      }
    }
  }), map$1((credential) => credential.toJSON()))
}));
const getCredentialLive = succeed$1(GetCredential, GetCredential.of({
  getCredential: (options) => pipe(tryPromise({
    try: () => get(options),
    catch: (e) => new InternalBrowserError({
      message: "Unable to get authentication credential",
      detail: String(e)
    })
  }), map$1((credential) => credential.toJSON()))
}));
const schedule = intersect(recurs(3), exponential("100 millis"));
const retryScheduleLive = succeed$1(RetrySchedule, RetrySchedule.of({ schedule }));
const dispatcherLive = pipe(DispatcherLive, provide(retryScheduleLive));
const connectClientLive = pipe(ConnectionClientLive, provide(dispatcherLive));
const registerClientLive = pipe(RegistrationClientLive, provide(dispatcherLive));
const authenticateClientLive = pipe(AuthenticationClientLive, provide(dispatcherLive));
const socialClientLive = pipe(SocialClientLive, provide(dispatcherLive));
const userClientLive = pipe(UserClientLive, provide(dispatcherLive));
const storageServiceLive = StorageServiceLive;
const userServiceLive = pipe(UserServiceLive, provide(userClientLive));
const registrationServiceLive = pipe(RegistrationServiceLive, provide(registerClientLive), provide(userServiceLive), provide(capabilitiesLive), provide(createCredentialLive), provide(storageServiceLive));
const authenticationServiceLive = pipe(AuthenticateServiceLive, provide(authenticateClientLive), provide(capabilitiesLive), provide(getCredentialLive), provide(storageServiceLive));
const connectionServiceLive = pipe(ConnectionServiceLive, provide(connectClientLive), provide(dispatcherLive));
const socialServiceLive = pipe(SocialServiceLive, provide(socialClientLive));
const allRequirements = mergeAll(capabilitiesLive, userServiceLive, registrationServiceLive, authenticationServiceLive, connectionServiceLive, storageServiceLive, socialServiceLive);
const browserStorageLive = effect(BrowserStorage, sync(() => BrowserStorage.of(globalThis.localStorage)));
const preConnect = () => pipe(ConnectionService, flatMap$1((service) => service.preConnect()), provide$1(connectionServiceLive));
const arePasskeysSupported = pipe(CapabilitiesService, flatMap$1((service) => service.arePasskeysSupported), provide$1(capabilitiesLive));
const isExistingUser = (request) => pipe(UserService, flatMap$1((service) => service.isExistingUser(request)), provide$1(userServiceLive));
const registerPasskey = (request) => pipe(RegistrationService, flatMap$1((service) => service.registerPasskey(request)), provide$1(registrationServiceLive), provide$1(browserStorageLive));
const authenticatePasskey = (request) => pipe(AuthenticationService, flatMap$1((service) => service.authenticatePasskey(request)), provide$1(authenticationServiceLive), provide$1(browserStorageLive));
const getSessionToken = (authType) => pipe(StorageService, flatMap$1((service) => service.getToken(authType)), provide$1(storageServiceLive), provide$1(browserStorageLive));
pipe(StorageService, flatMap$1((service) => service.clearExpiredTokens), provide$1(storageServiceLive), provide$1(browserStorageLive));
const registerOidc = (request) => pipe(SocialService, flatMap$1((service) => service.registerOidc(request)), provide$1(socialServiceLive));
const authenticateOidc = (request) => pipe(SocialService, flatMap$1((service) => service.authenticateOidc(request)), provide$1(socialServiceLive));
class PasslockError extends Error {
  code;
  detail;
  constructor(message, code, detail) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
  static isError = (error) => {
    return typeof error === "object" && error !== null && error instanceof PasslockError;
  };
}
const nonEmpty = (text) => {
  const trimmed = text.trim();
  if (trimmed.length > 0)
    return some(trimmed);
  return none$4();
};
const toRpcRegistrationRequest = (request) => {
  return {
    email: request.email,
    givenName: pipe(fromNullable(request.givenName), flatMap$5(nonEmpty)),
    familyName: pipe(fromNullable(request.familyName), flatMap$5(nonEmpty)),
    userVerification: fromNullable(request.userVerification)
  };
};
const toRpcAuthenticationRequest = (request) => {
  return {
    email: fromNullable(request.email),
    userVerification: fromNullable(request.userVerification)
  };
};
const toRpcOIDCRegistrationRequest = (request) => {
  return {
    provider: request.provider,
    idToken: request.idToken,
    givenName: pipe(fromNullable(request.givenName), flatMap$5(nonEmpty)),
    familyName: pipe(fromNullable(request.familyName), flatMap$5(nonEmpty)),
    nonce: request.nonce
  };
};
const hasMessage = (defect) => {
  return typeof defect === "object" && defect !== null && "message" in defect && typeof defect["message"] === "string";
};
const toPasslockError = (effect2) => {
  const fromEffectError = (effect3) => catchTags(effect3, {
    NotSupported: (e) => fail$1(new PasslockError(e.message, ErrorCode.NotSupported)),
    BadRequest: (e) => fail$1(new PasslockError(e.message, ErrorCode.BadRequest, e.detail)),
    Duplicate: (e) => fail$1(new PasslockError(e.message, ErrorCode.Duplicate, e.detail)),
    Unauthorized: (e) => fail$1(new PasslockError(e.message, ErrorCode.Unauthorized, e.detail)),
    Forbidden: (e) => fail$1(new PasslockError(e.message, ErrorCode.Forbidden, e.detail)),
    Disabled: (e) => fail$1(new PasslockError(e.message, ErrorCode.Disabled, e.detail)),
    NotFound: (e) => fail$1(new PasslockError(e.message, ErrorCode.NotFound, e.detail)),
    InternalServerError: (e) => fail$1(new PasslockError(e.message, ErrorCode.InternalServerError, e.detail)),
    InternalBrowserError: (e) => fail$1(new PasslockError(e.message, ErrorCode.InternalServerError, e.detail))
  });
  const catchDefect = (defect) => {
    return hasMessage(defect) ? new InternalServerError({ message: defect.message }) : new InternalServerError({ message: "Sorry, something went wrong" });
  };
  return pipe(sandbox(effect2), catchTags({
    Fail: ({ error }) => error,
    Die: ({ defect }) => catchDefect(defect),
    Interrupt: () => new InternalBrowserError({ message: "Operation aborted" }),
    Sequential: () => new InternalServerError({ message: "Sorry, something went wrong" }),
    Parallel: () => new InternalServerError({ message: "Sorry, something went wrong" }),
    Empty: () => new InternalServerError({ message: "Sorry, something went wrong" })
  }), fromEffectError);
};
class Passlock {
  runtime;
  constructor(props) {
    const config = succeed$1(RpcConfig, RpcConfig.of(props));
    const storage = succeed$1(BrowserStorage, BrowserStorage.of(globalThis.localStorage));
    const allLayers = pipe(allRequirements, provide(config), provide(storage), merge(config));
    const scope = runSync$1(make$2());
    this.runtime = runSync$1(toRuntime(allLayers).pipe(extend$1(scope)));
    runSync$1(logDebug(`Passlock version: ${PASSLOCK_CLIENT_VERSION}`));
  }
  static isPrincipal = (value) => isPrincipal(value);
  static isUserPrincipal = (value) => isUserPrincipal(value);
  runPromise = dual(2, (effect2, options) => pipe(toPasslockError(effect2), catchAll(succeed$2), (effect3) => runPromise(this.runtime)(effect3, options)));
  preConnect = async (options) => {
    return pipe(preConnect(), match({ onFailure: () => false, onSuccess: () => true }), (effect2) => runPromise(this.runtime)(effect2, options));
  };
  arePasskeysSupported = () => pipe(arePasskeysSupported, (effect2) => runPromise(this.runtime)(effect2));
  isExistingUser = (email, options) => pipe(isExistingUser(email), this.runPromise(options));
  registerPasskey = (request, options) => pipe(registerPasskey(toRpcRegistrationRequest(request)), this.runPromise(options));
  authenticatePasskey = (request = {}, options) => pipe(toRpcAuthenticationRequest(request), authenticatePasskey, this.runPromise(options));
  registerOidc = (request, options) => pipe(registerOidc(toRpcOIDCRegistrationRequest(request)), this.runPromise(options));
  authenticateOidc = (request, options) => pipe(authenticateOidc(request), this.runPromise(options));
  getSessionToken = (authType) => pipe(getSessionToken(authType), orElseSucceed(() => void 0), (effect2) => runPromise$1(effect2));
  clearExpiredTokens = () => {
    pipe(StorageService, flatMap$1((service) => service.clearExpiredTokens), (effect2) => {
      runSync(this.runtime)(effect2);
    });
  };
}
const PUBLIC_PASSLOCK_TENANCY_ID = "vqs0egu1rpniz4y";
const PUBLIC_PASSLOCK_CLIENT_ID = "63ufn4yo4-a0vryet4d-4jfkkfigo";
const PUBLIC_PASSLOCK_ENDPOINT = "https://okbq1o3xde.execute-api.eu-west-2.amazonaws.com";
const PUBLIC_APPLE_CLIENT_ID = "dev.passlock.demo.site";
const PUBLIC_GOOGLE_CLIENT_ID = "48511780264-4e8gvfq7ru682bn3t839uu8lia30a5io.apps.googleusercontent.com";
export {
  ErrorCode as E,
  Passlock as P,
  TreeFormatter as T,
  PasslockError as a,
  PUBLIC_APPLE_CLIENT_ID as b,
  PUBLIC_GOOGLE_CLIENT_ID as c,
  PUBLIC_PASSLOCK_TENANCY_ID as d,
  PUBLIC_PASSLOCK_CLIENT_ID as e,
  PUBLIC_PASSLOCK_ENDPOINT as f,
  flatMap$1 as g,
  decodePrincipal as h,
  mapError$1 as i,
  match as m,
  pipe as p,
  runPromise$1 as r,
  tryPromise as t
};
