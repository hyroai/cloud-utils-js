const { asyncPipe, withCacheAsyncCustom } = require("gamlajs").default;
const { unless, isEmpty } = require("ramda");
const redis = require("redis");
const { distributedLock } = require("./locking");
const { promisifyRedisClient } = require("./utils");

const makeNewRedisClient = (redisConfig) => redis.createClient(redisConfig);

module.exports = (redisConfig) => {
  const redisClient = promisifyRedisClient(makeNewRedisClient(redisConfig));

  redisClient.on("ready", () => console.log("Redis client connected"));

  redisClient.on("error", (err) => console.error("Redis client error", err));

  const cacheApiResources = (argsToLockId, lockIdToKey, f, ttl) =>
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

  return {
    ...redisClient,
    cacheApiResources,
    makeNewRedisClient,
  };
};
