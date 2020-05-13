// TODO: doc... this rule is representation-agnostic
function selection(options: StaticOptions & {expressions: PenVal[]}): PenVal {
    const {expressions} = options;
    const arity = expressions.length;
    return {
        parse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse()) return true;
            }
            return false;
        },

        unparse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse()) return true;
            }
            return false;
        },
    };
}