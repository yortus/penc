const unicode: PenVal = {
    bindings: {},
    parse: sys.NOT_A_RULE,
    unparse: sys.NOT_A_RULE,
    apply(expr) {
        let base = expr.bindings.base?.constant?.value as number;
        let minDigits = expr.bindings.minDigits?.constant?.value as number;
        let maxDigits = expr.bindings.maxDigits?.constant?.value as number;
        sys.assert(typeof base === 'number' && base >= 2 && base <= 36);
        sys.assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
        sys.assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);

        return {
            bindings: {},

            parse() {
                // Construct a regex to match the digits
                let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                let regex = RegExp(pattern, 'i');

                let {IDOC, IMEM} = sys.getState();
                if (!sys.isString(IDOC)) return false;
                const LEN = IDOC.length;
                const EOS = '';

                let len = 0;
                let num = ''; // TODO: fix this - should actually keep count
                let c = IMEM < LEN ? IDOC.charAt(IMEM) : EOS;
                while (true) {
                    if (!regex.test(c)) break;
                    num += c;
                    IMEM += 1;
                    len += 1;
                    if (len === maxDigits) break;
                    c = IMEM < LEN ? IDOC.charAt(IMEM) : EOS;
                }

                if (len < minDigits) return false;
                sys.setInState(IDOC, IMEM);
                let result = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                sys.setOutState(result);
                return true;
            },

            unparse: () => {
                // TODO: implement
                return false;
            },

            apply: sys.NOT_A_LAMBDA,
        };
    },
};
