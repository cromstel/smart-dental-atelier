/**
 * Upload tests for the admin gallery endpoint.
 *
 * These cover the multipart path end-to-end against a real request stream,
 * because both bugs they lock down lived in the plumbing between formidable and
 * the filesystem and neither is visible from a mocked request object:
 *
 *  1. Next's built-in body parser drains the socket before the handler runs, so
 *     the route must export `config.api.bodyParser = false` or `form.parse`
 *     never calls back.
 *  2. formidable 3 defaults `createDirsFromUploads` to false, so without it the
 *     write stream fails on ENOENT and the upload silently disappears.
 *
 * The suite starts from a directory that does not exist, so the route has to
 * create its own staging directory. That is the same assertion as (2), made
 * through behaviour instead of through the source text.
 *
 * The route resolves its directories from `process.cwd()` at import time, so
 * the suite runs from a throwaway directory to keep `public/uploads` clean.
 */
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
const { Readable } = require('node:stream');

jest.mock('@/lib/prisma', () => ({
  prisma: {
    galleryImage: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn() },
  },
  isDatabaseConfigured: true,
}));

jest.mock('@/lib/audit', () => ({ audit: jest.fn(() => Promise.resolve()) }));

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn(async () => ({ sub: '1', role: 'ADMIN' })) }));

const { prisma } = require('@/lib/prisma');
const { getToken } = require('next-auth/jwt');

const realCwd = process.cwd();
let sandbox;

/**
 * Builds a multipart/form-data body and the matching request object.
 *
 * formidable reads `req.headers['content-type']` for the boundary and consumes
 * `req` as a stream, so the request double has to be a real Readable.
 */
function multipartRequest({ fields = {}, file, mimetype = 'image/jpeg', filename = 'photo.jpg' } = {}) {
  const boundary = '----dentalatelierTestBoundary1234567890';
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        'utf8',
      ),
    );
  }

  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
          `Content-Type: ${mimetype}\r\n\r\n`,
        'utf8',
      ),
      file,
      Buffer.from('\r\n', 'utf8'),
    );
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  const body = Buffer.concat(chunks);

  const req = Readable.from([body]);
  req.method = 'POST';
  req.headers = {
    host: 'localhost:3005',
    origin: 'http://localhost:3005',
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

function mockRes() {
  const res = {
    statusCode: 200,
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
    setHeader() {
      return res;
    },
    getHeader() {
      return undefined;
    },
    end(payload) {
      res.body = payload;
      res.ended = true;
      return res;
    },
    get req() {
      return { method: 'POST' };
    },
  };
  return res;
}

/** A real, decodable JPEG so sharp is exercised rather than mocked away. */
/** Lists what ended up in the uploads directory, treating "not created yet" as empty. */
async function listUploads() {
  return fs.readdir(path.join(sandbox, 'public', 'uploads')).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
}

/** Lists the per-request staging directories that formidable creates. */
async function listStaging() {
  return fs.readdir(path.join(sandbox, '.tmp-uploads')).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
}

let jpegBuffer;

beforeAll(async () => {
  const sharp = require('sharp');
  jpegBuffer = await sharp({
    create: { width: 24, height: 16, channels: 3, background: { r: 200, g: 180, b: 40 } },
  })
    .jpeg()
    .toBuffer();

  sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'dental-atelier-upload-'));
  process.chdir(sandbox);

  // Imported after the chdir so the route resolves its directories inside the
  // sandbox rather than the real project.
  galleryRoute = require('@/pages/api/admin/gallery');
});

afterAll(async () => {
  process.chdir(realCwd);
  await fs.rm(sandbox, { recursive: true, force: true });
});

let galleryRoute;

beforeEach(() => {
  // No `resetModules`: the route resolves `process.cwd()` at import time, so it
  // has to stay loaded from the sandbox created in `beforeAll`. Resetting here
  // would also hand the route a fresh copy of the mocked auth modules, breaking
  // the mock references the assertions rely on.
  jest.clearAllMocks();
  getToken.mockResolvedValue({ sub: '1', role: 'ADMIN' });
  prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', isActive: true });
  prisma.galleryImage.create.mockImplementation(async ({ data }) => ({ id: 7, ...data }));

  // Each test asserts on the exact contents of the uploads directory, so the
  // directory starts empty and may not even exist yet — which is also what
  // forces the route to create its own staging directory.
  return fs.rm(path.join(sandbox, 'public'), { recursive: true, force: true });
});

