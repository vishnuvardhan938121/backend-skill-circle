const nodemailer = require("nodemailer");

const handleSendEmail = async (payload) => {
  const {
    toAddresses = [],
    subject = "",
    source = "",
    htmlData = "",
    ccEmails = [],
  } = payload;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });

  try {
    await transporter.sendMail({
      from: source,
      to: toAddresses.join(", "),
      cc: ccEmails.join(", "),
      subject: subject,
      html: htmlData,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = handleSendEmail;
