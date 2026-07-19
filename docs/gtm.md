# Go-to-Market — Minaroute (with the Manasik pilgrimage mode)

> **Product note:** The product is **Minaroute** (everyday Muslim-friendly-places discovery) with **Manasik** as its pilgrimage mode. The tactics below focus on launching the pilgrimage experience, but the community directory is a dual engine: it drives **acquisition** (people actively search for Muslim schools, halal food, and events) and **retention** (everyday utility keeps the app installed between pilgrimages). Win directory coverage in one beachhead city (Lagos) first. See `docs/product-architecture.md`.

> A solo-founder launch playbook. Every tactic here is executable by one part-time person on a near-zero budget. Prioritized ruthlessly — better to run three channels well than ten badly.

## 1. Market Context

Roughly 1.8+ billion Muslims consider Hajj and Umrah among the most significant undertakings of their lives, and the number performing Umrah in particular has grown sharply as Saudi Arabia has expanded visas and eased access for independent (non-package) travelers. That shift is exactly the opening for Manasik: the more people who travel *without* a traditional mutawwif or group leader, the more acute the "no live guidance" problem becomes. Existing tools are either generic Muslim apps (prayer times, du'a libraries) or scattered YouTube guides and PDF booklets — none of which prepares a pilgrim from home and then guides them, location-aware, through the rites. The timing is good for three reasons: independent Umrah travel is rising, smartphone penetration in the biggest sending markets (Indonesia, Pakistan, Nigeria, Egypt, India, Bangladesh) is now near-universal, and AI coding tools make it feasible for a solo designer-founder to ship a polished app that would once have needed a funded team. Manasik does not need to win a billion users — it needs to become the trusted companion that anxious, first-time, and solo pilgrims are told about by the creators and communities they already follow.

## 2. Launch Strategy

Given the constraints (solo, part-time, limited budget, Umrah-first prototype) and the 90-day goal — a usable prototype friends can take on a real Umrah — this is deliberately **not** a big-bang public launch. It's a slow, trust-first rollout that matches the seriousness of the domain. Correctness and trust matter more than a spike of downloads, so the sequence prioritizes real pilgrim validation and credible endorsement over vanity metrics.

**Phase 1 — Pre-launch (build trust + private beta, ~8 weeks).** Quietly build in public within Muslim tech/da'wah circles, line up a scholar reviewer, and get the prototype onto the phones of friends and a small hand-picked group traveling for Umrah. The deliverable of this phase is not downloads — it's testimonials and corrections from real journeys.

**Phase 2 — Soft launch (invite-only / waitlist, ~weeks 0–6).** Open a public waitlist and release via TestFlight + Play internal testing to a widening circle sourced from one or two Islamic creators. Collect reviews, fix the rite content and geofencing based on real use, and secure a visible endorsement. Still no app-store push.

**Phase 3 — Public launch (store release, timed to a season).** Release publicly on the App Store and Play Store, ideally timed to the run-up to **Ramadan** (the annual Umrah peak) — the single highest-intent window of the year. Lead with creator content and the accumulated testimonials, not paid ads.

## 3. Pre-Launch Playbook

The audience does not hang out on Product Hunt or Hacker News — they're on YouTube, TikTok/Instagram, and in WhatsApp groups and mosques. So "building in public" here means building trust in *Muslim* spaces, not startup spaces.

**Weeks -8 to -7 — Foundation.** Lock the name and grab handles on TikTok, Instagram, YouTube (Shorts), and X — all as "Minaroute" (or the closest available, kept consistent). Set up a one-page landing site with an email waitlist (use a free tier: Carrd + a free email tool, or a simple Supabase-backed page). Write the core story in one paragraph you can reuse everywhere: the anxious first-time/solo pilgrim, the scattered prep, the location-aware companion. Begin outreach to **one scholar or knowledgeable imam** to review rite content — this is the most important pre-launch task and the longest lead time.

**Weeks -6 to -5 — Start the content engine.** Post 3x/week short-form (60–90s) on TikTok + Instagram Reels + YouTube Shorts (same clip, cross-posted). Theme: *practical Umrah prep tips* — "3 things first-timers forget to pack," "the order of Umrah rites in 60 seconds," "what to do if you get separated from your group." You are not selling the app yet; you're becoming a trusted, useful voice. End each with a soft "I'm building something to make this easier — join the waitlist."

**Weeks -4 to -3 — Private beta with friends.** Get the Umrah prototype (via EAS internal distribution / TestFlight) onto the phones of the friends who are traveling soon. Give them a dead-simple feedback channel (a WhatsApp group or a single Google Form). Ask specifically about: correctness of rites, whether prep made them feel readier, and any moment they felt lost. Keep posting content; start teasing screenshots of the (beautiful) prep experience.

**Weeks -2 to -1 — Line up amplification.** DM 5–10 mid-size Islamic creators who make Hajj/Umrah guide content (10k–300k followers is the sweet spot — big enough to matter, small enough to reply). Don't ask for a promo; offer them early access and ask for honest feedback. Convert your best friend-tester story into a short testimonial clip. Reach out to 2–3 Umrah travel agencies with a one-paragraph pitch: "a free companion app your pilgrims will love — want to try it with a group?"

**Week 0 — Waitlist push.** Publish a "coming soon" clip showing the magic moment (prep at home → arriving and being guided). Point everyone to the waitlist. Aim to enter soft launch with a list of engaged, high-intent pilgrims rather than a cold audience.

## 4. Launch Week Plan

This applies to the **public (store) launch** in Phase 3, timed to the pre-Ramadan Umrah surge.

**Day 1 (Mon) — Go live quietly.** Release on both stores. Announce to the waitlist by email first — they're your warmest audience and best early reviews. Post the hero clip across TikTok/Reels/Shorts. Ask waitlist users to download and, crucially, to leave an honest store review (early ratings drive store ranking).

**Day 2 (Tue) — Creator day.** Have your 1–2 committed creators post their honest walkthrough. Repost and engage every comment. Watch install numbers and crash reports (EAS/analytics).

**Day 3 (Wed) — Story day.** Publish the strongest real-pilgrim testimonial ("this made my Umrah easier"). Share it as a Reel and in relevant Facebook/WhatsApp Umrah groups where you're already a member (participate, don't spam).

