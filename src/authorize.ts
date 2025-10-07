import { google } from 'googleapis';
import { getOAuth2Client, saveToken } from './auth';
import readline from 'readline';

async function authorize() {
  const oAuth2Client = getOAuth2Client();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  console.log('\n🔐 Google Sheets OAuth Authorization\n');
  console.log('Please authorize this app by visiting this url:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the authorization code from that page here: ', async (code) => {
    rl.close();

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      saveToken(tokens);

      console.log('\n✅ Authorization successful!');
      console.log('You can now run "npm run sync" to sync your Google Sheet data.\n');
    } catch (error) {
      console.error('\n❌ Error retrieving access token:', error);
      process.exit(1);
    }
  });
}

authorize();
