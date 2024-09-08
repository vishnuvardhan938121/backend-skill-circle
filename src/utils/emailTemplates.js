exports.forgotPassword = (link) => {
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Forgot Password</title>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    }
                    .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    }
                    h1 {
                    text-align: center;
                    }
                    p {
                    margin-bottom: 20px;
                    }
                    .button-container {
                    text-align: center;
                    }
                    .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    }
                    .button:hover {
                    background-color: #0056b3;
                    }
                </style>
                </head>
                <body>
                <div class="container">
                    <h1>Forgot Your Password?</h1>
                    <p>No worries, it happens! Click the button below to reset your password:</p>
                    <div class="button-container">
                    <a href=${link} class="button">Reset Password</a>
                    </div>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <p>Thanks,<br>Your Skill-Circle Team</p>
                </div>
                </body>
                </html>
                `;
};

