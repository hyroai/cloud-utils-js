const { asyncPipe, withCacheAsyncCustom } = require("gamlajs").default;
const { unless, isEmpty } = require("ramda");
const { filter, map, mergeAll, pipe } = require("ramda");
const { promisify } = require("util");
const { distributedLock } = require("./locking");

const promisifyRedisClient = (redisClient) =>
  pipe(
    filter((command) => redisClient[command]),
    map((command) => ({
      [command]: promisify(redisClient[command]).bind(redisClient),
    })),
    mergeAll
  )([
    "set",
    "setex",
    "expire",
    "lrange",
    "rpush",
    "llen",
    "get",
    "exists",
    "incr",
    "del",
    "publish",
    "on",
    "sadd",
    "srem",
    "sismember",
    "smembers",
    "smove",
  ]);

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
  promisifyRedisClient,
};
