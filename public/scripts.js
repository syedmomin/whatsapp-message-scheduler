document.addEventListener('DOMContentLoaded', function() {
    // Start the client and load QR Code image
    fetch('/start')
        .then(response => response.text())
        .then(() => {
            loadQrCode();
            checkAuthentication();
        })
        .catch(error => {
            console.error('Error initializing client:', error);
        });

    // Load QR Code image
    function loadQrCode() {
        fetch('/qr-code')
            .then(response => response.text())
            .then(data => {
                document.getElementById('qr-code').innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading QR code:', error);
            });
    }

    // Check authentication status and show scheduling screen
    function checkAuthentication() {
        fetch('/status')
            .then(response => response.json())
            .then(status => {
                if (status.authenticated) {
                    document.getElementById('qr-code-container').classList.add('d-none');
                    document.getElementById('scheduling-container').classList.remove('d-none');
                }
            })
            .catch(error => {
                console.error('Error checking authentication status:', error);
            });
    }

    // Form submission to schedule a message
    document.getElementById('scheduleForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        fetch('/schedule-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.text())
        .then(data => {
            document.getElementById('response').innerText = data;
            document.getElementById('scheduleForm').reset();
            setTimeout(() => document.getElementById('response').innerText = '', 5000);
        })
        .catch(error => {
            document.getElementById('response').innerText = 'An error occurred: ' + error;
        });
    });

    // Load logs when the Logs tab is activated
    document.getElementById('logs-tab').addEventListener('click', () => {
        fetch('/logs')
            .then(response => response.text())
            .then(data => {
                document.getElementById('logContent').innerText = data;
            })
            .catch(error => {
                document.getElementById('logContent').innerText = 'An error occurred: ' + error;
            });
    });
});
