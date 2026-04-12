import { Resend } from "resend";
import { cronFailureEmailSubject } from "./emailSubjects";

/** Best-effort email to ops when a scheduled job fails fatally. */
export async function alertCronFailure(cronName: string, reason: string): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: "hello@manu2print.com",
      subject: cronFailureEmailSubject(cronName, new Date().toISOString().slice(0, 10)),
      text: `The ${cronName} cron failed.\n\nReason: ${reason}\n\nCheck Vercel logs.\n\n— manu2print cron monitor`,
    });
  } catch {
    /* ignore */
  }
}
