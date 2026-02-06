
import 'server-only';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/welcome';
import { OtpEmail } from '@/emails/otp';
import { OnboardingInviteEmail } from '@/emails/onboarding-invite';
import { BlogReviewStatusEmail } from '@/emails/blog-review-status';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

type EmailType = 'otp' | 'welcome' | 'onboarding-invite' | 'blog-review-status';

interface EmailData {
    to: string;
    subject?: string;
    // OTP Data
    otp?: string;
    // Welcome Data
    userName?: string;
    loginUrl?: string;
    // Onboarding Data
    onboardingUrl?: string;
    expiresInMinutes?: number;
    // Blog Review Status Data
    blogTitle?: string;
    reviewStatus?: 'approved' | 'rejected' | 'pending_review' | 'published';
    reason?: string;
    blogUrl?: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.S3_REGION || 'us-east-2',
  credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    : undefined, // Uses default credential provider chain if not specified
});

/**
 * Send an email using AWS SES
 * @param options - Email options including to, subject, html, from, and replyTo
 * @returns Promise with success status and messageId
 */
async function sendEmailViaSES({
  to,
  subject,
  html,
  from = process.env.SES_FROM_EMAIL || '', 
  replyTo,
}: SendEmailOptions) {
  try {
    // Convert to array if single email
    const toAddresses = Array.isArray(to) ? to : [to];

    // Create the send email command
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });

    // Send the email
    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error('Error sending email via AWS SES:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    throw error;
  }
}

/**
 * Unified email sending function.
 * Sends emails using AWS SES with React Email templates.
 */
export async function sendEmail({ type, data }: { type: EmailType; data: EmailData }) {
    const { to, subject } = data;
    let html = '';
    let defaultSubject = '';

    try {
        switch (type) {
            case 'otp':
                if (!data.otp) throw new Error('OTP code is required for otp email');
                defaultSubject = 'Tu código de verificación de Crece tu Negocio';
                html = await render(OtpEmail({ otp: data.otp }));
                break;

            case 'welcome':
                if (!data.userName || !data.loginUrl) throw new Error('userName and loginUrl are required for welcome email');
                defaultSubject = 'Bienvenido a Crece tu Negocio';
                html = await render(WelcomeEmail({ 
                    userName: data.userName, 
                    loginUrl: data.loginUrl 
                }));
                break;

            case 'onboarding-invite':
                if (!data.userName || !data.onboardingUrl) throw new Error('userName and onboardingUrl are required for onboarding invite');
                defaultSubject = 'Invitación para completar tu perfil de socio';
                html = await render(OnboardingInviteEmail({
                    userName: data.userName,
                    onboardingUrl: data.onboardingUrl,
                    expiresInMinutes: data.expiresInMinutes || 10
                }));
                break;

            case 'blog-review-status':
                if (!data.userName || !data.blogTitle || !data.reviewStatus) {
                    throw new Error('userName, blogTitle, and reviewStatus are required for blog review status email');
                }
                defaultSubject = `Actualización del estado de tu artículo: ${data.blogTitle}`;
                html = await render(BlogReviewStatusEmail({
                    userName: data.userName,
                    blogTitle: data.blogTitle,
                    reviewStatus: data.reviewStatus,
                    reason: data.reason,
                    blogUrl: data.blogUrl,
                }));
                break;

            default:
                throw new Error(`Unknown email type: ${type}`);
        }

        const finalSubject = subject || defaultSubject;

        return await sendEmailViaSES({
            to,
            subject: finalSubject,
            html,
        });

    } catch (error) {
        console.error('Error in sendEmail:', error);
        return { success: false, error };
    }
}

/**
 * Send OTP email to user
 */
export async function sendOtpEmail(to: string, otp: string) {
    return sendEmail({
        type: 'otp',
        data: { to, otp }
    });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to: string, userName: string, loginUrl: string) {
    return sendEmail({
        type: 'welcome',
        data: { to, userName, loginUrl }
    });
}

/**
 * Send onboarding invite email to partner
 */
export async function sendOnboardingInviteEmail(
    to: string, 
    userName: string, 
    onboardingUrl: string, 
    expiresInMinutes?: number
) {
    return sendEmail({
        type: 'onboarding-invite',
        data: { to, userName, onboardingUrl, expiresInMinutes }
    });
}

/**
 * Send blog review status notification email
 */
export async function sendBlogReviewStatusEmail(
    to: string,
    userName: string,
    blogTitle: string,
    reviewStatus: 'approved' | 'rejected' | 'pending_review' | 'published',
    reason?: string,
    blogUrl?: string
) {
    return sendEmail({
        type: 'blog-review-status',
        data: { to, userName, blogTitle, reviewStatus, reason, blogUrl }
    });
}
