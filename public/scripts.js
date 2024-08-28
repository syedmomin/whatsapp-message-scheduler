document.addEventListener('DOMContentLoaded', function () {
    // First check authentication status
    fetch('/status')
        .then(response => response.json())
        .then(status => {
            if (status.authenticated) {
                showSchedulingScreen();
            } else {
                startQrCodePolling();
            }
        })
        .catch(error => {
            console.error('Error checking authentication status:', error);
        });

    function startQrCodePolling() {
        loadQrCode(); // Load QR code initially
        setInterval(loadQrCode, 5000); // Poll every 5 seconds to load QR code
    }

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

    function showSchedulingScreen() {
        document.getElementById('qr-code-container').classList.add('d-none');
        document.getElementById('scheduling-container').classList.remove('d-none');
    }

    // Form submission to schedule a message
    document.getElementById('scheduleForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/schedule-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.text();
            document.getElementById('response').innerText = result;
            document.getElementById('scheduleForm').reset();
            setTimeout(() => document.getElementById('response').innerText = '', 5000);
        } catch (error) {
            document.getElementById('response').innerText = 'An error occurred: ' + error;
        }
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
