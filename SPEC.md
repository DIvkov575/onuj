# chatAnalytics — Product Spec

_Last updated: 2026-03-30_

---

## Vision

The product analytics layer for conversational interfaces. What Amplitude is for traditional apps — chatAnalytics is for apps where the UI is a text box.

As application interfaces shift from structured (buttons, forms, pages) to free-form (chat, voice, natural language), the entire analytics stack breaks. Amplitude, Mixpanel, and Google Analytics are built around events triggered by structured interactions. When the UI is a text box, those tools go blind.

**chatAnalytics creates the category: User Intent Analytics for Conversational Products.**

---

## The Core Problem

| | Traditional Apps | Conversational Apps |
|---|---|---|
| User behavior analytics | Amplitude / Mixpanel ✅ | **chatAnalytics** |
| Infrastructure monitoring | Datadog / New Relic ✅ | Datadog ✅ |
| Technical LLM observability | — | Langfuse / LangSmith ✅ |
| User intent analytics | Not needed (buttons define intent) | **No pure-play product exists** |

In a structured UI, you design the interaction so you implicitly know user journeys. Feature usage = page views + button clicks. In a conversational UI, a single text box replaces 50+ UI surfaces. All feature-usage signal collapses into one input event. Users express the same need 100 different ways. Success is ambiguous — the AI responded with a 200 OK, but was it useful?

---

## The 10 Developer Pain Points

1. **Intent Blindness** — No way to know the distribution of what users are trying to accomplish without reading logs manually
2. **Feature Usage Collapse** — All feature requests go into the same text box; traditional analytics can't extract which capabilities are being used
3. **Silent Failure** — Apps fail with a 200 OK; no error is thrown when the AI misunderstands or gives a wrong answer
4. **Gap Detection Blindness** — Users ask for unimplemented features constantly; this demand is never surfaced; it's the hidden product roadmap
5. **Quality Measurement Collapse** — No measurable signal when you change a system prompt; can't A/B test sentences like buttons
6. **Multi-Turn Failure Attribution** — In a 12-turn conversation, you can't identify which turn caused the breakdown at scale
7. **Cost/Value Opacity** — Token costs scale with conversation complexity but cannot be attributed to which conversation types drive value vs. waste
8. **Vocabulary Mismatch** — Developer terminology vs. user language; same intent, different phrasing; analytics can surface this gap
9. **Behavioral Opacity for Stakeholders** — "What does our AI mostly do?" is unanswerable without engineering involvement
10. **Behavioral Drift** — Model updates or new input patterns silently change behavior; traditional monitoring misses it

---

## Market

### Primary Market: LLM Observability & Analytics

| Source | 2024 | 2029–2034 | CAGR |
|---|---|---|---|
| Market.us | $510.5M | $8.1B (2034) | 31.8% |
| Business Research Co. | $1.44B | $6.8B (2029) | 36.3% |

This market is 100% technical observability today. The user intent analytics layer is unoccupied.

### Adjacent Reference Markets

| Market | 2025 Size | CAGR |
|---|---|---|
| Product Analytics (Amplitude tier) | $10.6–14.8B | 12–22.6% |
| Developer Observability (Datadog tier) | $28.5B | 19.7% |
| AI Developer Tools | $7.4–7.9B | 26.6% |
| Conversational AI Platform | $14.3–14.8B | 21–23.7% |
| AI Application Development | $40.3B (2024) | 18.6% |

### Scale Signals

- **4 million developers** have built with OpenAI (Sam Altman, DevDay Oct 2025)
- **2.1 million** actively building on OpenAI platform (Q2 2025)
- **750 million LLM-powered apps** projected globally by 2025
- **67% of organizations** use GenAI products powered by LLMs
- **40% of enterprise applications** will have AI agents by 2026 (up from <5% in 2025, Gartner)

### Bottom-Up SAM

~50,000 teams with deployed conversational products × $200–1,000/mo = **$120M–$600M SAM**, growing 30%+ annually. Expands toward the product analytics TAM ($10–15B) as AI features become standard in every SaaS product.

---

## Consumer Segments

### Segment 1: AI-Native Product Companies ← MVP Target

**Profile**: Companies whose core product IS a conversational AI interface — AI tutors, coding assistants, legal research tools, health apps, writing tools. 5–200 employees, Seed–Series B. Built on OpenAI/Anthropic API directly.

**Buyer**: Founder or Head of Product

