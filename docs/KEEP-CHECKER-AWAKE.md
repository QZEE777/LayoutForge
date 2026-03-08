# Keep the checker awake so users don’t wait

## The problem (in plain English)

The checker runs on Render’s **free** plan. When nobody uses it for a while, Render turns it off to save money. The next person who uses it has to wait 30–60+ seconds while it starts back up. That’s why big files often “fail” — the page gives up before the checker has finished waking.

## The fix: ping the checker every few minutes

If something on the internet calls your checker’s “are you there?” page every 5 minutes, Render **never turns it off**. Then every user gets a fast response and no more “wait 60 seconds” or failed large-file checks from cold start.

You only need to set this up **once**. No code changes. No paying users to wait.

---

## Step-by-step: use UptimeRobot (free)

1. **Open:** https://uptimerobot.com and sign up (free account is enough).

2. **Add a monitor:**
   - Click **“Add New Monitor”**.
   - **Monitor Type:** choose **“HTTP(s)”**.
   - **Friendly Name:** e.g. `Print Ready Checker`.
   - **URL:** your checker’s “are you there?” address.  
     Use the same address you put in Vercel for the checker, and add `/health` at the end.  
     Example: `https://layoutforge.onrender.com/health`  
     (Replace with your real checker URL if it’s different.)
   - **Monitoring Interval:** choose **5 minutes** (or the smallest option they allow).
   - Leave the rest as default and click **“Create Monitor”**.

3. **Done.**  
   UptimeRobot will call that address every 5 minutes. Render will see traffic and keep the checker on. Users stop seeing long waits and failed large-file checks from cold start.

---

## If you prefer not to use a third-party site

**Option A – Upgrade Render**  
On Render, upgrade the checker service from the free plan to a **paid** plan. Paid plans don’t put the service to sleep, so there’s no cold start and no need for a ping.

**Option B – Another “ping” service**  
Any service that can open a URL on a schedule will work. For example:
- https://cron-job.org (free, you create a “job” that hits your `/health` URL every 5–10 minutes).
- Your hosting or monitoring provider’s “HTTP check” or “uptime check” pointed at `https://your-checker-url/health` every 5 minutes.

---

## Summary

- **Why** big files often failed: the checker was sleeping; the first request had to wake it and timed out.
- **Fix:** something (e.g. UptimeRobot) calls your checker’s `/health` URL every 5 minutes so it stays awake.
- **Result:** no more “wait 30–60 seconds” or cold-start failures for users.
