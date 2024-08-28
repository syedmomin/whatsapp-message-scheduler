const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

let qrCodeImage = '';
let isAuthenticated = false;

// Event listeners
client.on('qr', async (qr) => {
    try {
        qrCodeImage = await qrcode.toDataURL(qr);
        fs.writeFileSync(path.join(__dirname, 'public', 'qr-code.png'), qr);
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
});

client.on('authenticated', () => {
    isAuthenticated = true;
    logToFile('Authenticated successfully');
});

client.on('auth_failure', (msg) => {
    isAuthenticated = false;
    logToFile('Authentication failed: ' + msg);
});

client.on('ready', () => {
    logToFile('Client is ready!');
});

// Initialize WhatsApp client
client.initialize();

// Endpoints
app.get('/qr-code', (req, res) => {
    if (qrCodeImage) {
        res.send(`<h2>Scan the QR Code to Authenticate</h2><img src="${qrCodeImage}" alt="QR Code">`);
    } else {
        res.status(404).send('<div id="loading-code"><div></div><div></div><div></div><div></div></div><h4>Authentication in processing</h4>');
    }
});

app.get('/status', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

app.post('/schedule-message', (req, res) => {
    const { phoneNumber, message, datetime } = req.body;

    if (!phoneNumber || !message || !datetime) {
        return res.status(400).send('Please provide phone number, message, and schedule time.');
    }

    const formattedNumber = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
    const chatId = `${formattedNumber}@c.us`;

    scheduleJob(datetime, chatId, message);

    res.send('Message scheduled successfully!');
});

// Schedule a message job
function scheduleJob(scheduleTime, chatId, message) {
    schedule.scheduleJob(new Date(scheduleTime), async () => {
        try {
            await client.sendMessage(chatId, message);
            logToFile(`Message sent to ${chatId}: ${message}`);
        } catch (err) {
            logToFile('Failed to send message: ' + err);
        }
    });
}

// Logging function
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile('log.txt', `${timestamp} - ${message}\n`, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

app.get('/logs', (req, res) => {
    fs.readFile('log.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Unable to read log file');
        } else {
            res.send(data);
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});