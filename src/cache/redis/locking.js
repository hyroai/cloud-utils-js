const { makeLockUnlockWithId, withLockByInput } = require("gamlajs").default;
const { pipe, curryN } = require("ramda");

const distributedLock = curryN(4, (argsToLockId, lockIdToKey, redisClient, f) =>
  withLockByInput(
    argsToLockId,
    ...makeLockUnlockWithId(
      pipe(lockIdToKey, (key) =>
        redisClient.set(key, true, "EX", "1000", "NX")
      ),
      pipe(lockIdToKey, redisClient.del)
    ),
    f
  )
);

module.exports = {
  distributedLock,
};