**Trigger**: Have real users, can see token costs in Helicone/LangSmith, have zero understanding of what users are actually trying to do. Investors or advisors ask "what are your users using the product for?" and the founder can't answer.

**Narrative**: *"Our entire product is a chat interface. We have LangSmith for traces and Helicone for costs. But I have no idea what users are actually trying to do. Are 30% asking for something we don't support? Every product decision is a guess."*

**Price tolerance**: $200–$1,500/mo. Self-serve capable.

**Homogeneity**: Very high — universal pain regardless of vertical.

---

### Segment 2: Growth-Stage SaaS Adding AI Chat Features

**Profile**: Established SaaS products (50–2,000 employees, Series B–D) that shipped a conversational AI feature — a copilot, AI assistant, or "ask anything" interface. Existing analytics stack (Amplitude/Mixpanel) is completely silent on the AI feature.

**Buyer**: Head of Product, VP of Product

**Trigger**: AI feature is live. Analytics shows "5,000 users opened the chat window this month." PM cannot see what they asked, cannot explain feature adoption to leadership, cannot plan the next iteration. Amplitude is useless here.

**Narrative**: *"We shipped our AI assistant six months ago. I can see in Amplitude that 5,000 people have opened it. But I have no idea what they're asking or whether they're getting value. I'm writing the Q3 AI roadmap and I'm making it up."*

**Price tolerance**: $500–$3,000/mo. Already paying for Amplitude, Segment, etc.

**Homogeneity**: High for the pain; moderate for features needed.

---

### Segment 3: Developer Tool & API Companies

**Profile**: API-first companies (10–500 employees) with AI chat on their docs/developer console. Head of Developer Experience is a defined role.

**Buyer**: Head of Developer Experience, VP Developer Relations

**Trigger**: AI assistant is live on docs. Developers use it. DevEx team knows there are documentation gaps driving churn — but cannot see which ones. Recurring questions in chat are the richest signal they have about developer friction.

**Narrative**: *"We have an AI assistant on our developer docs. Developers ask it questions every day. If I could see what they ask most and what the bot can't answer, I could fix our docs and retain more developers. That signal is sitting in logs I never read."*

**Price tolerance**: $500–$5,000/mo. Developer retention has direct revenue impact.

**Homogeneity**: Very high — nearly identical pain across all developer-facing companies.

---

### Segment 4: Enterprise Internal AI Assistants ← V2

**Profile**: Fortune 500 / large mid-market deploying internal AI assistants for IT helpdesk, HR, legal, knowledge management. 70% of Fortune 100 are Anthropic customers.

**Buyer**: CIO, VP Digital Transformation, IT Director

**Trigger**: CFO asks for ROI 6–12 months post-deployment. Team can show token costs and uptime. Cannot show what employees get from it, what questions it fails to answer, or whether adoption is growing.

**Narrative**: *"We spent $2M deploying this AI assistant for 10,000 employees. Now the CFO wants ROI data. I can show him tokens and logins. I can't show him what employees actually use it for."*

**Price tolerance**: $3,000–$20,000/mo. Long sales cycles; compliance requirements.

---

### Segment 5: Consumer AI Application Companies ← V2

**Profile**: B2C AI apps (AI tutors, health apps, companions) with 10K–10M users. 5–100 employees, Seed–Series B.

**Buyer**: Founder or VP Product

**Trigger**: Retention drops at week 3. Team believes users hit capability gaps but can't see which ones without reading millions of conversations.

**Narrative**: *"We have 500K users of our AI tutor. Retention drops hard at week 3. If I knew which concepts users ask about that the tutor can't answer, I could fix retention. Right now we're guessing."*

**Price tolerance**: $200–$1,500/mo; usage-based tied to conversation volume.

---

## Competitive Landscape

### The Gap Matrix

| Capability | PostHog | Nebuly | LangWatch | Langfuse | Helicone | Inkeep | Braintrust |
|---|---|---|---|---|---|---|---|
| Auto intent/topic clustering | ✅ basic | ✅ | ⚠️ partial | ❌ DIY | ❌ | ✅ locked | ❌ |
| Knowledge gap detection | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ locked | ❌ |
| Works with any LLM | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Non-technical stakeholder view | ⚠️ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Self-serve / low-friction onboarding | ✅ | ❌ sales-led | ⚠️ | ✅ | ✅ | ❌ | ⚠️ |
| Vocabulary mismatch analysis | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Recurring pattern alerts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Purpose-built for chat products | ❌ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ |

