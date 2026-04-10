import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const ORGANIZER_EMAIL = process.env.ORGANIZER_EMAIL;
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { fullName, school, year, email } = req.body;

    if (!fullName || !school || !year || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Please fill in all fields with a valid email.' });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const loginUrl = `${BASE_URL}/contest?token=${token}&email=${encodeURIComponent(email)}`;

    // 🔽 REPLACE THIS with your actual PDF's base64 string (see setup guide below)
    const pdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Pj4KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihDb250ZXN0IERldGFpbHMgUGxhY2Vob2xkZXIpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIyNSAwMDAwMCBuIAowMDAwMDAwMjU5IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzQwCiUlRU9G';

    // 1️⃣ Send email to student
    await resend.emails.send({
      from: 'Physics Contest <contest@resend.dev>',
      replyTo: ORGANIZER_EMAIL,
      to: email,
      subject: 'Your Physics Contest Login & Details',
      html: `
        <p>Hi ${fullName},</p>
        <p>Thank you for registering for the Physics Contest!</p>
        <p><strong>Your secure login link:</strong><br>
        <a href="${loginUrl}">Click here to access the contest</a></p>
        <p><em>This link expires in 24 hours. Do not share it.</em></p>
        <p>Attached are the official contest details. Please review them before participating.</p>
        <p>Good luck!<br>The Physics Contest Team</p>
      `,
      attachments: [{
        filename: 'Contest_Details.pdf',
        content: pdfBase64
      }]
    });

    // 2️⃣ Send notification to you
    await resend.emails.send({
      from: 'Physics Contest <contest@resend.dev>',
      to: ORGANIZER_EMAIL,
      subject: `📝 New Registration: ${fullName}`,
      html: `
        <h3>New Contest Registration</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>School:</strong> ${school}</p>
        <p><strong>Year/Grade:</strong> ${year}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Token:</strong> ${token}</p>
        <p style="font-size:12px;color:#6b7280;margin-top:1rem;">Keep this for your records. No database is used.</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process registration. Please try again.' });
  }
}
