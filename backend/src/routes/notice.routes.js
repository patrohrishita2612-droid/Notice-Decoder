const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadNoticeFile,
  checkDuplicateNotice,
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNoticeStatus
} = require('../controllers/notice.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Multer memory storage configuration with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB maximum limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${file.mimetype}. Only PDF, JPG, and PNG are allowed.`));
    }
  }
});

// Protect all notice routes with authentication
router.use(requireAuth);

// POST /api/notices/upload - Upload PDF, JPG, PNG document & extract data
router.post('/upload', upload.single('file'), uploadNoticeFile);

// POST /api/notices/check-duplicate - Check if title or date is already scheduled
router.post('/check-duplicate', checkDuplicateNotice);

// POST /api/notices - Submit and process a new notice
router.post('/', createNotice);

// GET /api/notices - Retrieve notices
router.get('/', getAllNotices);

// GET /api/notices/:id - Retrieve a specific notice by ID
router.get('/:id', getNoticeById);

// PATCH /api/notices/:id/status - Update notice status (Professor only)
router.patch('/:id/status', requireRole('professor'), updateNoticeStatus);

module.exports = router;
