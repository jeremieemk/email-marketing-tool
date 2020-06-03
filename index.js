const nodemailer = require('nodemailer');
const csv = require('csvtojson/v1');
const schedule = require('node-schedule');
const template = require('./template.js');

const account = {
  user: process.env.MAILUSER,
  pass: process.env.MAILPASSWORD,
};

var transporter = nodemailer.createTransport({
    pool: true, 
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: account.user,
        pass: account.pass
    }
});

var testfile = './test_list.csv';
//my test list
var prodfile = './test_list.csv';
//path to our production list
var sendlist = [];
// empty array where we'll keep 
//all our contacts
var message_increment = 0;
//variable to move to the next
//contact


function trigger_sending(env) {
    //env passes our email and name to 
    //customize the message
    var emailbody = template.generate(env.first).toString();
    //generates a string to send 
    //the personalized HTML
    transporter.sendMail({
        from: 'Leãozinho <news@izem.me>',
        to: env.email,
        subject: 'This is an Elis Records Test email',
        text: 'Gosto muito de te ver, leãozinho',
        html: emailbody,
    }, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}


function set_message_delays() {
    var message_job = schedule.scheduleJob('*/10 * * * * *', function () {
        trigger_sending(sendlist[message_increment]);
        if (message_increment < sendlist.length) {
            message_increment++;
            // if our increment is less than our list length, 
            // we'll keep sending
        }
        if (message_increment >= sendlist.length) {
            message_job.cancel();
            // stop our function when last message is sent
        }
    });
}


function get_list() {
    
    csv().fromFile(testfile) //or your production list
        .on('json', (jsonObj) => {
            console.log(jsonObj);
            sendlist.push(jsonObj);
            console.log(sendlist);
        })
        .on('done', () => {
            set_message_delays();
        })
    
}


transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
        get_list();
        // trigger the whole app once the mail server is ready
    }
});