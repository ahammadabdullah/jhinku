import SpotifyWebApi from 'spotify-web-api-node';
import { config } from '../config/config.js';

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
      redirectUri: config.spotify.redirectUri
    });
    this.userTokens = new Map();
  }

  async authenticate() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);
      console.log('Spotify API authenticated successfully');
    } catch (error) {
      console.error('Failed to authenticate with Spotify:', error);
      console.error('Current redirect URI:', config.spotify.redirectUri);
      throw new Error('Spotify authentication failed');
    }
  }

  getAuthURL(state) {
    const scopes = ['user-read-currently-playing', 'user-read-playback-state'];
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  async handleCallback(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      return {
        accessToken: data.body['access_token'],
        refreshToken: data.body['refresh_token'],
        expiresIn: data.body['expires_in']
      };
    } catch (error) {
      console.error('Error in callback handling:', error);
      throw new Error('Failed to get Spotify tokens');
    }
  }

  async refreshTokenIfNeeded(userId) {
    const userToken = this.userTokens.get(userId);
    if (!userToken) return false;

    try {
      this.spotifyApi.setRefreshToken(userToken.refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      const tokens = {
        accessToken: data.body['access_token'],
        refreshToken: userToken.refreshToken,
        expiresIn: data.body['expires_in']
      };
      this.setUserTokens(userId, tokens);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async getCurrentTrack(userId) {
    try {
      const userToken = this.userTokens.get(userId);
      if (!userToken) {
        return { error: 'not_authenticated', message: 'Please authenticate with Spotify first' };
      }

      await this.refreshTokenIfNeeded(userId);
      this.spotifyApi.setAccessToken(userToken.accessToken);
      const data = await this.spotifyApi.getMyCurrentPlayingTrack();
      
      if (!data.body || !data.body.item) {
        return { error: 'no_track', message: 'No track is currently playing' };
      }

      return {
        name: data.body.item.name,
        artist: data.body.item.artists[0].name,
        album: data.body.item.album.name,
        url: data.body.item.external_urls.spotify,
        albumArt: data.body.item.album.images[0]?.url
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      return { error: 'spotify_error', message: 'Failed to fetch track information' };
    }
  }

  setUserTokens(userId, tokens) {
    this.userTokens.set(userId, tokens);
  }
}

export const spotifyService = new SpotifyService();