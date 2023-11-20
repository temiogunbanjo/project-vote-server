/* eslint-disable class-methods-use-this */
/**
 *
 */
const HtmlTemplates = {
  /**
   * @method
   * @param {{subject: string, content: string}} payload
   * @returns string
   */
  MailBody(payload) {
    return `
    <!doctype html>
    <html lang="en-US">
    <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>Email</title>
      <meta name="description" content="validate email template.">
      <style type="text/css">
          a:hover {text-decoration: underline !important;}
      </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
      <!--100% body table-->
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
          <td>
            <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
              align="center" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:80px;">&nbsp;</td>
              </tr>
              <tr>
                <td style="text-align:center;">
                  <a href="${process.env.BNJ_WEB_BASE_URL}" title="logo" target="_blank">
                  <img width="180" height= "50" src="${process.env.BNJ_WEB_BASE_URL}/favicon.ico" title="logo" alt="logo" style="object-fit:contain;">
                  </a>
                </td>
              </tr>
              <tr>
                <td style="height:20px;">&nbsp;</td>
              </tr>
              <tr>
                <td>
                  <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                    <tr>
                      <td style="height:40px;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td style="padding:0 35px;">
                        <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">${payload.subject}</h1>
                        <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                          ${payload.content}
                        </p>
                      </td>
                    </tr>
                      <tr>
                          <td style="height:40px;">&nbsp;</td>
                      </tr>
                  </table>
                </td>
              <tr>
                <td style="height:20px;">&nbsp;</td>
              </tr>
              <tr>
                <td style="text-align:center;">
                  <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.lotto.com</strong></p>
                </td>
              </tr>
              <tr>
                <td style="height:80px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--/100% body table-->
    </body>
    </html>`;
  },

  /**
   * @param {*} response
   * @param {*} statusCode
   * @param {*} redirectUrl
   * @returns string
   */
  VerificationPage(response, statusCode, redirectUrl) {
    // console.log(
    //   !!redirectUrl && redirectUrl !== '#' && redirectUrl !== null,
    //   redirectUrl
    // );
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Verification</title>
      <script src="https://use.fontawesome.com/d902c87f4f.js"></script>
    </head>
    <body>
      <style type="text/css">
        * {
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }
    
        body{
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 0;
          padding: 0;
          background-color: #eee;
        }
    
        main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: black;
          width: 90%;
          background-color: #fcfcff;
          padding: 3rem;
          margin: 3rem 0;
          border-radius: 10px;
        }
      </style>
      <main>
        <div>
        ${
  statusCode && statusCode === 200
    ? '<i style="font-size: 20px; color: green" class="fa fa-check-circle" aria-hidden="true"></i>'
    : '<i style="font-size: 20px; color: crimson"class="fa fa-times" aria-hidden="true"></i>'
}
        </div>
        <h1>${response}</h1>
        ${
  !!redirectUrl && redirectUrl !== '#' && redirectUrl !== null
    ? `<p>Your would be redirected to the login page soon. If not, click <a href="${redirectUrl}">here</a></p>`
    : `<p>Go to <a href="${process.env.BNJ_WEB_BASE_URL}">homepage</a></p>`
}
      </main>
      <script>
        ${
  !!redirectUrl && redirectUrl !== '#' && redirectUrl !== null
    ? `document.addEventListener("DOMContentLoaded", function() {
        setTimeout(function(){
          window.location.replace("${redirectUrl}");
        }, 80000);
      });`
    : ''
}
      </script>
    </body>
    </html>`;
  },

  /**
   * @param {string} firstname
   * @param {string} lastname
   * @param {string} emailVerificationLink
   * @returns string
   */
  UserVerificationMailContent(firstname, lastname, emailVerificationLink) {
    return `
    <div>
      <p style="font-size: 18px;">Welcome ${firstname} ${lastname}!</p><br/>
      <p style="font-size: 18px;line-height: 1.5">Please click the button below to verify your new account and have fun!</p><br><br/>
      <a href='${emailVerificationLink}' style="display:block;">
        <button style="background-color: darkgreen;border: none;border-radius:5px;color: white;width: 70%;height: 60px;text-align:center">Verify Account</button>
      </a>
    </div>
  `;
  },
};

module.exports = HtmlTemplates;
