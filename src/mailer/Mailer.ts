declare var Promise
var fs = require('fs');
var _ = require('lodash');
export default class MailSender {


    constructor(private mailgun:any, private mailOptions:any, private mails:any) {

    }

    /**
     * Sends a registration mail to a new user.
     * @param user
     */
    sendRegistrationMail = (user) => {
        // get mail
        // NOTE: There is no uuid in the first version of locator
        this.getRenderedMail(this.mails.REGISTRATION_MAIL, {
                'mail': user.mail,
                'name': user.name
            }
        ).then(mail => {
                this._sendMailToMailgun(user, mail, 'Ahoi ' + user.name + '!');
            }
        ).catch(err => console.error(err));

    };

    /**
     * Sends a inventation mail to all pre registered users.
     * @param user
     */
    sendInventationMail = (user) => {
        // get mail
        this.getRenderedMail(this.mails.INVENTATION_MAIL, {
                'mail': user.mail,
                'name': user.name,
            }
        ).then(mail => {
                this._sendMailToMailgun(user, mail, 'Einladung zur Release-Party! | Locator');
            }
        ).catch(err => console.error(err));

    };

    sendRegistrationMailWithoutUuid = (user) => {
        // send normal registration since there is no uuid in the first versions
        this.sendRegistrationMail(user);
    };

    sendPasswordForgottenMail = (user) => {

        this.getRenderedMail(this.mails.PASSWORD_FORGOTTEN_MAIL, {
                'mail': user.mail,
                'name': user.name,
                'password': user.resetPassword
            }
        ).then(mail => {
                this._sendMailToMailgun(user, mail, 'Ahoi ' + user.name + '!');
            }
        ).catch(err => console.error(err));

    };

    sendRegistrationMailWithPassword = (user) => {
        // get mail
        this.getRenderedMail(this.mails.REGISTRATION_MAIL_WITH_PASSWORT, {
                'mail': user.mail,
                'name': user.name,
                'password': user.password
            }
        ).then(mail => {
                this._sendMailToMailgun(user, mail, 'Ahoi ' + user.name + '!');
            }
        ).catch(err => console.error(err));

    };

    sendTripInterestMail = (send, rec, tripTitle, conversationID) => {
        // get mail
        this.getRenderedMail(this.mails.TRIP_INTEREST_FOR_YOU, {
                name: rec.name,
                opponent: send.name,
                tripTitle: tripTitle,
                conversationID: conversationID,
                profilePictureUrl: send.picture,
            }
        ).then(mail => {
                this._sendMailToMailgun(rec, mail, 'Ahoi ' + rec.name + '!');
            }
        ).catch(err => console.error(err));

    };

    sendTripInterestMailToMe = (user) => {
        // get mail
        this.getRenderedMail(this.mails.TRIP_INTEREST_FOR_ME, {
                'mail': user.mail,
                'name': user.name,
            }
        ).then(mail => {
                this._sendMailToMailgun(user, mail, 'Ahoi ' + user.name + '!');
            }
        ).catch(err => console.error(err));
    };

    getRenderedMail = (mail:String, user) => {
        return new Promise((resolve, reject)=> {
            fs.readFile(mail, 'utf-8', (err, template) => {
                if (err) {
                    return reject('Unable to read mail template');
                }

                var compiled = _.template(template);
                var renderedMail = compiled(user);

                resolve(renderedMail);

            });
        });
    };

    _sendMailToMailgun = (user:any, mail:string, subject:string) => {
        var data = {
            from: this.mailOptions.from,
            to: user.mail,
            subject: subject,
            html: mail
        };

        // send mail
        this.mailgun.messages().send(data, (err, result) => {
            if (err) {
                console.error('Error while sending mail to ', user, ' Because of ', err);
                return
            }
            console.log('mail send to ', user)
        })
    }
}