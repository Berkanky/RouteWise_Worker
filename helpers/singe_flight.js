var server_cache = require("../cache");

var sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get_or_compute_with_lock(cacheKey, computeFn, {
  cacheTTL = 86400,
  lockTTL = 180,
  waitTimeoutMs = 15000,
  pollEveryMs = 300
} = {}) {

  if ( !server_cache.is_enabled() ) {

    var data = await computeFn();
    await server_cache.set?.(cacheKey, data, cacheTTL);

    return data;
  }

  var cached = await server_cache.get(cacheKey);
  if (cached != null) return cached;

  var lockKey = `lock:${cacheKey}`;
  var token = await server_cache.acquire_lock(lockKey, lockTTL);

  if (token) {

    try {

      cached = await server_cache.get(cacheKey);
      if (cached != null) return cached;

      var data = await computeFn();

      await server_cache.set(cacheKey, data, cacheTTL);
      return data;

    } catch (e) {
      throw e;
    } finally {
      await server_cache.release_lock(lockKey, token);
    }
  }

  var deadline = Date.now() + waitTimeoutMs;
  while (Date.now() < deadline) {

    await sleep(pollEveryMs + Math.floor(Math.random() * 200));
    cached = await server_cache.get(cacheKey);
    if (cached != null) return cached;
  }

  throw new Error("Timeout while waiting for cached result");
}

module.exports = { get_or_compute_with_lock };