describe('gallery upload plumbing', () => {
  it('disables Next’s body parser so formidable owns the raw stream', () => {
    // If this ever reverts, `form.parse` silently never calls back and every
    // upload hangs until the client gives up.
    expect(galleryRoute.config).toEqual({ api: { bodyParser: false } });
  });

  it('stores the upload as WebP and records its dimensions', async () => {
    const res = mockRes();

    await galleryRoute.default(
      multipartRequest({
        file: jpegBuffer,
        fields: { altText: 'A patient smile after treatment', title: 'Veneers', category: 'smile' },
      }),
      res,
    );

    expect(res.statusCode).toBe(201);

    const created = prisma.galleryImage.create.mock.calls[0][0].data;
    expect(created.url).toMatch(/^\/uploads\/\d+-[0-9a-f]{12}\.webp$/);
    expect(created.width).toBe(24);
    expect(created.height).toBe(16);
    expect(created.altText).toBe('A patient smile after treatment');
    expect(created.title).toBe('Veneers');

    // The stored file really is WebP, and the JPEG is gone.
    const stored = await fs.readFile(path.join(sandbox, 'public', 'uploads', path.basename(created.url)));
    expect(stored.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(stored.subarray(8, 12).toString('ascii')).toBe('WEBP');

    // Nothing else is left behind: no source image, and the per-request staging
    // directory is gone.
    const uploads = await listUploads();
    expect(uploads).toEqual([path.basename(created.url)]);
    expect(await listStaging()).toEqual([]);
  });

  it('leaves no file behind when the form is rejected', async () => {
    const res = mockRes();

    // A .jpg arrives, but the alt text is missing, so validation rejects it.
    await galleryRoute.default(
      multipartRequest({ file: jpegBuffer, fields: { altText: '' } }),
      res,
    );

    expect(res.statusCode).toBe(422);
    expect(await listUploads()).toEqual([]);
    expect(await listStaging()).toEqual([]);
  });

  it('never writes the uploaded original, whatever format it arrived in', async () => {
    const png = await require('sharp')(jpegBuffer).png().toBuffer();

    const res = mockRes();
    await galleryRoute.default(
      multipartRequest({ file: png, filename: 'shot.png', mimetype: 'image/png', fields: { altText: 'Lab bench' } }),
      res,
    );

    expect(res.statusCode).toBe(201);
    const uploads = await listUploads();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].endsWith('.webp')).toBe(true);
  });

  it('rejects a file that is not an image before touching the database', async () => {
    const res = mockRes();

    await galleryRoute.default(
      multipartRequest({
        file: Buffer.from('not really an image'),
        filename: 'notes.txt',
        mimetype: 'text/plain',
        fields: { altText: 'nope' },
      }),
      res,
    );

    expect(res.statusCode).toBe(415);
    expect(prisma.galleryImage.create).not.toHaveBeenCalled();
    const uploads = await listUploads();
    expect(uploads).toEqual([]);
  });

  it('requires alt text', async () => {
    const res = mockRes();

    await galleryRoute.default(
      multipartRequest({ file: jpegBuffer, fields: { altText: '' } }),
      res,
    );

    expect(res.statusCode).toBe(422);
    expect(res.body.details).toHaveProperty('altText');
    expect(prisma.galleryImage.create).not.toHaveBeenCalled();
  });

  it('gives each concurrent upload its own staging directory', async () => {
    // A shared staging directory means one request's cleanup deletes the
    // other's temp file mid-transcode. The route creates a uniquely-named
    // subdirectory per request; this records the `mkdir` calls to prove it.
    const fsPromises = require('node:fs/promises');
    // A Set, because formidable's `createDirsFromUploads` re-creates the same
    // directory it was pointed at, so each request legitimately mkdirs twice.
    const created = new Set();
    const realMkdir = fsPromises.mkdir.bind(fsPromises);
    const spy = jest.spyOn(fsPromises, 'mkdir').mockImplementation(async (target, options) => {
      if (typeof target === 'string' && target.includes('.tmp-uploads')) created.add(target);
      return realMkdir(target, options);
    });

    try {
      await Promise.all([
        galleryRoute.default(
          multipartRequest({ file: jpegBuffer, fields: { altText: 'First upload' } }),
          mockRes(),
        ),
        galleryRoute.default(
          multipartRequest({ file: jpegBuffer, fields: { altText: 'Second upload' } }),
          mockRes(),
        ),
      ]);
    } finally {
      spy.mockRestore();
    }

    expect(prisma.galleryImage.create).toHaveBeenCalledTimes(2);
    // One directory per request, and the two are not the same directory.
    expect(created.size).toBe(2);
    expect(await listStaging()).toEqual([]);
  });

  it('answers 422 when the request carries no file at all', async () => {
    const res = mockRes();

    await galleryRoute.default(multipartRequest({ fields: { altText: 'orphan' } }), res);

    expect(res.statusCode).toBe(422);
    expect(prisma.galleryImage.create).not.toHaveBeenCalled();
  });
});
