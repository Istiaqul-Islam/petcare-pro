// src/lib/cross-fetch-ponyfill.js
// Purpose: A minimal ponyfill that just uses global fetch/Headers/Request/Response.
// This is used as a webpack alias for 'cross-fetch' to avoid its XMLHttpRequest dependency
// which causes crashes in Cloudflare Edge environments.

const _fetch = globalThis.fetch.bind(globalThis);
const _Headers = globalThis.Headers;
const _Request = globalThis.Request;
const _Response = globalThis.Response;

module.exports = _fetch;
module.exports.fetch = _fetch;
module.exports.Headers = _Headers;
module.exports.Request = _Request;
module.exports.Response = _Response;
module.exports.default = _fetch;
