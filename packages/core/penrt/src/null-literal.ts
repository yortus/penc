// TODO: doc... has only 'ast' representation
function nullLiteral(options: StaticOptions): PenVal {
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            OUT = NO_PRODUCE ? undefined : null;
            return true;
        },

        unparse() {
            if (!NO_CONSUME) {
                if (IN !== null || IP !== 0) return false;
                IP = 1;
            }
            OUT = undefined;
            return true;
        },
    };
}
