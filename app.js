const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const rimraf = require('rimraf');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

const MESSAGES_FILE = path.join(__dirname, 'scheduledMessages.json');

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});
const jobs = {}; 
let qrCodeImage = '';
let isAuthenticated = false;
let scheduledMessages = [];

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
    // logToFile('Client is ready!');
    rescheduleAllMessages(); // Reschedule messages on client ready
});

// Initialize WhatsApp client
client.initialize();


// Endpoints
app.get('/qr-code', (req, res) => {
    if (qrCodeImage) {
        res.send(`<h2>Scan the QR Code to Authenticate</h2><img src="${qrCodeImage}" alt="QR Code">`);
    } else {
        res.status(404).send('Please wait...');
    }
});

app.get('/status', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

// Load scheduled messages from file (if any)
function loadScheduledMessages() {
    if (fs.existsSync(MESSAGES_FILE)) {
        const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
        scheduledMessages = JSON.parse(data);
    }
}

// Save scheduled messages to file
function saveScheduledMessages() {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(scheduledMessages, null, 2), 'utf8');
}

// Reschedule all messages on startup
function rescheduleAllMessages() {
    scheduledMessages.forEach(({ id, phoneNumber, message, datetime }) => {
        const chatId = `${phoneNumber}@c.us`;
        scheduleJob(datetime, chatId, message);
    });
}

// Schedule Message Function
app.post('/schedule-message', (req, res) => {
    const { phoneNumber, message, datetime } = req.body;

    if (!phoneNumber || !message || !datetime) {
        return res.status(400).send('Please provide phone number, message, and schedule time.');
    }

    const formattedNumber = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
    const chatId = `${formattedNumber}@c.us`;

    const newMessage = {
        id: Date.now(), // Unique ID for the message
        phoneNumber: formattedNumber,
        message,
        datetime,
    };

    scheduledMessages.push(newMessage);
    saveScheduledMessages(); // Save messages to file
    scheduleJob(datetime, chatId, message);

    res.send('Message scheduled successfully!');
});

// schudled messages
app.get('/scheduled-messages', async (req, res) => {
    try {
        res.json(scheduledMessages);
    } catch (err) {
        logToFile('Failed to send message: ' + err);
    }
});

// Update a scheduled message
app.post('/edit-scheduled-message/:index', (req, res) => {
    const { newMessage } = req.body;
    const index = req.params.index;

    if (scheduledMessages[index]) {
        scheduledMessages[index].message = newMessage;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Message not found' });
    }
});

// Delete message endpoint
app.delete('/delete-message/:id', (req, res) => {
    const messageId = parseInt(req.params.id);

    // Find the index of the message
    const index = scheduledMessages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
        // Cancel the scheduled job if it exists
        if (jobs[messageId]) {
            jobs[messageId].cancel();
            delete jobs[messageId];
        }

        // Remove the message from the list
        scheduledMessages.splice(index, 1);

        res.send('Message deleted successfully!');
    } else {
        res.status(404).send('Message not found.');
    }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
    try {
        // Check if client is in ready state before logging out
        if (!client.info || !client.info.wid) {
            throw new Error('Client not ready, cannot log out');
        }

        // Attempt to log out
        await client.logout();

        // Remove authentication folders (wwebjs_auth and wwebjs_cache)
        const authDir = path.join(__dirname, '.wwebjs_auth');
        const cacheDir = path.join(__dirname, '.wwebjs_cache');

        rimraf(authDir, (err) => {
            if (err) console.error('Error removing auth directory:', err);
        });

        rimraf(cacheDir, (err) => {
            if (err) console.error('Error removing cache directory:', err);
        });

        isAuthenticated = false;
        res.send('Logged out successfully and folders removed.');
    } catch (error) {

        // Check for the specific error related to puppeteer evaluation
        if (error.message.includes('Evaluation failed')) {
            res.status(500).send('Logout failed due to Puppeteer issue.');
        } else {
            res.status(500).send('Error logging out.');
        }
    }
});

// Schedule a message job
function scheduleJob(scheduleTime, chatId, message, messageId) {
    const job = schedule.scheduleJob(new Date(scheduleTime), async () => {
        try {

            const messageExists = scheduledMessages.find(msg => msg.id === messageId);

            if (!messageExists) {
                logToFile(`Message with ID ${messageId} was deleted before it could be sent.`);
                delete jobs[messageId]; // Remove the job reference after confirming it's deleted
                return; // Exit the job as the message is deleted
            }
            
            await client.sendMessage(chatId, message);
            logToFile(`Message sent to ${chatId}: ${message}`);

            // After sending, remove from scheduledMessages
            scheduledMessages = scheduledMessages.filter(msg => msg.id !== messageId);
            delete jobs[messageId]; // Remove the job reference after sending
        } catch (err) {
            logToFile('Failed to send message: ' + err);
        }
    });

    jobs[messageId] = job; // Store the job so we can cancel it later if needed
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
    loadScheduledMessages(); // Load messages when server starts
});
