import { getOAuth2Client, saveToken } from './auth';

async function authorizeWithCode() {
  const code = process.argv[2];

  if (!code) {
    console.error('Please provide authorization code as argument');
    process.exit(1);
  }

  const oAuth2Client = getOAuth2Client();

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
}

authorizeWithCode();
