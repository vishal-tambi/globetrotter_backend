const AuditLog = require('../models/AuditLog');
const { format } = require('date-fns');

const logSecurityEvent = async (eventData) => {
  const logEntry = new AuditLog({
    timestamp: new Date(),
    eventType: eventData.event,
    userId: eventData.userId || null,
    username: eventData.username || null,
    ipAddress: eventData.ip || null,
    userAgent: eventData.userAgent || null,
    metadata: {
      route: eventData.route || null,
      error: eventData.error || null,
      ...eventData.metadata
    }
  });

  try {
    await logEntry.save();
    console.log(`[SECURITY] ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} - ${eventData.event}`);
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};

const logApiRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logSecurityEvent({
      event: 'API_REQUEST',
      ip: req.ip,
      userId: req.user?._id,
      username: req.user?.username,
      route: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      metadata: {
        durationMs: duration,
        userAgent: req.headers['user-agent']
      }
    });
  });
  
  next();
};

module.exports = {
  logSecurityEvent,
  logApiRequest
};