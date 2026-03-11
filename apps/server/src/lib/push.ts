import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let initialized = false;

export function initFirebase() {
  if (initialized) return;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'firebase-adminsdk.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
      initialized = true;
    } else {
      console.warn(`Firebase Admin SDK not initialized: Service account file not found at ${serviceAccountPath}. Push notifications are disabled.`);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export async function sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
  if (!initialized || tokens.length === 0) return;

  try {
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed push to ${tokens[idx]}:`, resp.error);
          // Optional: we could delete invalid tokens from the DB here
        }
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
