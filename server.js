const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const schedule = require('node-schedule');

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Create a new instance of the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

let qrCodeImage = '';
let isAuthenticated = false;

// Generate and serve QR code for authentication
client.on('qr', async (qr) => {
    try {
        qrCodeImage = await qrcode.toDataURL(qr);
        console.log('QR Code URL:', qrCodeImage);  // For debugging
        fs.writeFileSync(path.join(__dirname, 'public', 'qr-code.png'), qr); // Save QR code to a file
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
});

// Handle client authentication success
client.on('authenticated', () => {
    isAuthenticated = true;
    logToFile('Authenticated successfully');
});

// Handle client authentication failure
client.on('auth_failure', (msg) => {
    isAuthenticated = false;
    logToFile('Authentication failed: ' + msg);
});

// Handle client ready event
client.on('ready', () => {
    logToFile('Client is ready!');
});

// Initialize the WhatsApp client
client.initialize();

// Endpoint to serve the QR code image
app.get('/qr-code', (req, res) => {
    if (qrCodeImage) {
        res.send(`<img src="${qrCodeImage}" alt="QR Code">`);
    } else {
        res.status(404).send('QR code not available');
    }
});

// Endpoint to check authentication status
app.get('/status', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

// Endpoint to schedule a message
app.post('/schedule-message', async (req, res) => {
    const { phoneNumber, message, datetime } = req.body;

    if (!phoneNumber || !message || !datetime) {
        return res.status(400).send('Please provide number, message, and schedule.');
    }

    // Remove any leading zeros from the number
    const formattedNumber = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
    const chatId = `92${formattedNumber}@c.us`;

    scheduleJob(datetime, chatId, message);

    res.send('Message scheduled successfully!');
});

// Function to schedule a job
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

// Function to log messages to log.txt
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile('log.txt', `${timestamp} - ${message}\n`, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

// Endpoint to serve the log file
app.get('/logs', (req, res) => {
    fs.readFile('log.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Unable to read log file');
        } else {
            res.send(data);
        }
    });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});