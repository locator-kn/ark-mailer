declare var Promise;
export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export interface IUserMail {
    name:string;
    mail:string;
    uuid:string;
}

// filesystem & utility
var fs = require('fs');
var _ = require('lodash');
var path = require('path')

export default
class Mailer {
    db:any;
    mailgun:any;
    mailOptions:any = {};
    REGISTRATION_MAIL:string;
    PASSWORD_FORGOTTEN_MAIL:string;
    REGISTRATION_MAIL_WITH_PASSWORT:string;

    /**
     * constructor with env variable
     *
     * @param env - environment variable:
     *     {
     *     "mail": {
     *          "MAIL_ADDR": "any@gmail.com",
     *          "MAIL_PASS": "secret",
     *          "MAIL_SERVICE": "Gmail"
     *          }
     *     }
     *  @param uri - url to web-application
     */
    constructor(private env:any) {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };


        if (!env) {
            throw new Error('env is required');
        }

        this.mailOptions = env;

        // sender
        this.mailOptions.from = 'Locator Team <team@' + env.DOMAIN + '>';

        this.mailgun = require('mailgun-js')({apiKey: env.API_KEY, domain: env.DOMAIN});

        this.REGISTRATION_MAIL = path.resolve(__dirname, './templates/registration.html');
        this.PASSWORD_FORGOTTEN_MAIL = path.resolve(__dirname, './templates/passwordForget.html');
        this.REGISTRATION_MAIL_WITH_PASSWORT = path.resolve(__dirname, './templates/registrationWithPassword.html');

    }

    /**
     * exposes functions to other plugins
     * @param server
     */
    exportApi(server) {
        server.expose('sendRegistrationMail', this.sendRegistrationMail);
        server.expose('sendPasswordForgottenMail', this.sendPasswordForgottenMail);
        server.expose('sendRegistrationMailWithPassword', this.sendRegistrationMailWithPassword);
        server.expose('sendRegistrationMailWithoutUuid', this.sendRegistrationMailWithoutUuid);
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);
        this.exportApi(server);

        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
            next();
        });
        next();
    };

    private _register(server, options) {
        return 'register';
    }


    /**
     * Sends a registration mail to a new user.
     * @param user
     */
    sendRegistrationMail = (user:IUserMail) => {
        // get mail
        this.getRenderedMail(this.REGISTRATION_MAIL, {
                'mail': user.mail,
                'name': user.name,
                'uuid': user.uuid
            }
        ).then(mail => {
                var data = {
                    from: this.mailOptions.from,
                    to: user.mail,
                    subject: 'Ahoi ' + user.name + '!',
                    html: mail
                };

                this.mailgun.messages().send(data, (err, result) => {
                    if (err) {
                        console.error('Error while sending registration', err);
                        return
                    }
                    console.log('registration send to ', user)
                })

            }
        ).catch(err => console.error(err));

    };

    sendRegistrationMailWithoutUuid = (user, mail) => {

    };

    sendPasswordForgottenMail = (user) => {

        this.getRenderedMail(this.PASSWORD_FORGOTTEN_MAIL, {
                'mail': user.mail,
                'name': user.name,
                'password': user.resetPassword
            }
        ).then(mail => {
                var data = {
                    from: this.mailOptions.from,
                    to: user.mail,
                    subject: 'howdy ' + user.name + '!',
                    html: mail
                };
                this.mailgun.messages().send(data, (err, result) => {
                    if (err) {
                        console.error('Error while sending password', err);
                        return
                    }
                    console.log('password send to ', user)
                })
            }
        ).catch(err => console.error(err));

    };

    sendRegistrationMailWithPassword = (user) => {
        // get mail
        this.getRenderedMail(this.REGISTRATION_MAIL_WITH_PASSWORT, {
                'mail': user.mail,
                'name': user.name,
                'password': user.password
            }
        ).then(mail => {
                var data = {
                    from: this.mailOptions.from,
                    to: user.mail,
                    subject: 'howdy ' + user.name + '!',
                    html: mail
                };

                // send mail
                this.mailgun.messages().send(data, (err, result) => {
                    if (err) {
                        console.error('Error while sending registration with password', err);
                        return
                    }
                    console.log('registration with password send to ', user)
                })

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
}