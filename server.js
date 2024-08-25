const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
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

// Generate and print QR code for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Handle client authentication success
client.on('authenticated', () => {
    logToFile('Authenticated successfully');
});

// Handle client authentication failure
client.on('auth_failure', (msg) => {
    logToFile('Authentication failed: ' + msg);
});

// Handle client ready event
client.on('ready', () => {
    logToFile('Client is ready!');
});

// Initialize the WhatsApp client
client.initialize();

// Endpoint to schedule a message
app.post('/schedule-message', async (req, res) => {
    const { number, message, schedule } = req.body;

    if (!number || !message || !schedule) {
        return res.status(400).send('Please provide phone number, message, and schedule.');
    }

    // Remove any leading zeros from the number
    const formattedNumber = number.startsWith('0') ? number.slice(1) : number;

    // Add country code for Pakistan
    const chatId = `92${formattedNumber}@c.us`;

    // Schedule the message
    scheduleJob(schedule, chatId, message);

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
