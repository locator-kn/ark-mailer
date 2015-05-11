export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Mailer {
    transporter:any;

    /**
     * example: new Mailer('mymailaddr@whatever.jo','secret');
     *
     * @param user - mail address of agent
     * @param pass - password
     */
    constructor(user:string, pass:string) {
        this.register.attributes = {
            name: 'ark-mailer',
            version: '0.1.0'
        };

        // load nodemailer module
        var nodemailer = require('nodemailer');
        // create reusable transporter object using SMTP transport
        this.transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: user,
                pass: pass
            }
        });
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);
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