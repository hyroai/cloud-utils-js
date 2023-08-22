const { asyncPipe, withCacheAsyncCustom } = require("gamlajs").default;
const { unless, isEmpty } = require("ramda");
const { distributedLock } = require("./locking");

const cacheApiResources = (redisClient) => (
  argsToLockId,
  lockIdToKey,
  f,
  ttl
) =>
  distributedLock(
    argsToLockId,
    lockIdToKey,
    redisClient,
    withCacheAsyncCustom(
      asyncPipe(redisClient.get, unless(isEmpty, JSON.parse)),
      (key, results) =>
        redisClient.set(key, JSON.stringify(results), "EX", ttl),
      f
    )
  );

module.exports = {
  cacheApiResources,
};
