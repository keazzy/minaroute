# Product Vision — Minaroute (Manasik pilgrimage mode)

> **Product note:** This product is now **Minaroute** — an everyday app for finding Muslim-friendly places — with **Manasik** as its focused **pilgrimage mode**. The strategy and brand below describe primarily the Manasik pilgrimage mode and the shared brand foundation; the everyday discovery shell (Home / Explore / Trips / Review) is defined in `docs/product-architecture.md`, which is the authoritative merged-product definition. Read that first.

## 1. Vision & Mission

### Vision Statement

Every Muslim, whether they travel with a guide or entirely alone, can perform Hajj and Umrah with confidence and presence — arriving prepared and moving through each rite knowing exactly what to do, where to go, and that they are doing it correctly.

### Mission Statement

Manasik prepares pilgrims from the day they start planning at home and then guides them, place by place, through every rite on the ground using location-aware, scholar-verified guidance in their own language.

### Founder's Why

Abdulazeez is a Muslim product designer whose work is animated by a single conviction: build things that are truly useful, even if they help just one person. That belief is unusual in a market obsessed with scale, and it is exactly what makes Manasik trustworthy. This is not a growth play dressed in religious language — it is an act of service that happens to be a product.

He has not yet performed Umrah himself, and rather than a weakness this is the source of his discipline. He is building from the outside in, with humility: learning from friends who have made the journey, from the beautiful guide videos that pilgrims already turn to, and — critically — committing to scholar-verified content and real pilgrim testing rather than assuming he already knows the answers. Founders who have done the pilgrimage often build from memory; Abdulazeez is forced to build from evidence, which for a spiritually critical product is the safer instinct.

His sharpest insight reframes the entire category. Most tools treat guidance as something that happens on the ground in Makkah. Abdulazeez insists it begins at day one of planning, at home. Preparation is where anxiety is either resolved or carried onto the plane, and it is where a companion can do its quietest, most important work. That is the seed the whole product grows from.

### Core Values

**Correctness is sacred.** Every rite, du'a, count, and instruction must be verified against recognized scholarship before it ships. On this journey a wrong instruction is not a bug — it is a harm. When in doubt, we do not guess; we cite, we defer, and we mark clearly what is agreed upon versus what varies by school.

**Prepared before the plane.** We design for the weeks before departure as seriously as the moments at the Kaaba. If a pilgrim boards feeling ready, we have already succeeded once before they arrive.

**Calm over clever.** The pilgrim is often anxious, tired, and overwhelmed by crowds. Every screen should lower the heart rate, not raise it. We remove steps, shorten words, and never make someone hunt for what they need at the moment they need it.

**Works when it matters most.** The rites happen in the densest crowds on earth, where networks fail. Core guidance must work offline, every time. Reliability at the Haram is worth more than any feature that needs a signal.

**Useful to one before useful to a million.** We would rather delight a single solo pilgrim completely than half-serve a crowd. Depth of care is our differentiator and our discipline.

### Strategic Pillars

**Umrah first, Hajj later.** Umrah is the smaller, year-round, less complex rite. It is the right beachhead to prove the experience before taking on the scale and seasonality of Hajj.

**Location is the magic, content is the trust.** The geofenced "it knows where I am" moment is what makes Manasik feel alive, but scholar-verified content is what makes pilgrims rely on it. We invest in both and never let one outrun the other.

**Prepare, then guide.** The product has two acts — readiness at home and guidance on the ground. Decisions that strengthen the bridge between them win over decisions that optimize only one.

**Solo-buildable.** Abdulazeez is a solo, part-time, designer-founder building with AI coding agents. Any feature that cannot be built and maintained under those constraints is deferred until it can be.

### Success Looks Like

