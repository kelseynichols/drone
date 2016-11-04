var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
exports.sendEmail = function(toAddress, fromAddress, subject, content) {
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [ { to: [{ email: toAddress }], subject: subject } ],
            from: { email: fromAddress },
            content: [ { type: 'text/html', value: content } ]
        }
    });
    return sg.API(request);
}