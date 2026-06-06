"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
const resend_1 = require("resend");
const config_1 = require("../config");
const resend = config_1.config.resend.apiKey ? new resend_1.Resend(config_1.config.resend.apiKey) : null;
async function sendEmail(to, subject, html) {
    if (!resend) {
        console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
        return { id: 'mock' };
    }
    return resend.emails.send({
        from: config_1.config.resend.fromEmail,
        to,
        subject,
        html,
    });
}
async function sendWelcomeEmail(email, name, academyName) {
    return sendEmail(email, `Welcome to ${academyName} on SAMS`, `<h1>Welcome, ${name}!</h1><p>Your account for ${academyName} has been created on SAMS.</p>`);
}
//# sourceMappingURL=email.service.js.map