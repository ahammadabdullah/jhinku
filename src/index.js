import 'dotenv/config';
import express from 'express';
import { discordService } from './services/discordService.js';
import { spotifyService } from './services/spotifyService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const tokens = await spotifyService.handleCallback(code);
    spotifyService.setUserTokens(state, tokens);
    
    // Notify user through Discord DM about successful authentication
    await discordService.notifyAuthenticationSuccess(state);
    
    res.send('Authentication successful! You can close this window and return to Discord.');
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

async function startBot() {
  try {
    await spotifyService.authenticate();
    discordService.start();
    
    app.listen(PORT, () => {
      console.log(`Callback server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

startBot();