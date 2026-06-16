/**
 * ================================================
 * CHIHIRO HD BOT - COMPLETE VERSION
 * Bot Discord untuk MLBB Roles Management
 * ================================================
 * Fitur:
 * - Role assignment untuk lane MLBB (EXP, Gold, Mid, Jungler, Roamer)
 * - Button-based interface untuk kemudahan user
 * - HTTP health check endpoint
 * - PM2 support untuk production deployment
 * - Docker support untuk containerization
 * ================================================
 */

'use strict';

// ============================================
// DEPENDENCIES & CONFIGURATION
// ============================================

require('dotenv').config();
const express = require('express');
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const TOKEN = process.env.TOKEN;
const PORT = Number(process.env.PORT) || 3001;

// ============================================
// ROLES CONFIGURATION
// ============================================

const ROLES = {
    role_exp: '1507513107910623252',        // EXP Laner
    role_gold: '1507513296679337994',       // Gold Laner
    role_mid: '1507475536618983465',        // Mid Laner
    role_jungler: '1507513310759751844',    // Jungler
    role_roamer: '1507515529840296066',     // Roamer
};

// ============================================
// DISCORD BOT CLIENT INITIALIZATION
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// ============================================
// GLOBAL VARIABLES
// ============================================

let lastInteractionAt = null;

// ============================================
// BOT READY EVENT
// ============================================

client.once('ready', () => {
    console.log(`✅ Bot berhasil online sebagai ${client.user.tag}!`);
    console.log(`🔧 Bot siap melayani di ${client.guilds.cache.size} server(s)`);
});

// ============================================
// MESSAGE CREATE EVENT - SETUP ROLES
// ============================================

client.on('messageCreate', async (message) => {
    // Abaikan bot messages
    if (message.author.bot) return;

    // Hanya di guild
    if (!message.guild) return;

    // Check command
    if (message.content.trim() !== '!setuproles-MLBB') return;

    try {
        // Create embed message
        const embed = new EmbedBuilder()
            .setColor('#FF8C00')
            .setTitle('🔥 Choose Your Lane Role & Dominate the Land of Dawn! 🔥')
            .setDescription(
                `:exp: - **EXP Laner** The frontline warrior! Hold the line, engage in epic duels, and show your resilience!\n\n` +
                `:gold: - **Gold Laner** The team's main damage dealer! Farm gold, scale up, and strike fear into your enemies!\n\n` +
                `:MID: - **Mid Laner** The game's tempo controller! Master the mid, unleash burst damage, and turn the tides of battle!\n\n` +
                `:jungle: - **Jungler** The shadow predator! Secure objectives, dominate the jungle, and ambush enemies with surprise ganks!\n\n` +
                `:roam: - **Roamer** The team's guardian! Support your allies with fast rotations, vision control, and game-changing initiations!\n\n` +
                '🔥 Choose your role now and conquer the battlefield! 🏆',
            )
            .setFooter({ text: 'Tap a button to get or remove a role • You can pick multiple roles!' });

        // Create button rows
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('role_exp')
                .setLabel('EXP Laner')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('role_gold')
                .setLabel('Gold Laner')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('role_mid')
                .setLabel('Mid Laner')
                .setStyle(ButtonStyle.Danger),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('role_jungler')
                .setLabel('Jungler')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('role_roamer')
                .setLabel('Roamer')
                .setStyle(ButtonStyle.Secondary),
        );

        // Send message with buttons
        await message.channel.send({
            embeds: [embed],
            components: [row1, row2],
        });

        console.log(`📤 Role selection message sent in ${message.guild.name} by ${message.author.tag}`);
    } catch (error) {
        console.error('Error sending role setup message:', error);
        await message.reply('❌ Terjadi kesalahan saat setup roles. Silakan coba lagi.');
    }
});

// ============================================
// INTERACTION CREATE EVENT - BUTTON CLICKS
// ============================================

client.on('interactionCreate', async (interaction) => {
    // Only handle button interactions
    if (!interaction.isButton()) return;

    // Update last interaction timestamp
    lastInteractionAt = new Date().toISOString();

    /**
     * Safe reply function to handle deferred replies
     */
    const safeReply = async (content) => {
        try {
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content });
            }
            return interaction.reply({ content, ephemeral: true });
        } catch (replyError) {
            console.error('Reply failed, trying editReply fallback:', replyError);
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content }).catch(() => {});
            }
            return interaction.reply({ content, ephemeral: true }).catch(() => {});
        }
    };

    try {
        // Defer the reply
        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        // Get role ID from button custom ID
        const roleId = ROLES[interaction.customId];
        if (!roleId) {
            await safeReply('❌ Role tidak ditemukan!');
            return;
        }

        // Get role and member objects
        const role = interaction.guild.roles.cache.get(roleId);
        const member = interaction.member;

        // Check if role exists
        if (!role) {
            await safeReply('❌ Role ini belum tersedia di server.');
            return;
        }

        // Toggle role (add/remove)
        if (member.roles.cache.has(roleId)) {
            // Remove role
            await member.roles.remove(roleId);
            await safeReply(`❌ Role **${role.name}** telah dilepas.`);
            console.log(
                `🗑️  Role removed: ${member.user.tag} from ${role.name} in ${interaction.guild.name}`
            );
        } else {
            // Add role
            await member.roles.add(roleId);
            await safeReply(`✅ Kamu berhasil mendapatkan role **${role.name}**!`);
            console.log(
                `➕ Role added: ${member.user.tag} to ${role.name} in ${interaction.guild.name}`
            );
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        const errorMsg = '❌ Terjadi kesalahan. Pastikan bot punya izin yang tepat!';
        
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

// ============================================
// EXPRESS SERVER SETUP
// ============================================

const app = express();

/**
 * Health check endpoint
 * Returns bot status and last interaction time
 */
app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        botOnline: client.isReady(),
        lastInteractionAt,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/**
 * Stats endpoint
 * Returns bot statistics
 */
app.get('/stats', (req, res) => {
    res.json({
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        ping: client.ws.ping,
        uptime: process.uptime(),
    });
});

/**
 * Health probe endpoint for Kubernetes/Docker
 */
app.get('/health', (req, res) => {
    if (client.isReady()) {
        res.status(200).json({ status: 'healthy' });
    } else {
        res.status(503).json({ status: 'unhealthy' });
    }
});

/**
 * Start HTTP server
 */
app.listen(PORT, () => {
    console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ============================================
// BOT LOGIN & ERROR HANDLING
// ============================================

/**
 * Validate TOKEN existence
 */
if (!TOKEN) {
    console.error('❌ TOKEN tidak ditemukan di .env');
    console.error('   Tambahkan bot token pada file .env atau environment variable TOKEN');
    process.exit(1);
}

/**
 * Login Discord bot
 */
client.login(TOKEN).catch((error) => {
    console.error('❌ Gagal login Discord:', error);
    process.exit(1);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
    console.log('📴 SIGTERM signal received: closing HTTP server and Discord client');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT signal received: closing HTTP server and Discord client');
    client.destroy();
    process.exit(0);
});

// ============================================
// UNHANDLED REJECTION HANDLER
// ============================================

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============================================
// Export untuk testing/module usage
// ============================================

module.exports = { client, app, ROLES };