In twelve months, a first-time pilgrim from Lagos or Jakarta downloads Manasik the week they book their Umrah. Over the following weeks the app walks them through what to pack, what to learn, and what to expect, and they board their flight feeling — many for the first time — genuinely ready. In Makkah, as they approach the Mataf, their phone quietly tells them they've arrived, shows the intention and the du'a in their language with audio, and tracks their circuits. They finish Umrah without once feeling lost or afraid they did it wrong, and they message Abdulazeez to say the app felt like a friend who had been there before. By then a handful of Islamic creators have made videos about it, a travel agency is piloting it with its customers, and the first few hotels and restaurants near the Haram have asked to be listed. The numbers are still small and that is fine — the reviews say "this made my Umrah easier," and that is the whole point.

## 2. User Research

### Primary Persona

**Ibrahim, 34 — first-time Umrah pilgrim, Lagos.** Ibrahim is a practicing Muslim with a steady job and a young family. He booked Umrah after years of intending to, and the excitement is real — but so is the anxiety. He is comfortable with a smartphone for WhatsApp, banking, and YouTube, but he is not a power user and does not enjoy fiddly apps. He does not speak Arabic. In the weeks before travel he pieces preparation together from a few YouTube guides, a PDF booklet a friend sent, and voice notes from relatives who have gone. His recurring fear is specific and emotional: that in the crowd and the moment, he will forget a step, mangle a du'a, or do the rites out of order on the one journey he has waited his whole life to make. He is not looking for theology or a course — he wants to feel ready before he flies and to be quietly told what to do at each place once he is there. He would switch to Manasik the instant it convinces him it will carry that burden for him. His tech comfort means the app must be effortless; his emotional state means it must be calming; his language means everything must be available in clear, plain English (and eventually Yoruba/Hausa and other pilgrim languages).

### Secondary Personas

**The group leader / mutawwif.** An experienced guide shepherding ten to forty pilgrims. He currently keeps everyone together by voice, patience, and repetition. Manasik could let him share an itinerary, keep stragglers oriented, and reduce the number of times he answers the same question — turning the app into a force multiplier rather than a replacement.

**The travel agency.** A Hajj/Umrah agency that has already sold the trip and wants happier, better-prepared customers and a reason to stand out. They see Manasik as a value-add or co-branded companion that reduces support headaches and raises reviews, and a potential distribution partner.

**The family member back home.** A spouse or parent who cannot travel and wants reassurance and connection while their loved one is on pilgrimage. A lightweight "follow along / they're okay" experience could serve them, though this is a later consideration, not an MVP concern.

### Jobs To Be Done

**Functional:** "When I book my Umrah, help me arrive fully prepared — what to pack, learn, and expect — so I'm not scrambling." "When I reach a site, tell me exactly which rite to perform, the du'a, how many times, and how long, so I do it correctly." "When I finish a rite, show me where to go next and which gate to use, so I never feel lost." "When there's no signal in the crowd, still work."

**Emotional:** "Help me feel calm and confident instead of anxious." "Let me be spiritually present instead of mentally juggling logistics." "Reassure me that I'm doing this right."

**Social:** "Let me perform the rites competently in front of strangers and my group without embarrassment." "Let me be the prepared one my family trusts to travel alone."

### Pain Points

**Fear of doing the rites wrong (severe, constant).** This is the emotional core. It shadows the whole trip, and today the pilgrim manages it with rehearsal, anxiety, and hope. Consequences are felt as spiritual distress, not just inconvenience — which is precisely why it is worth solving well.

**Disorientation on the ground (severe, frequent).** The Haram and the sites between Makkah and the plains of Arafat/Mina are vast, crowded, and multi-gated. Pilgrims get lost, lose their group, and take wrong turns. Google Maps does not understand rites or gates and is confusing indoors.

**Fragmented, generic preparation (moderate, chronic).** Videos, booklets, and WhatsApp advice do not add up to a plan, are not personalized to the pilgrim's dates or pace, and cannot help at the exact moment of need. The pilgrim never quite knows if they've prepared "enough."

**Language and pronunciation friction (moderate, frequent).** Non-Arabic speakers struggle with du'as and signage. Getting the words right matters to them deeply.

**Network failure in crowds (moderate but high-stakes).** At peak density, connectivity collapses — exactly when guidance is needed most. Any cloud-dependent guidance fails at the worst possible moment.

