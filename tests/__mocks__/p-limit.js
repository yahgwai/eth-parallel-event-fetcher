// Mock implementation of p-limit for Jest tests
function pLimit(concurrency) {
  return async function(fn) {
    return await fn();
  };
}

module.exports = pLimit;
module.exports.default = pLimit;