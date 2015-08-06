import MailSender from './mailer/Mailer';
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
        this.exportApi(server);

        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
            next();
        });

        this._registerRoutes(server, options);
        this._registerSeneca(server, options);
        next();
    };

    private _registerSeneca(server, options) {

        if (!server.seneca) {
            throw new Error('Server is missing Chairo Plugin');
        }

        server.seneca.add({send: 'sendRegistrationMailWithoutUuid'}, (message, next)=> {

            var newUser = message.user;
            this.mailer.sendRegistrationMailWithoutUuid({
                name: newUser.name,
                mail: newUser.mail,
            });
            return next(null, {ok: true});
        });

        server.seneca.add({send: 'registrationMail'}, (message, next)=> {

            var newUser = message.user;
            this.mailer.sendRegistrationMail({
                name: newUser.name,
                mail: newUser.mail,
                uuid: newUser.uuid
            });
            return next(null, {ok: true});
        });

        server.seneca.add({send: 'sendRegistrationMailWithPassword'}, (message, next)=> {
            var user = message.user;

            if (!user || !user.newPassword || !user.mail || !user.name) {
                return next({error: 'user is not well defined'})
            }
            // send welcome mail
            this.mailer.sendRegistrationMailWithPassword({
                name: user.name,
                mail: user.mail,
                password: user.newPassword
            });
            return next(null, {ok: true});
        });


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
                    var intervalId = setInterval(() => {
                        if (i <= 0) {
                            clearInterval(intervalId)
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