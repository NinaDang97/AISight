module.exports = {
  createConnection() {
    throw new Error('net.createConnection is not supported in React Native');
  },
  connect() {
    throw new Error('net.connect is not supported in React Native');
  },
  Socket: function Socket() {
    throw new Error('net.Socket is not supported in React Native');
  },
};
