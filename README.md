# WhatsApp Message Scheduler Extension

This WhatsApp extension allows you to schedule messages by scanning a QR code that opens a form with three fields: phone number, message, and scheduled time. The extension ensures secure communication and includes features like QR code updates every 10 seconds, message logging, and more.

## Features

- **QR Code Authentication**: Scan the QR code to authenticate your WhatsApp account and access the message scheduling form.
- **Secure Message Scheduling**: Schedule messages to be sent at a specific date and time, ensuring that all data is handled securely.
- **Real-Time QR Code Updates**: The QR code updates every 10 seconds to ensure the latest authentication code is available.
- **Form Fields**: 
  - **Phone Number**: Enter the recipient's phone number (with country code).
  - **Message**: Type the message you want to send.
  - **Schedule Time**: Select the date and time when the message should be sent.
- **Message Logging**: All scheduled messages and their statuses are logged for future reference.
- **Responsive UI**: A user-friendly interface that works well on different screen sizes.


### Security

- **All messages are sent securely using the authenticated WhatsApp Web session.**
- **QR codes are refreshed every 10 seconds to ensure the highest security during the authentication process.**
- **Logs are created for all scheduled messages, providing a history of sent messages and their statuses.**
 

### Future Enhancements

- **Multi-User Support: Allow multiple users to authenticate and schedule messages.**
- **Advanced Scheduling Options: Add options for recurring messages, message templates, etc.**
- **Custom Notifications: Notify users when a message is sent successfully or if it fails.**

# Contributions
 *Contributions are welcome! Feel free to fork the project and submit a pull request.*


 
 **Install Dependencies**:  
 ```bash
$ npm run install
```

 **Run the Application**: 
 ```bash
$ npm run start
```



