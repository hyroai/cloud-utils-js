const { filter, map, mergeAll, pipe } = require("ramda");
const { promisify } = require("util");

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

module.exports = {
  promisifyRedisClient,
};