### Key Competitors

**PostHog** (closest competitor) — Launched Clusters on March 13, 2026: automatic behavioral clustering of LLM traces using embeddings. Validates the market. Gaps: horizontal tool (clustering is one feature among many), event-based architecture, no gap detection, no stakeholder views, downsamples large conversations.

**LangWatch** — Has Topic Detection, User Intent Analysis, User Analytics (€59/mo+). Primarily an LLM evaluation platform; user analytics is secondary. Per-seat pricing. Engineering-team focused.

**Langfuse** (acquired by ClickHouse Jan 2026) — Intent classification is a DIY cookbook guide, not a built-in feature. No automatic clustering or gap detection.

**Helicone** (YC W23) — User session metrics (engagement, depth) but not intent metrics. Cost/latency focused.

**Inkeep** — Closest to gap detection: Content Gaps + AI Reports features for docs teams. Platform-locked: only works if you use Inkeep's chat product. Validates enterprise willingness to pay; doesn't serve custom LLM implementations.

**Braintrust** ($45M, a16z) — Best-in-class for prompt evaluation (model quality). Zero user intent analytics.

**Arize Phoenix** ($131M) — RAG debugging, technical observability. No user analytics.

**Nebuly** (founded 2022, $1.7M ARR, Alchemist/EXOR-backed) — Most direct existing competitor. "User Analytics for LLMs" with intent classification, implicit feedback detection, failure insights, and stakeholder reports. SOC2 certified. Gaps: sales-led (no self-serve), no knowledge gap detection or unanswered demand surface, limited developer distribution. Key customers are enterprise (Oura, Iveco). Validates the market at small scale; doesn't serve self-serve developer segment.

**Context.ai** (acqui-hired by OpenAI, April 2025) — Was building the exact product: "Amplitude for ChatGPT." Raised $3.5M from GV (Google Ventures) + Theory Ventures (Tomasz Tunguz) in August 2023. Tracked user intent, topics, satisfaction from conversation signals. Acqui-hired by OpenAI — products wound down, team now builds internal model eval tools. Validates the thesis with top-tier VC backing; the acqui-hire is market clearance — no successor product exists.

**Profound** ($35M Series B, Sequoia 2025) — Analyzes what users ask ChatGPT/Perplexity *about your brand*. Marketing/SEO tool, not product analytics.

### The Strategic Insight

**Context.ai's GV-backed thesis and OpenAI acqui-hire is the definitive validation signal.** Google Ventures and Tomasz Tunguz (Theory Ventures) explicitly backed "Amplitude for ChatGPT" in August 2023. OpenAI acqui-hired the team in April 2025 — wound down the products and put the founders on internal model evals. Every developer building on OpenAI is still without this product.

**PostHog's Clusters launch is the second market validation signal.** A $4B+ company looked at their LLM analytics roadmap and decided intent clustering was the most important new feature. This confirms the problem is real. Their implementation is horizontal and tacked onto an event-based platform — chatAnalytics is what PostHog Clusters would be if it were a company.

**Inkeep validates enterprise willingness to pay for gap detection.** They built it as a core value proposition and close enterprise deals on it. They are platform-locked — every company on a custom LLM stack is unserved.

**No funded pure-play product** exists providing user intent analytics as a standalone SDK for any LLM implementation.

---

## Differentiation Strategy

### The competitive reality

PostHog has developer distribution and just validated the category. Nebuly has enterprise relationships and 3 years of compliance certifications. LangWatch owns the eval/testing buyer. Two direct predecessors (Context.ai, Phospho) tried and failed. Any differentiation strategy has to account for all of this honestly.

---

### The timing window

PostHog launched clusters on March 13, 2026 — three weeks ago. That launch is free category education. Developers who didn't know this kind of analytics existed now do. Teams are evaluating whether PostHog's implementation is sufficient for their needs. A purpose-built product entering now doesn't need to explain why intent clustering matters — PostHog just did that with its entire distribution. The window is narrow but real: PostHog's launch created awareness before they have depth, and Nebuly's enterprise motion leaves the entire SMB and startup segment unserved.

---

### The architectural gap PostHog cannot close

