const path = require('path');
const { createTransporter } = require('./transporter');

const resolveFromAddress = () => {
    const configuredFrom = (process.env.EMAIL_FROM || '').trim();
    const authUser = (process.env.EMAIL_USER || '').trim();

    if (!configuredFrom) {
        return authUser;
    }

    const fromDomain = (configuredFrom.split('@')[1] || '').replace('>', '').trim().toLowerCase();
    const userDomain = (authUser.split('@')[1] || '').trim().toLowerCase();

    // Evita desalinear remitente en Gmail (ej. no-reply@cherry.local) porque aumenta score de spam.
    if (!fromDomain || fromDomain.endsWith('.local') || (userDomain && fromDomain !== userDomain)) {
        return authUser;
    }

    return configuredFrom;
};

const buildDataRows = (rows) => {
    return rows
        .filter((row) => row && row.label && row.value !== undefined && row.value !== null && String(row.value).trim() !== '')
        .map((row) => `
            <tr>
                <td style="padding:10px 12px;font-size:13px;color:#68473D;background:#fff7f7;border:1px solid #f0dddd;font-weight:700;width:38%;">${row.label}</td>
                <td style="padding:10px 12px;font-size:13px;color:#68473D;background:#ffffff;border:1px solid #f0dddd;">${row.value}</td>
            </tr>
        `)
        .join('');
};

const sendBrandedEmail = async ({
    to,
    subject,
    title,
    introText,
    detailsHtml,
    detailTextLines = [],
    highlightText,
    closingText,
    footerText,
    text
}) => {
    const transporter = createTransporter();
    const logoPath = path.join(__dirname, '../../../public/images/logo_cherry.png');
    const logoCid = 'logo_cherry_png';
    const publicLogoUrl = (process.env.EMAIL_LOGO_URL || '').trim();
    const useCidLogo = (process.env.EMAIL_USE_CID_LOGO || 'false').trim().toLowerCase() === 'true';
    const logoSrc = publicLogoUrl ? publicLogoUrl : (useCidLogo ? `cid:${logoCid}` : '');

    const html = `
        <div style="margin:0;padding:24px 0;background:#FEF2F2;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #f3dada;border-radius:22px;overflow:hidden;">
                <tr>
                    <td style="padding:24px 24px 12px 24px;background:linear-gradient(135deg,#FEF2F2 0%,#ffffff 100%);text-align:center;border-bottom:1px solid #f0dddd;">
                        ${logoSrc ? `<img src="${logoSrc}" alt="Cherry" style="max-width:185px;height:auto;display:inline-block;" />` : ''}
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px;font-family:'Trebuchet MS',Verdana,Arial,sans-serif;color:#68473D;">
                        <h2 style="margin:0 0 10px 0;font-size:24px;line-height:1.25;color:#D92525;">${title}</h2>
                        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">${introText}</p>
                        ${detailsHtml || ''}
                        <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#497413;font-weight:600;">${highlightText || ''}</p>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#68473D;">${closingText || ''}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 24px;background:#fff7f7;border-top:1px solid #f0dddd;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#68473D;text-align:center;">
                        ${footerText || 'Sistema Cherry'}
                    </td>
                </tr>
            </table>
        </div>
    `;

    const fallbackText = [
        title,
        introText,
        ...detailTextLines,
        highlightText,
        closingText
    ].filter(Boolean).join('\n');

    await transporter.sendMail({
        from: resolveFromAddress(),
        to,
        subject,
        text: text || fallbackText,
        html,
        attachments: (!publicLogoUrl && useCidLogo)
            ? [
                {
                    path: logoPath,
                    cid: logoCid,
                    contentType: 'image/png',
                    contentDisposition: 'inline'
                }
            ]
            : []
    });
};

module.exports = {
    buildDataRows,
    sendBrandedEmail
};
