const redis = require('./redis_client');
/* eslint-disable no-unused-vars */
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();
  const key = keyGenerator.getSlidingWindowRateLimiterKey(
    opts.interval,
    name,
    opts.maxHits,
  );

  // START Challenge #7
  const transaction = client.multi();

  const currTimeInMillis = timeUtils.getCurrentTimestampMillis();
  transaction.zadd(
    key,
    currTimeInMillis,
    `${currTimeInMillis}-${Math.random()}`,
  );
  transaction.zremrangebyscore(
    key,
    '-inf',
    `(${currTimeInMillis - opts.interval}`,
  );
  transaction.zcard(key);

  const res = await transaction.execAsync();
  const hits = parseInt(res[2], 10);

  const hitsRemaining = hits > opts.maxHits ? -1 : opts.maxHits - hits;

  return hitsRemaining;
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
