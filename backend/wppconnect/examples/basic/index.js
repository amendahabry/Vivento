const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

/*
 * This file is part of WPPConnect.
 *
 * WPPConnect is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * WPPConnect is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with WPPConnect.  If not, see <https://www.gnu.org/licenses/>.
 */
const wppconnect = require('../../dist');
const {
  updateSentTime,
  getWhatsappMessagesToSend,
  getEventDetails,
  markGuestAsResponded,
  getGuestInfo,
  insertImageToDB,
  getEventUploadPhotosLinksToSend,
} = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const googleApiKey = process.env.GOOGLE_API_KEY;
const genAI = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null;
const { loadPolicyTexts } = require('./policies.js');
const axios = require('axios');
const nodemailer = require('nodemailer');
const geminiModel = 'gemini-2.5-flash';
const ADMIN_PHONE = (process.env.ADMIN_WHATSAPP_JID || '').trim();
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailTransport =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;
const policyTexts = loadPolicyTexts();
const activeChats = {};
const welcomedUsers = new Set();

wppconnect
  .create()
  .then((client) => {
    start(client);
    monitorSession(client);
    processQueue(client);
    checkEventsToSendPhotosLinks();
  })
  .catch((error) => {
    console.error('❌ Failed to create WhatsApp client:', error);
  });

function start(client) {
  client.onMessage(async (message) => {
    try {
      if (!message.body || message.isGroupMsg) return;
      const phone = message.from;
      const normalizedPhone = normalizePhoneNumber(phone.replace('@c.us', ''));

      // const userReply = message.body.trim().toLowerCase();
      // const consentWords = ['כן', 'היי', 'hi', 'yes', 'ok', 'نعم'];

      // if (consentWords.some(word => userReply.includes(word))) {
      //   console.log("send invitation!");
      //   await handleGuestResponse(normalizedPhone);
      //   return;
      // }

      await markGuestAsResponded(normalizedPhone);

      // Step 1: Start or continue a chat session
      if (!activeChats[phone]) {
        console.log('Creating new chat for:', phone);
        if (!genAI) {
          await client.sendText(
            phone,
            'This demo bot is not configured (set GOOGLE_API_KEY in backend/.env).'
          );
          return;
        }
        const model = genAI.getGenerativeModel({ model: geminiModel });

        const combinedPolicies = `
  הנה תנאי השימוש ומדיניות הפרטיות בשלוש שפות:
  
  📜 תנאי שימוש (עברית):
  ${policyTexts.tos_he}
  
  📜 Terms of Service (English):
  ${policyTexts.tos_en}
  
  📜 سياسة الخصوصية (عربي):
  ${policyTexts.privacy_ar}

  📜 דרכי השימוש של האפליקציה בשלושה שפות:

  📜 How to use the app (English):
    ${policyTexts.app_usage_en}
  
  📜 شرح كيفية استخدام التطبيق (عربي):
  ${policyTexts.app_usage_ar}

  📜 דרכי השימוש של האפליקציה (עברית):
  ${policyTexts.app_usage_he} 
          `;

        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [
                {
                  text: 'אתה עוזר חכם מטעם Vivento, חברה שמספקת שירות RSVP לאירועים. דבר תמיד בטון עדין, מסביר, ועזור ללקוח.',
                },
                { text: 'תעזור ללקוח גם בשאלות כלליות.' },
                {
                  text: 'השתמש בטקסטים המצורפים כדי לענות על שאלות בנוגע לתנאי השימוש או למדיניות הפרטיות.',
                },
                { text: combinedPolicies },
              ],
            },
          ],
        });

        activeChats[phone] = chat;

        if (!welcomedUsers.has(phone)) {
          // await client.sendText(
          //   phone,
          //   'היי! 😊 ברוכים הבאים ל-Vivento!\nקיבלנו את הפנייה שלכם ואנחנו כבר על זה 💬\n\n⬇️ תשובה מבית Vivento תגיע עכשיו...'
          // );
          welcomedUsers.add(phone);
        }
      }

      // Step 2: Continue chat with Gemini
      const chat = activeChats[phone];
      const result = await chat.sendMessage(message.body);
      const geminiText = result.response.text();

      // Step 3: Send Gemini's response only (no duplicate)
      setTimeout(async () => {
        await client.sendText(phone, geminiText);
      }, 1500);
    } catch (error) {
      console.error('❌ Error handling message from', message.from, ':', error);

      try {
        await client.sendText(
          message.from,
          'מצטערים, הייתה שגיאה בעיבוד הבקשה שלכם. אנא נסו שוב מאוחר יותר.'
        );
      } catch (sendError) {
        console.error('❌ Failed to send error message to user:', sendError);
      }
    }
  });
}

async function handleGuestResponse(normalizedPhone) {
  try {
    // Mark guest as responded
    await markGuestAsResponded(normalizedPhone);
  } catch (error) {
    console.error('❌ Error handling guest response:', error);
  }
}

