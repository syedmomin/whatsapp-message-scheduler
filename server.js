const express = require('express');
const path = require('path');
const { initWhatsAppClient } = require('./whatsappClient');
const { scheduleMessage } = require('./scheduler');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize WhatsApp Client
initWhatsAppClient();

// Endpoints
app.get('/qr-code', getQRCode);
app.get('/status', getStatus);
app.post('/schedule-message', scheduleMessageEndpoint);
app.post('/logout', logoutClient);
app.get('/logs', getLogs);

// Start server
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

/** ================================
 * Endpoints & Helper Functions
 ==================================*/

// QR Code Endpoint
function getQRCode(req, res) {
    const qrCodeImage = require('./whatsappClient').qrCodeImage;
    if (qrCodeImage) {
        res.send(`<h2>Scan the QR Code to Authenticate</h2><img src="${qrCodeImage}" alt="QR Code">`);
    } else {
        res.status(404).send('Please wait...');
    }
}

// Status Endpoint
function getStatus(req, res) {
    const isAuthenticated = require('./whatsappClient').isAuthenticated;
    res.json({ authenticated: isAuthenticated });
}

// Schedule Message Endpoint
function scheduleMessageEndpoint(req, res) {
    const { phoneNumber, message, datetime } = req.body;
    if (!phoneNumber || !message || !datetime) {
        return res.status(400).send('Please provide phone number, message, and schedule time.');
    }

    scheduleMessage(phoneNumber, message, datetime);
    res.send('Message scheduled successfully!');
}

// Logout Endpoint
function logoutClient(req, res) {
    require('./whatsappClient').logoutClient(req, res);
}

// Logs Endpoint
function getLogs(req, res) {
    fs.readFile('log.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Unable to read log file');
        res.send(data);
    });
}