import MailSender from './mailer/mailer';
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
var path = require('path');

export default
class Mailer {
    db:any;
    joi:any;
    mailer:any;

    private MAILS = {
        REGISTRATION_MAIL: path.resolve(__dirname, './templates/registration.html'),
        PASSWORD_FORGOTTEN_MAIL: path.resolve(__dirname, './templates/passwordForget.html'),
        REGISTRATION_MAIL_WITH_PASSWORT: path.resolve(__dirname, './templates/registrationWithPassword.html'),
        INVENTATION_MAIL: path.resolve(__dirname, './templates/inventationMail.html'),
        TRIP_INTEREST_FOR_YOU: path.resolve(__dirname, './templates/tripInterestYou.html'),
        TRIP_INTEREST_FOR_ME: path.resolve(__dirname, './templates/tripInterestMe.html')
    };

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

        this.joi = require('joi');
        // sender
        var mailOptions = env;
        mailOptions.from = 'Locator Team <team@' + env.DOMAIN + '>';
        var mailgun = require('mailgun-js')({apiKey: env.API_KEY, domain: env.DOMAIN});

        this.mailer = new MailSender(mailgun, mailOptions, this.MAILS);
    }

    /**
     * exposes functions to other plugins
     * @param server
     */
    exportApi(server) {
        server.expose('sendRegistrationMail', this.mailer.sendRegistrationMail);
        server.expose('sendPasswordForgottenMail', this.mailer.sendPasswordForgottenMail);
        server.expose('sendRegistrationMailWithPassword', this.mailer.sendRegistrationMailWithPassword);
        server.expose('sendRegistrationMailWithoutUuid', this.mailer.sendRegistrationMailWithoutUuid);
        server.expose('sendInventationMail', this.mailer.sendInventationMail);
        server.expose('sendTripInterestMail', this.mailer.sendTripInterestMail);
        server.expose('sendTripInterestMailToMe', this.mailer.sendTripInterestMailToMe);
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);
        this.exportApi(server);

        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
            next();
        });

        this._registerRoutes(server, options);
        next();
    };

    private _register(server, options) {
        return 'register';
    }


    _registerRoutes = (server, options) => {

        server.route({
            method: 'POST',
            path: '/mail/send/invitation',
            config: {
                handler: (request, reply) => {

                    return reply('not available any more');
                    if (!request.auth.credentials || !request.auth.credentials.isAdmin) {
                        return reply().code(401);
                    }
                    var user = request.payload;
                    var i = user.length;
                    setInterval(() => {
                        if (i <= 0) {
                            return;
                        }
                        i = i - 1;

                        // capitalize first character of name
                        var name = user[i].name;
                        user[i].name = name.charAt(0).toUpperCase() + name.slice(1);

                        // send mail
                        this.mailer.sendInventationMail(user[i]);

                    }, 1000);

                    // async reply
                    reply('Sending mails')
                },
                description: 'Send an invitation mail to given users from payload',
                tags: ['api', 'mail'],
                validate: {
                    payload: this.joi.array().items(
                        this.joi.object().keys({
                            name: this.joi.string().required(),
                            mail: this.joi.string().email().required()
                        })
                    ).required()
                }
            }
        })
    };


}