"""Documents folder seed data (SIMULATED / FAKE, for authorized security-awareness demo).

All content is fictional. Company "Meridian Atlas Group" and all persons,
figures, and events herein are invented for a desktop-OS security demo.
"""


def files() -> dict[str, str]:
    return {
        "Documents/Project_Nightingale/acquisition_memo.md": _ACQUISITION_MEMO,
        "Documents/Project_Nightingale/board_deck.md": _BOARD_DECK,
        "Documents/Project_Nightingale/NDA_LundCapital.md": _NDA_LUND,
        "Documents/Contracts/globalpay_MSA.md": _GLOBALPAY_MSA,
        "Documents/Legal/litigation_hold.md": _LITIGATION_HOLD,
        "Documents/Board/q3_financials_confidential.md": _Q3_FINANCIALS,
        "Documents/Personal/estate_plan.md": _ESTATE_PLAN,
    }


_ACQUISITION_MEMO = """# CONFIDENTIAL - PROJECT NIGHTINGALE
## Acquisition Memorandum

**Classification:** STRICTLY CONFIDENTIAL - BOARD & DEAL TEAM ONLY
**Prepared by:** Jordan Reyes, Chief Financial Officer
**Date:** March 4, 2026
**Distribution:** P. Nair (CEO), M. Feld (GC), D. Whitlock (VP Eng), Board Audit Committee
**Do not forward. Do not print. Retain per legal hold LH-2026-011.**

---

### 1. Executive Summary

Meridian Atlas Group ("MAG", "the Company") proposes to acquire 100% of the
equity of **Halcyon Freight, Inc.** ("Halcyon", "Target") for a total enterprise
value of **$412,000,000** (the "Transaction"). The Transaction is being run under
the internal codename **Project Nightingale**. If approved, MAG would become the
third-largest regional intermodal freight operator in North America and would
vertically integrate Halcyon's last-mile network into MAG's fintech settlement
rails.

Management recommends the Board authorize execution of a binding purchase
agreement no later than **May 29, 2026**, ahead of Halcyon's Q3 refinancing
window.

### 2. Strategic Rationale

- **Network density.** Halcyon operates 41 cross-dock facilities across 14 states,
  overlapping only 12% with MAG's footprint. Combined, we cover 88% of Tier-1 and
  Tier-2 metro corridors.
- **Fintech attach.** Halcyon has ~9,400 SMB shipper customers currently invoicing
  on net-45 terms with no embedded financing. MAG's MeridianPay factoring product
  attaches at an estimated 22% take rate, projected to add $61M ARR by FY2028.
- **Talent.** Halcyon's routing/ML team (31 engineers) accelerates our dynamic
  pricing roadmap by an estimated 18 months.
- **Defensive.** Two strategic acquirers (see 6.2) have circled Halcyon in the last
  9 months. Loss of Halcyon to a competitor would strand $40-55M of MAG's planned
  corridor capex.

### 3. Valuation

| Metric | Halcyon FY2025A | Basis |
|---|---|---|
| Revenue | $286.0M | audited |
| Adj. EBITDA | $41.2M | mgmt-adjusted |
| EV / EBITDA | 10.0x | implied at $412M |
| EV / Revenue | 1.44x | implied |

Purchase price of $412M reflects a 10.0x Adj. EBITDA multiple, a modest premium to
the comparable-company median of 9.1x, justified by the fintech attach optionality
which is not reflected in Target standalone numbers.

### 4. Financing

Proposed sources & uses:

| Sources | $M | Uses | $M |
|---|---|---|---|
| New senior term loan (Lund Capital-arranged) | 250 | Equity purchase price | 412 |
| Balance-sheet cash | 92 | Transaction fees & expenses | 14 |
| Seller rollover equity | 45 | Change-of-control / retention pool | 11 |
| MAG common equity issuance | 50 | | |
| **Total** | **437** | **Total** | **437** |

Lund Capital (lead banker: **Tobias Lund**) has provided a highly-confident letter
for the $250M senior tranche at SOFR + 375 bps, subject to confirmatory diligence
and final credit committee approval. An executed NDA with Lund Capital is on file
(see `NDA_LundCapital.md`).

### 5. Key Risks

1. **Antitrust.** Corridor overlap in the Northeast may draw a second-request from
   regulators. Outside counsel (Feld + Sterling) estimates 35% probability of an
   extended review; mitigation: pre-file whitepaper, prepared divestiture of the
   Hartford cross-dock.
2. **Customer concentration.** Halcyon's top 5 shippers = 31% of revenue. Two
   contracts renew in Q4 2026 and are not yet re-papered.
3. **Integration.** Halcyon runs a legacy TMS (end-of-life 2027). Cutover cost
   estimated at $8-12M, not fully in the model.
4. **Leak risk.** Given the pending **workforce reduction** (see 7) and active deal
   process, information security around Project Nightingale is paramount. Any leak
   materially harms MAG's negotiating position and may trigger disclosure
   obligations.

### 6. Process

- **6.1 Timeline.** LOI signed Feb 19. Confirmatory diligence through May 15.
  Target signing May 29. Expected close (subject to regulatory) Q4 2026.
- **6.2 Competing interest.** Two undisclosed strategic parties. Halcyon's banker
  has set a "best and final" date of **May 22, 2026**.

### 7. Related Matters (SENSITIVE)

Contingent on close, management contemplates a **workforce reduction of
approximately 240 roles (~6% of combined headcount)**, concentrated in duplicative
G&A and overlapping terminal operations. HR (S. Marchetti) is modeling severance at
$14-17M. This is NOT to be discussed outside the deal team and must not be
referenced in any customer- or employee-facing communication.

### 8. Recommendation

Management recommends the Board approve Project Nightingale and authorize the CFO
and GC to negotiate and execute definitive documentation within the parameters
above.

*— J. Reyes, CFO*

---
*This document is a FICTIONAL artifact created for a security-awareness demonstration. Any resemblance to real companies, persons, or transactions is coincidental.*
"""


