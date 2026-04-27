const db = require('../db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../jwtSecret');

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking password.' });
            }
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }
            // Generate JWT
            const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
            res.json({ token });
        });
    });
}; 