### Current Alternatives & Competitive Landscape

**Human mutawwif / guided group.** The gold standard and the thing Manasik is modeled on. It works well when present, but isn't always available, affordable, or attentive to each individual — and disappears the moment a pilgrim is solo or separated. Switching to Manasik doesn't require abandoning a guide; it complements one and covers the gaps.

**YouTube guide videos.** Free, rich, and trusted — pilgrims already love them. But they are linear, generic, not personalized, and useless at the exact moment and place of need. Manasik should feel like the video's knowledgeable host, but responsive to where you are.

**Printed / PDF rite booklets.** Portable and offline, but static, text-heavy, and hard to navigate under stress. No audio, no location, no progress tracking.

**General Muslim apps (Muslim Pro, Quran apps, du'a apps).** Excellent for prayer times, qibla, and du'a libraries, and many pilgrims already have them. But they are not purpose-built for the pilgrimage sequence, offer no location-aware rite guidance, and no wayfinding.

**Google Maps.** Ubiquitous for navigation, but disorienting inside the Haram, ignorant of rites and gates, and network-dependent. The founder's deliberate choice to avoid it is correct.

**"Do nothing" / rely on the day.** Many pilgrims simply trust that their group leader or the person next to them will tell them what to do. It often works — and it is exactly the anxious, dependent experience Manasik exists to replace.

### Key Assumptions to Validate

**Pilgrims will trust an app for religiously binding guidance.** We assume the target user will rely on Manasik for correctness because content is scholar-verified and clearly sourced. To validate: show prototypes to pilgrims and imams and measure stated trust and willingness to rely on it; secure at least one recognized scholar/endorser early.

**Geofencing is accurate and reliable enough at the sites.** We assume GPS/geofencing can detect arrival at rite locations precisely in a dense, partly indoor environment. To validate: field-test geofence triggers at real coordinates (or the closest proxies available) and design a manual fallback ("I'm here" / "start this rite") for when GPS is weak.

**Preparation is a strong enough hook on its own.** We assume the at-home readiness experience is compelling before the pilgrim ever tests the on-ground magic. To validate: ship the prep experience to friends heading for Umrah and measure whether they engage weeks ahead and report feeling readier.

**Offline-bundled content covers the critical path.** We assume the core rites, du'as, and maps can be bundled on-device to work without signal. To validate: build the Umrah rite set fully offline and test in airplane mode end to end.

**People will use it in the moment of worship.** We assume pilgrims will glance at a phone during rites without it breaking their spiritual presence. To validate: observe or interview about acceptable phone use; design for glanceable, audio-first, minimal-interaction guidance.

**Language coverage matters early, not later.** We assume multi-language is closer to must-have than nice-to-have for the target markets. To validate: check the primary languages of first testers and creators' audiences; prioritize accordingly.

**Creators and agencies will help distribute.** We assume Islamic creators and agencies see Manasik as additive, not competitive. To validate: pitch two or three creators and one agency during the prototype phase and gauge willingness.

### User Journey Map

**Awareness.** Ibrahim watches an Umrah prep video from a creator he trusts; the creator mentions Manasik as "the app I wish I'd had." Curiosity, mild skepticism.

**Consideration.** He installs it the week he books. The onboarding is warm and plain-spoken, asks his travel dates, and immediately shows a countdown and a short "here's how I'll help" — no account required to start. Relief begins to replace anxiety.

**First use (at home).** Over the following weeks he ticks off packing items, watches two-minute learning modules on Ihram and Tawaf, and reviews his personalized itinerary. He starts to feel ready. This is the first magic moment: *"I've got this."*

**Magic moment (on the ground).** In Makkah he approaches the Mataf and his phone gently notifies him he's arrived, shows the intention and du'a in English with audio, and offers to track his seven circuits. He performs Tawaf without fear. The promise made at home is kept.

**Habit formation.** For each subsequent rite — Sa'i, hair-cutting, and for Hajj the days of Mina and Arafat — Manasik hands him from one step to the next, tells him which way to walk and which gate to use, and works even when the signal drops. He stops rehearsing in his head and starts worshiping.

**Advocacy.** Back home, he leaves a review — "this made my Umrah easier" — and sends the app to a cousin planning to go. Friction points to watch: onboarding that feels heavy, any moment the app is wrong or unsure, and any reliance on signal at the Haram.

## 3. Product Strategy

### Product Principles

**Audio-first, glanceable always.** A pilgrim's hands, eyes, and attention belong to worship. Guidance should be hearable and understandable in a two-second glance, never a paragraph to read mid-rite.

**Offline is the default, not the fallback.** Design every core-path feature to work with no signal first, then enhance when connected — not the reverse.

**One clear next step.** At any moment the pilgrim should see exactly one thing to do next. Choice and complexity are the enemy of calm.

**Verified or absent.** If a rite instruction isn't scholar-verified, it doesn't ship. Where practice legitimately varies, say so plainly rather than pretending to a single answer.

**Prepare and guide are one product.** Never let the at-home experience and the on-ground experience feel like two apps. The itinerary the pilgrim built at home is the same thread that guides them in Makkah.

**Respect the moment.** The tone, timing, and even the silence of the app should honor that this is worship, not a task list to gamify.

### Market Differentiation

Manasik's difference is that it is the only tool that spans the whole journey and reacts to where the pilgrim physically is. Human guides are present but not always available and not scalable; videos and booklets are available but generic and blind to the moment; general Muslim apps and Google Maps each cover a slice but none is built for the pilgrimage sequence. Manasik occupies the empty intersection: purpose-built, end-to-end, and location-aware. That matters to Ibrahim because his two deepest fears — being unprepared and being lost or wrong on the ground — are precisely the two gaps no existing option closes together. It is defensible because the moat is not a single feature but the accumulation of scholar-verified content, tuned geofencing at real sites, offline reliability, and the trust these build — none of which a generic app can bolt on quickly, and all of which compound with every pilgrim who tests and improves it.

### Magic Moment Design

There are two linked magic moments, and the founder wisely chose the earlier one as primary. The first is at home: *"I've got this"* — the pilgrim feels ready before departure. For this to happen reliably, the MVP must deliver a genuinely reassuring prep experience within minutes of install: a warm onboarding, a personalized countdown and checklist tied to the pilgrim's dates, and short, trustworthy learning modules — all without forcing an account. The shortest path from install to this moment is: open app → enter travel dates → see "here's your plan and here's what to do first."

The second magic moment is on the ground: arriving at a site and being told, unprompted, exactly what to do. For this to be real in the MVP, the Umrah rite set must be fully built, geofenced to real coordinates, bundled offline, and paired with a manual "I'm here" fallback so the moment still lands when GPS is weak. Both moments are achievable in an Umrah-first MVP — which confirms the scope is right. If either required Hajj-scale complexity to work, the scope would be wrong; it does not.

### MVP Definition — In Scope

The MVP is an **Umrah companion**, built solo and part-time with AI coding agents, targeting a usable prototype for friends within 90 days.

**Onboarding + travel dates (no forced account).** A warm, plain-spoken intro that captures the pilgrim's Umrah dates and sets up the countdown. Essential because it is the on-ramp to the primary magic moment. Done = a pilgrim reaches a personalized home screen in under two minutes without signing in.

**Pre-trip prep: countdown, checklist, packing list, learning modules.** The at-home readiness experience that delivers "I've got this." Essential because it is the primary magic moment. Done = a pilgrim can tick off a packing/prep checklist and watch/read bite-size Umrah learning modules, all offline.

**Umrah rite guidance (step-by-step, scholar-verified, audio + text).** The complete Umrah sequence — intention/Ihram, Tawaf (with circuit counting), Sa'i (with lap counting), hair-cutting — each with du'a text, transliteration, audio, and duration. Essential; this is the substance. Done = a pilgrim can complete Umrah end to end guided entirely by the app, offline.

**Location-triggered guidance with manual fallback.** Geofencing that detects arrival at the key Umrah sites and surfaces the right rite, plus an always-available "I'm here / start this rite" control. Essential; this is the second magic moment and the product's signature. Done = arriving at (or manually selecting) a site opens the correct rite.

**Progress tracking + next step.** Mark rites complete, always see what's done and what's next. Essential for calm and orientation. Done = the home screen always shows the single next step.

**Basic wayfinding between Umrah sites.** Purpose-built directional guidance between the key sites and gate guidance for the Mataf — not full turn-by-turn. Essential enough to reduce disorientation; kept deliberately simple for v1.

**Offline core + English, architected for more languages.** All core-path content bundled on-device; English at launch with the data model built for additional languages. Essential because of network failure and the non-Arabic-speaking user.

### Explicitly Out of Scope

**Full Hajj rites and multi-day Mina/Arafat/Muzdalifah logistics.** Tempting because Hajj is the marquee event, but it is far more complex, seasonal, and higher-stakes. Deferred until the Umrah experience is proven. Reconsider after the Umrah prototype succeeds and before the next Hajj season.

**The local-business marketplace (hotels, restaurants, services).** The sharpest monetization idea, but it requires supply-side partnerships and a mature user base to matter. Deferred to post-MVP. Reconsider once there are real, repeat users near the Haram to serve.

**Family "follow-along" and social features.** Emotionally appealing but adds accounts, real-time infrastructure, and privacy complexity. Deferred. Reconsider after core guidance is loved.

**Group-leader / mutawwif coordination tools.** A promising B2B wedge, but a different product surface. Deferred until the individual experience is solid. Reconsider alongside agency conversations.

**Full multi-language localization.** Architected for from day one, but only English is authored at launch to keep scope lean. Add the top pilgrim languages once the English experience is validated.

**Payments / premium tier.** No paid features in the MVP — core guidance is free. RevenueCat is chosen for when premium arrives, but nothing to charge for yet.

### Feature Priority (MoSCoW)

**Must Have:** Onboarding with travel dates (no forced account); pre-trip checklist and packing list; bite-size Umrah learning modules; complete scholar-verified Umrah rite guidance with audio, transliteration, and counting; location-triggered rite surfacing with manual fallback; progress tracking and next-step; offline core; English.

**Should Have:** Basic wayfinding and gate guidance between Umrah sites; personalized itinerary tied to travel dates; data model and UI ready for additional languages.

**Could Have:** A second language (e.g. Urdu, Indonesian, or a Nigerian language matched to first testers); light qibla/prayer-time convenience; simple companion/family "they're okay" ping.

**Won't Have (this time):** Full Hajj; local-business marketplace; group-leader tools; premium/payments; social feed; real-time family tracking.

### Core User Flows

**Prepare at home.** Trigger: pilgrim installs after booking. Steps: warm intro → enter Umrah dates → see personalized countdown and checklist → tick off packing/prep items → watch/read Umrah learning modules. Outcome: feels ready before flying. Success: pilgrim returns across multiple sessions before departure and reports increased confidence.

**Perform a rite on the ground.** Trigger: pilgrim arrives at a site (geofence) or taps "I'm here." Steps: app surfaces the correct rite → shows intention and du'a with audio and transliteration → tracks count/duration → pilgrim marks complete → app presents the next step and direction. Outcome: rite performed correctly and in order, offline if needed. Success: pilgrim completes the full Umrah sequence app-guided without getting lost or unsure.

**Find the next site.** Trigger: rite complete. Steps: app shows next rite's location and simple directional/gate guidance → pilgrim walks → arrival re-triggers rite flow. Outcome: continuous, unbroken guidance through the sequence. Success: no "what now?" gap between rites.

### Success Metrics

**Primary metric:** Number of pilgrims who complete a full app-guided Umrah and report it "made my Umrah easier." For the 90-day goal, even a handful of friends is a meaningful signal.

**Secondary metrics:** Pre-trip engagement (sessions and checklist completion in the weeks before departure); rite-completion rate within the app; offline sessions that succeed without error; qualitative trust ("I felt confident I was doing it right").

**Leading indicators:** Installs from creator/agency referrals; onboarding completion rate (reaching the personalized home screen); day-1-to-departure retention (do they come back to prepare?); number of learning modules viewed per user.

**Good vs. great:** Good in 90 days = 3–5 friends complete Umrah with Manasik and give detailed feedback. Great = they proactively recommend it and at least one creator or agency asks to partner without being chased.

### Risks

**Content correctness (high likelihood of scrutiny, severe impact).** A wrong instruction damages trust irreparably and could mislead worship. Mitigation: scholar review before launch, clear sourcing, explicit handling of school-based differences, and a fast correction path.

**Geofencing unreliable at the sites (medium likelihood, high impact).** GPS is imperfect in dense, partly indoor spaces. Mitigation: always-available manual "I'm here" fallback; tune geofence radii; never make the magic moment depend solely on GPS.

**Cannot field-test at the real sites (high likelihood, medium impact).** The founder hasn't performed the pilgrimage and access is restricted. Mitigation: recruit friends traveling soon as testers; build a simulation/mock-location test mode; partner with returnees for feedback.

**Solo, part-time capacity (high likelihood, medium impact).** Scope can easily outrun a single part-time builder. Mitigation: ruthless Umrah-first MVP, lean managed stack (Supabase/Expo, reusing Minaroute), and disciplined deferral of Hajj, marketplace, and social.

**Trust barrier for religious guidance from an app (medium likelihood, high impact).** Some pilgrims may resist relying on software for worship. Mitigation: visible scholarly endorsement, humble framing ("a companion, not a replacement for knowledge"), and creator validation.

**Acceptability of phone use during worship (medium likelihood, medium impact).** Glancing at a phone mid-rite may feel wrong to some. Mitigation: audio-first, minimal-interaction, respectful design; make it feel like a whispered reminder, not a screen demanding attention.

**Distribution dependence on creators/agencies (medium likelihood, medium impact).** Early reach leans on others. Mitigation: cultivate several relationships in parallel and build an organic da'wah-content habit rather than betting on one channel.

## 4. Brand Strategy

### Positioning Statement

For Muslim pilgrims who want to feel prepared and confident performing Hajj or Umrah — especially those going without a dedicated guide — Manasik is the location-aware pilgrimage companion that readies you at home and guides you correctly through every rite on the ground. Unlike scattered videos, static booklets, general Muslim apps, or Google Maps, Manasik is purpose-built for the pilgrimage, works offline in the crowds, and tells you exactly what to do at the moment and place you need it.

### Brand Personality

Manasik is the friend who has made the journey and offers, without being asked, to walk beside you the whole way. If Manasik were a person, they would be warm, patient, and unhurried — the kind who lowers their voice in a crowd to say "don't worry, I'll tell you when we're there." They dress simply and carry themselves with quiet dignity, matching the sacredness of the moment without ever being pompous or preachy. They never rush you, never make you feel foolish for not knowing, and never show off their knowledge. They would sooner say "take your time" than "hurry up," and "may Allah accept it" than "task complete." They are companionable, not clinical; reassuring, not authoritative; present, not performative.

### Voice & Tone Guide

The voice is constant: gentle, encouraging, plain-spoken, and warmly spiritual without being preachy. Tone shifts gently by context.

| Context | DO | DON'T |
|---|---|---|
| Onboarding | "As-salamu alaykum. Let's get you ready — when do you travel for Umrah?" | "Create an account to unlock all features and maximize your experience!" |
| Rite guidance | "You've reached the Mataf. When you're ready, begin Tawaf — I'll count your circuits with you." | "STEP 3/7: Commence circumambulation. Tap to log each lap." |
| Error / no signal | "No internet right now — that's okay, everything you need is already here with you." | "Network error. Please check your connection and try again." |
| Empty state | "Your journey hasn't started yet. Let's prepare, step by step, in shaa Allah." | "No data available." |
| Success / rite complete | "Tawaf complete — beautifully done. May Allah accept it. When you're ready, we'll head to Safa." | "Task completed! 1 of 4 done. Keep the streak going!" |
| Marketing copy | "The companion that gets you ready at home — and guides you at every step of your Umrah." | "The #1 AI-powered Hajj super-app. Download now!" |

### Messaging Framework

**Tagline:** "Ready from home. Guided every step."

**Homepage headline:** "Perform your Umrah with confidence — prepared before you go, and guided at every rite."

**Value propositions:** (1) *Arrive ready.* Prepare from the day you book, so you board your flight knowing what to expect. (2) *Never feel lost or unsure.* When you reach each site, Manasik tells you exactly what to do, in your language, with audio. (3) *Works when it matters.* Everything you need is on your phone — even with no signal, in the biggest crowds.

**Feature descriptions:** Location-aware guidance ("it knows when you've arrived"); scholar-verified rites ("guidance you can trust"); offline-first ("no signal needed"); prepare-at-home ("readiness starts today").

**Objection handlers:** *"I have a guide."* → Manasik walks with you for the moments your guide can't — and remembers everything for you. *"Is it correct?"* → Every rite is verified against recognized scholarship and clearly sourced. *"Isn't using a phone during worship wrong?"* → Manasik is designed to whisper, not demand — audio-first and glanceable, so you stay present.

### Elevator Pitches

**5-second:** "Manasik gets Muslims ready for Umrah at home and guides them through every rite on the ground."

**30-second:** "Most people go for Hajj or Umrah with a guide, but if you're alone or a first-timer, you're anxious about doing the rites correctly. Manasik is a location-aware companion: it prepares you from the day you book, and once you arrive it detects where you are and tells you exactly what to do, in your language, with audio — even offline in the crowds. It's the friend who's made the journey, walking beside you."

**2-minute:** "Hajj and Umrah are the journeys of a lifetime, and today most pilgrims rely on a human guide to know what to do. But guides aren't always available, and if you're going alone or for the first time, preparation is scattered across YouTube videos and WhatsApp advice, and on the ground you're terrified of getting the rites wrong in an unfamiliar, crowded place where you may not speak Arabic. Manasik solves both halves. Before you travel, it prepares you — a countdown, a checklist, short learning modules — so you feel ready before you fly. On the ground, it uses your location to detect when you arrive at each site and tells you exactly what to do: the intention, the du'a with audio and transliteration, how many times, and where to go next — all scholar-verified and all working offline, because networks fail in the biggest crowds. We're starting with Umrah, which is simpler and year-round, and proving it with real pilgrims before expanding to Hajj. It's built by a Muslim product designer whose whole aim is to make something truly useful — even if it helps just one pilgrim perform their Umrah with confidence and presence. If you know someone going for Umrah, I'd love for them to try it."

### Competitive Differentiation Narrative

Every existing option solves part of the pilgrim's problem and none solves the whole. A human mutawwif is the trusted model but isn't always present, affordable, or attentive to the individual — and vanishes the moment you're solo. YouTube guides are beloved but linear and blind to the moment; booklets are portable but static; general Muslim apps nail prayer times and du'a libraries but were never built for the pilgrimage sequence; Google Maps doesn't understand rites or gates and fails indoors and in crowds. Manasik sits in the gap they all leave open: it is purpose-built for the pilgrimage, spans the entire journey from planning at home to the final rite, and — uniquely — reacts to where the pilgrim physically is, delivering the right guidance at the right place, offline. That combination is hard to copy quickly, because the real moat is trust built from scholar-verified content, geofencing tuned to real sites, and reliability in the exact conditions where everything else breaks. Manasik doesn't try to replace the guide, the video, or the du'a app — it becomes the one companion that finally connects them into a single, calm, confident journey.

## 5. Visual Design

Visual design tokens (colors, typography, spacing, components, motion) live in `docs/design.md`. If that file does not yet exist, run `/plaid design` with image references to generate it before building.
