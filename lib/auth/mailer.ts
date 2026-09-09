import { ses } from 'tencentcloud-sdk-nodejs-ses';

export type MailDelivery = 'console' | 'tencent';

export function isTencentSesConfigured() {
  return Boolean(
    process.env.TENCENT_SECRET_ID &&
      process.env.TENCENT_SECRET_KEY &&
      process.env.TENCENT_SES_FROM &&
      process.env.TENCENT_SES_TEMPLATE_ID
  );
}

function sesClient() {
  return new ses.v20201002.Client({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: process.env.TENCENT_SES_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'ses.tencentcloudapi.com',
      },
    },
  });
}

async function sendViaTencent(email: string, code: string) {
  const templateId = Number(process.env.TENCENT_SES_TEMPLATE_ID);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    throw new Error('TENCENT_SES_TEMPLATE_ID is invalid');
  }

  await sesClient().SendEmail({
    FromEmailAddress: process.env.TENCENT_SES_FROM as string,
    Destination: [email],
    Subject: 'Voxify 登录验证码',
    Template: {
      TemplateID: templateId,
      TemplateData: JSON.stringify({ code }),
    },
    TriggerType: 1,
  });
}

/** Send a login code via Tencent SES when configured; otherwise print it in the server log. */
export async function sendLoginCode(email: string, code: string): Promise<{ delivery: MailDelivery }> {
  if (isTencentSesConfigured()) {
    await sendViaTencent(email, code);
    console.info(`[Voxify] Login code emailed to ${email}`);
    return { delivery: 'tencent' };
  }

  console.info(`\n[Voxify] 登录验证码 ${email}: ${code}\n`);
  return { delivery: 'console' };
}
