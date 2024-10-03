document.addEventListener('DOMContentLoaded', () => {
    let pollInterval;
    const scheduleForm = document.getElementById('scheduleForm');
    const logsTab = document.getElementById('logs-tab');
    const logoutBtn = document.getElementById('logoutBtn');
    const responseElement = document.getElementById('response');
    const messagesList = document.getElementById('scheduled-messages-list');
    const logContent = document.getElementById('logContent');
    
    // Start polling for authentication status
    pollInterval = setInterval(checkAuthenticationStatus, 2000);

    // Check authentication status
    async function checkAuthenticationStatus() {
        try {
            const res = await fetch('/status');
            const status = await res.json();
            if (status.authenticated) {
                clearInterval(pollInterval); // Stop polling
                showSchedulingScreen();
            } else {
                loadQrCode();
            }
        } catch (error) {
            console.error('Error checking authentication status:', error);
        }
    }

    // Load the QR code
    async function loadQrCode() {
        try {
            const res = await fetch('/qr-code');
            const qrCodeHtml = await res.text();
            document.getElementById('qr-code').innerHTML = qrCodeHtml;
        } catch (error) {
            console.error('Error loading QR code:', error);
        }
    }

    // Display scheduling screen
    function showSchedulingScreen() {
        document.getElementById('qr-code-container').classList.add('d-none');
        document.getElementById('scheduling-container').classList.remove('d-none');
    }

    async function fetchScheduledMessages() {
        try {
            const res = await fetch('/scheduled-messages');
            const messages = await res.json();
            messagesList.innerHTML = ''; // Clear list

            messages.forEach((msg, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${msg.phoneNumber}</td>
                    <td><span id="message-${index}">${msg.message}</span></td>
                    <td>${new Date(msg.datetime).toLocaleString()}</td>
                    <td>
                        <button type="button" class="btn btn-outline-primary" data-edit="${msg.id}" data-index="${index}">
                            <i class="fas fa-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" data-delete="${msg.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                messagesList.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching scheduled messages:', error);
        }
    }

    // Edit or delete a message based on the button clicked
    messagesList.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const deleteId = target.getAttribute('data-delete');
        const editId = target.getAttribute('data-edit');
        const index = target.getAttribute('data-index');

        if (deleteId) {
            // Delete message
            try {
                const res = await fetch(`/delete-message/${deleteId}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchScheduledMessages(); // Refresh list
                } else {
                    alert('Failed to delete the message');
                }
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        } else if (editId) {
            // Edit message
            editMessage(editId, index);
        }
    });

    // Edit message logic
    async function editMessage(id, index) {
        const messageElement = document.getElementById(`message-${index}`);
        const originalMessage = messageElement.innerText;
        const newMessage = prompt('Edit your message:', originalMessage);

        if (newMessage && newMessage !== originalMessage) {
            try {
                const res = await fetch(`/edit-scheduled-message/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newMessage })
                });
                const result = await res.json();
                if (result.success) {
                    messageElement.innerText = newMessage;
                } else {
                    alert('Failed to update the message.');
                }
            } catch (error) {
                console.error('Error updating message:', error);
            }
        }
    }

    // Handle message scheduling form submission
    scheduleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/schedule-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.text();
            responseElement.innerText = result;
            scheduleForm.reset();
            fetchScheduledMessages();
            setTimeout(() => responseElement.innerText = '', 5000);
        } catch (error) {
            responseElement.innerText = 'An error occurred: ' + error;
        }
    });

    // Load logs when Logs tab is activated
    logsTab.addEventListener('click', async () => {
        try {
            const res = await fetch('/logs');
            const data = await res.text();
            logContent.innerText = data;
        } catch (error) {
            logContent.innerText = 'An error occurred: ' + error;
        }
    });

    // Handle user logout
    logoutBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await res.text();
            alert(result);
            location.reload(); // Refresh the page after logout
        } catch (error) {
            alert('Error logging out: ' + error);
        }
    });

    // Fetch messages on page load
    fetchScheduledMessages();
});