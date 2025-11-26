const warn = method => {
  console.warn(`dns.${method} is not supported in React Native`);
};

const unsupported = method => (...args) => {
  warn(method);
  const maybeCallback = args[args.length - 1];
  if (typeof maybeCallback === 'function') {
    maybeCallback(new Error(`dns.${method} is not supported in React Native`));
  }
};

module.exports = {
  lookup: unsupported('lookup'),
  resolve: unsupported('resolve'),
  resolve4: unsupported('resolve4'),
  resolve6: unsupported('resolve6'),
};
