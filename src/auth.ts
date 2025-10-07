import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from './config';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(__dirname, '../token.json');

export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    config.googleSheet.clientId,
    config.googleSheet.clientSecret,
    config.googleSheet.redirectUri
  );
}

export function saveToken(token: any): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to', TOKEN_PATH);
}

export function loadToken(): any | null {
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(token);
  } catch (error) {
    return null;
  }
}

export async function getAuthorizedClient(): Promise<OAuth2Client> {
  const oAuth2Client = getOAuth2Client();
  const token = loadToken();

  if (!token) {
    throw new Error(
      'No token found. Please run "npm run authorize" first to authenticate with Google.'
    );
  }

  oAuth2Client.setCredentials(token);

  // Refresh token if expired
  oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      saveToken(tokens);
    }
  });

  return oAuth2Client;
}
