import expect = require('expect');

export const jsonExpect = new Proxy(expect, {
  apply: (target, thisArg, argumentsList) => {
    const calledExpect = target.apply(thisArg, argumentsList);
    const received = argumentsList[0];
    Object.keys(calledExpect).map((key) => {
      if (typeof calledExpect[key] === 'function') {
        calledExpect[key] = new Proxy(calledExpect[key], {
          apply: (matcher, context, matcherArgumentsList) => {
            try {
              const expectationResult = matcher.apply(context, matcherArgumentsList);
              return {
                expected: matcherArgumentsList,
                matcher: key,
                passed: true,
                received,
              };
            } catch (e) {
              return {
                expected: matcherArgumentsList,
                matcher: key,
                passed: false,
                received,
              };
            }
          },
        });
      }
      return key;
    });

    return calledExpect;
  },
});