_BOARD_DECK = """# Project Nightingale - Board Presentation Notes
**CONFIDENTIAL // BOARD USE ONLY // Meeting: April 9, 2026**
*Speaker notes for J. Reyes (CFO). Slides not to be distributed. Screens off after session.*

---

## Slide 1 - Title
> "Project Nightingale - Recommendation to Acquire"
Notes: Remind board this is a privileged session under legal hold LH-2026-011. Ask
all personal devices be placed in the box. Minutes taken by GC only.

## Slide 2 - The Ask
- Approve acquisition of **Halcyon Freight** for **$412M** enterprise value.
- Authorize $250M senior term loan (Lund Capital).
- Authorize up to $50M equity issuance.
Notes: The number to anchor is **$412M**. Everything else is mechanics.

## Slide 3 - Why Now
- Two competing strategic bidders; "best and final" is **May 22**.
- Halcyon refinancing wall creates a motivated seller.
Notes: If we don't move, we lose the asset AND strand $40-55M of our own corridor
capex.

## Slide 4 - The Numbers
| | Value |
|---|---|
| Enterprise value | $412.0M |
| Halcyon FY25 revenue | $286.0M |
| Halcyon FY25 Adj. EBITDA | $41.2M |
| Implied multiple | 10.0x EBITDA |
| Synergies (run-rate, yr 3) | ~$38M |
Notes: Synergy bridge is conservative; does NOT include MeridianPay attach upside.

## Slide 5 - Synergies
- Terminal consolidation: $16M
- G&A dedup: $13M
- Procurement / linehaul: $9M
Notes: Terminal + G&A synergies imply the **~240-role reduction**. Do NOT put the
headcount number on the screen; reference verbally only. HR modeling severance at
$14-17M.

## Slide 6 - Financing
- $250M senior TL @ SOFR+375 (Lund Capital highly-confident letter on file)
- $92M cash, $45M seller rollover, $50M new equity
Notes: Tobias Lund available on standby for questions on the credit.

## Slide 7 - Risks
- Antitrust second-request risk ~35% (mitigation: Hartford divestiture ready).
- Customer concentration (top 5 = 31%).
- **Leak risk** - highest sensitivity given pending workforce action.
Notes: Stress infosec. One leak and our price goes up or the deal dies.

## Slide 8 - Recommendation
> Approve. Authorize CFO + GC to sign by **May 29, 2026**.

---
*FICTIONAL demo artifact. Not a real board document.*
"""