**Day 4 (Thu) — Utility day.** Post a genuinely useful piece (e.g., "the complete Umrah checklist") that stands alone and links to the app. This is your most shareable, evergreen asset.

**Day 5 (Fri) — Jumu'ah reach.** Friday is the highest-engagement day for Muslim audiences. Post a reflective, mission-driven piece about *why* you built Manasik. If you have a mosque connection, ask them to mention it. 

**Weekend — Respond & fix.** Triage feedback, ship a quick EAS Update for any rough edges, and thank every reviewer publicly. Watch: installs, onboarding-completion rate, crash-free sessions, and store rating.

## 5. Post-Launch Growth

**Weeks 1–4 — Listen and harden.** Treat this as a continuation of beta. Talk to real users (offer a 15-min call to anyone who completed an Umrah with the app). Fix rite-content edge cases and geofencing issues fast. Keep the content cadence at 3x/week; double down on whichever format is converting (usually the "practical tip" Shorts). Add store-review prompts at the right moment (after a completed prep milestone, never mid-rite).

**Weeks 5–8 — Deepen credibility.** Publish your scholar endorsement prominently (site, store description, a dedicated clip). Formalize one agency pilot — get a single agency to hand Manasik to one real group and report back; that becomes a case study and a repeatable B2B motion. Start a simple email/WhatsApp broadcast for waitlist + users with prep tips tied to their travel dates.

