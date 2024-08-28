const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: 'postgresql://postgres:mKvQGZmWZvPmPeCjimiGERPYMiifViOJ@autorack.proxy.rlwy.net:48177/railway'
});

// Function to get or create a user by WhatsApp ID
async function getOrCreateUser(whatsappId) {
    try {
        const userQuery = 'SELECT * FROM users WHERE whatsapp_id = $1';
        const userResult = await pool.query(userQuery, [whatsappId]);

        if (userResult.rows.length > 0) {
            return userResult.rows[0].id;
        } else {
            const insertQuery = 'INSERT INTO users (whatsapp_id) VALUES ($1) RETURNING id';
            const insertResult = await pool.query(insertQuery, [whatsappId]);
            return insertResult.rows[0].id;
        }
    } catch (err) {
        console.error('Error getting or creating user:', err);
        throw err;
    }
}

module.exports = { pool, getOrCreateUser };