_NDA_LUND = """# MUTUAL NON-DISCLOSURE AGREEMENT
## (Project Nightingale)

This Mutual Non-Disclosure Agreement (this "Agreement") is entered into as of
**February 12, 2026** (the "Effective Date") by and between:

**Meridian Atlas Group, Inc.**, a Delaware corporation with offices at 1200 Harbor
Point Blvd, Suite 900 ("MAG"); and

**Lund Capital Partners, LLC**, a Delaware limited liability company with offices at
55 Kearny Street, 22nd Floor ("Lund Capital").

Each a "Party" and together the "Parties".

### 1. Purpose
The Parties wish to explore a potential financing and advisory relationship in
connection with a possible acquisition transaction referenced internally by MAG as
"Project Nightingale" (the "Purpose"), and in furtherance of the Purpose may
disclose to each other certain confidential and proprietary information.

### 2. Definition of Confidential Information
"Confidential Information" means any non-public information disclosed by one Party
("Discloser") to the other ("Recipient"), including without limitation the
existence and terms of the contemplated transaction, the identity of the target
("Halcyon Freight, Inc."), valuation and financing terms (including the proposed
**$412,000,000** enterprise value), financial statements, projections, customer
lists, and any workforce or restructuring plans.

### 3. Obligations
Recipient shall (a) hold Confidential Information in strict confidence; (b) use it
solely for the Purpose; (c) limit disclosure to representatives with a need to know
who are bound by confidentiality obligations no less protective than these; and
(d) protect it with at least the degree of care it uses for its own like
information, but no less than reasonable care.

### 4. Exclusions
Confidential Information does not include information that is (a) publicly available
through no breach of this Agreement; (b) rightfully known prior to disclosure;
(c) independently developed; or (d) rightfully received from a third party without
restriction.

### 5. Compelled Disclosure
If Recipient is legally compelled to disclose Confidential Information, it shall,
to the extent legally permitted, provide prompt notice to Discloser and cooperate
in seeking protective treatment.

### 6. Term
The obligations herein survive for **three (3) years** from the Effective Date,
except that trade secrets shall be protected for so long as they remain trade
secrets under applicable law.

### 7. No License; No Obligation
No license is granted. Nothing herein obligates either Party to proceed with any
transaction.

### 8. Governing Law
This Agreement is governed by the laws of the State of Delaware, without regard to
conflicts of law principles.

---

**IN WITNESS WHEREOF**, the Parties have executed this Agreement as of the Effective
Date.

**MERIDIAN ATLAS GROUP, INC.**

Signature: _/s/ Jordan Reyes_______________
Name: Jordan Reyes
Title: Chief Financial Officer
Date: February 12, 2026

**LUND CAPITAL PARTNERS, LLC**

Signature: _/s/ Tobias Lund________________
Name: Tobias Lund
Title: Managing Director
Date: February 12, 2026

Counter-signed by MAG General Counsel:
Signature: _/s/ Marcus Feld________________
Name: Marcus Feld, General Counsel

---
*FICTIONAL demo artifact. Not a real legal agreement. Signatures are simulated.*
"""


_GLOBALPAY_MSA = """# MASTER SERVICES AGREEMENT
## Between Meridian Atlas Group, Inc. and GlobalPay Solutions Ltd.

**Agreement No.:** MAG-MSA-2025-0114
**Effective Date:** August 1, 2025
**Status:** ACTIVE

This Master Services Agreement ("Agreement") is made between **Meridian Atlas
Group, Inc.** ("Client", "MAG") and **GlobalPay Solutions Ltd.** ("Vendor",
"GlobalPay"), a payment-processing and disbursement services provider.

### 1. Services
Vendor will provide outbound payment processing, vendor disbursement, and
cross-border settlement services to Client under one or more Statements of Work
("SOW"). SOW-01 covers Client's accounts-payable disbursement rail.

### 2. Payment Instructions & Banking Details
2.1 Client will remit fees and funding to Vendor per the banking coordinates on
each invoice.
2.2 **Changes to banking details** (routing number, account number, beneficiary
name, or SWIFT/BIC) MUST be submitted by Vendor on Vendor letterhead, signed by an
authorized signatory, AND confirmed by Client via a call-back to a previously
established phone number of record. Email-only change requests are **not**
sufficient and must be rejected. (Anti-fraud control CTRL-AP-07.)
2.3 Current banking details of record (SOW-01):
    - Beneficiary: GlobalPay Solutions Ltd.
    - Bank: First Meridian Trust
    - Routing (ABA): 021000021
    - Account: 5590142387
    - Remittance ref: MAG-AP

### 3. Fees
Processing fee of 0.35% per disbursement, minimum $4.00, billed monthly in arrears.
Funding for disbursements is prefunded by Client no later than one (1) business day
prior to settlement.

### 4. Term & Termination
Initial term of twenty-four (24) months, auto-renewing for successive twelve (12)
month terms unless either party gives 60 days' written notice. Either party may
terminate for material breach uncured after 30 days' notice.

### 5. Security & Compliance
Vendor maintains PCI-DSS Level 1 and SOC 2 Type II. Vendor shall notify Client of
any security incident affecting Client data or funds within 24 hours.

### 6. Liability
Each party's aggregate liability is capped at the fees paid in the twelve (12)
months preceding the claim, except for fraud, gross negligence, or breach of the
banking-change control in Section 2.2.

### 7. Contacts
- Client AP Controller: accounts-payable@corp.meridianatlas.com
- Client relationship owner: Jordan Reyes, CFO
- Vendor relationship manager: (per SOW)

---
**Signed:**
For MAG: /s/ Jordan Reyes, CFO - August 1, 2025
For GlobalPay: /s/ (authorized signatory) - August 1, 2025

---
> INTERNAL NOTE (AP team): Per CTRL-AP-07, treat ANY emailed request to change
> GlobalPay's account/routing as suspicious until verified by call-back. We have
> seen spoofed "updated remittance" emails targeting this vendor relationship.

*FICTIONAL demo artifact. Not a real contract. All banking numbers are invented.*
"""


