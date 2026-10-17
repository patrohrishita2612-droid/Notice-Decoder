const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  processNoticeFile,
  MockProvider
} = require('../src/services/ai.service');
const {
  decodeNoticeFile,
  uploadNoticeFile
} = require('../src/controllers/notice.controller');

describe('Document Upload & PDF Decoding Tests', () => {
  const samplePdfBuffer = Buffer.from('%PDF-1.4 sample pdf content for testing notice decode');

  it('should process a PDF document buffer with MockProvider and return valid 13-field schema', async () => {
    const mockModelOutput = {
      title: 'End Semester Laboratory Examination',
      summary: 'Computer Science Department practical exams scheduled for 20 November 2026 at Lab 3.',
      event_date: '20 November 2026',
      start_time: '09:00 AM',
      end_time: '12:00 PM',
      venue: 'Lab 3',
      deadline: '19 November 2026',
      target_audience: 'CSE 3rd Year Students',
      required_actions: ['Bring certified observation notebook', 'Arrive 15 minutes before exam'],
      documents_required: ['Laboratory Record', 'ID Card'],
      urgency: 'high',
      missing_information: [],
      evidence: ['End Semester Laboratory Examination', '20 November 2026', 'Lab 3']
    };

    const mockProvider = new MockProvider({ response: mockModelOutput });
    const result = await processNoticeFile(samplePdfBuffer, 'application/pdf', '', {
      providerInstance: mockProvider
    });

    assert.strictEqual(mockProvider.callCount, 1);
    assert.strictEqual(result.title, 'End Semester Laboratory Examination');
    assert.strictEqual(result.event_date, '20 November 2026');
    assert.strictEqual(result.venue, 'Lab 3');
    assert.strictEqual(result.urgency, 'high');
    assert.deepStrictEqual(result.documents_required, ['Laboratory Record', 'ID Card']);
    assert.deepStrictEqual(result.evidence, ['End Semester Laboratory Examination', '20 November 2026', 'Lab 3']);
  });

  it('should reject non-buffer or empty buffer inputs', async () => {
    await assert.rejects(
      async () => {
        await processNoticeFile(null, 'application/pdf');
      },
      err => err.status === 400 && err.message.includes('Invalid or empty file buffer')
    );

    await assert.rejects(
      async () => {
        await processNoticeFile(Buffer.alloc(0), 'application/pdf');
      },
      err => err.status === 400 && err.message.includes('Invalid or empty file buffer')
    );
  });

  it('should reject unsupported file MIME types', async () => {
    await assert.rejects(
      async () => {
        await processNoticeFile(samplePdfBuffer, 'text/plain');
      },
      err => err.status === 400 && err.message.includes('Unsupported file type')
    );
  });

  it('decodeNoticeFile should return 400 when no file is uploaded', async () => {
    const req = { file: null, body: {} };
    let responseStatus = null;
    let responseData = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await decodeNoticeFile(req, res, () => {});
    assert.strictEqual(responseStatus, 400);
    assert.ok(responseData.error.includes('No file uploaded'));
  });

  it('decodeNoticeFile should return 400 when file size exceeds 10MB limit', async () => {
    const req = {
      file: {
        originalname: 'giant_notice.pdf',
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB
        buffer: Buffer.alloc(100)
      },
      body: {}
    };
    let responseStatus = null;
    let responseData = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await decodeNoticeFile(req, res, () => {});
    assert.strictEqual(responseStatus, 400);
    assert.ok(responseData.error.includes('exceeds the 10MB limit'));
  });

  it('decodeNoticeFile should successfully process valid uploaded PDF file', async () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'fixtures', 'sample_notice.pdf');
    const pdfBuffer = fs.readFileSync(filePath);

    const mockOutput = {
      title: 'Annual Tech Symposium',
      summary: 'Computer Science Department symposium on 25 November 2026.',
      event_date: '25 November 2026',
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      venue: 'Main Auditorium Block A',
      deadline: '20 November 2026',
      target_audience: 'All Students',
      required_actions: ['Register before 20 November 2026'],
      documents_required: [],
      urgency: 'high',
      missing_information: [],
      evidence: ['ANNUAL TECH SYMPOSIUM: 25 NOVEMBER 2026', 'Main Auditorium Block A']
    };

    const mockProvider = new MockProvider({ response: mockOutput });
    const req = {
      file: {
        originalname: 'sample_notice.pdf',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        buffer: pdfBuffer
      },
      body: { text: '' }
    };

    let responseStatus = null;
    let responseData = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await decodeNoticeFile(req, res, () => {}, { providerInstance: mockProvider });
    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.data.title, 'Annual Tech Symposium');
    assert.strictEqual(responseData.data.event_date, '25 November 2026');
    assert.strictEqual(responseData.data.venue, 'Main Auditorium Block A');
    assert.strictEqual(responseData.fileInfo.fileName, 'sample_notice.pdf');
  });
});