PostHog's fundamental limitation isn't a feature they forgot to build — it's the data model. Their platform was built for events: discrete, timestamped user actions (clicks, page views, form submissions). A conversation is not an event sequence. It's a document — a multi-turn exchange where turn 3 is only interpretable in the context of turns 1 and 2, where a user's intent shifts mid-conversation, where the quality of the answer at turn 7 determines whether the user asks again at turn 8. PostHog treats each message as an independent event and downsamples long conversations. A conversation-native data model — where the full turn sequence is the primary unit of analysis — produces meaningfully better clustering, better gap detection, and better failure attribution. This is a technical architecture difference that PostHog cannot fix by shipping features. They would have to rebuild the core data model.

---

### Gap detection is the sharpest point of entry

Every other feature in this space — clustering, topic detection, sentiment analysis — produces insights a PM has to interpret and act on. Gap detection produces a to-do list. "These 9 question clusters appeared 340 times this week and your product couldn't answer them" is not an insight requiring interpretation — it's a sprint ticket. It's the most directly monetizable output in the category because it maps to a specific, measurable downstream action (fix the product, update the knowledge base, build the feature).

Inkeep validated that enterprise buyers pay for this as a core feature. Inkeep is platform-locked. Nobody else does it in a platform-agnostic way. This is the strongest specific feature claim available.

---

### Self-serve depth — the gap Nebuly leaves

Nebuly survives by serving enterprise. Their pricing is contact-to-buy. Their onboarding requires sales. Their certifications (SOC2, ISO 42001, VPC deployment) are table stakes for a Fortune 500 but active friction for a 10-person AI startup. The startup founder with a deployed chatbot and 5,000 users cannot buy Nebuly today without scheduling a call, going through a procurement process, and probably waiting weeks. They will instrument PostHog clusters instead — not because it's better, but because it's instant and the free tier exists.

The gap is a self-serve product with Nebuly-level analytical depth. PostHog has self-serve but shallow depth. Nebuly has depth but no self-serve. Nobody has both. This is the specific intersection to occupy.

The reason Phospho failed at self-serve is likely not that the motion is impossible — it's that Phospho built generic text analytics ("PostHog for prompts") without a specific enough value proposition to create activation on day one. A product that delivers a concrete, specific insight — "here are your top 5 unanswered questions from the last 7 days" — within hours of instrumentation has a fundamentally different activation story than a general analytics dashboard that requires weeks of data to become interesting.

---

### The output format is underestimated as a differentiator

Every analytics product in this space delivers dashboards. Dashboards require the user to visit, interpret, and decide. The highest-value output format is not a dashboard — it's an automated weekly digest that surfaces only what changed and what to do about it. "3 new question clusters emerged this week. 'Export to CSV' spiked 2x — users want a feature you don't have. Unanswered questions about billing increased 40% — your docs have a gap." This is what a Head of Product needs, delivered where they already work (email, Slack), without requiring them to remember to log in.

Nebuly's most-developed feature category — stakeholder reports and external sharing — points at the same insight: the buyers who have budget are the ones who need to show someone else the data, not explore it themselves. The report is the product, not the dashboard.

---

### The ecosystem position: complement, don't compete

Langfuse and Helicone serve engineering teams — tracing, cost, latency. PostHog serves product teams — usage, retention, funnels, now clusters. The framing that positions chatAnalytics as "PostHog for conversations" invites a direct comparison that PostHog will win on distribution. A stronger framing: chatAnalytics is the layer that sits beside PostHog and Langfuse, not on top of them. "Langfuse for your LLM infrastructure. PostHog for your product events. chatAnalytics for what your users are actually trying to do." This framing avoids a feature-by-feature comparison with $4B in distribution weight and instead positions chatAnalytics as filling a specific, named gap in an existing stack developers already understand.

It also opens the door to integration partnerships rather than competition — a PostHog integration, a Langfuse integration — that provide distribution without requiring chatAnalytics to win a head-to-head fight.

---

### The segment where the case is clearest

Developer tool and API companies (docs AI assistants) have the most legible ROI for this specific product. When a developer asks your AI docs assistant a question and gets a bad answer, they don't file a support ticket — they churn silently. The gap between what developers ask and what the docs answer is the single most actionable signal available for improving developer retention. The buyer (Head of DevEx or Head of Developer Relations) has a clear mandate around developer retention and can put a dollar figure on it. The ICP is highly homogeneous — every developer-facing company with an AI assistant has exactly this problem. The product decision that results from the data (update the docs, write the guide, build the integration) is already within the buyer's scope of work.