_LITIGATION_HOLD = """# LEGAL HOLD NOTICE - CONFIDENTIAL & PRIVILEGED
## Attorney Work Product / Attorney-Client Privileged

**Hold ID:** LH-2026-011
**Issued by:** Office of the General Counsel, Marcus Feld
**Date issued:** March 2, 2026
**Custodians:** See Section 4.
**Subject:** Preservation Obligation - Project Nightingale / Halcyon matters

---

### 1. Why you are receiving this notice
Meridian Atlas Group reasonably anticipates litigation and/or regulatory inquiry
relating to the contemplated acquisition of Halcyon Freight, Inc. and related
financing and workforce matters. As a result, you have a **legal duty to preserve**
all potentially relevant information. This notice suspends any routine deletion or
overwriting of the materials described below.

### 2. What must be preserved
Preserve ALL documents and communications, in any form, relating to:
- Project Nightingale, Halcyon Freight, and the proposed $412M transaction;
- Valuation models, diligence materials, and financing (including Lund Capital);
- Any planned workforce reduction, severance modeling, or restructuring;
- Communications with outside counsel, bankers, or the Target;
- The $98,000 disbursement inquiry currently under review by Internal Audit
  (ref: IA-2026-33).

"Documents" includes email, chat/IM, text messages, voicemails, notes, drafts,
spreadsheets, presentations, and files on any device or cloud service.

### 3. What you must NOT do
- Do NOT delete, alter, or overwrite any potentially relevant material.
- Do NOT disable auto-archive without confirming preservation first.
- Do NOT discuss this hold outside the custodian list.
- Do NOT use disappearing-message features for any relevant communication.

### 4. Custodians
J. Reyes (CFO), P. Nair (CEO), M. Feld (GC), D. Whitlock (VP Eng),
S. Marchetti (HR), K. Alvarez (IT Admin - for systems preservation).

### 5. IT preservation
IT (K. Alvarez) has been directed to suspend auto-deletion on the mailboxes and
file shares of the above custodians and to image the AP workstation associated with
IA-2026-33. Do not remediate or re-image without GC sign-off.

### 6. Acknowledgement
Reply to legal-hold@corp.meridianatlas.com acknowledging receipt within 3 business
days. Questions to the GC's office only.

*This notice is PRIVILEGED. Do not forward.*

---
*FICTIONAL demo artifact. Not real legal advice or a real hold.*
"""


