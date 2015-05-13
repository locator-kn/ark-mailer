export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export interface IUserMail {
    name:string;
    surname:string;
    mail:string;
    url:string;
}

interface IMailOptions {
    from:string;
    to:string;
    subject:string;
    text:string;
    html:string;
}

export default
class Mailer {
    transporter:any;
    db:any;

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
            name: 'ark-mailer',
            version: '0.1.0'
        };

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

    register:IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);

        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
            next();
        });

        server.views({
            engines: {jade: require('jade')},
            // path to jade templates
            path: __dirname + '/templates',
            // options object passed to the engine's compile function
            compileOptions: {
                pretty: true
            }
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
                    // return jade structure for test
                    reply.view('registration', {
                        title: 'registration mail',
                        message: 'Hello World!'
                    })
                },
                description: 'send registration mail to new user',
                tags: ['api', 'mailer']
            }
        });
        // Register
        return 'register';
    }


    sendRegistrationMail(user:IUserMail) {

        this.db.getRegistrationMail((err, data) => {
            if(err) {
                return err;
            }

            // TODO: jade


            var mailOptions = {
                from: this.env['MAIL_ADDR'], // sender address
                to: user.mail,
                subject: data.subject,
                html: "TODO"
            };

            // send mail with defined transport object
            this.transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log('Message sent: ' + info.response);
                }
            });
        });



    }

    errorInit(error) {
        if (error) {
            console.log('Error: Failed to load plugin (Mailer):', error);
        }
    }
}