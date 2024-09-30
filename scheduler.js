const schedule = require('node-schedule');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');

const client = new Client();

// Schedule Message Function
function scheduleMessage(phoneNumber, message, datetime) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    const chatId = `${formattedNumber}@c.us`;

    scheduleJob(datetime, chatId, message);
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
    return phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;
}

// Schedule Job Function
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

// Log to file function (shared functionality)
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile('log.txt', `${timestamp} - ${message}\n`, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

module.exports = {
    scheduleMessage,
};