This is a more defensible starting point than the broad "AI-native product company" ICP — it's narrower, the pain is more acute, and the ROI story is legible without a custom business case.

---

### The unanswered question

Phospho failed at self-serve developer analytics for LLM apps in 2024. That fact needs an explanation before this strategy is credible. The honest answer is: we don't know exactly why. Plausible reasons include (a) the market was too early — fewer LLM products in production with real user volume in mid-2024, (b) the product was too generic — "text analytics" without a specific enough value hook, (c) the activation experience was too slow — value took weeks to emerge. The degree to which (a) explains the failure determines the degree to which timing alone makes the thesis more viable now. The degree to which (b) and (c) explain it determines what product decisions need to be made differently.

This question should be answered with primary research — finding out what Phospho tried, who they talked to, and why those users didn't convert — before significant capital is committed to the self-serve motion.

---

## Product Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Primary persona | Founder / Head of Product at AI-native product company | Highest pain, self-serve capable, short sales cycle |
| Integration strategy | SDK-first (OpenAI/Anthropic wrapper) | Serves Segments 1–3 and 5; broadest ICP coverage |
| Deployment | SaaS, self-serve | Fast iteration; enterprise self-hosted post-PMF |
| Pricing model | Usage-based (per conversation volume) | Aligns incentives; scales with customer growth; per-seat doesn't fit developer tools |
| Differentiation | Purpose-built for conversational products; gap detection + intent clustering + stakeholder views | No horizontal tool does all three; Inkeep does it but is platform-locked |

---

## Differentiating Features (Refined)

The following four features are the ones that actually earn the niche. Two were dropped from an earlier list: the conversation-native data model (architecture, not a customer feature) and platform-agnostic SDK (table stakes). These remain as implementation requirements, not differentiators.

---

### Feature 1: Knowledge Gap Detection
*Most defensible. Most actionable. Best matched to the target ICP.*

Every other feature in this space produces an insight requiring interpretation. Gap detection produces a to-do list. "These 8 question clusters appeared 412 times this week and your product failed to answer them" is a sprint ticket, not a data point.

**Works best for:** Products with a bounded knowledge domain — docs assistants, support bots, developer tools. For these, "unanswered" maps cleanly to "the knowledge base doesn't cover this." For open-ended products (coding assistants, writing tools), the signal is noisier because bad answers look like answers. The ICP should be narrowed to match the feature's strength.

**Implementation — three layers:**

*Signal layer:* Pattern match on assistant response text for explicit fallback language ("I don't know," "please contact support," "I'm not sure"). Track behavioral signals within conversations: consecutive user messages with cosine similarity > 0.85 indicate rephrasing of an unmet need; short negative user message ("no," "never mind") after a long assistant response is a failure signature. Each signal is weighted — rephrase alone scores 0.4, explicit fallback 0.7, rephrase + frustration language 1.0. Threshold for flagging: composite score ≥ 0.6.

*Classification layer:* GPT-4o-mini LLM-as-judge, run async and batched post-conversation, evaluates each (query, response) pair: answered / partially answered / not answered. Never in the hot path. Cached by semantic similarity — near-duplicate queries inherit prior classifications without re-running inference.

*Clustering layer:* Flagged queries are embedded (text-embedding-3-small) and clustered nightly with HDBSCAN (not k-means — number of gap categories is unknown; HDBSCAN handles arbitrary cluster counts and marks noise rather than forcing outliers into clusters). Each cluster is auto-labeled via GPT-4o-mini given 5–10 representative examples. Ranked by frequency × recency decay weight. Output: ranked gap list with example conversations, weekly trend, first-seen date.

**Honest constraint:** Signal precision is imperfect. A confident wrong answer is invisible to this system. Implicit feedback detection (frustration signals even when the AI responded) is a v2 addition that addresses this blind spot.

---

### Feature 2: Intent & Topic Clustering
*The foundational view. What PostHog now does, but conversation-native.*

Automatically groups all conversations by what users are actually trying to do — without predefined categories, without manual tagging, without a developer writing classification rules. Shows volume by cluster, trend per cluster (growing / stable / declining), and drill-down to raw conversations.

**What makes it better than PostHog clusters:**

PostHog embeds individual message summaries then k-means clusters them, and downsamples long conversations. chatAnalytics embeds full-conversation summaries — the entire intent arc of each conversation is the unit of analysis. "User asked about pricing, got confused, asked about cancellation" is one intent pattern. PostHog sees two unrelated events. HDBSCAN over k-means means cluster count is discovered from the data, not specified in advance — important because a new product doesn't know how many intent categories its users have.

