/**
 * Minimal Next.js API request/response doubles.
 *
 * Enough to exercise a route handler end-to-end (status codes, JSON body,
 * method routing) without pulling in node-mocks-http or a live database.
 */
import { ZodError } from 'zod';

export function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,

    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      res.ended = true;
      return res;
    },
    setHeader(key, value) {
      res.headers[key.toLowerCase()] = value;
      return res;
    },
    getHeader(key) {
      return res.headers[key.toLowerCase()];
    },
    end(payload) {
      res.body = payload;
      res.ended = true;
      return res;
    },
    write(payload) {
      res.body = payload;
      res.ended = true;
      return res;
    },
    /** Next.js reads `res.req.method` in `methodNotAllowed`. */
    get req() {
      return { method: this._method || 'GET' };
    },
  };

  return res;
}

export function createMockReq({
  method = 'GET',
  body,
  query = {},
  headers = { host: 'localhost:3031' },
  socket,
} = {}) {
  return {
    method,
    body,
    query,
    headers,
    socket: socket || { remoteAddress: '127.0.0.1' },
  };
}

/**
 * Runs a `pages/api/**` handler and returns `{ res, data }`.
 *
 * @param {(req,res) => Promise<void>} handler
 */
export async function callApi(handler, options = {}) {
  const req = createMockReq(options);
  const res = createMockRes();
  res._method = options.method || 'GET';
  req.res = res;

  await handler(req, res);

  let data = res.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      /* leave as the raw string */
    }
  }

  return { res, req, data, status: res.statusCode };
}

/** Builds a ZodError-shaped object for negative validation tests. */
export function zodError(path, message) {
  const error = new ZodError([{ code: 'custom', path: [path], message }]);
  return error;
}