**Weeks 9–12 — Compound and plan the season.** Identify your best-performing creator partnership and propose a deeper collaboration for the Ramadan/Umrah peak. Begin scoping the highest-requested language (from real user data) and the local-business marketplace discovery spike (from the roadmap's Phase 5). Decide double-down vs. adjust based on one question: *are users telling other pilgrims about it?* If yes, pour fuel on creators + word of mouth. If not, return to user interviews before spending on reach.

## 6. Channel Strategy

**1. Islamic content creators (highest ROI).** Your target user already watches Hajj/Umrah guide videos — the endorsement problem is half-solved. Effort: moderate (relationship-building, 5–10 warm DMs, offering early access). Return: high (a single trusted creator can drive more qualified installs than months of ads). Timeline: 4–8 weeks to first partnership. This is your #1 channel — protect and invest in it.

**2. Short-form social da'wah (owned, compounding).** TikTok, Instagram Reels, YouTube Shorts with the *same* cross-posted clips, 3x/week. Effort: sustained but cheap (one filming session can yield several clips). Return: builds a durable, owned audience and feeds every other channel. Timeline: compounds over 8–12 weeks. This is your engine; the creator channel is the accelerant.

**3. Umrah/Hajj travel agencies (B2B2C, high-value).** Agencies have already-booked, high-intent pilgrims. Effort: moderate (direct outreach, one pilot). Return: high per deal, and a distribution wedge that doesn't depend on you posting daily. Timeline: 6–12 weeks to a first pilot. Start with one; make it a case study.

**4. Mosques & WhatsApp/Facebook communities (grassroots).** Local mosques, community groups, and existing Umrah-prep WhatsApp/Facebook groups. Effort: low-to-moderate and personal. Return: steady, trust-rich word of mouth. Timeline: ongoing. Participate authentically where you're already a member; don't cold-spam.

**Deliberately skipped for now:** paid ads (expensive, low trust for a sacred product, and you lack the budget), Product Hunt/HN (wrong audience), and SEO (too slow for MVP). Revisit paid social only after a creator clip proves a repeatable conversion.

## 7. Content Strategy

Anchor everything to how this audience already seeks information: they search YouTube for "how to perform Umrah step by step" and scroll Reels for travel tips. Meet them there with genuinely useful, standalone content — the app is the natural next step, not the pitch.

**Core format (3x/week):** 60–90s vertical clips, cross-posted to TikTok, Reels, and Shorts. Three recurring series: **Prep** ("what first-timers forget," packing, documents, du'as to memorize), **Rites explained** (each rite in under 90 seconds, plainly, in the gentle Manasik voice), and **Reassurance** ("what if you get separated," "it's okay if you're nervous — here's how to feel ready"). Keep the brand voice from `product-vision.md § Voice & Tone`: warm, gentle, encouraging, lightly spiritual, never preachy.

**Evergreen anchor asset:** one genuinely excellent "Complete Umrah Prep Checklist" (as a clip + a shareable graphic + the in-app checklist). This is your most shareable, most searchable piece — the thing people send to a friend who's going.

**Cadence discipline:** batch-film once a week so posting never depends on daily willpower. Reuse the same script across the app's learning modules, your captions, and your store description — one voice everywhere.

## 8. Community Strategy

Your audience gathers in three places: **YouTube comment sections** of Hajj/Umrah guide videos (be genuinely helpful there — answer questions, no links at first), **Facebook/WhatsApp Umrah groups** (join as a real participant sharing tips; earn the right to mention the app), and **local mosques** (the highest-trust environment of all — a single respected imam's mention outweighs thousands of impressions). The posture throughout is *participation before promotion*: show up as a knowledgeable, caring member of the community for weeks before you ever ask for a download. Because Manasik's mission is service ("useful even for one person"), this comes naturally — lead with help, and let the app be the thing people discover because you were the person who made their prep easier. Consider a small "founding pilgrims" group (a WhatsApp or Discord) for your earliest users, so feedback is a conversation, not a form.

## 9. Key Metrics

Tied to the 90-day goal (a usable prototype real friends take on Umrah) and the vision's success metrics, keep the dashboard tiny and honest.

**North-star (primary):** number of pilgrims who complete a full app-guided Umrah and report it "made my Umrah easier." In the first 90 days, even 3–5 is a real signal.

**Acquisition:** waitlist signups (target a few hundred pre-launch from content + one creator); installs (track source: creator vs. organic vs. agency). **Activation:** onboarding-completion rate (reaching the personalized home — target 80%+, since it's friction-light); checklist engagement in the weeks before travel. **Retention:** do users return to prepare across multiple sessions before departure? (the leading indicator that the primary magic moment landed); rite-completion rate on the ground. **Reliability:** crash-free sessions and successful offline sessions (a trust metric that matters more than growth here). **Revenue:** effectively $0 in MVP by design — the early "revenue" metric is *qualified interest*: number of local businesses or agencies that ask to be involved.

The one question that overrides every metric: **are users telling other pilgrims about it?** Word of mouth is both the goal and the truest signal.

## 10. Budget Considerations

The whole plan is designed to run on roughly **$0–50/month** plus unavoidable developer fees. Free: all social platforms, the content engine (film on your phone), a Carrd/Supabase landing page, waitlist email on a free tier, community participation, and creator outreach (offer early access, not cash). Unavoidable: Apple Developer Program (~$99/yr) and Google Play (~$25 one-time) to publish; everything else in the stack (Supabase, expo-maps, EAS) runs on free tiers at this scale. Where to spend *first* if a little money appears: (1) **du'a audio licensing/recording** — it's core to trust and correctness, not marketing; (2) a small honorarium or gift for your **scholar reviewer**, if appropriate; (3) only *after* a creator clip proves it converts, a modest boost/paid partnership with that one creator. Do **not** spend on broad paid ads early — for a sacred, trust-driven product with a solo founder, money is better invested in correctness and relationships than impressions.

## 11. Risks

**Trust barrier for a religious app (high impact).** Pilgrims may hesitate to rely on software for worship. Mitigation: secure and prominently display a scholar endorsement before public launch; frame Manasik humbly as "a companion, not a replacement for knowledge"; lead with real pilgrim testimonials.

**Content-correctness scrutiny (high impact).** A single wrong rite detail, publicly caught, could damage trust badly. Mitigation: scholar review before launch, visible sourcing, a fast public correction path, and cautious handling of madhhab differences (see `prd.md § Open Questions`).

**Creator channel dependence (medium impact).** Early reach leans on a few creators; if they don't post, the launch stalls. Mitigation: cultivate several relationships in parallel and build the owned short-form engine so you're never reliant on one person.

**Seasonality / mistimed launch (medium impact).** Umrah intent peaks around Ramadan; launching in a trough wastes momentum. Mitigation: time the public launch to the pre-Ramadan window; use troughs for beta, content, and agency pilots.

**Solo-founder bandwidth (medium impact).** Content + product + support is a lot for one part-time person. Mitigation: batch-film content weekly, automate store-review and feedback prompts, and keep the channel list to the top three until traction justifies more.

**Cross-cultural / language mismatch (medium impact).** The biggest sending markets aren't English-first; English-only content and app limit reach. Mitigation: prioritize the first additional language based on real user/creator data, and partner with a creator who speaks that language for localized content.
