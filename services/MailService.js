const nodemailer = require("nodemailer");

module.exports = {
  /** @private */
  transport: null,
  /** @private */
  from: null,
  /** @private */
  to: null,
  /**
   * Nodemailer initializer
   * @name mailService.initialize
   * @param {{hostname: String, port: Number, username: String, password: String, from: String, to: String}} config Nodemailer configuration
   * @returns {Void}
   */
  VERIFICATION_EMAIL: `
  <p>Hi,</p><br />

<p>Welcome to Cohortly! You're one step away from unlocking your learning experience.

Please confirm your email address by clicking the button below:</p>

<a href="{{{link}}}" target="_blank">Verify My Email</a>

<p>If you didn't sign up for Cohortly, feel free to ignore this message.</p>

<p>See you inside,<br />
Team Cohortly</p>
  `,

  FORGOT_PASSWORD: `
 <p> Hi {{{first_name}}},<br />

  We received a request to reset your password. You can create a new one by clicking the button below: <br />

  <a href="{{{link}}}" target="_blank">Reset Password</a> <br />

  If you didn't request this, you can safely ignore this email. Your current password is still secure. <br />

  Need help? Reach out anytime: <a href="mailto:support@cohort.ly">support@cohort.ly</a>

  - Team Cohortly </p>
  `,

  initialize: function (
    config,
    pool = false,
    maxMessages = 100,
    maxConnections = 5
  ) {
    this.transport = nodemailer.createTransport({
      pool,
      maxMessages,
      maxConnections,
      host: config.mail_host,
      port: config.mail_port,
      auth: {
        user: config.mail_user,
        pass: config.mail_pass,
      },
    });

    this.from = config.from;
    this.to = config.to;
  },
  /**
   * Inject values into email template
   * @name mailService.inject
   * @param {{body: String, subject: String}} template email template
   * @param {Object.<string, string>} payload template values
   * @returns {{from: String, to: String, subject: String, text: String}}  Value injected email template
   */
  inject: function (template, payload) {
    let mailBody = template.body;
    let mailSubject = template.subject;

    for (const key in payload) {
      const value = payload[key];
      mailBody = mailBody.replace(new RegExp("{{{" + key + "}}}", "g"), value);
    }

    for (const key in payload) {
      const value = payload[key];
      mailSubject = mailSubject.replace(
        new RegExp("{{{" + key + "}}}", "g"),
        value
      );
    }

    return {
      from: this.from,
      to: this.to,
      subject: mailSubject,
      html: mailBody,
    };
  },
  /**
   * Send email
   * @name mailService.send
   * @param {nodemailer.SendMailOptions} template email template
   * @reject {Error} send mail error
   * @returns {Promise.<nodemailer.SentMessageInfo>} send mail info
   */
  send: async function ({ from, to, subject, html, attachments }) {
    let self = this;
    try {
      const response = await self.transport.sendMail({
        from,
        to,
        subject,
        html,
        attachDataUrls: true,
        attachments,
      });
      return {
        error: false,
        message: response,
      };
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  },
};
