export interface TemplateContentProfile {
  id: string;
  sectionTitles: [string, string, string, string, string, string];
  clauseHeadings: [
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string]
  ];
  guidance: [string, string, string, string, string, string];
}

type ProfileSeed = Omit<TemplateContentProfile, 'id'> & { id: string; matches: RegExp };

const PROFILES: ProfileSeed[] = [
  {
    id: 'music-license',
    matches: /^(beat-license|remix-license|sample-clearance|sync-license|master-use-license)-agreement$/,
    sectionTitles: ['Licensed Material & Rights Holder','Grant of Use & Approved Exploitation','License Fee, Royalties & Reporting','Ownership, Attribution & Restrictions','Clearance, Term & Revocation','Schedules, Notices & Execution'],
    clauseHeadings: [
      ['Identification of Licensed Material','Rights Holder Authority & Existing Encumbrances'],
      ['License Grant & Permitted Exploitation','Territory, Term & Distribution Limits'],
      ['License Fee, Royalty Base & Payment Trigger','Statements, Audit & Late Payment'],
      ['Reserved Rights & No Implied Transfer','Credit, Metadata & Integrity Requirements'],
      ['Third-Party Clearances & Indemnity Allocation','Expiration, Takedown & Post-Term Use'],
      ['License Schedule & Technical Specifications','Notices, Amendments & Signatures']
    ],
    guidance: [
      'Identify each master, composition, sample, stem, audiovisual cue or other asset by title, owner, version and source. Attach reference files or identifiers so the licensed material cannot be confused with another work.',
      'State whether the permission is exclusive, non-exclusive, transferable or sublicensable. List each permitted use, platform, media type, edit, advertising context and restriction rather than relying on a broad description.',
      'Specify any one-time fee, recurring royalty, minimum guarantee, usage-based charge, reporting period and currency. Leave all amounts and rates as explicit blanks until negotiated.',
      'Separate the underlying composition, sound recording, sample, artwork and performer rights. A license to one layer does not itself grant permission for another layer.',
      'Identify who obtains and pays for every third-party clearance, what evidence must be retained, and the steps required if permission expires or a claim is received.',
      'Attach the asset list, use matrix, cue sheet or delivery specification. Record notice contacts and require signed written amendments for any expansion of use.'
    ]
  },
  {
    id: 'music-splits',
    matches: /^(music-collaboration-split-sheet|songwriting-collaboration-agreement|music-publishing-administration-agreement)$/,
    sectionTitles: ['Composition Identity & Contributors','Writing Contributions & Approval','Writer Shares, Publisher Shares & Accounting','Composition Ownership & Administration','Registration, Disputes & Changes','Work Data, Notices & Signatures'],
    clauseHeadings: [
      ['Work Identification & Version Control','Contributor Roles & Capacity'],
      ['Writer Contributions & Composition Shares','Unfinished Material, Revisions & Approval'],
      ['Writer Shares & Publisher Splits','Publisher Splits & Registration Duties'],
      ['Composition Ownership & Administration Rights','Samples, Interpolations & Third-Party Material'],
      ['Publisher / PRO Registration Duties','Disputed Shares, Corrections & Amendments'],
      ['Split Schedule & Contact Details','Confirmation of Shares & Execution']
    ],
    guidance: [
      'Identify each composition separately, including working title, final title, alternate titles, version, creation date and any related sound recording. Do not combine distinct works in one split schedule.',
      'Describe each contributor role and the material contribution made. Confirm whether the parties intend to recognize lyric, melody, arrangement or other protectable contributions.',
      'Record writer and publisher percentages as negotiated figures and verify that the total allocation is complete. No ownership percentage should be inferred from equal participation or from this template.',
      'Distinguish composition ownership from master recording ownership and identify any administrator, publisher or collection agent with limited authority.',
      'Specify who submits registrations, which performing-rights organizations or societies are involved, and how corrections are handled if a registration conflicts with the signed split.',
      'Attach the final work list and contact/registration details. Every contributor should confirm the allocation and retain an identical signed copy.'
    ]
  },
  {
    id: 'residential-occupancy',
    matches: /^(residential-lease-agreement|room-rental-agreement|residential-sublease-agreement|vacation-rental-agreement|roommate-agreement|parking-storage-lease|rental-move-in-agreement)$/,
    sectionTitles: ['Premises, Occupancy & Authorized Residents','Access, Use & Property Condition','Rent, Deposits & Utility Allocation','Repairs, Care & Property Records','Notices, Default & Move-Out','Inventory, Disclosures & Execution'],
    clauseHeadings: [
      ['Premises, Included Areas & Occupants','Term, Possession & Renewal'],
      ['Permitted Use, Guests & Access Rules','Move-In Condition & Inventory'],
      ['Rent, Due Dates & Accepted Payment','Deposit, Utilities & Other Charges'],
      ['Maintenance Duties & Repair Requests','Entry, Inspection & Emergency Access'],
      ['Notice, Default & Opportunity to Cure','Surrender, Keys & Deposit Accounting'],
      ['Condition Report & Required Disclosures','Notices, Attachments & Signatures']
    ],
    guidance: [
      'Identify the complete street address, unit or room, included parking/storage areas, shared facilities and each authorized occupant. State whether the arrangement is a lease, sublease, room rental or short-stay occupancy.',
      'Describe permitted residential use, guest limits, access devices, house rules and any approval required for additional occupants, pets or alterations. Attach a condition inventory before possession.',
      'State the rent amount, due date, accepted payment methods, deposit amount and handling, utility allocation, late charges and any other recurring fees. Do not assume a deposit may be retained without the required legal basis.',
      'Allocate routine care, repair reporting, urgent maintenance and access for inspection. Record the condition of fixtures, appliances, keys and supplied items.',
      'Specify notice methods, applicable notice periods, cure procedures, move-out condition, key return, inspection and an itemized accounting of any proposed deductions.',
      'Attach the inventory, disclosures, house rules and any required local addenda. Confirm all occupants and authorized representatives sign the same final version.'
    ]
  },
  {
    id: 'property-purchase',
    matches: /^real-estate-purchase-agreement$/,
    sectionTitles: ['Property, Parties & Purchase Structure','Due Diligence, Inspections & Disclosures','Purchase Price, Earnest Money & Escrow','Title, Survey & Property Condition','Closing Conditions, Default & Remedies','Closing Deliverables & Execution'],
    clauseHeadings: [
      ['Property Description & Included Improvements','Seller Authority & Buyer Capacity'],
      ['Inspection, Review & Objection Period','Disclosure Package & Contingency Elections'],
      ['Purchase Price, Earnest Money & Escrow Holder','Financing, Appraisal & Funds to Close'],
      ['Title, Survey & Closing Conditions','Condition, Repairs & Risk of Loss'],
      ['Conditions Precedent & Closing Extension','Default, Cure, Termination & Deposit Disposition'],
      ['Closing Statement, Deed & Possession','Escrow Instructions, Notices & Signatures']
    ],
    guidance: [
      'Identify the legal description, parcel number, street address, included fixtures and personal property, and the exact parties taking or conveying title.',
      'Set the inspection and document-review periods, required disclosures, objection process and any financing, appraisal or other contingency selected by the parties.',
      'State the purchase price, deposit amount, escrow holder, deposit deadline, payment instructions, prorations and the source and timing of closing funds.',
      'Identify title evidence, survey requirements, liens, easements, permitted exceptions, repair agreements and who bears casualty risk before closing.',
      'List each condition that must be satisfied before closing and the written evidence required. Define extension, cure, termination and earnest-money disposition procedures.',
      'List the deed, transfer forms, closing statement, keys, possession time and other deliverables. Coordinate signed instructions with the escrow or closing professional.'
    ]
  },
  {
    id: 'photography-services',
    matches: /^photography-services-agreement$/,
    sectionTitles: ['Creative Brief, Shot List & Production Plan','Session Logistics, Capture & Delivery','Creative Fee, Expenses & Payment Milestones','Image License, Model Releases & Portfolio Rights','Rescheduling, Cancellation & File Retention','Shot List, Releases & Execution'],
    clauseHeadings: [
      ['Project Brief, Subjects & Intended Use','Shot List, Style References & Exclusions'],
      ['Location, Schedule & Client Readiness','Selection, Editing & Delivery Specifications'],
      ['Session Fee, Retainer & Balance Due','Travel, Usage Add-Ons & Approved Expenses'],
      ['Image License, Territory & Usage Term','Model / Property Releases & Portfolio Display'],
      ['Rescheduling, Weather & Cancellation','Raw Files, Archive Period & Re-Delivery'],
      ['Final Shot List & Delivery Checklist','Notices, Approvals & Signatures']
    ],
    guidance: [
      'Identify the shoot, subjects, location, date, creative brief, intended publication and any excluded shots or services. Attach visual references and the approved shot list.',
      'Set access, arrival times, client preparation, equipment responsibilities, selection deadlines, retouching scope, delivery format and file-transfer method.',
      'State the session fee, retainer, balance date, travel costs, additional edits, overtime and any separate licensing fee. Require written approval for added expenses.',
      'Specify the exact license granted for delivered images, permitted media, territory, term, exclusivity and any credit requirement. Obtain model, property and location releases where needed.',
      'Define weather and rescheduling options, cancellation charges, delivery delays, archive duration, backup responsibilities and the cost of retrieving archived files.',
      'Attach the shot list, usage schedule, release forms and delivery checklist. Confirm the authorized client contact for final approval.'
    ]
  },
  {
    id: 'employment-offer',
    matches: /^employment-offer-letter$/,
    sectionTitles: ['Position, Reporting Line & Start Conditions','Duties, Work Location & Expectations','Base Pay, Incentives & Benefits','Confidentiality, Property & Work Product','At-Will / Term, Conditions & Separation','Offer Details, Policies & Acceptance'],
    clauseHeadings: [
      ['Position, Department & Reporting Manager','Start Date, Work Status & Conditions'],
      ['Core Duties & Performance Expectations','Work Location, Schedule & Travel'],
      ['Base Pay, Pay Frequency & Classification','Incentives, Benefits & Reimbursement'],
      ['Confidential Information & Security Duties','Work Product, Inventions & Company Property'],
      ['Employment Term & Applicable Separation Rules','Background Checks, Eligibility & Required Notices'],
      ['Referenced Policies & Required Documents','Offer Expiration & Written Acceptance']
    ],
    guidance: [
      'Identify the employing entity, role, department, manager, work classification and proposed start date. Any conditions to employment should be listed clearly and lawfully.',
      'Summarize the primary responsibilities, expected work location, schedule, travel and reporting arrangements. Detailed duties may be maintained in a separate job description.',
      'State compensation, pay frequency, exempt/non-exempt classification where applicable, incentive eligibility, benefits eligibility and expense reimbursement rules.',
      'Reference applicable confidentiality, information-security, invention-assignment and company-property policies. Do not imply that a separate policy has been signed unless it is attached.',
      'Describe the employment duration and separation terms consistent with applicable law and the actual employer policy. Avoid inserting a waiver of non-waivable rights.',
      'List incorporated policies, eligibility documents and required attachments. Provide a clear acceptance deadline and signature area for both the employer and candidate.'
    ]
  },
  {
    id: 'llc-governance',
    matches: /^llc-operating-agreement$/,
    sectionTitles: ['Members, Purpose & Company Formation','Management, Authority & Voting','Capital Accounts, Allocations & Distributions','Company Property, Records & Transfers','Dissociation, Dissolution & Winding Up','Schedules, Notices & Member Adoption'],
    clauseHeadings: [
      ['Members, Formation & Business Purpose','Principal Office, Term & Tax Classification'],
      ['Member-Managed / Manager-Managed Structure','Voting Thresholds & Reserved Decisions'],
      ['Initial Contributions & Capital Accounts','Profits, Losses & Distribution Waterfall'],
      ['Company Property & Intellectual Property','Books, Records & Inspection Rights'],
      ['Transfer Restrictions & Member Withdrawal','Dissolution Events & Winding Up'],
      ['Member Schedule & Contribution Ledger','Amendments, Notices & Execution']
    ],
    guidance: [
      'Identify the state of formation, legal name, principal office, business purpose, registered agent and every initial member with their agreed interests.',
      'Select the management structure, appoint managers if applicable, define authority limits, voting thresholds, meeting procedures and decisions reserved to members.',
      'Record each contribution, valuation, capital account method, allocation formula, distribution priority and any agreed limits on additional capital calls.',
      'Define ownership of company assets, records, intellectual property, banking authority, tax records and each member’s inspection rights.',
      'Set transfer approval rules, permitted transfers, withdrawal consequences, buyout valuation method, dissolution triggers and the order for winding up liabilities and assets.',
      'Attach the member schedule, contribution ledger and any tax or governance elections. Require all members to sign amendments and retain the adopted agreement.'
    ]
  },
  {
    id: 'promissory-note',
    matches: /^(promissory-note|personal-loan-agreement)$/,
    sectionTitles: ['Principal, Funding & Promise to Pay','Interest, Maturity & Payment Application','Payment Method, Records & Prepayment','Security, Guaranty & Credit Support','Default, Notice & Collection Remedies','Payment Schedule, Notices & Signatures'],
    clauseHeadings: [
      ['Principal Amount & Funding Date','Borrower Promise & Lender Identity'],
      ['Interest Rate & Accrual Method','Maturity Date & Installment Schedule'],
      ['Payment Address & Application Waterfall','Prepayment, Fees & Payment Evidence'],
      ['Collateral, Security Interest & Perfection','Guarantor Duties & Supporting Documents'],
      ['Payment Default & Other Events of Default','Notice, Cure, Acceleration & Collection Costs'],
      ['Amortization Schedule & Payment Ledger','Governing Terms, Notices & Execution']
    ],
    guidance: [
      'Identify the lender and borrower, principal amount, currency, funding date, method of disbursement and whether the obligation replaces or supplements another debt.',
      'State the interest rate, whether fixed or variable, calculation convention, installment amounts, due dates, maturity date and any balloon payment.',
      'Specify where and how payments must be made, how partial payments are applied, whether prepayment is allowed and what receipt or ledger evidence will be maintained.',
      'If the obligation is secured or guaranteed, identify the collateral, guarantor, required filings and separate security or guaranty documents. Do not assume a lien exists without proper creation and perfection.',
      'Define missed-payment and other defaults, notice and cure periods, acceleration rights, collection procedures and any limits imposed by applicable law.',
      'Attach the signed payment schedule and any collateral/guaranty exhibits. Verify all amounts and dates before signing.'
    ]
  },
  {
    id: 'saas-subscription',
    matches: /^saas-subscription-agreement$/,
    sectionTitles: ['Subscription Scope, Seats & Authorized Use','Service Availability, Support & Maintenance','Subscription Fees, Usage & Renewal','Customer Data, Security & Intellectual Property','Incidents, Suspension & Exit Assistance','Service Schedule, Contacts & Execution'],
    clauseHeadings: [
      ['Subscription Services & Included Features','Users, Seats & Acceptable Use'],
      ['Service Availability, Maintenance & Support','Service Credits & Escalation Process'],
      ['Subscription Term, Fees & Usage Metrics','Renewal, Taxes & Billing Disputes'],
      ['Customer Data, Provider Materials & License','Security Controls, Subprocessors & Retention'],
      ['Security Incident Notice & Cooperation','Suspension, Export & Secure Deletion'],
      ['Service Description & SLA Schedule','Support Contacts, Notices & Signatures']
    ],
    guidance: [
      'Identify the subscribed service, plan, modules, deployment environment, user or seat limits, usage caps, integrations and any implementation services included.',
      'Set availability measurement, maintenance windows, support hours, severity levels, response targets, escalation contacts and any service-credit remedy.',
      'Specify fees, billing frequency, usage overages, renewal method, price changes, taxes, payment timing and the process for disputing an invoice.',
      'Distinguish customer data from provider software, service telemetry and pre-existing materials. Define processing instructions, access controls, subprocessors, backups and retention.',
      'Set incident reporting, investigation cooperation, suspension triggers, data export format, transition assistance and verified deletion requirements.',
      'Attach the service description, SLA, data-processing addendum and support matrix. Identify operational contacts and authorized signatories.'
    ]
  },
  {
    id: 'cybersecurity-response',
    matches: /^cybersecurity-incident-response$/,
    sectionTitles: ['Incident Scope, Authority & Response Activation','Containment, Evidence Handling & Recovery','Response Fees, Retainers & Cost Approval','Systems, Data & Confidentiality Controls','Escalation, Liability & Service Exit','Response Plan, Contacts & Execution'],
    clauseHeadings: [
      ['Covered Systems, Assets & Incident Types','Authorization, Contacts & Activation Threshold'],
      ['Triage, Containment & Eradication','Evidence Preservation & Chain of Custody'],
      ['Retainer, Hourly Rates & Emergency Work','Expense Approval & Incident Cost Records'],
      ['Access Authorization & Least-Privilege Controls','Sensitive Data, Forensics & Confidentiality'],
      ['Escalation, Regulatory Coordination & Updates','Handover, Recovery Validation & Closeout'],
      ['System Inventory & Response Playbook','Emergency Contacts, Notices & Signatures']
    ],
    guidance: [
      'Identify covered systems, networks, cloud tenants, endpoints, data classes, locations and incident categories. State who can authorize emergency response actions.',
      'Define triage, isolation, credential rotation, evidence preservation, forensic imaging, restoration and validation responsibilities. Preserve chain-of-custody records.',
      'Set retainer amounts, response rates, minimum billing increments, after-hours rates, expense limits and who may approve work beyond the initial scope.',
      'Limit system access to authorized personnel and approved purposes. Record data handling, secure transfer, retention, deletion and confidentiality requirements.',
      'Define escalation triggers, status-report frequency, coordination with counsel/insurers/regulators and the final handover package. Avoid making legal notification determinations without the responsible party.',
      'Attach asset inventories, response playbooks, contact trees, escalation matrices and approved access methods. Verify emergency contacts before execution.'
    ]
  },
  {
    id: 'influencer-campaign',
    matches: /^influencer-campaign-agreement$/,
    sectionTitles: ['Campaign Brief, Deliverables & Posting Calendar','Content Creation, Review & Publication','Creator Fee, Commission & Performance Reporting','Disclosure, Usage Rights & Paid Amplification','Platform Compliance, Changes & Withdrawal','Campaign Schedule, Metrics & Execution'],
    clauseHeadings: [
      ['Campaign Objective, Audience & Key Message','Deliverable Count, Format & Posting Dates'],
      ['Draft Submission & Approval Window','Publication, Link Tracking & Content Retention'],
      ['Creator Fee, Bonus & Payment Milestones','Attribution Window, Metrics & Reporting'],
      ['Advertising Disclosures & Endorsement Statements','Content License, Whitelisting & Paid Media'],
      ['Platform Rules, Claims & Prohibited Conduct','Correction, Takedown & Campaign Cancellation'],
      ['Content Calendar & Measurement Definitions','Brand / Creator Contacts & Signatures']
    ],
    guidance: [
      'Identify the brand, creator, campaign objective, target audience, products, required message, prohibited claims and each deliverable with a due date.',
      'Set draft deadlines, revision rounds, approval authority, publication windows, caption/link requirements and the process for documenting live posts.',
      'State fixed fees, product consideration, commission or performance bonuses, payment dates, attribution methods and the metrics used to calculate compensation.',
      'Specify clear and conspicuous endorsement disclosures, permitted brand-asset use, content license, term, territory, whitelisting and paid amplification rights.',
      'Require compliance with applicable advertising law and platform policies. Define how inaccurate claims, missed posts, takedowns or campaign changes are corrected.',
      'Attach the content calendar, creative brief, approved claims, tracking links and reporting format. Name one authorized approval contact for each party.'
    ]
  },
  {
    id: 'bill-of-sale',
    matches: /^bill-of-sale$/,
    sectionTitles: ['Goods, Seller Authority & Transfer','Price, Delivery & Acceptance','Payment, Taxes & Transfer Costs','Title, Condition & Included Items','Warranties, Risk & Dispute Resolution','Item Schedule, Receipt & Execution'],
    clauseHeadings: [
      ['Description, Quantity & Identifying Marks','Seller Authority & Ownership'],
      ['Purchase Price & Payment Timing','Delivery, Inspection & Acceptance'],
      ['Payment Method & Receipt','Taxes, Fees & Transfer Expenses'],
      ['Title Transfer & Included Accessories','Condition, Defects & Disclosed Exceptions'],
      ['Express Warranties or As-Is Election','Risk of Loss & Dispute Process'],
      ['Item Inventory & Delivery Receipt','Buyer / Seller Acknowledgment & Signatures']
    ],
    guidance: [
      'Describe each item by make, model, serial number, quantity, identifying marks and included accessories. Identify the seller and buyer with complete legal names.',
      'State the total price, deposit if any, payment deadline, delivery location, delivery method, inspection opportunity and when acceptance occurs.',
      'Record the payment method, receipt reference, applicable taxes, transfer fees and which party is responsible for each expense.',
      'State when title passes and list any liens, encumbrances, defects, missing parts or condition exceptions disclosed to the buyer.',
      'Choose and describe any express warranty or as-is arrangement accurately, subject to non-waivable legal requirements. Allocate risk of loss during delivery.',
      'Attach the item inventory, condition photographs and receipt. Both parties should retain a signed copy showing the transfer date.'
    ]
  }
,
  {
    id: 'recording-artist',
    matches: /^recording-artist-agreement$/,
    sectionTitles: ["Artist Engagement & Recording Commitment","Recording Schedule, Delivery & Acceptance","Advances, Royalties & Recoupment","Master Ownership, Release & Promotion","Accounting, Termination & Reversion","Recording Schedule, Royalty Terms & Execution"],
    clauseHeadings: [["Artist Services & Exclusive / Non-Exclusive Commitment","Recording Obligations & Minimum Delivery"],["Recording Budget, Sessions & Delivery Specifications","Revisions, Acceptance & Re-Recording"],["Advance, Recording Costs & Recoupment","Royalty Base, Reserves & Statements"],["Master Ownership & Exploitation","Release Commitment, Marketing & Artist Approval"],["Accounting, Audit & Dispute Process","Term, Breach, Cure & Rights Reversion"],["Recording Schedule & Delivery Checklist","Credits, Notices & Signatures"]],
    guidance: ["Identify the artist, label or commissioning party, covered recordings, project scope and whether services are exclusive. Set the number and type of recordings rather than leaving the commitment open-ended.","Set recording milestones, session responsibilities, technical formats, delivery dates, revision limits and objective acceptance criteria for each master.","Separate any advance, recording budget, recoupable costs and royalty calculation. State the royalty base, deductions, accounting period and audit window.","Specify who owns each master, who controls release timing, permitted exploitation, marketing duties, artist approvals and credit placement.","Define reporting, audit, breach notice, cure, termination and whether any rights revert or remain licensed after termination.","Attach recording schedules, budgets, royalty definitions, credit requirements and signatory authority."]
  },
  {
    id: 'music-producer',
    matches: /^music-producer-agreement$/,
    sectionTitles: ["Production Brief & Deliverables","Sessions, Revisions & Technical Acceptance","Producer Fee & Royalty Participation","Master Rights, Credits & Session Materials","Clearances, Delivery & Project Closeout","Track Schedule, Credits & Execution"],
    clauseHeadings: [["Production Brief & Creative Direction","Track List, Roles & Third-Party Inputs"],["Production Deliverables, Stems & Session Files","Revision Rounds, Approval & Final Delivery"],["Producer Fee, Deposit & Milestone Payments","Producer Royalty, Points & Accounting"],["Master Ownership & Exploitation Rights","Producer Credit, Metadata & Portfolio Use"],["Sample Clearance & Third-Party Material","File Handover, Backup & Project Completion"],["Track-by-Track Production Schedule","Notices, Approvals & Signatures"]],
    guidance: ["Identify each track, creative brief, tempo/key references, production role and any supplied beats, samples or recordings. Distinguish production services from songwriting contributions.","List required mixes, stems, session files, formats, naming conventions, revision rounds and approval authority. Define when a deliverable is accepted.","Set deposits, milestone fees, additional revision rates and any negotiated royalty points. Define the royalty base, deductions, statements and audit access.","Separate ownership of the master from composition rights and pre-existing tools. State producer credit wording, metadata duties and portfolio permissions.","Allocate sample and interpolation clearance responsibilities. Define final file transfer, backup period, retained copies and project sign-off.","Attach track inventory, delivery checklist, credit data and payment schedule."]
  },
  {
    id: 'featured-artist',
    matches: /^featured-artist-agreement$/,
    sectionTitles: ["Featured Performance & Recording Scope","Recording Session, Approval & Delivery","Feature Fee, Royalty & Credit","Master Use, Name & Likeness Permissions","Release Coordination, Takedown & Disputes","Track Details, Credits & Execution"],
    clauseHeadings: [["Featured Performance & Recording Scope","Track, Role & Performance Requirements"],["Session Logistics, Takes & Vocal Delivery","Edit Approval, Pickups & Final Acceptance"],["Feature Fee, Royalty Share & Payment Date","Credit Placement & Metadata Accuracy"],["Master Recording Use & Distribution Permission","Name, Image & Promotional Excerpts"],["Release Date, Marketing Commitments & Coordination","Objection, Cure & Removal Procedure"],["Recording Details & Credit Sheet","Notices, Approvals & Signatures"]],
    guidance: ["Identify the track, primary artist, featured performer, expected performance, recording version and any live or promotional appearances included.","Set session dates, recording method, number of takes, delivery format, edit approval, pickup requirements and the person authorized to accept the performance.","State the fee, payment trigger, any royalty share, accounting basis and exact credit. Do not infer a percentage or guarantee from the feature status.","Define permission to incorporate the performance into the master, distribute it, use the performer's approved name/image and publish agreed promotional excerpts.","Coordinate release timing, announcement approvals, promotional obligations and the process for resolving a credit or unauthorized-use complaint.","Attach track details, performer billing, payment terms and release contacts."]
  },
  {
    id: 'music-management',
    matches: /^music-management-agreement$/,
    sectionTitles: ["Management Appointment & Authority","Artist Services, Decisions & Commitments","Commission Base & Accounting","Rights, Expenses & Conflicts","Term, Sunset & Termination","Commission Schedule, Contacts & Execution"],
    clauseHeadings: [["Manager Appointment & Representation Scope","Territory, Exclusivity & Covered Activities"],["Career Strategy, Opportunities & Reporting","Approval Limits, Signing Authority & Conflicts"],["Commissionable Income & Excluded Receipts","Statements, Expenses & Audit Rights"],["No Transfer of Artist Rights or Ownership","Expense Approval & Related-Party Transactions"],["Initial Term, Renewal & Termination Rights","Post-Term Commission Sunset & Pending Deals"],["Commission Schedule & Excluded Income List","Notices, Approvals & Signatures"]],
    guidance: ["Define the manager's appointment, covered activities, territory, exclusivity and any expressly excluded business areas.","Describe strategy, booking and negotiation support, reporting frequency, spending limits and which contracts require the artist's separate approval.","List commissionable income and exclusions by source, timing and gross/net basis. Define statements, payment dates, expense offsets and audit rights.","Clarify that management does not transfer ownership of masters, compositions, accounts or the artist's identity. Require disclosure and approval of conflicts and related-party deals.","Set initial term, renewal mechanics, termination for cause or convenience, cure periods and a narrow sunset for deals procured during the term.","Attach commission examples, excluded-income schedule, approval matrix and contact details."]
  },
  {
    id: 'live-performance',
    matches: /^live-performance-agreement$/,
    sectionTitles: ["Engagement, Venue & Performance","Production Advance, Soundcheck & Technical Rider","Guarantee, Deposit & Settlement","Ticketing, Merchandising & Recording Rights","Cancellation, Safety & Force Majeure","Rider, Settlement Sheet & Execution"],
    clauseHeadings: [["Engagement Date, Venue & Performance Format","Set Length, Lineup & Artist Responsibilities"],["Stage Plot, Input List & Technical Rider","Soundcheck, Backline & Production Contacts"],["Guarantee, Deposit & Payment Milestones","Ticket Revenue, Settlement & Approved Deductions"],["Ticketing, Guest List & Merchandising","Recording, Livestream & Broadcast Permission"],["Cancellation, Weather & Force Majeure","Safety, Security & Event Interruption"],["Technical Rider & Hospitality Schedule","Settlement Contacts, Notices & Signatures"]],
    guidance: ["Identify the event, date, venue, billing, set length, lineup, arrival requirements and included appearances.","Attach stage plot, input list, backline, soundcheck timing, hospitality and production contacts. Define who supplies and operates each item.","State guarantee, deposit, balance timing, ticket split, settlement method and permitted deductions. Require a written settlement statement.","Allocate ticketing, guest list, merch sales and any recording, livestream, broadcast or promotional capture rights separately.","Define cancellation notice, deposits, force majeure, venue safety, security and procedures if the performance is interrupted.","Attach the technical and hospitality riders, settlement worksheet and authorized day-of-show contacts."]
  },
  {
    id: 'master-services',
    matches: /^master-services-agreement$/,
    sectionTitles: ["Services, Deliverables & Acceptance","Governance, Change Control & Service Standards","Fees, Expenses & Invoicing","Confidentiality, Data & Work Product","Risk Allocation, Suspension & Exit","Statement of Work & Execution"],
    clauseHeadings: [["Services, Deliverables & Exclusions","Statement of Work Priority & Dependencies"],["Project Governance & Client Responsibilities","Change Requests, Acceptance & Service Levels"],["Fees, Rates & Milestone Invoices","Expenses, Taxes & Payment Disputes"],["Confidential Information & Data Handling","Background Materials, Work Product & License"],["Warranties, Indemnity & Liability Limits","Suspension, Transition & Termination Assistance"],["Statement of Work Template & Rate Card","Notices, Escalation & Signatures"]],
    guidance: ["Describe the service relationship and make each statement of work identify deliverables, assumptions, exclusions, dependencies and acceptance criteria.","Set project contacts, governance meetings, client dependencies, change-order approval and service standards. Establish precedence if an SOW conflicts with the master terms.","Specify fixed fees, time rates, milestones, expense approval, invoice detail, taxes, due dates and a documented dispute process.","Define confidentiality, security controls, customer data, pre-existing materials, newly created work product and the license or assignment actually intended.","Allocate warranties, indemnities and liability caps deliberately. Define suspension rights, termination triggers, transition support and return of materials.","Attach the SOW, rate card, service levels, security addenda and escalation contacts."]
  },
  {
    id: 'confidentiality',
    matches: /^confidentiality-agreement$/,
    sectionTitles: ["Protected Information & Purpose","Permitted Disclosure & Safeguards","Duration, Exceptions & Compelled Disclosure","Ownership, No License & Return","Incident Notice, Remedies & Enforcement","Disclosure Schedule, Contacts & Execution"],
    clauseHeadings: [["Protected Information & Disclosing Parties","Defined Purpose & Authorized Recipients"],["Use Limitation & Need-to-Know Access","Security Measures & Representative Duties"],["Confidentiality Period & Survival","Public, Prior-Knowledge & Independent-Development Exceptions"],["Compelled Disclosure Notice & Cooperation","Return, Destruction & Backup Retention"],["Loss, Unauthorized Access & Incident Notice","Equitable Relief, Costs & Available Remedies"],["Permitted Recipient Schedule","Notices, Governing Terms & Signatures"]],
    guidance: ["Identify disclosing and receiving parties, covered information, permitted purpose and authorized recipient classes. Avoid defining all information as confidential without workable boundaries.","Limit use to the stated purpose, restrict access to need-to-know personnel and require safeguards proportionate to the information.","Set the term and survival period. Define exclusions for public information, prior lawful possession, independent development and lawful third-party receipt.","State whether disclosure grants any license. Define return or destruction, certification and narrow archival or backup exceptions.","Set prompt incident notice, cooperation, mitigation and remedies without assuming every breach automatically creates a specific loss.","Attach any permitted recipient list, disclosure schedule and designated security contacts."]
  },
  {
    id: 'commercial-lease',
    matches: /^commercial-property-lease$/,
    sectionTitles: ["Commercial Premises & Permitted Use","Delivery, Improvements & Operating Rules","Operating Costs & Tenant Charges","Maintenance, Insurance & Property Risk","Default, Renewal & Surrender","Premises Plan, Expense Schedule & Execution"],
    clauseHeadings: [["Premises, Permitted Use & Exclusive Rights","Term, Commencement & Possession Condition"],["Tenant Improvements & Landlord Work","Signage, Access, Parking & Building Rules"],["Base Rent, Escalations & Payment","Operating Costs, CAM Reconciliation & Taxes"],["Repairs, Building Systems & Capital Work","Insurance, Indemnity & Casualty Allocation"],["Default, Notice & Cure","Renewal Options, Assignment & Surrender"],["Premises Plan & Delivery Condition","Operating Expense Schedule & Signatures"]],
    guidance: ["Attach a plan identifying rentable area, shared areas, parking, access and permitted business use. State commencement, delivery condition and any exclusivity.","Allocate landlord work, tenant improvements, permits, signage, access hours, loading and building rules. Define approval and restoration requirements.","Set base rent, increases, operating expense pass-throughs, taxes, utilities, audit rights and annual reconciliation procedures.","Allocate repairs by building system and area. Set insurance limits, casualty response, business interruption and indemnity responsibilities.","Define default notices, cure periods, renewal options, assignment/subletting, holdover and surrender condition.","Attach floor plans, work letters, operating expense estimates, rules and required statutory disclosures."]
  },
  {
    id: 'property-management',
    matches: /^property-management-agreement$/,
    sectionTitles: ["Property Portfolio & Management Appointment","Leasing, Maintenance & Vendor Authority","Rent Collection & Owner Accounting","Trust Funds, Records & Compliance","Performance, Termination & Handover","Property Schedule, Budget & Execution"],
    clauseHeadings: [["Managed Property & Appointment Scope","Manager Authority & Owner Reserved Decisions"],["Tenant Screening, Leasing & Renewal Limits","Maintenance Thresholds & Emergency Work"],["Rent Collection, Deposits & Delinquency","Monthly Statements, Reserves & Owner Distributions"],["Separate Funds, Records & Inspection Rights","Vendor Selection, Licensing & Legal Compliance"],["Service Standards, Reporting & Disputes","Termination, Transition & Tenant File Handover"],["Property Inventory & Approved Budget","Fee Schedule, Notices & Signatures"]],
    guidance: ["List each managed property, unit, service scope, term and decisions reserved to the owner. Confirm required licenses and local compliance responsibilities.","Set leasing authority, screening criteria, lease approval limits, maintenance spending thresholds and emergency authorization.","Define rent collection, deposit handling, delinquency action, reserves, owner distributions and monthly statement detail.","Require appropriate segregation and records for client funds. Define inspection access, vendor controls, insurance and legal compliance.","Set reporting standards, performance escalation, termination rights, transition timing and transfer of tenant files, keys and funds.","Attach property inventory, approved budget, fee schedule, vendor rules and emergency contacts."]
  },
  {
    id: 'graphic-design',
    matches: /^graphic-design-services-agreement$/,
    sectionTitles: ["Design Brief & Creative Deliverables","Concept Rounds, Approval & Production","Project Fee, Licensing Add-ons & Payment","Source Files, Usage License & Portfolio","Third-Party Assets, Cancellation & Handover","Creative Brief, Asset List & Execution"],
    clauseHeadings: [["Brand Brief, Audience & Design Objectives","Deliverable List, Formats & Exclusions"],["Concept Directions & Revision Rounds","Client Approval, Production & Change Requests"],["Project Fee, Deposit & Milestone Payments","Additional Work, Rush Fees & Expenses"],["Final Artwork License & Permitted Media","Editable Source Files & Portfolio Display"],["Fonts, Stock Assets & Third-Party Restrictions","Cancellation, Archive & Final Handover"],["Creative Brief & Delivery Specifications","Approvals, Notices & Signatures"]],
    guidance: ["Identify brand, audience, intended use, design direction, deliverables, file formats and exclusions. Attach references and required brand assets.","Define concept count, revision rounds, feedback windows, approval authority and how a material scope change is priced and scheduled.","Set deposit, milestones, final payment, rush fees, additional work and reimbursable expenses.","Distinguish final exported artwork, editable source files and pre-existing tools. Define license scope, media, territory, term, exclusivity and portfolio display.","List fonts, stock imagery and other third-party assets with their license restrictions. Define cancellation fees, archive duration and handover process.","Attach creative brief, asset inventory, delivery checklist and final approver details."]
  },
  {
    id: 'executive-employment',
    matches: /^executive-employment-agreement$/,
    sectionTitles: ["Executive Appointment & Authority","Duties, Fiduciary Expectations & Reporting","Compensation, Incentives & Equity","Confidentiality, IP & Restrictive Covenants","Termination, Severance & Transition","Compensation Schedule, Policies & Execution"],
    clauseHeadings: [["Executive Role, Appointment & Delegated Authority","Term, Reporting Line & Board Oversight"],["Duties, Standards & Conflicts Disclosure","Business Objectives & Performance Review"],["Base Salary, Bonus & Long-Term Incentives","Equity Awards, Benefits & Reimbursement"],["Confidential Information & Security Obligations","Inventions, Work Product & Post-Employment Restrictions"],["Termination for Cause, Without Cause & Resignation","Severance, Release Conditions & Transition"],["Incentive Plan & Equity Award References","Policies, Notices & Signatures"]],
    guidance: ["Identify employer, executive title, start date, term, reporting line and delegated authority. Distinguish board-reserved matters from ordinary operating authority.","Set duties, performance objectives, conflict disclosure, outside activities, fiduciary expectations and review process.","Specify salary, bonus metrics, equity award documents, vesting references, benefits and expense reimbursement. Avoid implying an award exists unless approved separately.","Reference confidentiality, information security, invention assignment and any post-employment restrictions only to the extent lawful and separately supported.","Define termination categories, notice, severance, bonus/equity treatment, release conditions, final pay and transition assistance.","Attach compensation schedules, incentive plans, equity documents, policies and approval resolutions."]
  },
  {
    id: 'shareholders',
    matches: /^shareholders-agreement$/,
    sectionTitles: ["Share Capital & Shareholder Rights","Board Composition & Reserved Matters","Transfers, Pre-emption & New Issuances","Dividends, Information & Related Parties","Deadlock, Exit & Dispute Resolution","Capitalization Table, Joinders & Execution"],
    clauseHeadings: [["Share Classes, Holdings & Rights","Shareholder Capacity & Accession"],["Board Appointment & Quorum","Reserved Matters & Consent Thresholds"],["Transfer Restrictions & Permitted Transfers","Pre-emption, Tag-along & Drag-along Rights"],["Dividend Policy & Financial Information","Related-Party Transactions & Conflicts"],["Deadlock Escalation & Buy-Sell Mechanism","Exit Events, Valuation & Dispute Process"],["Capitalization Table & Transfer Notice Form","Joinders, Amendments & Signatures"]],
    guidance: ["Attach a fully reconciled capitalization table, share classes, voting rights and each shareholder's holdings. Define who is bound and how new holders accede.","Set board appointment rights, quorum, voting thresholds and reserved matters requiring shareholder consent.","Define transfer restrictions, permitted transfers, rights of first refusal or pre-emption, tag-along and drag-along mechanics with clear notice timelines.","Set dividend policy, information rights, budgets, related-party approvals and conflict disclosures.","Provide deadlock escalation, valuation method, buy-sell or sale process, exit triggers and dispute resolution steps.","Attach cap table, transfer notices, joinder form, valuation method and required corporate approvals."]
  },
  {
    id: 'business-loan',
    matches: /^business-loan-agreement$/,
    sectionTitles: ["Facility, Borrower & Funding Conditions","Use of Proceeds & Financial Covenants","Interest, Repayment & Prepayment","Collateral, Guarantees & Reporting","Default, Acceleration & Enforcement","Amortization, Collateral & Execution"],
    clauseHeadings: [["Facility Amount, Borrower & Lender","Conditions Precedent & Funding Mechanics"],["Permitted Use of Proceeds","Financial Covenants & Information Undertakings"],["Interest Rate, Fees & Day-Count Basis","Repayment, Maturity & Voluntary Prepayment"],["Collateral, Security Documents & Guarantors","Financial Reporting & Inspection Rights"],["Events of Default & Cure Periods","Acceleration, Enforcement & Application of Proceeds"],["Amortization & Payment Schedule","Collateral Description, Notices & Signatures"]],
    guidance: ["Identify borrower, lender, facility amount, purpose, availability period and conditions precedent. State how and when funds are advanced.","Define permitted uses, financial covenants, testing dates, reporting deliverables and notice of covenant breaches.","Specify interest basis, fees, day-count convention, payment dates, maturity, prepayment and any applicable break costs.","Describe collateral, guarantors, security documents, perfection steps, reporting and inspection rights. Do not imply security exists before required steps are completed.","Define defaults, materiality thresholds, notice and cure, acceleration, enforcement and application of recoveries.","Attach amortization schedule, collateral description, guaranties, certificates and authorized signatories."]
  },
  {
    id: 'api-license',
    matches: /^api-license-agreement$/,
    sectionTitles: ["API Products & Licensed Access","Rate Limits, Availability & Support","Usage Fees, Metering & Billing","Data, Security & Intellectual Property","Abuse, Suspension & Version Retirement","API Schedule, Keys & Execution"],
    clauseHeadings: [["API Products, Endpoints & License Scope","Credentials, Applications & Authorized Users"],["Rate Limits, Quotas & Fair Use","Availability, Support & Deprecation Notices"],["Metered Usage, Fees & Overage Rates","Billing Records, Taxes & Disputes"],["Request Data, Response Data & Provider IP","Credential Security, Logs & Retention"],["Abuse Detection, Suspension & Remediation","Version Changes, Migration & Termination"],["Endpoint, Quota & Pricing Schedule","Security Contacts, Notices & Signatures"]],
    guidance: ["Identify API products, endpoints, documentation version, permitted application, environment and authorized users. Define whether credentials may be shared or sublicensed.","Set rate limits, quotas, availability targets, support scope, maintenance windows and advance notice for material deprecations.","Define metering units, free tiers, overage rates, billing cycle, usage records and invoice disputes.","Separate customer request data, API responses, provider software and telemetry. Set credential controls, encryption, logging, retention and data-use limits.","Define prohibited use, abuse response, suspension notice, remediation, version migration and export or deletion on exit.","Attach endpoint list, quotas, pricing, security contacts and credential issuance procedures."]
  },
  {
    id: 'brand-sponsorship',
    matches: /^brand-sponsorship-agreement$/,
    sectionTitles: ["Sponsorship Property & Deliverables","Activation, Approvals & Audience Commitments","Sponsorship Fee & Performance Metrics","Marks, Content & Exclusivity","Disclosure, Compliance & Makegoods","Activation Calendar, Metrics & Execution"],
    clauseHeadings: [["Sponsored Property, Tier & Rights Package","Deliverables, Channels & Excluded Rights"],["Activation Calendar & Approval Deadlines","Audience, Placement & Proof of Performance"],["Sponsorship Fee, Installments & Taxes","Impressions, Engagement & Measurement Rules"],["Brand Marks, Content License & Approvals","Category Exclusivity & Competitor Conflicts"],["Advertising Disclosures & Platform Compliance","Cancellation, Makegoods & Takedown"],["Rights Matrix & Activation Schedule","Reporting, Notices & Signatures"]],
    guidance: ["Identify the sponsored property, tier, event or program, rights package, deliverables, channels and any rights expressly excluded.","Set publication dates, creative approval windows, placement, audience commitments and evidence required to verify performance.","Specify fee installments, taxes, measurement sources, reporting cadence and treatment of under-delivery or invalid traffic.","Define use of marks, content approvals, license term, territory, exclusivity category and restrictions on competitor sponsorships.","Allocate advertising disclosures, platform rules, cancellation, makegood inventory, correction and takedown obligations.","Attach rights matrix, activation calendar, creative specifications, measurement plan and reporting contacts."]
  },
  {
    id: 'event-services',
    matches: /^event-services-agreement$/,
    sectionTitles: ["Event Scope, Venue & Production Plan","Vendors, Staffing & Run of Show","Fees, Ticketing & Settlement","Permits, Safety & Event Data","Cancellation, Force Majeure & Closeout","Run of Show, Budget & Execution"],
    clauseHeadings: [["Event Purpose, Date, Venue & Capacity","Scope, Deliverables & Excluded Services"],["Vendor Roles, Staffing & Call Times","Run of Show, Equipment & Change Control"],["Service Fee, Deposit & Production Budget","Ticketing, Revenue Share & Settlement"],["Permits, Insurance & Safety Plan","Attendee Data, Photography & Recording"],["Cancellation, Postponement & Force Majeure","Incident Response, Refunds & Final Reconciliation"],["Run of Show & Approved Budget","Vendor Contacts, Notices & Signatures"]],
    guidance: ["Identify event date, venue, capacity, purpose, event owner, scope and excluded services. Confirm venue access and load-in/load-out windows.","List vendors, staffing roles, call times, equipment, run of show, approval chain and change-order process.","Set service fee, deposits, production budget, ticketing authority, revenue shares, settlement timing and approved deductions.","Allocate permits, insurance, safety, security, attendee data, photography and recording permissions.","Define cancellation, postponement, force majeure, incident response, refunds, vendor closeout and final reconciliation.","Attach run of show, budget, vendor matrix, emergency contacts and venue requirements."]
  }
];

