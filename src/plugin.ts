export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export interface IUserMail {
    name:string;
    mail:string;
    url:string;
}

export default
class Mailer {
    transporter:any;
    db:any;
    jade:any;

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
     */
    constructor(private env:any) {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };

        // load jade module
        this.jade = require('jade');
        // load nodemailer module
        var nodemailer = require('nodemailer');
        // load html to text module
        var htmlToText = require('nodemailer-html-to-text').htmlToText;

        // create reusable transporter object using SMTP transport
        this.transporter = nodemailer.createTransport({
            service: this.env['MAIL_SERVICE'],
            auth: {
                user: this.env['MAIL_ADDR'],
                pass: this.env['MAIL_PASS']
            }
        });
        this.transporter.use('compile', htmlToText())
    }

    /**
     * exposes functions to other plugins
     * @param server
     */
    exportApi(server) {
        server.expose('sendRegistrationMail', this.sendRegistrationMail);

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
        // route to create new user
        server.route({
            method: 'GET',
            path: '/mail/registration/test',
            config: {
                auth: false,
                handler: (request, reply) => {
                    var user = {
                        name: 'Udo',
                        surname: 'Walter',
                        mail: 'ruprecht.t@gmx.de',
                        url: 'http://www.google.de'
                    };
                    this.sendRegistrationMail(user);
                },
                description: 'send registration mail to new user',
                tags: ['api', 'mailer']
            }
        });
        // Register
        return 'register';
    }


    /**
     * Sends a registration mail to a new user.
     * @param user
     */
    sendRegistrationMail = (user:IUserMail) => {
        // get mail text from database
        this.db.getRegistrationMail((err, data) => {
            if (err) {
                console.log(err);
            }

            // add user to content variable to get user information in email template
            var content = data[0];
            content.user = user;

            // renderFile
            var fn = this.jade.compileFile(__dirname + '/templates/registration.jade');
            // parse content to jade file to get a html template
            var html = fn(content);
            // setup mail options
            var mailOptions = {
                from: this.env['MAIL_ADDR'], // sender address
                to: user.mail,
                subject: content.title,
                html: html
            };

            // send mail with defined transport object
            this.transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        });
    };
}