// TODO: doc... has only 'ast' representation

function parseField(name: Rule, value: Rule) {
    const stateₒ = getState();
    const obj = {} as Record<string, unknown>;

    if (!name()) return false;
    assert(typeof OUT === 'string');
    const propName = OUT;

    if (!value()) return setState(stateₒ), false;
    assert(OUT !== undefined);
    obj[propName] = OUT;

    OUT = obj;
    return true;
}

function printField(name: Rule, value: Rule) {
    if (objectToString.call(IN) !== '[object Object]') return false;
    const stateₒ = getState();
    let text: unknown;

    const propNames = Object.keys(IN as any); // TODO: doc reliance on prop order and what this means
    const propCount = propNames.length;
    assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

    // TODO: temp testing...
    const obj = IN as Record<string, unknown>;
    let bitmask = IP;

    // Find the first property key/value pair that matches this field name/value pair (if any)
    for (let i = 0; i < propCount; ++i) {
        const propName = propNames[i];

        // TODO: skip already-consumed key/value pairs
        const propBit = 1 << i;
        if ((bitmask & propBit) !== 0) continue;

        // TODO: match field name
        setState({IN: propName, IP: 0});
        if (!name()) continue;
        if (IP !== propName.length) continue;
        text = concat(text, OUT);

        // TODO: match field value
        setState({IN: obj[propName], IP: 0});
        if (!value()) continue;
        if (!isInputFullyConsumed()) continue;
        text = concat(text, OUT);

        // TODO: we matched both name and value - consume them from `node`
        bitmask += propBit;
        setState({IN: obj, IP: bitmask});
        OUT = text;
        return true;
    }

    // If we get here, no match...
    setState(stateₒ);
    return false;
}
