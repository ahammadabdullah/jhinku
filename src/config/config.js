export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.NODE_ENV === 'production' 
      ? `${process.env.RAILWAY_PUBLIC_DOMAIN}/callback`
      : process.env.SPOTIFY_REDIRECT_URI
  }
};