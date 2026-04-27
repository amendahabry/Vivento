const db = require('../db/database');

class EventController {
  // Validate event by ID
  static async validateEvent(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      const query = `
        SELECT id, name, date, location_address, latitude, longitude, google_maps_url, waze_url, note
        FROM events 
        WHERE id = ?
      `;

      db.get(query, [eventId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error validating event'
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }

        // Check if event date is in the future or today
        const eventDate = new Date(row.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

        const isEventValid = eventDate >= today;

        res.json({
          success: true,
          data: {
            id: row.id,
            name: row.name,
            date: row.date,
            time: row.time,
            location_address: row.location_address,
            latitude: row.latitude,
            longitude: row.longitude,
            google_maps_url: row.google_maps_url,
            waze_url: row.waze_url,
            note: row.note,
            isValid: isEventValid
          }
        });
      });
    } catch (error) {
      console.error('Validate event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get event details by ID
  static async getEvent(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      const query = `
        SELECT id, name, date, time, location_address, latitude, longitude, google_maps_url, waze_url, note
        FROM events 
        WHERE id = ?
      `;

      db.get(query, [eventId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching event'
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }

        res.json({
          id: row.id,
          name: row.name,
          date: row.date,
          time: row.time,
          location_address: row.location_address,
          latitude: row.latitude,
          longitude: row.longitude,
          google_maps_url: row.google_maps_url,
          waze_url: row.waze_url,
          note: row.note,
        });
      });
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all events
  static async getAllEvents(req, res) {
    try {
      const query = `
        SELECT id, name, date, time, location_address, latitude, longitude, google_maps_url, waze_url, note
        FROM events 
        ORDER BY date ASC
      `;

      db.all(query, [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching events'
          });
        }

        res.json({
          success: true,
          data: rows
        });
      });
    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update event details by ID
  static async updateEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { name, date, time, location_address, latitude, longitude, google_maps_url, waze_url, note } = req.body;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      // Only update provided fields
      const fields = [];
      const values = [];
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (date !== undefined) { fields.push('date = ?'); values.push(date); }
      if (time !== undefined) { fields.push('time = ?'); values.push(time); }
      if (location_address !== undefined) { fields.push('location_address = ?'); values.push(location_address); }
      if (latitude !== undefined) { fields.push('latitude = ?'); values.push(latitude); }
      if (longitude !== undefined) { fields.push('longitude = ?'); values.push(longitude); }
      if (google_maps_url !== undefined) { fields.push('google_maps_url = ?'); values.push(google_maps_url); }
      if (waze_url !== undefined) { fields.push('waze_url = ?'); values.push(waze_url); }
      if (note !== undefined) { fields.push('note = ?'); values.push(note); }
      fields.push('updated_at = datetime("now")');

      if (fields.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update.'
        });
      }

      const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
      values.push(eventId);

      db.run(sql, values, function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error updating event'
          });
        }
        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Event not found'
          });
        }
        res.json({
          success: true,
          message: 'Event updated successfully'
        });
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = EventController; 