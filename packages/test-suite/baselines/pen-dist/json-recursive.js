
"use strict";
function field({ mode, name, value }) {
    if (isParse(mode)) {
        return function FLD() {
            let stateₒ = getState();
            let obj = {};
            if (!name())
                return false;
            assert(typeof OUT === 'string');
            let propName = OUT;
            if (!value())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;
            OUT = obj;
            return true;
        };
    }
    else {
        return function FLD() {
            if (objectToString.call(IN) !== '[object Object]')
                return false;
            let stateₒ = getState();
            let text;
            let propNames = Object.keys(IN);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = IN;
            let bitmask = IP;
            for (let i = 0; i < propCount; ++i) {
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    continue;
                setState({ IN: propName, IP: 0 });
                if (!name())
                    continue;
                if (IP !== propName.length)
                    continue;
                text = concat(text, OUT);
                setState({ IN: obj[propName], IP: 0 });
                if (!value())
                    continue;
                if (!isInputFullyConsumed())
                    continue;
                text = concat(text, OUT);
                bitmask += propBit;
                setState({ IN: obj, IP: bitmask });
                OUT = text;
                return true;
            }
            setState(stateₒ);
            return false;
        };
    }
}
function list({ mode, elements }) {
    const elementsLength = elements.length;
    if (isParse(mode)) {
        return function LST() {
            let stateₒ = getState();
            let arr = [];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i]())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            OUT = arr;
            return true;
        };
    }
    else {
        return function LST() {
            if (!Array.isArray(IN))
                return false;
            if (IP < 0 || IP + elementsLength > IN.length)
                return false;
            let stateₒ = getState();
            let text;
            const arr = IN;
            const off = IP;
            for (let i = 0; i < elementsLength; ++i) {
                setState({ IN: arr[off + i], IP: 0 });
                if (!elements[i]())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
            }
            setState({ IN: arr, IP: off + elementsLength });
            OUT = text;
            return true;
        };
    }
}
function record({ mode, fields }) {
    if (isParse(mode)) {
        return function RCD() {
            let stateₒ = getState();
            let obj = {};
            for (let field of fields) {
                let propName = field.name;
                if (!field.value())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        };
    }
    else {
        return function RCD() {
            if (objectToString.call(IN) !== '[object Object]')
                return false;
            let stateₒ = getState();
            let text;
            let propNames = Object.keys(IN);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = IN;
            let bitmask = IP;
            for (let field of fields) {
                let i = propNames.indexOf(field.name);
                if (i < 0)
                    return setState(stateₒ), false;
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    return setState(stateₒ), false;
                setState({ IN: obj[propName], IP: 0 });
                if (!field.value())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
                bitmask += propBit;
            }
            setState({ IN: obj, IP: bitmask });
            OUT = text;
            return true;
        };
    }
}
const PARSE = 6;
const PRINT = 7;
const COVAL = 4;
const COGEN = 5;
const ABGEN = 2;
const ABVAL = 3;
const isParse = (mode) => (mode & 1) === 0;
const isPrint = (mode) => (mode & 1) !== 0;
const hasConcreteForm = (mode) => (mode & 4) !== 0;
const hasAbstractForm = (mode) => (mode & 2) !== 0;
const hasInput = (mode) => isParse(mode) ? hasConcreteForm(mode) : hasAbstractForm(mode);
const hasOutput = (mode) => isParse(mode) ? hasAbstractForm(mode) : hasConcreteForm(mode);
function isRule(_x) {
    return true;
}
function isLambda(_x) {
    return true;
}
function isModule(_x) {
    return true;
}
let IN;
let IP;
let OUT;
function getState() {
    return { IN, IP };
}
function setState(state) {
    IN = state.IN;
    IP = state.IP;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}
function concat(a, b) {
    if (a === undefined)
        return b;
    if (b === undefined)
        return a;
    let type = objectToString.call(a);
    if (type !== objectToString.call(b))
        throw new Error(`Internal error: invalid sequence`);
    if (type === '[object String]')
        return a + b;
    if (type === '[object Array]')
        return [...a, ...b];
    if (type === '[object Object]')
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
}
function isInputFullyConsumed() {
    let type = objectToString.call(IN);
    if (type === '[object String]')
        return IP === IN.length;
    if (type === '[object Array]')
        return IP === IN.length;
    if (type === '[object Object]') {
        let keyCount = Object.keys(IN).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1;
}
const objectToString = Object.prototype.toString;
function zeroOrMore({ expression }) {
    return function O_M() {
        let IPₒ = IP;
        let out;
        do {
            if (!expression())
                break;
            if (IP === IPₒ)
                break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    };
}
function zeroOrOne({ expression }) {
    return function O_1() {
        if (!expression())
            OUT = undefined;
        return true;
    };
}

// -------------------- Extensions --------------------
const createExtension𝕊3 = (() => {
    "use strict";
    /* @pen exports = {
        char,
        f64,
        i32,
        memoise,
    } */
    // TODO: doc... has both 'txt' and 'ast' representation
    // TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
    // TODO: optimise 'any char' case better
    // TODO: optimise all cases better
    function char({ mode }) {
        return function CHA_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : '\u0000';
            let max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : '\uFFFF';
            assert(typeof min === 'string' && min.length === 1);
            assert(typeof max === 'string' && max.length === 1);
            let checkRange = min !== '\u0000' || max !== '\uFFFF';
            if (!hasInput(mode)) {
                assert(hasOutput(mode));
                return function CHA() { return OUT = min, true; };
            }
            return function CHA() {
                if (isPrint(mode) && typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                let c = IN.charAt(IP);
                if (checkRange && (c < min || c > max))
                    return false;
                IP += 1;
                OUT = hasOutput(mode) ? c : undefined;
                return true;
            };
        };
    }
    // TODO: doc... has both 'txt' and 'ast' representation
    function f64({ mode }) {
        if (!hasInput(mode)) {
            assert(hasOutput(mode));
            const out = isParse(mode) ? 0 : '0';
            return function F64() { return OUT = out, true; };
        }
        if (isParse(mode)) {
            return function F64() {
                if (typeof IN !== 'string')
                    return false;
                let stateₒ = getState();
                const LEN = IN.length;
                const EOS = 0;
                let digitCount = 0;
                // Parse optional '+' or '-' sign
                let c = IN.charCodeAt(IP);
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT)
                        break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse optional '.'
                if (c === DECIMAL_POINT) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT)
                        break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Ensure we have parsed at least one significant digit
                if (digitCount === 0)
                    return setState(stateₒ), false;
                // Parse optional exponent
                if (c === UPPERCASE_E || c === LOWERCASE_E) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    // Parse optional '+' or '-' sign
                    if (c === PLUS_SIGN || c === MINUS_SIGN) {
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }
                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (c < ZERO_DIGIT || c > NINE_DIGIT)
                            break;
                        digitCount += 1;
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }
                    if (digitCount === 0)
                        return setState(stateₒ), false;
                }
                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                let num = Number.parseFloat(IN.slice(stateₒ.IP, IP));
                if (!Number.isFinite(num))
                    return setState(stateₒ), false;
                // Success
                OUT = hasOutput(mode) ? num : undefined;
                return true;
            };
        }
        else /* isPrint */ {
            return function F64() {
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0)
                    return false;
                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                OUT = hasOutput(mode) ? String(IN) : undefined;
                IP = 1;
                return true;
            };
        }
    }
    // These constants are used by the f64 rule.
    const PLUS_SIGN = '+'.charCodeAt(0);
    const MINUS_SIGN = '-'.charCodeAt(0);
    const DECIMAL_POINT = '.'.charCodeAt(0);
    const ZERO_DIGIT = '0'.charCodeAt(0);
    const NINE_DIGIT = '9'.charCodeAt(0);
    const LOWERCASE_E = 'e'.charCodeAt(0);
    const UPPERCASE_E = 'E'.charCodeAt(0);
    // TODO: doc... has both 'txt' and 'ast' representation
    function i32({ mode }) {
        return function I32_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
            let signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');
            if (!hasInput(mode)) {
                assert(hasOutput(mode));
                const out = isParse(mode) ? 0 : '0';
                return function I32() { return OUT = out, true; };
            }
            if (isParse(mode)) {
                return function I32() {
                    if (typeof IN !== 'string')
                        return false;
                    let stateₒ = getState();
                    // Parse optional leading '-' sign (if signed)...
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IP < IN.length && IN.charAt(IP) === '-') {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IP += 1;
                    }
                    // ...followed by one or more decimal digits. (NB: no exponents).
                    let num = 0;
                    let digits = 0;
                    while (IP < IN.length) {
                        // Read a digit.
                        let c = IN.charCodeAt(IP);
                        if (c >= 256)
                            break;
                        let digitValue = DIGIT_VALUES[c];
                        if (digitValue >= base)
                            break;
                        // Update parsed number.
                        num *= base;
                        num += digitValue;
                        // Check for overflow.
                        if (num > MAX_NUM)
                            return setState(stateₒ), false;
                        // Loop again.
                        IP += 1;
                        digits += 1;
                    }
                    // Check that we parsed at least one digit.
                    if (digits === 0)
                        return setState(stateₒ), false;
                    // Apply the sign.
                    if (isNegative)
                        num = -num;
                    // Success
                    OUT = hasOutput(mode) ? num : undefined;
                    return true;
                };
            }
            else /* isPrint */ {
                return function I32() {
                    if (typeof IN !== 'number' || IP !== 0)
                        return false;
                    let num = IN;
                    // Determine the number's sign and ensure it is in range.
                    let isNegative = false;
                    let MAX_NUM = 0x7FFFFFFF;
                    if (num < 0) {
                        if (!signed)
                            return false;
                        isNegative = true;
                        num = -num;
                        MAX_NUM = 0x80000000;
                    }
                    if (num > MAX_NUM)
                        return false;
                    // Extract the digits.
                    let digits = [];
                    while (true) {
                        let d = num % base;
                        num = (num / base) | 0;
                        digits.push(CHAR_CODES[d]);
                        if (num === 0)
                            break;
                    }
                    // Compute the final string.
                    if (isNegative)
                        digits.push(0x2d); // char code for '-'
                    // TODO: is String.fromCharCode(...) performant?
                    OUT = hasOutput(mode) ? String.fromCharCode(...digits.reverse()) : undefined;
                    IP = 1;
                    return true;
                };
            }
        };
    }
    // TODO: doc...
    // use this for bases between 2-36. Get the charCode, ensure < 256, look up DIGIT_VALUES[code], ensure < BASE
    // NB: the number 80 is not special, it's just greater than 36 which makes it a sentinel for 'not a digit'.
    const DIGIT_VALUES = [
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 80, 80, 80, 80, 80, 80,
        80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80,
        80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
    ];
    // TODO: doc...
    const CHAR_CODES = [
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
        0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e,
        0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a,
    ];
    function memoise({}) {
        return function MEM_lambda(expr) {
            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
            const memos = new Map();
            return function MEM() {
                // Check whether the memo table already has an entry for the given initial state.
                let stateₒ = getState();
                let memos2 = memos.get(IN);
                if (memos2 === undefined) {
                    memos2 = new Map();
                    memos.set(IN, memos2);
                }
                let memo = memos2.get(IP);
                if (!memo) {
                    // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                    // this initial state. The first thing we do is create a memo table entry, which is marked as
                    // *unresolved*. All future applications of this rule with the same initial state will find this
                    // memo. If a future application finds the memo still unresolved, then we know we have encountered
                    // left-recursion.
                    memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ, OUT: undefined };
                    memos2.set(IP, memo);
                    // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                    // At this point, any left-recursive paths encountered during application are guaranteed to have
                    // been noted and aborted (see below).
                    if (expr()) { // TODO: fix cast
                        memo.result = true;
                        memo.stateᐟ = getState();
                        memo.OUT = OUT;
                    }
                    memo.resolved = true;
                    // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                    // final.
                    if (!memo.isLeftRecursive) {
                        setState(memo.stateᐟ);
                        OUT = memo.OUT;
                        return memo.result;
                    }
                    // If we get here, then the above application of the rule invoked itself left-recursively, but we
                    // aborted the left-recursive paths (see below). That means that the result is either failure, or
                    // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                    // the same rule with the same initial state. We continue to iterate as long as the application
                    // succeeds and consumes more input than the previous iteration did, in which case we update the
                    // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                    // does not consume more input, at which point we take the result of the previous iteration as
                    // final.
                    while (memo.result === true) {
                        setState(stateₒ);
                        // TODO: break cases for UNPARSING:
                        // anything --> same thing (covers all string cases, since they can only be same or shorter)
                        // some node --> some different non-empty node (assert: should never happen!)
                        if (!expr())
                            break; // TODO: fix cast
                        let state = getState();
                        if (state.IP <= memo.stateᐟ.IP)
                            break;
                        // TODO: was for unparse... comment above says should never happen...
                        // if (!isInputFullyConsumed()) break;
                        memo.stateᐟ = state;
                        memo.OUT = OUT;
                    }
                }
                else if (!memo.resolved) {
                    // If we get here, then we have already applied the rule with this initial state, but not yet
                    // resolved it. That means we must have entered a left-recursive path of the rule. All we do here is
                    // note that the rule application encountered left-recursion, and return with failure. This means
                    // that the initial application of the rule for this initial state can only possibly succeed along a
                    // non-left-recursive path. More importantly, it means the parser will never loop endlessly on
                    // left-recursive rules.
                    memo.isLeftRecursive = true;
                    return false;
                }
                // We have a resolved memo, so the result of the rule application for the given initial state has
                // already been computed. Return it from the memo.
                setState(memo.stateᐟ);
                OUT = memo.OUT;
                return memo.result;
            };
        };
    }

    return ({mode}) => {
        let _char = char({mode});
        let _f64 = f64({mode});
        let _i32 = i32({mode});
        let _memoise = memoise({mode});
        return (name) => {
            switch(name) {
                case 'char': return _char;
                case 'f64': return _f64;
                case 'i32': return _i32;
                case 'memoise': return _memoise;
                default: return undefined;
            }
        };
    };
})();
const createExtension𝕊4 = (() => {
    "use strict";
    /* @pen exports = {
        unicode
    } */
    function unicode({ mode }) {
        return function UNI_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let base = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
            let minDigits = (_d = (_c = expr('minDigits')) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
            let maxDigits = (_f = (_e = expr('maxDigits')) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
            assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
            // Construct a regex to match the digits
            let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
            let regex = RegExp(pattern, 'i');
            if (isParse(mode)) {
                return function UNI() {
                    if (typeof IN !== 'string')
                        return false;
                    let stateₒ = getState();
                    const LEN = IN.length;
                    const EOS = '';
                    let len = 0;
                    let num = ''; // TODO: fix this - should actually keep count
                    let c = IP < LEN ? IN.charAt(IP) : EOS;
                    while (true) {
                        if (!regex.test(c))
                            break;
                        num += c;
                        IP += 1;
                        len += 1;
                        if (len === maxDigits)
                            break;
                        c = IP < LEN ? IN.charAt(IP) : EOS;
                    }
                    if (len < minDigits)
                        return setState(stateₒ), false;
                    // tslint:disable-next-line: no-eval
                    OUT = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                    return true;
                };
            }
            else /* isPrint */ {
                return function UNI() {
                    // TODO: implement
                    return false;
                };
            }
        };
    }

    return ({mode}) => {
        let _unicode = unicode({mode});
        return (name) => {
            switch(name) {
                case 'unicode': return _unicode;
                default: return undefined;
            }
        };
    };
})();




// --------------------------------------------------------------------------------
const parse = (() => {

    // -------------------- json-recursive.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case '$1': return 𝕊0_$1;
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case '$2': return 𝕊0_$2;
            case 'unicode': return 𝕊0_unicode;
            case 'start': return 𝕊0_start;
            case 'Value': return 𝕊0_Value;
            case 'False': return 𝕊0_False;
            case 'Null': return 𝕊0_Null;
            case 'True': return 𝕊0_True;
            case 'Object': return 𝕊0_Object;
            case 'Properties': return 𝕊0_Properties;
            case 'Array': return 𝕊0_Array;
            case 'Elements': return 𝕊0_Elements;
            case 'Number': return 𝕊0_Number;
            case 'String': return 𝕊0_String;
            case 'CHAR': return 𝕊0_CHAR;
            case 'LBRACE': return 𝕊0_LBRACE;
            case 'RBRACE': return 𝕊0_RBRACE;
            case 'LBRACKET': return 𝕊0_LBRACKET;
            case 'RBRACKET': return 𝕊0_RBRACKET;
            case 'COLON': return 𝕊0_COLON;
            case 'COMMA': return 𝕊0_COMMA;
            case 'DOUBLE_QUOTE': return 𝕊0_DOUBLE_QUOTE;
            case 'WS': return 𝕊0_WS;
            default: return undefined;
        }
    };

    const 𝕊0_$1 = (arg) => {
        if (!𝕊0_$1_memo) 𝕊0_$1_memo = 𝕊3;
        return 𝕊0_$1_memo(arg);
    };
    let 𝕊0_$1_memo;

    const 𝕊0_char = (arg) => {
        if (!𝕊0_char_memo) 𝕊0_char_memo = 𝕊0('$1')('char');
        return 𝕊0_char_memo(arg);
    };
    let 𝕊0_char_memo;

    const 𝕊0_f64 = (arg) => {
        if (!𝕊0_f64_memo) 𝕊0_f64_memo = 𝕊0('$1')('f64');
        return 𝕊0_f64_memo(arg);
    };
    let 𝕊0_f64_memo;

    const 𝕊0_$2 = (arg) => {
        if (!𝕊0_$2_memo) 𝕊0_$2_memo = 𝕊4;
        return 𝕊0_$2_memo(arg);
    };
    let 𝕊0_$2_memo;

    const 𝕊0_unicode = (arg) => {
        if (!𝕊0_unicode_memo) 𝕊0_unicode_memo = 𝕊0('$2')('unicode');
        return 𝕊0_unicode_memo(arg);
    };
    let 𝕊0_unicode_memo;

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t2 = 𝕊0('WS');
            const t3 = 𝕊0('Value');
            const t4 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t2()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t3()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t4()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t5 = 𝕊0('False');
            const t6 = 𝕊0('Null');
            const t7 = 𝕊0('True');
            const t8 = 𝕊0('Object');
            const t9 = 𝕊0('Array');
            const t10 = 𝕊0('Number');
            const t11 = 𝕊0('String');
            return function SEL() {
                if (t5()) return true;
                if (t6()) return true;
                if (t7()) return true;
                if (t8()) return true;
                if (t9()) return true;
                if (t10()) return true;
                if (t11()) return true;
                return false;
            };
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t12 = function STR() {
                if (IP + 5 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 102) return false;
                if (IN.charCodeAt(IP + 1) !== 97) return false;
                if (IN.charCodeAt(IP + 2) !== 108) return false;
                if (IN.charCodeAt(IP + 3) !== 115) return false;
                if (IN.charCodeAt(IP + 4) !== 101) return false;
                IP += 5;
                OUT = undefined;
                return true;
            };
            const t13 = function BOO() {
                OUT = false;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t12()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t13()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t14 = function STR() {
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 110) return false;
                if (IN.charCodeAt(IP + 1) !== 117) return false;
                if (IN.charCodeAt(IP + 2) !== 108) return false;
                if (IN.charCodeAt(IP + 3) !== 108) return false;
                IP += 4;
                OUT = undefined;
                return true;
            };
            const t15 = function NUL() {
                OUT = null;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t14()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t15()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t16 = function STR() {
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 116) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 117) return false;
                if (IN.charCodeAt(IP + 3) !== 101) return false;
                IP += 4;
                OUT = undefined;
                return true;
            };
            const t17 = function BOO() {
                OUT = true;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t16()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t17()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t18 = 𝕊0('LBRACE');
            const t19 = (() => {
                const t21 = 𝕊0('Properties');
                const t22 = record({
                    mode: 6,
                    fields: [],
                });
                return function SEL() {
                    if (t21()) return true;
                    if (t22()) return true;
                    return false;
                };
            })();
            const t20 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t18()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t19()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t20()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Properties = (arg) => {
        if (!𝕊0_Properties_memo) 𝕊0_Properties_memo = (() => {
            const t23 = field({
                mode: 6,
                name: 𝕊0('String'),
                value: (() => {
                    const t25 = 𝕊0('COLON');
                    const t26 = 𝕊0('Value');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t25()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t26()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            const t24 = zeroOrOne({
                mode: 6,
                expression: (() => {
                    const t27 = 𝕊0('COMMA');
                    const t28 = 𝕊0('Properties');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t27()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t28()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t23()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t24()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Properties_memo(arg);
    };
    let 𝕊0_Properties_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t29 = 𝕊0('LBRACKET');
            const t30 = (() => {
                const t32 = 𝕊0('Elements');
                const t33 = list({
                    mode: 6,
                    elements: [],
                });
                return function SEL() {
                    if (t32()) return true;
                    if (t33()) return true;
                    return false;
                };
            })();
            const t31 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t29()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t30()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t31()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Elements = (arg) => {
        if (!𝕊0_Elements_memo) 𝕊0_Elements_memo = (() => {
            const t34 = list({
                mode: 6,
                elements: [
                    𝕊0('Value'),
                ],
            });
            const t35 = zeroOrOne({
                mode: 6,
                expression: (() => {
                    const t36 = 𝕊0('COMMA');
                    const t37 = 𝕊0('Elements');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t36()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t37()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t34()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t35()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Elements_memo(arg);
    };
    let 𝕊0_Elements_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t38 = 𝕊0('DOUBLE_QUOTE');
            const t39 = zeroOrMore({
                mode: 6,
                expression: 𝕊0('CHAR'),
            });
            const t40 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t38()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t39()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t40()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t41 = (() => {
                const t51 = (() => {
                    const t54 = function STR() {
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = "\\";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t54();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t52 = (() => {
                    const t55 = function STR() {
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = "\"";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t55();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t53 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t51()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t52()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t53()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t42 = (() => {
                const t56 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 34) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t57 = function STR() {
                    OUT = "\"";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t56()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t57()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t43 = (() => {
                const t58 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 92) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t59 = function STR() {
                    OUT = "\\";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t58()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t59()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t44 = (() => {
                const t60 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 47) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t61 = function STR() {
                    OUT = "/";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t60()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t61()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t45 = (() => {
                const t62 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 98) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t63 = function STR() {
                    OUT = "\b";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t62()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t63()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t46 = (() => {
                const t64 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 102) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t65 = function STR() {
                    OUT = "\f";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t64()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t65()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t47 = (() => {
                const t66 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 110) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t67 = function STR() {
                    OUT = "\n";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t66()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t67()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t48 = (() => {
                const t68 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 114) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t69 = function STR() {
                    OUT = "\r";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t68()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t69()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t49 = (() => {
                const t70 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 116) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t71 = function STR() {
                    OUT = "\t";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t70()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t71()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t50 = (() => {
                const t72 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 117) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t73 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t72()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t73()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            return function SEL() {
                if (t41()) return true;
                if (t42()) return true;
                if (t43()) return true;
                if (t44()) return true;
                if (t45()) return true;
                if (t46()) return true;
                if (t47()) return true;
                if (t48()) return true;
                if (t49()) return true;
                if (t50()) return true;
                return false;
            };
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
            OUT = " ";
            return true;
        };
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65535) return false;
            IP += 1;
            OUT = "￿";
            return true;
        };
        return 𝕊1_max_memo(arg);
    };
    let 𝕊1_max_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_minDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    };

    const 𝕊2_base = (arg) => {
        if (!𝕊2_base_memo) 𝕊2_base_memo = function NUM() {
            OUT = 16;
            return true;
        };
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = function NUM() {
            OUT = 4;
            return true;
        };
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = function NUM() {
            OUT = 4;
            return true;
        };
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t74 = 𝕊0('WS');
            const t75 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 123) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t76 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t74()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t75()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t76()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t77 = 𝕊0('WS');
            const t78 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 125) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t79 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t77()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t78()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t79()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t80 = 𝕊0('WS');
            const t81 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 91) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t82 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t80()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t81()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t82()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t83 = 𝕊0('WS');
            const t84 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 93) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t85 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t83()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t84()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t85()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t86 = 𝕊0('WS');
            const t87 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 58) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t88 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t86()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t87()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t88()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t89 = 𝕊0('WS');
            const t90 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 44) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t91 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t89()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t90()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t91()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode: 6,
            expression: (() => {
                const t92 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 32) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t93 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 9) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t94 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 10) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t95 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 13) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEL() {
                    if (t92()) return true;
                    if (t93()) return true;
                    if (t94()) return true;
                    if (t95()) return true;
                    return false;
                };
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊3 = createExtension𝕊3({mode: 6});

    const 𝕊4 = createExtension𝕊4({mode: 6});

    // -------------------- Compile-time constants --------------------

    return 𝕊0('start');
})();




// --------------------------------------------------------------------------------
const print = (() => {

    // -------------------- json-recursive.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case '$1': return 𝕊0_$1;
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case '$2': return 𝕊0_$2;
            case 'unicode': return 𝕊0_unicode;
            case 'start': return 𝕊0_start;
            case 'Value': return 𝕊0_Value;
            case 'False': return 𝕊0_False;
            case 'Null': return 𝕊0_Null;
            case 'True': return 𝕊0_True;
            case 'Object': return 𝕊0_Object;
            case 'Properties': return 𝕊0_Properties;
            case 'Array': return 𝕊0_Array;
            case 'Elements': return 𝕊0_Elements;
            case 'Number': return 𝕊0_Number;
            case 'String': return 𝕊0_String;
            case 'CHAR': return 𝕊0_CHAR;
            case 'LBRACE': return 𝕊0_LBRACE;
            case 'RBRACE': return 𝕊0_RBRACE;
            case 'LBRACKET': return 𝕊0_LBRACKET;
            case 'RBRACKET': return 𝕊0_RBRACKET;
            case 'COLON': return 𝕊0_COLON;
            case 'COMMA': return 𝕊0_COMMA;
            case 'DOUBLE_QUOTE': return 𝕊0_DOUBLE_QUOTE;
            case 'WS': return 𝕊0_WS;
            default: return undefined;
        }
    };

    const 𝕊0_$1 = (arg) => {
        if (!𝕊0_$1_memo) 𝕊0_$1_memo = 𝕊3;
        return 𝕊0_$1_memo(arg);
    };
    let 𝕊0_$1_memo;

    const 𝕊0_char = (arg) => {
        if (!𝕊0_char_memo) 𝕊0_char_memo = 𝕊0('$1')('char');
        return 𝕊0_char_memo(arg);
    };
    let 𝕊0_char_memo;

    const 𝕊0_f64 = (arg) => {
        if (!𝕊0_f64_memo) 𝕊0_f64_memo = 𝕊0('$1')('f64');
        return 𝕊0_f64_memo(arg);
    };
    let 𝕊0_f64_memo;

    const 𝕊0_$2 = (arg) => {
        if (!𝕊0_$2_memo) 𝕊0_$2_memo = 𝕊4;
        return 𝕊0_$2_memo(arg);
    };
    let 𝕊0_$2_memo;

    const 𝕊0_unicode = (arg) => {
        if (!𝕊0_unicode_memo) 𝕊0_unicode_memo = 𝕊0('$2')('unicode');
        return 𝕊0_unicode_memo(arg);
    };
    let 𝕊0_unicode_memo;

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t96 = 𝕊0('WS');
            const t97 = 𝕊0('Value');
            const t98 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t96()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t97()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t98()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t99 = 𝕊0('False');
            const t100 = 𝕊0('Null');
            const t101 = 𝕊0('True');
            const t102 = 𝕊0('Object');
            const t103 = 𝕊0('Array');
            const t104 = 𝕊0('Number');
            const t105 = 𝕊0('String');
            return function SEL() {
                if (t99()) return true;
                if (t100()) return true;
                if (t101()) return true;
                if (t102()) return true;
                if (t103()) return true;
                if (t104()) return true;
                if (t105()) return true;
                return false;
            };
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t106 = function STR() {
                OUT = "false";
                return true;
            };
            const t107 = function BOO() {
                if (IN !== false || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t106()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t107()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t108 = function STR() {
                OUT = "null";
                return true;
            };
            const t109 = function NUL() {
                if (IN !== null || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t108()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t109()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t110 = function STR() {
                OUT = "true";
                return true;
            };
            const t111 = function BOO() {
                if (IN !== true || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t110()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t111()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t112 = 𝕊0('LBRACE');
            const t113 = (() => {
                const t115 = 𝕊0('Properties');
                const t116 = record({
                    mode: 7,
                    fields: [],
                });
                return function SEL() {
                    if (t115()) return true;
                    if (t116()) return true;
                    return false;
                };
            })();
            const t114 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t112()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t113()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t114()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Properties = (arg) => {
        if (!𝕊0_Properties_memo) 𝕊0_Properties_memo = (() => {
            const t117 = field({
                mode: 7,
                name: 𝕊0('String'),
                value: (() => {
                    const t119 = 𝕊0('COLON');
                    const t120 = 𝕊0('Value');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t119()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t120()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            const t118 = zeroOrOne({
                mode: 7,
                expression: (() => {
                    const t121 = 𝕊0('COMMA');
                    const t122 = 𝕊0('Properties');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t121()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t122()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t117()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t118()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Properties_memo(arg);
    };
    let 𝕊0_Properties_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t123 = 𝕊0('LBRACKET');
            const t124 = (() => {
                const t126 = 𝕊0('Elements');
                const t127 = list({
                    mode: 7,
                    elements: [],
                });
                return function SEL() {
                    if (t126()) return true;
                    if (t127()) return true;
                    return false;
                };
            })();
            const t125 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t123()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t124()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t125()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Elements = (arg) => {
        if (!𝕊0_Elements_memo) 𝕊0_Elements_memo = (() => {
            const t128 = list({
                mode: 7,
                elements: [
                    𝕊0('Value'),
                ],
            });
            const t129 = zeroOrOne({
                mode: 7,
                expression: (() => {
                    const t130 = 𝕊0('COMMA');
                    const t131 = 𝕊0('Elements');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t130()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t131()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t128()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t129()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Elements_memo(arg);
    };
    let 𝕊0_Elements_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t132 = 𝕊0('DOUBLE_QUOTE');
            const t133 = zeroOrMore({
                mode: 7,
                expression: 𝕊0('CHAR'),
            });
            const t134 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t132()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t133()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t134()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t135 = (() => {
                const t145 = (() => {
                    const t148 = function STR() {
                        if (typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = "\\";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t148();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t146 = (() => {
                    const t149 = function STR() {
                        if (typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = "\"";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t149();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t147 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t145()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t146()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t147()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t136 = (() => {
                const t150 = function STR() {
                    OUT = "\\\"";
                    return true;
                };
                const t151 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 34) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t150()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t151()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t137 = (() => {
                const t152 = function STR() {
                    OUT = "\\\\";
                    return true;
                };
                const t153 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t152()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t153()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t138 = (() => {
                const t154 = function STR() {
                    OUT = "\\/";
                    return true;
                };
                const t155 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 47) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t154()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t155()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t139 = (() => {
                const t156 = function STR() {
                    OUT = "\\b";
                    return true;
                };
                const t157 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 8) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t156()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t157()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t140 = (() => {
                const t158 = function STR() {
                    OUT = "\\f";
                    return true;
                };
                const t159 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 12) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t158()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t159()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t141 = (() => {
                const t160 = function STR() {
                    OUT = "\\n";
                    return true;
                };
                const t161 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 10) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t160()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t161()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t142 = (() => {
                const t162 = function STR() {
                    OUT = "\\r";
                    return true;
                };
                const t163 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 13) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t162()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t163()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t143 = (() => {
                const t164 = function STR() {
                    OUT = "\\t";
                    return true;
                };
                const t165 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 9) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t164()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t165()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t144 = (() => {
                const t166 = function STR() {
                    OUT = "\\u";
                    return true;
                };
                const t167 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t166()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t167()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            return function SEL() {
                if (t135()) return true;
                if (t136()) return true;
                if (t137()) return true;
                if (t138()) return true;
                if (t139()) return true;
                if (t140()) return true;
                if (t141()) return true;
                if (t142()) return true;
                if (t143()) return true;
                if (t144()) return true;
                return false;
            };
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
            OUT = " ";
            return true;
        };
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65535) return false;
            IP += 1;
            OUT = "￿";
            return true;
        };
        return 𝕊1_max_memo(arg);
    };
    let 𝕊1_max_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_minDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    };

    const 𝕊2_base = (arg) => {
        if (!𝕊2_base_memo) 𝕊2_base_memo = function NUM() {
            if (IN !== 16 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = function NUM() {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = function NUM() {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t168 = 𝕊0('WS');
            const t169 = function STR() {
                OUT = "{";
                return true;
            };
            const t170 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t168()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t169()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t170()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t171 = 𝕊0('WS');
            const t172 = function STR() {
                OUT = "}";
                return true;
            };
            const t173 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t171()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t172()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t173()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t174 = 𝕊0('WS');
            const t175 = function STR() {
                OUT = "[";
                return true;
            };
            const t176 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t174()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t175()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t176()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t177 = 𝕊0('WS');
            const t178 = function STR() {
                OUT = "]";
                return true;
            };
            const t179 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t177()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t178()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t179()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t180 = 𝕊0('WS');
            const t181 = function STR() {
                OUT = ":";
                return true;
            };
            const t182 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t180()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t181()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t182()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t183 = 𝕊0('WS');
            const t184 = function STR() {
                OUT = ",";
                return true;
            };
            const t185 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t183()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t184()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t185()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = function STR() {
            OUT = "\"";
            return true;
        };
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode: 7,
            expression: (() => {
                const t186 = function STR() {
                    OUT = " ";
                    return true;
                };
                const t187 = function STR() {
                    OUT = "\t";
                    return true;
                };
                const t188 = function STR() {
                    OUT = "\n";
                    return true;
                };
                const t189 = function STR() {
                    OUT = "\r";
                    return true;
                };
                return function SEL() {
                    if (t186()) return true;
                    if (t187()) return true;
                    if (t188()) return true;
                    if (t189()) return true;
                    return false;
                };
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊3 = createExtension𝕊3({mode: 7});

    const 𝕊4 = createExtension𝕊4({mode: 7});

    // -------------------- Compile-time constants --------------------

    return 𝕊0('start');
})();

// -------------------- Main exports --------------------
module.exports = {
    parse(text) {
        setState({ IN: text, IP: 0 });
        if (!parse()) throw new Error('parse failed');
        if (!isInputFullyConsumed()) throw new Error('parse didn\'t consume entire input');
        if (OUT === undefined) throw new Error('parse didn\'t return a value');
        return OUT;
    },
    print(node) {
        setState({ IN: node, IP: 0 });
        if (!print()) throw new Error('print failed');
        if (!isInputFullyConsumed()) throw new Error('print didn\'t consume entire input');
        if (OUT === undefined) throw new Error('print didn\'t return a value');
        return OUT;
    },
};
