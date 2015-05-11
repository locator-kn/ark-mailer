export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Mailer {
    transporter:any;

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
        // create reusable transporter object using SMTP transport
        this.transporter = nodemailer.createTransport({
            service: this.env['MAIL_SERVICE'],
            auth: {
                user: this.env['MAIL_ADDR'],
                pass: this.env['MAIL_PASS']
            }
        });
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);

        server.views({
            engines: { jade: require('jade') },
            //  options object passed to the engine's compile function
            compileOptions: {
                pretty: true
            }
        });

        next();
    };

    private _register(server, options) {
        // Register
        return 'register';
    }

    errorInit(error) {
        if (error) {
            console.log('Error: Failed to load plugin (Mailer):', error);
        }
    }
}