async function processQueue(client) {
  try {
    const messages = await getWhatsappMessagesToSend(); // pull pending rows from DB

    if (messages.length === 0) {
      // console.log('📭 No messages to send. Waiting 5s...');
      return setTimeout(() => processQueue(client), 3000); // try again after 5 sec
    }

    for (const guest of messages) {
      let phone =
        '972' + parseInt(normalizePhoneNumber(guest.phone_number)) + '@c.us';
      if (!phone || phone === '972null@c.us') {
        console.error('❌ Invalid phone number:', phone);
        continue;
      }

      try {
        if (guest.event_id != null) {
          await sendImageToGuest(client, guest.event_id, guest.phone_number);
        }

        await updateSentTime(guest.id); // avoid re-sending
        await client.sendText(phone, guest.message);
        console.log('✅ Message sent to:', phone);
      } catch (err) {
        console.error('❌ Failed to send to', phone, err.message);
      }
    }

    // After sending all, wait before processing next batch
    setTimeout(() => processQueue(client), 2000);
  } catch (error) {
    console.error('🔴 Error processing queue:', error.message);
    setTimeout(() => processQueue(client), 10000); // retry slower if failure
  }
}

async function sendImageToGuest(client, eventid, normalizedPhone) {
  // Get event details including image
  const event = await getEventDetails(normalizedPhone, eventid);
  if (!event) {
    console.error('Event not found for guest');
    return;
  }

  // Send invitation with image if available
  if (event.inv_id) {
    try {
      const image_url = await getPresignedUrlForInvitationPhoto(event.inv_id);

      // Get the phone number from the guest data
      const phone = '972' + parseInt(normalizedPhone) + '@c.us';
      console.log('✅ Image Sent!');

      await client.sendImage(
        phone,
        image_url,
        'invitation.png',
        `*${event.name}*`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(
        '❌ Failed to send image as base64, sending text only:',
        err
      );
    }
  }
}

async function getPresignedUrlForInvitationPhoto(photoId) {
  try {
    const response = await axios.get(
      `https://viventoevents.com/api/photos/${photoId}/presignedForInvitations`
    );

    // Check if the response has the expected structure
    if (response.data && response.data.url) {
      return response.data.url;
    } else {
      throw new Error('Invalid response format from presigned URL endpoint');
    }
  } catch (error) {
    console.error('Failed to get signed URL:', error.message);
    throw error;
  }
}

async function notifyAdmin(client, message) {
  try {
    if (client && ADMIN_PHONE) {
      await client.sendText(
        ADMIN_PHONE,
        `🚨 *Vivento Bot Alert* 🚨\n${message}`
      );
    }
  } catch (err) {
    console.error('❌ Failed to notify admin via WhatsApp:', err);
  }
}

async function notifyByEmail(subject, message) {
  try {
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (!mailTransport || !smtpUser || !adminEmail) {
      console.warn('Skipping admin email (set SMTP_USER, SMTP_PASS, ADMIN_NOTIFY_EMAIL).');
      return;
    }
    await mailTransport.sendMail({
      from: smtpUser,
      to: adminEmail,
      subject,
      text: message,
    });
    console.log('📧 Admin email sent');
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
}

function monitorSession(client) {
  try {
    let errorCount = 0; // track how many failures we’ve seen

    const interval = setInterval(async () => {
      try {
        const state = await client.getConnectionState();
        errorCount = 0; // reset on success

        if (state === 'DISCONNECTED' || state === 'UNPAIRED') {
          console.log('Session is not paired or disconnected.');
          await notifyAdmin(client, 'WhatsApp Down! ' + state);
          await notifyByEmail('WhatsApp Down! ' + state, '');

          clearInterval(interval); // stop loop
          setTimeout(() => process.exit(1), 3000);
        }
      } catch (err) {
        console.log('Session check failed:', err);
        errorCount++;

        if (errorCount >= 2) {
          console.log('Two consecutive errors, exiting process.');
          clearInterval(interval);
          await notifyByEmail('WhatsApp Down! ' + state, '');
          setTimeout(() => process.exit(1), 3000);
        }
      }
    }, 5000); // run every 5s
  } catch (err) {
    console.error('monitorSession failed:', err);
  }
}

async function checkEventsToSendPhotosLinks() {
  try {
    // check if there are events to send photos links every 0.5 hour and send them
    const interval = setInterval(async () => {
      await getEventUploadPhotosLinksToSend();
    }, 60000 * 30); // run every 0.5 hour
    await getEventUploadPhotosLinksToSend();
  } catch (err) {
    console.error('checkEventsToSendPhotosLinks failed:', err);
  }
}

function normalizePhoneNumber(rawPhone) {
  // Remove everything except digits
  let digits = rawPhone.replace(/\D/g, '');

  // Convert +972... to 0...
  if (digits.startsWith('972')) {
    digits = '0' + digits.slice(3);
  }

  // If it already starts with 5 and has 9 digits, add 0 at the start
  if (digits.length === 9 && digits.startsWith('5')) {
    digits = '0' + digits;
  }

  // Final validation (must be 10 digits and start with 05)
  if (/^05\d{8}$/.test(digits)) {
    return digits;
  }

  return null; // Invalid format
}
