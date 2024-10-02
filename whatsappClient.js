const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

let qrCodeImage = '';
let isAuthenticated = false;
let qrRefreshInterval;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
});

function initWhatsAppClient() {
    client.on('qr', handleQRCode);
    client.on('authenticated', handleAuthenticated);
    client.on('auth_failure', handleAuthFailure);
    client.on('ready', () => {
        clearInterval(qrRefreshInterval); // Clear QR refresh interval once authenticated
        logToFile('Client is ready!');
    });

    client.initialize();
}

// Handle QR Code
async function handleQRCode(qr) {
    try {
        qrCodeImage = await qrcode.toDataURL(qr);
        fs.writeFileSync(path.join(__dirname, 'public', 'qr-code.png'), qr);
        logToFile('QR code generated.');
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
}

function startQRRefresh() {
    qrRefreshInterval = setInterval(() => {
        client.getQRCode().then(handleQRCode); // Re-generate the QR code
    }, 20000); // Refresh every 20 seconds (can adjust based on your needs)
}

// Handle Successful Authentication
function handleAuthenticated() {
    isAuthenticated = true;
    logToFile('Authenticated successfully');
}

// Handle Authentication Failure
function handleAuthFailure(msg) {
    isAuthenticated = false;
    logToFile('Authentication failed: ' + msg);
}

// Logout Client
async function logoutClient(req, res) {
    try {
        if (!client.info || !client.info.wid) {
            throw new Error('Client not ready, cannot log out');
        }

        await client.logout();
        removeAuthAndCacheFolders();
        isAuthenticated = false;
        res.send('Logged out successfully and folders removed.');
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Error logging out.');
    }
}

// Remove Authentication and Cache Folders
function removeAuthAndCacheFolders() {
    const authDir = path.join(__dirname, '.wwebjs_auth');
    const cacheDir = path.join(__dirname, '.wwebjs_cache');

    [authDir, cacheDir].forEach((dir) => {
        rimraf(dir, (err) => {
            if (err) console.error(`Error removing directory ${dir}:`, err);
        });
    });
}

// Log messages to file
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile('log.txt', `${timestamp} - ${message}\n`, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

// Getter to always return the latest QR code image
function getQRCodeImage() {
    return qrCodeImage;
}

module.exports = {
    initWhatsAppClient,
    logoutClient,
    getQRCodeImage,  // Export the getter for qrCodeImage
    get isAuthenticated() {
        return isAuthenticated;
    }
};
