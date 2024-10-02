document.addEventListener('DOMContentLoaded', function () {
    let pollInterval;

    // Start polling for authentication status
    startAuthenticationPolling();

    function startAuthenticationPolling() {
        pollInterval = setInterval(checkAuthenticationStatus, 2000); // Check every 2 seconds
    }

    function checkAuthenticationStatus() {
        fetch('/status')
            .then(response => response.json())
            .then(status => {
                if (status.authenticated) {
                    clearInterval(pollInterval); // Stop polling
                    showSchedulingScreen(); // Switch to scheduling screen
                } else {
                    loadQrCode(); // Continue showing QR code if not authenticated
                }
            })
            .catch(error => {
                console.error('Error checking authentication status:', error);
            });
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
        document.getElementById('logoutButton').classList.remove('d-none'); 
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


    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.text();
            alert(result);
            // Optionally, redirect the user to the login page or refresh the page
            location.reload();
        } catch (error) {
            alert('Error logging out: ' + error);
        }
    });

    // Fetch scheduled messages and display them
async function fetchScheduledMessages() {
    const response = await fetch('/scheduled-messages');
    const messages = await response.json();
  
    const messagesList = document.getElementById('scheduled-messages-list');
    messagesList.innerHTML = '';
  
    messages.forEach((msg, index) => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${msg.phoneNumber}</td>
        <td>${msg.message}</td>
        <td>${new Date(msg.time).toLocaleString()}</td>
        <td>
          <button onclick="editMessage(${index})">Edit</button>
          <button onclick="deleteMessage(${msg.id})">Delete</button>
        </td>
      `;
  
      messagesList.appendChild(row);
    });
  }
  
  // Call the fetch function on page load
  fetchScheduledMessages();
  
});