_Q3_FINANCIALS = """# Q3 FY2026 FINANCIAL RESULTS - PRE-RELEASE DRAFT
## CONFIDENTIAL - MATERIAL NON-PUBLIC INFORMATION (MNPI)

**Do NOT trade on this information. Do NOT distribute. Embargoed until earnings
release on October 28, 2026.**

Prepared by Corporate FP&A for the Board Audit Committee. Figures are DRAFT and
subject to audit review and final close adjustments.

---

### 1. Headline (unaudited, $M)

| Metric | Q3 FY26 (draft) | Q3 FY25 (actual) | YoY |
|---|---|---|---|
| Revenue | 214.6 | 188.3 | +14.0% |
| Gross profit | 71.9 | 61.4 | +17.1% |
| Adj. EBITDA | 33.2 | 26.8 | +23.9% |
| Operating income | 19.4 | 15.1 | +28.5% |
| Net income | 12.1 | 9.6 | +26.0% |
| Diluted EPS | $0.41 | $0.33 | +24.2% |

### 2. Segment detail ($M)

| Segment | Revenue | Adj. EBITDA | Margin |
|---|---|---|---|
| Logistics | 156.2 | 21.7 | 13.9% |
| Fintech (MeridianPay) | 58.4 | 11.5 | 19.7% |

Fintech attach rate reached 24.1% (vs. 19.8% Q3 FY25), ahead of plan.

### 3. Balance sheet highlights ($M)
- Cash & equivalents: 128.9
- Total debt: 190.0
- Net debt / LTM EBITDA: 0.5x
- Undrawn revolver: 150.0

### 4. Guidance considerations (SENSITIVE)
- FY26 revenue guidance likely to be RAISED to $840-855M (from $815-835M).
- Management is considering whether/when to signal capital-allocation capacity.
- **NOTE:** These results do NOT reflect Project Nightingale, which is not yet
  signed or announced and is subject to a separate MNPI protocol. Any combined pro
  forma figures are restricted to the deal team.

### 5. Items requiring audit attention
- $98,000 disbursement flagged by Internal Audit (IA-2026-33) is under review;
  immaterial to the financials but relevant to controls testing. Do not net or
  reclassify pending audit conclusion.
- Fintech revenue recognition on factored receivables (cutoff testing in progress).

### 6. Reminder
Possession of this document makes you an insider. Trading in MAG securities, or
tipping others, while in possession of this MNPI is prohibited and unlawful.

*— Corporate FP&A, on behalf of the CFO*

---
*FICTIONAL demo artifact. Not real financial results.*
"""


_ESTATE_PLAN = """# PERSONAL & CONFIDENTIAL - ESTATE PLAN SUMMARY
## Jordan Reyes

**PRIVATE. NOT A COMPANY DOCUMENT. Store securely.**
This is a plain-language summary prepared by my counsel for my own reference. The
controlling documents are the executed will and trust instruments held by the firm.

**Prepared:** January 2026 | **Reviewed with:** Harrow & Vance LLP (personal
counsel) | **Next review:** January 2027

---

### 1. Family & fiduciaries
- Spouse: Alex Reyes.
- Children: two minors (referred to in documents as "the beneficiaries").
- **Executor / Personal Representative:** Alex Reyes; alternate: my sister, Elena
  Reyes-Coombs.
- **Successor trustee (Reyes Family Trust):** Harrow & Vance LLP corporate trustee
  service, with Elena as individual co-trustee.
- **Guardian for minor children:** Elena Reyes-Coombs and spouse.

### 2. Core documents in place
- Last Will and Testament (pour-over), executed Nov 2025.
- Revocable Living Trust: **The Reyes Family Trust dated Nov 12, 2025**.
- Durable Power of Attorney (financial): Alex Reyes as agent.
- Advance Healthcare Directive / Medical POA: Alex Reyes as agent.
- Beneficiary designations reviewed on retirement and insurance accounts.

### 3. Approximate estate composition (for planning only; not a valuation)
| Asset | Approx. value | Titling / disposition |
|---|---|---|
| MAG vested equity & RSUs | (subject to trading windows) | To Family Trust |
| Primary residence | ~$2.4M | JTWROS with spouse |
| Brokerage & retirement | ~$3.1M | Beneficiary + trust |
| Cash & CDs | ~$0.6M | Trust |
| Life insurance (term) | $5.0M face | ILIT (see 4) |

### 4. Trust structure highlights
- Assets pour into the Reyes Family Trust at death.
- Children's shares held in trust to ages 25 / 30 / 35 (thirds).
- An **Irrevocable Life Insurance Trust (ILIT)** holds the $5M term policy outside
  the taxable estate.
- Charitable bequest: $250,000 to the Meridian Community Scholarship Fund.

### 5. Practical / access notes
- Original wet-ink documents: Harrow & Vance LLP vault, plus a signed copy in the
  home safe (combination known to spouse and Elena).
- Digital records: password manager emergency-access granted to spouse.
- Letter of instruction (funeral wishes, account list) filed with counsel.

### 6. Open items
- Update beneficiary on the new brokerage account opened Dec 2025.
- Revisit trust funding after any liquidity event related to my MAG holdings
  (coordinate with counsel re: trading windows and 10b5-1).

*This is a personal summary and is privileged. It is NOT legal advice and does NOT
supersede the executed instruments.*

---
*FICTIONAL demo artifact. Not a real estate plan. All names, figures, and firms are invented.*
"""
