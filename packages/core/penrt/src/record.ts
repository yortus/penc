// TODO: doc... has only 'ast' representation

function parseRecord(fields: Array<{name: string, value: Rule}>) {
    const stateₒ = getState();
    const obj = {} as Record<string, unknown>;
    for (const field of fields) {
        const propName = field.name;
        if (!field.value()) return setState(stateₒ), false;
        assert(OUT !== undefined);
        obj[propName] = OUT;
    }
    OUT = obj;
    return true;
}

function printRecord(fields: Array<{name: string, value: Rule}>) {
    if (objectToString.call(IN) !== '[object Object]') return false;
    const stateₒ = getState();
    let text: unknown;

    const propNames = Object.keys(IN as any); // TODO: doc reliance on prop order and what this means
    const propCount = propNames.length;
    assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it

    // TODO: temp testing...
    const obj = IN as Record<string, unknown>;
    let bitmask = IP;

    for (const field of fields) {

        // Find the property key/value pair that matches this field name/value pair (if any)
        const i = propNames.indexOf(field.name);
        if (i < 0) return setState(stateₒ), false;
        const propName = propNames[i];

        // TODO: skip already-consumed key/value pairs
        const propBit = 1 << i;
        if ((bitmask & propBit) !== 0) return setState(stateₒ), false;

        // TODO: match field value
        setState({IN: obj[propName], IP: 0});
        if (!field.value()) return setState(stateₒ), false;
        if (!isInputFullyConsumed()) return setState(stateₒ), false;
        text = concat(text, OUT);

        // TODO: we matched both name and value - consume them from `node`
        bitmask += propBit;
    }
    setState({IN: obj, IP: bitmask});
    OUT = text;
    return true;
}
