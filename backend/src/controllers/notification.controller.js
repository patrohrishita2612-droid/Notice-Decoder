const { getSupabaseClient } = require('../config/database');
const { memoryNotifications } = require('./notice.controller');

/**
 * Controller: Get notifications / alerts for current user
 * GET /api/notifications
 */
async function getNotifications(req, res, next) {
  try {
    let notifications = [];
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        notifications = data;
      } else {
        notifications = memoryNotifications;
      }
    } catch {
      notifications = memoryNotifications;
    }

    return res.status(200).json({
      notifications: notifications || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notif = memoryNotifications.find(n => String(n.id) === String(id));
    if (notif) {
      notif.is_read = true;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch {
      // Memory fallback
    }

    return res.status(200).json({
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
async function markAllAsRead(req, res, next) {
  try {
    memoryNotifications.forEach(n => {
      n.is_read = true;
    });

    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    } catch {
      // Memory fallback
    }

    return res.status(200).json({
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
