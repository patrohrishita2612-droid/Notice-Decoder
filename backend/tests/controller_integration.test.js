const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createNotice,
  decodeNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} = require('../src/controllers/notice.controller');
const { MockProvider } = require('../src/services/ai.service');

// Helper to create mock Express req and res
function createMockHttp(body = {}, params = {}) {
  const req = { body, params };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return { req, res };
}

describe('Controller Integration Tests', () => {
  it('should return 400 when notice text is empty (preserves Member 2 contract)', async () => {
    const { req, res } = createMockHttp({ text: '' });
    await createNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { error: 'Notice text is required.' });
  });

  it('should return 400 when body is not an object', async () => {
    const { req, res } = createMockHttp(null);
    await createNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Invalid request body'));
  });

  it('should return 400 when text is too short for AI processing', async () => {
    const { req, res } = createMockHttp({ text: 'Tiny' });
    await createNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('too short'));
  });

  it('decodeNotice should return 400 when text is missing', async () => {
    const { req, res } = createMockHttp({});
    await decodeNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { error: 'Notice text is required.' });
  });

  it('updateNotice should return 400 when ID parameter is missing', async () => {
    const { req, res } = createMockHttp({ summary: 'Updated summary' }, { id: '' });
    await updateNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Notice ID is required'));
  });

  it('updateNotice should return 400 when request body is empty', async () => {
    const { req, res } = createMockHttp({}, { id: 'notice-123' });
    await updateNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('empty'));
  });

  it('deleteNotice should return 400 when ID parameter is missing', async () => {
    const { req, res } = createMockHttp({}, { id: '' });
    await deleteNotice(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Notice ID is required'));
  });

  it('getNoticeById should return 400 when ID parameter is missing', async () => {
    const { req, res } = createMockHttp({}, { id: '' });
    await getNoticeById(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Notice ID is required'));
  });

  it('getAllNotices should return 200 with an array', async () => {
    const { req, res } = createMockHttp();
    await getAllNotices(req, res, err => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.notices));
  });
});
