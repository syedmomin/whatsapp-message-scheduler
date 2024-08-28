const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { pool, getOrCreateUser } = require('./db/config');

// Express setup
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.static('public'));

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth()
});

let qrCodeImage = '';
let userId = null;

client.on('qr', async (qr) => {
    qrCodeImage = await qrcode.toDataURL(qr);
});

client.on('ready', async () => {
    const whatsappId = client.info.wid.user; // Unique identifier for the session
    userId = await getOrCreateUser(whatsappId);
    console.log(`User authenticated with ID: ${userId}`);
    console.log('Client is ready!');
});

client.initialize();

// Routes

// Serve QR code to the user
app.get('/qr-code', (req, res) => {
    if (qrCodeImage) {
        res.send(`<h2>Scan the QR Code to Authenticate</h2><img src="${qrCodeImage}" alt="QR Code">`);
    } else {
        res.status(404).send('Authentication in process. Please wait...');
    }
});

// Schedule a message
app.post('/schedule-message', async (req, res) => {
    const { phoneNumber, message, datetime } = req.body;

    if (!userId) {
        return res.status(403).send('User not authenticated.');
    }

    if (!phoneNumber || !message || !datetime) {
        return res.status(400).send('Please provide phone number, message, and schedule time.');
    }

    const formattedNumber = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
    const chatId = `92${formattedNumber}@c.us`;

    schedule.scheduleJob(new Date(datetime), async () => {
        try {
            await client.sendMessage(chatId, message);
            await pool.query('INSERT INTO scheduled_messages (user_id, phone_number, message, scheduled_time) VALUES ($1, $2, $3, $4)', [userId, phoneNumber, message, datetime]);
            console.log(`Message sent to ${chatId}: ${message}`);
        } catch (err) {
            console.log('Failed to send message:', err);
        }
    });

    res.send('Message scheduled successfully!');
});

// View logs and scheduled messages
app.get('/logs', async (req, res) => {
    if (!userId) {
        return res.status(403).send('User not authenticated.');
    }

    try {
        const logs = await pool.query('SELECT * FROM scheduled_messages WHERE user_id = $1', [userId]);
        res.json(logs.rows);
    } catch (err) {
        res.status(500).send('Unable to retrieve logs.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