**Implementation:** On conversation close, a worker generates a 2–3 sentence summary via GPT-4o-mini and embeds it. Embeddings accumulate in pgvector. Nightly: HDBSCAN over all embeddings from the past 30 days, generate cluster labels, store assignments. Incremental updates for new conversations between nightly runs: assign to nearest existing cluster if cosine distance < threshold, otherwise flag as candidate for next nightly re-cluster.

---

### Feature 3: Self-serve with Depth
*Distribution requirement and the specific gap between PostHog (self-serve, shallow) and Nebuly (deep, no self-serve).*

**The activation problem:** Phospho's self-serve motion failed, likely because the product required weeks of data before patterns emerged. The fix is engineering time-to-value to hours, not weeks.

*Historical backfill:* At instrumentation, developer can pass historical conversation logs (OpenAI response JSONL, or any format via a one-line adapter). chatAnalytics processes them immediately — first login shows populated data, not an empty dashboard.

*Single-line instrumentation:*
```python
import chatanalytics
client = chatanalytics.wrap(openai.OpenAI())
# All calls automatically logged. Zero other code changes.
```
Identical pattern for Anthropic. LangChain and LlamaIndex via callback handlers. Background buffer flush every 5s or 100 events — never blocks the application. Retries with exponential backoff, drops after 3 failures. PII scrubbed client-side before transmission.

*Pricing:* 10,000 conversations/month free, full feature access including gap detection. No feature gating on the free tier — the conversion event is volume growth, not feature unlock. Gating gap detection behind a paywall removes the most compelling activation hook.

---

### Feature 4: Push-based Insights
*Post-MVP. Only valuable once signal quality (Feature 1) is validated.*

The dashboard is a failure mode for busy PMs. The highest-value delivery is a weekly digest — what changed, what's new, what to do — delivered to email and Slack without requiring a login.

Format: LLM-generated narrative, not a table of metrics. Not "Gap cluster 'CSV export' — 234 occurrences (↑ 312%)" but "Your users asked about CSV export 234 times this week — three times more than last week. Your product doesn't support this. It's your most-requested missing feature right now." The difference matters: one is a number to interpret, one is a decision to make.

**Why this is post-MVP:** The narrative makes specific claims. If gap detection signals are noisy, the push format amplifies mistakes — a wrong insight delivered with authority to a Head of Product who then plans a sprint around it is worse than no insight. This feature is only built after gap detection precision is validated with real customers.

**Implementation when ready:** Sunday night cron per workspace → compute top clusters, new gaps, anomalies (> 2x spike) → GPT-4o-mini narrative → Resend email + Slack incoming webhook. Real-time alerts via Redis rolling window counts: threshold rules configurable per workspace.

---

## MVP Feature List

### 1. Top Queries Dashboard
Ranked list of most-asked queries, semantically deduplicated, with frequency counts, trend lines, and drill-down to raw conversations.

### 2. Recurring Request Detection
Trending query clusters, recurring unanswered requests, semantic grouping of equivalent phrasings, threshold alerts.

### 3. Intent / Topic Clustering
Automatic unsupervised clustering from embeddings. Volume by cluster, trend per cluster, operator-editable labels, CSV export.

### 4. Knowledge Gap Detection
Queries flagged as unanswered (fallback, escalation, 2+ rephrases), ranked by frequency, gap summary view.

### 5. Conversation Explorer
Full-text search, filter by cluster/outcome, turn-by-turn replay, similar conversations panel.

### 6. Integration Layer
SDK (OpenAI/Anthropic wrapper) first. Intercom connector second. Slack/Teams connector third.

---

## Open Questions

1. **Pricing tiers**: Usage-based with flat tiers + volume overages, or pure metered?
2. **Self-serve onboarding**: How much product-led growth investment for MVP vs. white-glove for first 10 customers?
3. **Clustering approach**: OpenAI embeddings + HDBSCAN (handles unknown cluster counts) vs. lighter model to reduce cost/latency?
4. **PostHog differentiation**: Clear messaging required — purpose-built vs. horizontal feature.
5. **Data privacy / SOC 2**: Conversations contain PII. Timeline for compliance certification?
6. **"Unanswered" signal definition**: Escalation flag, 2+ rephrases, explicit thumbs-down, or LLM judge? One per connector.
