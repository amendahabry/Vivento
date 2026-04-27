require('dotenv').config();
const db = require('../db/database');
const crypto = require('crypto');

function queueAdminVisitAlert(source, messageText) {
    const phone = process.env.ADMIN_NOTIFY_PHONE;
    const guestName = process.env.ADMIN_NOTIFY_NAME || 'Admin';
    if (!phone) return;
    db.run(
        `INSERT INTO messaging_queue (phone_number, guest_name, source, message, status) 
                            VALUES (?, ?, ?, ?, ?)`,
        [phone, guestName, source, messageText, 'pending'],
        function (err) {
            if (err) console.error(err.message);
        }
    );
}

// Get client IP address from request
function getClientIP(req) {
    let ip =
        req.headers['x-forwarded-for']?.split(',')[0] || // first IP in list
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
        req.ip ||
        'unknown';

    // Remove IPv6 prefix if exists
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }
    return ip;
}

exports.trackVisit = (req, res) => {
    try {
        const {
            userAgent,
            language,
            screenResolution,
            timezone,
            referrer,
            pageUrl,
            sessionId
        } = req.body;

        // Get IP address
        const ipAddress = getClientIP(req);

        // Generate device ID if not provided
        const deviceId = req.body.deviceId;

        // Insert visit record
        const sql = `
      INSERT INTO visits (
        device_id, 
        ip_address, 
        user_agent, 
        language, 
        screen_resolution, 
        timezone, 
        referrer, 
        page_url, 
        session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            deviceId,
            ipAddress,
            userAgent || req.headers['user-agent'] || null,
            language || req.headers['accept-language'] || null,
            screenResolution || null,
            timezone || null,
            referrer || req.headers['referer'] || null,
            pageUrl || req.headers['referer'] || null,
            sessionId || null
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error tracking visit:', err);
                return res.status(500).json({
                    error: 'Failed to track visit',
                    deviceId: deviceId // Return device ID even if tracking fails
                });
            }

            queueAdminVisitAlert(
                'visit',
                `You had a visit!\n${deviceId}\n${ipAddress}\n${screenResolution}\n${timezone}\n${language}\n${userAgent}`
            );

            res.json({
                success: true,
                deviceId: deviceId,
                visitId: this.lastID
            });
        });


    } catch (error) {
        console.error('Error in trackVisit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.trackPageVisit = (req, res) => {
    try {
        const {
            userAgent,
            language,
            screenResolution,
            timezone,
            referrer,
            pageUrl,
            sessionId,
            pageName,
            pagePath,
            previousPage,
            navigationType
        } = req.body;

        // Get IP address
        const ipAddress = getClientIP(req);

        // Generate device ID if not provided
        const deviceId = req.body.deviceId;

        // Insert page visit record with enhanced data
        const sql = `
      INSERT INTO visits (
        device_id, 
        ip_address, 
        user_agent, 
        language, 
        screen_resolution, 
        timezone, 
        referrer, 
        page_url, 
        session_id,
        page_name,
        page_path,
        previous_page,
        navigation_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            deviceId,
            ipAddress,
            userAgent || req.headers['user-agent'] || null,
            language || req.headers['accept-language'] || null,
            screenResolution || null,
            timezone || null,
            referrer || req.headers['referer'] || null,
            pageUrl || req.headers['referer'] || null,
            sessionId || null,
            pageName || null,
            pagePath || null,
            previousPage || null,
            navigationType || null
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error tracking page visit:', err);
                return res.status(500).json({
                    error: 'Failed to track page visit',
                    deviceId: deviceId // Return device ID even if tracking fails
                });
            }

            if (navigationType != 'reload') {
                // Send notification for page visits (optional - you can customize this)
                queueAdminVisitAlert(
                    'page_visit',
                    `*Page visit tracked!*\n*deviceId*: ${deviceId}\n*ipAddress*: ${ipAddress}\n*userAgent*: ${userAgent}\n*language*: ${language}\n*screenResolution*: ${screenResolution}\n*timezone*: ${timezone}\n*referrer*: ${referrer}\n*pageUrl*: ${pageUrl}`
                );
            }

            res.json({
                success: true,
                deviceId: deviceId,
                visitId: this.lastID
            });
        });

    } catch (error) {
        console.error('Error in trackPageVisit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateVisitDuration = (req, res) => {
    try {
        const { deviceId, sessionId, duration } = req.body;

        if (!deviceId || !duration) {
            return res.status(400).json({ error: 'Device ID and duration are required' });
        }

        const sql = `
      UPDATE visits 
      SET visit_duration = ?, updated_at = datetime('now')
      WHERE device_id = ? AND session_id = ?
      AND id = (SELECT MAX(id) FROM visits WHERE device_id = ? AND session_id = ?)
    `;

        db.run(sql, [duration, deviceId, sessionId || null, deviceId, sessionId || null], function (err) {
            if (err) {
                console.error('Error updating visit duration:', err);
                return res.status(500).json({ error: 'Failed to update visit duration' });
            }

            res.json({
                success: true,
                changes: this.changes
            });
        });

    } catch (error) {
        console.error('Error in updateVisitDuration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getVisitStats = (req, res) => {
    try {
        const { startDate, endDate, deviceId } = req.query;

        let sql = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(DISTINCT ip_address) as unique_ips,
        AVG(visit_duration) as avg_duration,
        MIN(created_at) as first_visit,
        MAX(created_at) as last_visit
      FROM visits
    `;

        const params = [];
        const conditions = [];

        if (startDate) {
            conditions.push('created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            conditions.push('created_at <= ?');
            params.push(endDate);
        }

        if (deviceId) {
            conditions.push('device_id = ?');
            params.push(deviceId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        db.get(sql, params, (err, stats) => {
            if (err) {
                console.error('Error getting visit stats:', err);
                return res.status(500).json({ error: 'Failed to get visit statistics' });
            }

            res.json(stats);
        });

    } catch (error) {
        console.error('Error in getVisitStats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getRecentVisits = (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const sql = `
      SELECT 
        id,
        device_id,
        ip_address,
        user_agent,
        language,
        screen_resolution,
        timezone,
        referrer,
        page_url,
        session_id,
        visit_duration,
        created_at,
        updated_at
      FROM visits 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

        db.all(sql, [limit, offset], (err, visits) => {
            if (err) {
                console.error('Error getting recent visits:', err);
                return res.status(500).json({ error: 'Failed to get recent visits' });
            }

            res.json(visits);
        });

    } catch (error) {
        console.error('Error in getRecentVisits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 