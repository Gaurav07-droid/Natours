const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//new email(user,url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    (this.to = user.email),
      (this.firstname = user.name.split(' ')[0]),
      (this.url = url),
      (this.from = `Gaurav Bhardwaj <${process.env.EMAIL_FROM}>`);
  }

  newTransport() {
    //1) create a transporter
    if (process.env.NODE_ENV === 'production') {
      //sendgrid
      return nodemailer.createTransport({
        service: 'sendGrid',

        auth: {
          user: process.env.SENDGRID_USERNAME, //not generated yet
          pass: process.env.SENDGRID_PASSWORD, //not generated yet
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME, // generated ethereal user
        pass: process.env.EMAIL_PASSWORD, // generated ethereal password
      },
    });
  }

  async send(template, subject) {
    //1) Render pug template based on the template argument
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstname,
        url: this.url,
        subject,
      }
    );

    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    //3 create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the NATOURS family!');
  }

  async sendResetPasswordToken() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes)'
    );
  }
};
