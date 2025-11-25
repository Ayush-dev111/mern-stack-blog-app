import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from './emailTemplate.js';
import transporter from  './nodemailer.js';

export const sendVerificationEmail = async (email, verifyOtp)=>{
   try{
     const mailOptions = {
        from: {
        name: "Blog zone",
        address: process.env.SENDER_EMAIL,
      },
        to: email,
        subject: "Verify your email",
        html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verifyOtp),
    };

    const response = await transporter.sendMail(mailOptions);

    console.log("Email sent: " + response.messageId);
   }catch(error){
    console.error("Error sending verification email: ", error);
   };

};

export const sendResetPasswordEmail  = async (email, resetURL)=>{
    try {
      const mailOptions = {
        from: {
        name: "Mern Auth App",
        address: process.env.SENDER_EMAIL,
      },
        to: email,
        subject: "Reset your password",
        html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL)
    };
      const response = await transporter.sendMail(mailOptions);

      console.log("Email sent: " + response.messageId);
    } catch (error) {
      console.error("Error sending reset password email: ", error);
    }
};

export const sendResetSuccessMail = async (email)=>{
   try {
      const mailOptions = {
        from: {
        name: "Mern Auth App",
        address: process.env.SENDER_EMAIL,
      },
        to: email,
        subject: "Password reset successfully",
        html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    };
      const response = await transporter.sendMail(mailOptions);

      console.log("Email sent: " + response.messageId);
    } catch (error) {
      console.error("Error sending reset password email: ", error);
    }
};