const CATEGORY_FALLBACKS: Record<string, TemplateContentProfile> = {
  'Music & Entertainment': {
    id: 'music-general',
    sectionTitles: ['Engagement, Masters & Scope','Recording Services & Deliverables','Compensation, Royalties & Accounting','Master, Composition & Credits','Release, Clearances & Termination','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Transaction Purpose & Parties','Scope, Assets & Exclusions'],
      ['Creative Services, Deliverables & Approval','Milestones, Review & Change Control'],
      ['Compensation, Royalties & Accounting','Statements, Records & Reconciliation'],
      ['Master Rights, Composition Rights & Credits','Ownership, Access & Recordkeeping'],
      ['Term, Renewal & Completion','Release Obligations, Clearances & Termination'],
      ['Governing Terms, Compliance & Disputes','Execution, Counterparts & Schedules']
    ],
    guidance: ['Identify the parties, recordings, compositions and services covered.','List masters, stems, credits, approvals and delivery dates.','Specify negotiated fees, advances, royalties and statement timing.','Separate master, composition, artwork and performer rights.','Document clearances, release duties, defaults and takedown steps.','Attach the schedules, notices and signed approvals.']
  },
  'Business & Commercial': {
    id: 'commercial-general',
    sectionTitles: ['Commercial Engagement & Scope','Services, Deliverables & Acceptance','Fees, Expenses & Invoicing','Work Product & Confidentiality','Commercial Risk & Exit','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Transaction Purpose & Parties','Scope, Assets & Exclusions'],
      ['Service Levels, Work Orders & Acceptance','Milestones, Review & Change Control'],
      ['Fees, Expenses, Taxes & Invoicing','Statements, Records & Reconciliation'],
      ['Work Product, Business Records & Confidential Information','Ownership, Access & Recordkeeping'],
      ['Commercial Risk, Change Control & Exit','Term, Renewal & Completion'],
      ['Governing Terms, Compliance & Disputes','Execution, Counterparts & Schedules']
    ],
    guidance: ['Identify the commercial objective, parties and transaction scope.','Define service standards, work orders, deliverables and acceptance.','Specify fees, taxes, expenses, invoice timing and records.','Classify work product, confidential information and permitted use.','Set change control, liability allocation, cure and exit assistance.','Attach work orders, commercial schedules and notices.']
  },
  'Real Estate & Rentals': {
    id: 'property-general',
    sectionTitles: ['Property, Premises & Occupancy','Permitted Use, Access & Condition','Rent, Deposits & Charges','Property Rights & Maintenance','Default, Notices & Surrender','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Property Description & Parties','Scope, Included Areas & Exclusions'],
      ['Premises, Permitted Use & Occupancy Duties','Access, Condition & Inspection'],
      ['Rent, Deposits, Utilities & Other Charges','Statements, Receipts & Reconciliation'],
      ['Access, Condition, Repairs & Property Records','Ownership, Fixtures & Maintenance'],
      ['Property Condition, Default & Surrender','Notices, Cure & Completion'],
      ['Property Schedule & Disclosures','Execution, Counterparts & Schedules']
    ],
    guidance: ['Identify the property, parties, legal description and included areas.','Set permitted use, occupancy, access and condition requirements.','Specify rent or consideration, deposits, utilities and charges.','Allocate maintenance, repairs, fixtures and property records.','Set notice, default, cure, surrender and closing procedures.','Attach property schedules, inventories and required disclosures.']
  },
  'Creative & Freelance': {
    id: 'creative-general',
    sectionTitles: ['Creative Brief & Project Scope','Concepts, Revisions & Delivery','Creative Fees & Milestones','Copyright, License & Source Files','Approval, Cancellation & Handover','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Creative Brief & Project Purpose','Scope, Assets & Exclusions'],
      ['Creative Deliverables & Revision Process','Review, Acceptance & Change Requests'],
      ['Creative Fee, Expenses & Payment Milestones','Invoices, Deposits & Reconciliation'],
      ['Copyright, Source Files, License & Portfolio Use','Third-Party Assets & Usage Restrictions'],
      ['Approval, Cancellation & Final Handover','Term, Archive & Post-Project Support'],
      ['Project Schedule & Required Releases','Execution, Counterparts & Schedules']
    ],
    guidance: ['Identify the brief, intended audience, creative direction and scope.','Specify deliverables, revision rounds, approval windows and formats.','Set deposits, milestone payments, expenses and additional work rates.','Distinguish final work, drafts, source files and third-party assets.','Define cancellation, handover, archive and post-project support.','Attach references, asset lists, releases and final delivery schedule.']
  },
  'Employment & HR': {
    id: 'employment-general',
    sectionTitles: ['Role, Appointment & Scope','Responsibilities & Workplace Standards','Compensation & Benefits','Confidentiality & Work Product','Performance, Separation & Transition','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Role, Appointment & Reporting','Scope, Classification & Work Location'],
      ['Responsibilities & Workplace Standards','Review, Training & Policy Compliance'],
      ['Compensation, Benefits & Reimbursement','Payroll, Incentives & Records'],
      ['Confidentiality, Work Product & Company Property','Data Access & Return of Property'],
      ['Performance Review, Leave & Separation','Notice, Transition & Final Pay'],
      ['Policies, Schedules & Required Notices','Execution, Acknowledgment & Signatures']
    ],
    guidance: ['Identify the employing entity, role, status and reporting line.','Describe duties, workplace standards, training and policies.','Specify compensation, benefits, payroll and reimbursements.','Set confidentiality, work-product and property obligations.','Document review, leave, separation and transition processes.','Attach policies and any required employee acknowledgments.']
  },
  'Corporate & Legal': {
    id: 'corporate-general',
    sectionTitles: ['Transaction, Entity & Scope','Governance, Authority & Closing','Capital, Consideration & Distributions','Corporate Records & Reserved Matters','Representations, Compliance & Exit','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Entity, Transaction & Purpose','Parties, Capacity & Defined Terms'],
      ['Governance, Authority & Transaction Mechanics','Approvals, Voting & Conditions'],
      ['Capitalization, Consideration & Distribution','Accounts, Allocations & Payment'],
      ['Corporate Records, Information & Reserved Matters','Ownership, Access & Transfer Restrictions'],
      ['Representations, Compliance & Transaction Exit','Default, Remedies & Closing Obligations'],
      ['Schedules, Registers & Supporting Documents','Execution, Counterparts & Resolutions']
    ],
    guidance: ['Identify the entity, transaction, parties and governing documents.','Confirm authority, approvals, voting and closing mechanics.','Record capital, consideration, allocations and distributions.','Maintain registers, records, information rights and reserved matters.','Set representations, compliance duties, default and exit terms.','Attach resolutions, registers, schedules and signed approvals.']
  },
  'Finance & Investment': {
    id: 'finance-general',
    sectionTitles: ['Facility, Investment & Scope','Funding, Use of Proceeds & Covenants','Principal, Interest & Repayment','Collateral & Financial Records','Default, Remedies & Recovery','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Facility, Investment & Parties','Purpose, Funding & Conditions'],
      ['Use of Proceeds & Financial Covenants','Reporting & Information Undertakings'],
      ['Principal, Interest, Repayment & Consideration','Payment Application & Reconciliation'],
      ['Collateral, Security & Financial Records','Valuation, Perfection & Release'],
      ['Default, Acceleration & Recovery','Cure, Restructuring & Enforcement'],
      ['Payment Schedule & Financial Exhibits','Notices, Amendments & Execution']
    ],
    guidance: ['Identify the financing or investment, parties and purpose.','Set permitted use of funds, covenants and reporting obligations.','Specify principal, return, interest, maturity and payment terms.','Document collateral, records, valuation and release conditions.','Define defaults, cure periods, acceleration and recovery procedures.','Attach financial schedules, notices and signed instruments.']
  },
  'Technology & Data': {
    id: 'technology-general',
    sectionTitles: ['Platform, System & Scope','Technical Delivery & Service Levels','Subscription, Usage & Fees','Software, Data & Security','Incidents, Continuity & Exit','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Platform, System & Authorized Scope','Accounts, Users & Permitted Use'],
      ['Technical Delivery, Support & Service Levels','Testing, Acceptance & Change Control'],
      ['Subscription Fees, Usage Charges & Service Credits','Billing, Renewal & Reconciliation'],
      ['Software, Data, Security & Processing Instructions','Access, Retention & Intellectual Property'],
      ['Incidents, Continuity & Termination','Export, Transition & Secure Deletion'],
      ['Technical Schedule & Security Exhibit','Notices, Contacts & Execution']
    ],
    guidance: ['Identify the platform, systems, service scope and users.','Define implementation, testing, service levels and support.','Specify subscriptions, usage, overages, credits and renewal.','Set software, data, security, privacy and access rules.','Define incidents, continuity, suspension and exit assistance.','Attach architecture, security and service schedules.']
  },
  'Marketing & Partnerships': {
    id: 'marketing-general',
    sectionTitles: ['Campaign, Brand & Scope','Content, Approvals & Activation','Fees, Commissions & Reporting','Brand Assets, Content & Disclosures','Compliance, Changes & Withdrawal','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Campaign Objective & Parties','Scope, Channels & Exclusions'],
      ['Content, Deliverables & Approval','Activation, Timing & Tracking'],
      ['Campaign Fee, Commission & Reporting','Attribution, Metrics & Reconciliation'],
      ['Brand Assets, Content Usage & Disclosures','License, Exclusivity & Paid Amplification'],
      ['Compliance, Changes & Withdrawal','Correction, Takedown & Termination'],
      ['Campaign Schedule & Measurement','Notices, Schedules & Execution']
    ],
    guidance: ['Identify the campaign, parties, objective and target audience.','Define content, approvals, publication and tracking requirements.','Set fees, commissions, attribution windows and reporting.','Document brand use, content licenses and disclosure requirements.','Set compliance, correction, takedown and cancellation procedures.','Attach creative, posting and reporting schedules.']
  },
  'Personal & General': {
    id: 'personal-general',
    sectionTitles: ['Subject Matter & Arrangement','Delivery, Responsibilities & Acceptance','Consideration & Payment','Ownership, Condition & Records','Notice, Completion & Remedies','Notices, Schedules & Execution'],
    clauseHeadings: [
      ['Subject Matter & Parties','Scope, Included Items & Exclusions'],
      ['Delivery, Responsibilities & Acceptance','Inspection & Completion Evidence'],
      ['Consideration, Payment & Receipts','Expenses, Taxes & Reconciliation'],
      ['Ownership, Condition & Supporting Records','Transfer, Custody & Restrictions'],
      ['Nonperformance, Notice & Completion','Remedies, Return & Dispute Process'],
      ['Inventory, Schedule & Supporting Documents','Notices & Execution']
    ],
    guidance: ['Identify the subject matter, parties and intended arrangement.','Set delivery, responsibilities, inspection and acceptance conditions.','Record consideration, payment timing and receipts.','Document ownership, condition, custody and supporting records.','Set notice, completion, return and dispute procedures.','Attach inventories, schedules and signed acknowledgments.']
  }
};

export function resolveTemplateContentProfile(
  templateId: string,
  category: string
): TemplateContentProfile {
  const specific = PROFILES.find(profile => profile.matches.test(templateId));
  const fallback = CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS['Personal & General'];
  const { matches: _matches, ...resolved } = specific || { ...fallback, matches: /.*/ };
  return {
    ...resolved,
    sectionTitles: [...resolved.sectionTitles] as TemplateContentProfile['sectionTitles'],
    clauseHeadings: resolved.clauseHeadings.map(pair => [...pair]) as TemplateContentProfile['clauseHeadings'],
    guidance: [...resolved.guidance] as TemplateContentProfile['guidance']
  };
}
