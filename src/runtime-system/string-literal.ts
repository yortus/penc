function stringLiteral(value: string): PenVal {
    return {
        bindings: {},

        parse() {
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }
            ODOC = ONUL ? undefined : value;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }
            ODOC = ONUL ? undefined : value;
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}