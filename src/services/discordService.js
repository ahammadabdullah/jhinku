import { Client, GatewayIntentBits, EmbedBuilder, Partials, PermissionsBitField } from 'discord.js';
import { config } from '../config/config.js';
import { spotifyService } from './spotifyService.js';

class DiscordService {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction]
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      if (message.content === '!jhinku') {
        try {
          const track = await spotifyService.getCurrentTrack(message.author.id);
          
          if (track.error === 'not_authenticated') {
            try {
              const authUrl = spotifyService.getAuthURL(message.author.id);
              const authEmbed = new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle('Spotify Authentication Required')
                .setDescription('Please click the link below to authenticate with Spotify:')
                .addFields({ name: 'Authentication Link', value: `[Click here](${authUrl})` })
                .setFooter({ text: 'After authenticating, you can use /jhinku in any channel!' });

              await message.author.send({ embeds: [authEmbed] });
              
              if (message.guild) {
                await message.reply('I\'ve sent you a DM with authentication instructions! Please check your DMs.');
              }
            } catch (dmError) {
              console.error('Could not send DM:', dmError);
              await message.reply('I couldn\'t send you a DM. Please enable DMs from server members and try again.');
            }
            return;
          } else if (track.error) {
            await message.reply(track.message);
            return;
          }

          const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('Currently Playing')
            .addFields(
              { name: 'Track', value: track.name },
              { name: 'Artist', value: track.artist },
              { name: 'Album', value: track.album }
            )
            .setURL(track.url);

          if (track.albumArt) {
            embed.setThumbnail(track.albumArt);
          }

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error handling !playing command:', error);
          await message.reply('Sorry, there was an error processing your request.');
        }
      }

      if (message.content === '!help') {
        try {
          const helpEmbed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('Bot Commands')
            .addFields(
              { name: '!jhinku', value: 'Shows your currently playing Spotify track' },
              { name: '!help', value: 'Shows this help message' }
            );
          
          await message.reply({ embeds: [helpEmbed] });
        } catch (error) {
          console.error('Error handling !help command:', error);
          await message.reply('Sorry, there was an error displaying the help message.');
        }
      }
    });
  }

  async notifyAuthenticationSuccess(userId) {
    try {
      const user = await this.client.users.fetch(userId);
      const successEmbed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('Authentication Successful!')
        .setDescription('You have successfully connected your Spotify account. You can now use the !playing command in any channel!')
        .setTimestamp();

      await user.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error sending authentication success message:', error);
    }
  }

  start() {
    this.client.login(config.discord.token)
      .catch(error => {
        console.error('Failed to login to Discord:', error);
        throw new Error('Discord authentication failed');
      });
  }
}

export const discordService = new DiscordService();