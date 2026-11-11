import type { DocumentModel, DocumentType, Section } from '../types/document';
import { resolveTemplateContentProfile } from './templateProfiles';

export type TemplateCategory =
  | 'Music & Entertainment'
  | 'Business & Commercial'
  | 'Real Estate & Rentals'
  | 'Creative & Freelance'
  | 'Employment & HR'
  | 'Corporate & Legal'
  | 'Finance & Investment'
  | 'Technology & Data'
  | 'Marketing & Partnerships'
  | 'Personal & General';

export interface DocumentTemplateDefinition {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  documentType: DocumentType;
  focus: string;
  deliverable: string;
  sectionTitles: string[];
}

type TemplateSeed = [
  id: string,
  title: string,
  category: TemplateCategory,
  description: string,
  tags: string,
  focus: string,
  deliverable: string
];

export const LIL_SYNN_TEMPLATE_ID = 'lil-synn-music-agreement';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Music & Entertainment',
  'Business & Commercial',
  'Real Estate & Rentals',
  'Creative & Freelance',
  'Employment & HR',
  'Corporate & Legal',
  'Finance & Investment',
  'Technology & Data',
  'Marketing & Partnerships',
  'Personal & General'
];

const TEMPLATE_SEEDS: TemplateSeed[] = [
  // Music & Entertainment (21)
  [LIL_SYNN_TEMPLATE_ID,'LIL SYNN Music Agreement','Music & Entertainment','Branded agreement covering artist collaboration, master recording ownership, release responsibilities, credits and music-rights schedules.','LIL SYNN;music agreement;master recording;artist collaboration;release','the music collaboration, master recording ownership, artist services and release obligations between LIL SYNN and the named contributors','approved masters, split schedules, credits, artwork permissions, release assets and distribution-ready metadata'],
  ['recording-artist-agreement','Recording Artist Agreement','Music & Entertainment','Structures an artist engagement, recording commitment, release obligations and master participation.','recording artist;record deal;master;royalty','the recording artist engagement, featured recordings, release schedule and master exploitation rights','completed vocal and instrumental masters, approved revisions, credits and release-ready metadata'],
  ['music-producer-agreement','Music Producer Agreement','Music & Entertainment','Defines producer services, recording deliverables, credit, compensation and master-use permissions.','producer;beatmaker;production;royalty','the production of specified compositions and master recordings by an independent music producer','instrumental sessions, stems, final mixes, revisions and production metadata'],
  ['beat-license-agreement','Beat License Agreement','Music & Entertainment','Documents a non-exclusive or exclusive instrumental license, permitted uses, limitations and fees.','beat license;instrumental;lease;exclusive','the grant of defined rights to use an identified instrumental composition and its associated files','licensed instrumental files, permitted recording uses and delivery of the resulting release information'],
  ['featured-artist-agreement','Featured Artist Agreement','Music & Entertainment','Sets featured vocal performance, credit, compensation, approvals and release permissions.','featured artist;vocalist;feature;credit','a featured artist vocal performance on a named sound recording and its promotional campaign','approved vocal takes, performance revisions, credit information and agreed promotional assets'],
  ['music-collaboration-split-sheet','Music Collaboration Split Sheet','Music & Entertainment','Records participant contributions, writer shares, ownership intentions and registration details.','split sheet;co-writing;publishing;composition','the joint creation of one or more musical compositions by the named writers and contributors','agreed ownership percentages, writer and publisher information, PRO details and registration-ready splits'],
  ['songwriting-collaboration-agreement','Songwriting Collaboration Agreement','Music & Entertainment','Defines co-writing contributions, composition ownership, publishing administration and decision rights.','songwriting;co-writer;composition;publishing','the joint writing, arrangement and development of lyrics, melody and musical composition elements','final lyric sheets, composition metadata, agreed splits and registration instructions'],
  ['master-recording-ownership-agreement','Master Recording Ownership Agreement','Music & Entertainment','Documents ownership and administration of identified sound recording masters.','master ownership;sound recording;copyright;catalog','the ownership, control, delivery and exploitation of identified master sound recordings','master files, alternate versions, ISRC data, session records and chain-of-title documentation'],
  ['music-video-production-agreement','Music Video Production Agreement','Music & Entertainment','Covers music video production scope, crew responsibilities, deliverables, usage and release coordination.','music video;production;director;visuals','the concept, production and post-production of a music video tied to a designated musical release','approved treatment, production schedule, edited video, cutdowns, captions and source deliverables'],
  ['music-management-agreement','Music Management Agreement','Music & Entertainment','Sets manager services, authority limits, commission, expense accounting and artist protections.','artist manager;management;commission;representation','the professional management and career-development services provided to a recording artist','career strategy, opportunity coordination, accounting statements and documented approvals'],
  ['booking-agreement','Artist Booking Agreement','Music & Entertainment','Defines an artist booking, event requirements, performance fee and cancellation terms.','artist booking;booking agent;appearance;live event','the procurement and confirmation of an artist appearance at a specified event and venue','confirmed booking particulars, itinerary, venue liaison and settlement records'],
  ['live-performance-agreement','Live Performance Agreement','Music & Entertainment','Specifies live show obligations, stage production, technical rider, payment and cancellation.','live performance;concert;venue;technical rider','the artist performance at a named venue, festival or private event','set length, performance schedule, stage plot, input list and show-day coordination'],
  ['session-musician-agreement','Session Musician Agreement','Music & Entertainment','Documents musician services, recording session scope, fee, credits and recording permissions.','session musician;studio;performance;release','the musician contribution to designated studio recordings and arrangements','recorded instrument parts, alternate takes, charts and session notes'],
  ['remix-license-agreement','Remix License Agreement','Music & Entertainment','Grants defined rights to create and exploit a remix using supplied source material.','remix;derivative recording;stems;license','the creation and release of a remix derived from a specified original sound recording','remix master, stems handling, approved edits, credits and release metadata'],
  ['sample-clearance-agreement','Sample Clearance Agreement','Music & Entertainment','Records permission to incorporate identified sampled material into a new recording.','sample clearance;master use;composition;permission','the use of identified excerpts from an existing master recording and/or underlying composition','sample identification, source references, approved duration, clearance proof and credit information'],
  ['sync-license-agreement','Sync License Agreement','Music & Entertainment','Defines synchronization and master-use rights for music paired with visual media.','sync;film;television;advertising;music supervision','the synchronization of a composition and/or master recording with a named audiovisual production','cue details, media scope, territory, term, cue-sheet data and licensed audio assets'],
  ['master-use-license-agreement','Master Use License Agreement','Music & Entertainment','Authorizes limited use of a sound recording in a specified project or distribution context.','master use;recording license;catalog;media','the use of a specific sound recording master in the stated project, media and distribution channels','identified master, approved edits, usage records and license attribution'],
  ['music-publishing-administration-agreement','Music Publishing Administration Agreement','Music & Entertainment','Sets composition administration, collection authority, reporting and publisher service fees.','music publishing;administration;royalties;composition','the administration and collection of income associated with listed musical compositions','work registrations, writer/publisher data, royalty statements and collection reports'],
  ['digital-distribution-agreement','Digital Music Distribution Agreement','Music & Entertainment','Defines delivery, platform distribution, takedowns, revenue accounting and metadata duties.','digital distribution;DSP;release;streaming','the delivery and digital distribution of specified sound recordings and associated release assets','audio masters, artwork, metadata, identifiers, release dates and platform updates'],
  ['record-label-services-agreement','Record Label Services Agreement','Music & Entertainment','Defines label services, campaign support, distribution, marketing spend and accounting.','record label;label services;artist;release campaign','the label services and release support supplied for identified recordings and artist projects','release planning, marketing deliverables, distribution coordination and periodic accounting'],
  ['artist-name-image-likeness-release','Artist Name, Image & Likeness Release','Music & Entertainment','Documents approved use of an artist name, likeness, biography and promotional materials.','name image likeness;publicity;artist;promotion','the authorized use of artist identity and approved publicity assets for the stated campaign','approved photographs, biography, name usage, campaign assets and approval records'],

  // Business & Commercial (12)
  ['master-services-agreement','Master Services Agreement','Business & Commercial','Sets the umbrella terms governing recurring professional services and future statements of work.','MSA;professional services;vendor;SOW','the ongoing provision of professional or operational services across one or more work orders','service standards, work orders, acceptance records and periodic service reports'],
  ['professional-services-sow','Professional Services Statement of Work','Business & Commercial','Defines a project-specific scope, milestones, staffing, acceptance and fees under a master agreement.','statement of work;SOW;project;deliverables','the defined project scope, milestones and deliverables for a specific services engagement','milestone plan, work products, acceptance criteria and completion report'],
  ['business-consulting-agreement','Business Consulting Agreement','Business & Commercial','Covers advisory scope, access to information, fees, work product and consulting boundaries.','consulting;advisor;business strategy;fees','the provision of strategic, operational or management consulting services','advisory sessions, analysis, recommendations and agreed implementation materials'],
  ['confidentiality-agreement','Mutual Confidentiality Agreement','Business & Commercial','Establishes mutual rules for confidential disclosures, permitted use and protected information.','NDA;confidentiality;mutual;trade secret','the exchange of confidential business, commercial or technical information for an identified purpose','permitted-use controls, recipient access records and return or destruction confirmations'],
  ['independent-contractor-agreement','Independent Contractor Agreement','Business & Commercial','Defines independent services, contractor status, deliverables, payment and work-product ownership.','independent contractor;consultant;services;1099','the independent contractor engagement to provide the described services without creating employment','service deliverables, invoices, progress updates and final handover materials'],
  ['joint-venture-agreement','Joint Venture Agreement','Business & Commercial','Sets venture purpose, participant contributions, governance, economics and exit mechanisms.','joint venture;collaboration;contributions;governance','the formation and operation of a joint business undertaking for a defined commercial objective','contribution schedule, operating plan, shared records and venture reporting'],
  ['supplier-services-agreement','Supplier & Services Agreement','Business & Commercial','Sets supply requirements, specifications, delivery, inspections, service levels and payment.','supplier;procurement;vendor;purchase orders','the supply of specified goods, materials or services to the purchasing organization','orders, specifications, delivery confirmations, inspection records and invoices'],
  ['product-purchase-agreement','Commercial Product Purchase Agreement','Business & Commercial','Documents a commercial goods sale, product specifications, delivery, acceptance and payment.','purchase agreement;goods sale;products;delivery','the sale and purchase of identified products in stated quantities and condition','product schedule, delivery documents, inspection results and transfer records'],
  ['referral-partner-agreement','Referral Partner Agreement','Business & Commercial','Defines qualified referrals, attribution, fees, disclosures and customer relationship boundaries.','referral;partner;commission;lead generation','the introduction of prospective customers and referral opportunities between the parties','qualified lead records, attribution evidence and commission statements'],
  ['strategic-partnership-agreement','Strategic Partnership Agreement','Business & Commercial','Establishes a commercial collaboration, shared workstreams, governance and partner commitments.','strategic partnership;collaboration;commercial;alliance','the coordinated commercial partnership to pursue the stated products, services or market opportunity','joint work plan, assigned workstreams, reporting and partner review records'],
  ['franchise-license-agreement','Franchise License Agreement','Business & Commercial','Documents use of a business system and brand subject to operational standards and fees.','franchise;brand license;business system;royalty','the licensed operation of a business using the franchisor system, brand and operating standards','location setup, training completion, operating checklists and ongoing performance reports'],
  ['commercial-settlement-agreement','Commercial Settlement Agreement','Business & Commercial','Records negotiated resolution, releases, payment timing and continuing obligations.','settlement;release;dispute resolution;commercial','the resolution of specified commercial claims and disputed performance obligations','settlement consideration, release documents, payment confirmation and closeout records'],

  // Real Estate & Rentals (12)
  ['residential-lease-agreement','Residential Lease Agreement','Real Estate & Rentals','Covers residential occupancy, rent, deposit, maintenance, notices and move-out obligations.','residential lease;tenant;landlord;rent','the rental and residential use of the identified dwelling by the named tenant','condition report, keys, rent ledger, repair notices and move-out inspection'],
  ['commercial-property-lease','Commercial Property Lease','Real Estate & Rentals','Sets commercial premises use, rent, operating costs, maintenance, insurance and tenant improvements.','commercial lease;business premises;rent;tenant improvements','the occupancy and business use of the identified commercial premises','premises plan, permitted-use approvals, insurance certificates and maintenance records'],
  ['room-rental-agreement','Room Rental Agreement','Real Estate & Rentals','Defines room occupancy, shared facilities, house rules, rent and privacy expectations.','room rental;house share;occupancy;rent','the rental of a defined room within a shared residential property','room condition, shared facility rules, access arrangements and payment ledger'],
  ['residential-sublease-agreement','Residential Sublease Agreement','Real Estate & Rentals','Documents subletting approval, subtenant duties, rent, term and continuing primary-tenant liability.','sublease;subtenant;residential;landlord consent','the subletting of a defined residential unit or room under an existing head lease','consent evidence, inventory, rent allocation and subtenant move-out records'],
  ['lease-amendment-agreement','Lease Amendment Agreement','Real Estate & Rentals','Changes identified lease provisions without replacing the remainder of the existing lease.','lease amendment;rent change;renewal;premises','the agreed amendment of selected provisions of an existing lease while preserving unchanged terms','amended schedule, revised rent dates, notice records and signed amendment'],
  ['property-management-agreement','Property Management Agreement','Real Estate & Rentals','Defines property manager authority, maintenance, rent collection, reporting and fees.','property manager;management;landlord;maintenance','the management of the identified real property on behalf of its owner','inspection reports, tenant communications, maintenance approvals and owner statements'],
  ['real-estate-purchase-agreement','Real Estate Purchase Agreement','Real Estate & Rentals','Documents a property sale, price, deposit, contingencies, due diligence and closing.','property purchase;real estate sale;escrow;closing','the purchase and sale of the identified real property under negotiated closing conditions','purchase price schedule, inspection results, title documents and closing deliverables'],
  ['seller-property-disclosure','Seller Property Condition Disclosure','Real Estate & Rentals','Organizes seller disclosures about known property condition, systems, repairs and notices.','seller disclosure;property condition;real estate;inspection','the seller disclosure of known material property conditions and prior repair history','completed disclosure questionnaire, supporting reports and buyer acknowledgment'],
  ['vacation-rental-agreement','Vacation Rental Agreement','Real Estate & Rentals','Sets short-term lodging dates, occupancy limits, house rules, deposits and guest responsibilities.','vacation rental;short-term stay;guest;lodging','the temporary guest occupancy of the named accommodation for specified dates','check-in details, guest list, condition inventory and checkout confirmation'],
  ['roommate-agreement','Roommate Agreement','Real Estate & Rentals','Allocates shared rent, utilities, chores, common-area use and household expectations.','roommate;shared housing;utilities;house rules','the shared residential living arrangement among named roommates','rent and utility allocations, shared inventory, cleaning schedule and house rules'],
  ['parking-storage-lease','Parking & Storage Space Lease','Real Estate & Rentals','Defines limited-use rights for a parking stall or storage space, fees and access restrictions.','parking lease;storage rental;access;space use','the rental of the identified parking or storage area for the specified permitted purpose','space identification, access credentials, condition records and fee ledger'],
  ['rental-move-in-agreement','Rental Move-In Condition & Inventory Agreement','Real Estate & Rentals','Records initial premises condition, fixtures, keys, photos and tenant acknowledgments.','move in;inventory;condition report;keys','the documented condition and inventory of the premises at the start of occupancy','dated photographs, fixture checklist, meter readings and key receipt'],

  // Creative & Freelance (10)
  ['freelance-creative-services','Freelance Creative Services Agreement','Creative & Freelance','Defines creative engagement scope, milestones, revisions, fees, portfolio and ownership rights.','freelance;creative services;deliverables;revision','the freelance creation of creative work products for a defined client brief','creative concepts, milestone drafts, revision rounds and final production files'],
  ['graphic-design-services-agreement','Graphic Design Services Agreement','Creative & Freelance','Covers design brief, concepts, revision rounds, source files, license and delivery.','graphic design;branding;source files;license','the design of specified visual assets and production-ready graphic materials','concept boards, layout proofs, final artwork and agreed source files'],
  ['brand-identity-agreement','Brand Identity & Strategy Agreement','Creative & Freelance','Sets brand research, positioning, identity design, style guide, approvals and usage rights.','brand identity;logo;style guide;strategy','the development of a brand strategy and visual identity system for a named organization','brand discovery, logo suite, typography/color guidance and brand standards guide'],
  ['photography-services-agreement','Photography Services Agreement','Creative & Freelance','Defines shoot logistics, shot list, image editing, delivery, licensing and model/property releases.','photography;photoshoot;image license;retouching','the commissioned photography session and subsequent editing of selected images','shot list, schedule, edited image gallery and licensed image deliverables'],
  ['videography-production-agreement','Videography Production Services Agreement','Creative & Freelance','Covers filming, production crew, edit rounds, raw footage, music and usage rights.','videography;film production;editing;footage','the filming and editing of a defined video project for a client or commissioning party','production schedule, footage, review cuts, final export and caption files'],
  ['illustration-commission-agreement','Illustration Commission Agreement','Creative & Freelance','Defines commissioned illustration subject, style, rounds, usage license and source delivery.','illustration;commission;artwork;license','the creation of original illustration artwork matching an approved creative direction','thumbnail concepts, refinement proofs, final high-resolution artwork and usage notes'],
  ['website-development-agreement','Website Design & Development Agreement','Creative & Freelance','Sets site requirements, build stages, content responsibilities, testing, launch and maintenance.','website development;design;hosting;launch','the design, development, testing and launch of a specified website or digital experience','approved wireframes, functional build, QA report, repository handover and launch checklist'],
  ['commissioned-art-agreement','Commissioned Artwork Agreement','Creative & Freelance','Documents original artwork commission, materials, approvals, delivery, display and reproduction rights.','commissioned art;artist;original artwork;reproduction','the creation and delivery of one or more original physical or digital art pieces','approved concept, progress photographs, final artwork and care or installation instructions'],
  ['content-creator-agreement','Content Creator Services Agreement','Creative & Freelance','Defines creator content, platform formats, schedule, approvals, usage and disclosure requirements.','content creator;social content;UGC;deliverables','the creation of original digital content for a named brand, product or campaign','content calendar, drafts, published content links and performance summary'],
  ['ghostwriting-agreement','Ghostwriting & Editorial Services Agreement','Creative & Freelance','Sets manuscript scope, research, interviews, drafts, revisions, attribution and rights transfer.','ghostwriting;writing;manuscript;editorial','the writing and editorial development of a manuscript or other written work for a client','outline, chapter drafts, revision log, final manuscript and research notes'],

  // Employment & HR (10)
  ['employment-agreement','Employment Agreement','Employment & HR','Sets role, duties, salary, benefits, workplace terms, confidentiality and separation conditions.','employment;employee;salary;position','the employment of the named individual in a defined position and reporting structure','role description, performance goals, onboarding records and company property handover'],
  ['executive-employment-agreement','Executive Employment Agreement','Employment & HR','Covers executive authority, compensation, incentives, confidentiality and transition obligations.','executive;officer;employment;incentive','the appointment of an executive with defined delegated authority and leadership responsibilities','executive mandate, performance objectives, compensation schedule and transition plan'],
  ['employment-offer-letter','Employment Offer Letter','Employment & HR','Summarizes a proposed role, compensation, start date, reporting relationship and conditions.','job offer;employment;start date;compensation','the proposed employment offer for the stated role and commencement date','signed offer acceptance, onboarding checklist and pre-start requirements'],
  ['employee-confidentiality-agreement','Employee Confidentiality Agreement','Employment & HR','Protects employer information, trade secrets, customer data and access credentials.','employee NDA;confidentiality;trade secrets;data','the employee access to and handling of protected employer information during and after service','confidentiality acknowledgment, access inventory and return-of-information confirmation'],
  ['invention-assignment-agreement','Employee Invention & IP Assignment Agreement','Employment & HR','Documents assignment and disclosure of covered inventions, works and employment-related IP.','invention assignment;employee IP;work product;patent','the disclosure and ownership allocation of inventions and work product created within the defined employment scope','invention disclosures, assignment schedules and supporting creation records'],
  ['remote-work-agreement','Remote & Hybrid Work Agreement','Employment & HR','Establishes remote-work location, availability, security, equipment and workplace expectations.','remote work;hybrid;telework;equipment','the employee remote or hybrid work arrangement and its operational conditions','approved work location, equipment inventory, availability plan and security checklist'],
  ['severance-and-release-agreement','Severance & Separation Agreement','Employment & HR','Sets separation consideration, transition steps, release language and continuing obligations.','severance;separation;release;transition','the agreed separation of employment and associated transition arrangements','separation payment schedule, benefits information, property return and signed acknowledgments'],
  ['commission-incentive-plan','Sales Commission & Incentive Plan','Employment & HR','Defines eligible sales, commission triggers, calculation, adjustments and payout timing.','commission;incentive;sales;quota','the calculation and payment of variable compensation tied to defined performance measures','quota schedule, sales attribution records, commission statements and payout records'],
  ['employee-handbook-acknowledgment','Employee Handbook Acknowledgment','Employment & HR','Records receipt and acknowledgment of workplace policies and employee responsibilities.','handbook;policy;acknowledgment;HR','the employee receipt and acknowledgment of the organization’s current workplace policy materials','signed acknowledgment, handbook version and policy training record'],
  ['performance-bonus-agreement','Performance Bonus Agreement','Employment & HR','Sets bonus eligibility, performance metrics, assessment periods and payment conditions.','performance bonus;employee;target;incentive','the employee bonus opportunity based on stated targets and review periods','target schedule, measurement record, management approval and bonus calculation'],

  // Corporate & Legal (10)
  ['llc-operating-agreement','LLC Operating Agreement','Corporate & Legal','Sets member interests, management, voting, distributions, transfers and dissolution.','LLC;operating agreement;members;governance','the governance and internal operating rules of the limited liability company','member schedule, capital contribution record, resolutions and distribution statements'],
  ['shareholders-agreement','Shareholders Agreement','Corporate & Legal','Documents shareholder rights, reserved matters, transfers, governance and exit mechanisms.','shareholders;equity;governance;transfer','the rights and obligations of shareholders in relation to ownership and governance of the company','share register, shareholder approvals, transfer notices and cap table records'],
  ['corporate-bylaws','Corporate Bylaws','Corporate & Legal','Establishes board, officer, meeting, voting and corporate record procedures.','bylaws;corporate governance;board;officers','the internal procedures and governance rules for the corporation','board minutes, officer appointments, meeting notices and corporate registers'],
  ['board-consent-resolution','Board Written Consent Resolution','Corporate & Legal','Records board action approved without a meeting, including authority and supporting resolutions.','board consent;resolution;directors;approval','the formal approval of specified corporate action by written director consent','written consents, supporting memoranda and updated corporate records'],
  ['asset-purchase-agreement','Business Asset Purchase Agreement','Corporate & Legal','Documents transfer of listed business assets, assumed liabilities, price and closing actions.','asset purchase;business sale;closing;assets','the purchase and transfer of specified operating assets and related rights','asset schedule, bill of sale, assignment instruments and closing checklist'],
  ['stock-purchase-agreement','Stock Purchase Agreement','Corporate & Legal','Sets share sale terms, representations, consideration, closing conditions and transfer records.','stock purchase;shares;equity;closing','the purchase and transfer of identified equity securities in the issuing company','share transfer forms, updated share ledger, payment evidence and closing certificates'],
  ['merger-transaction-agreement','Merger & Business Combination Agreement','Corporate & Legal','Outlines transaction structure, consideration, conditions, approvals and post-closing obligations.','merger;business combination;transaction;closing','the proposed combination of the identified entities and related closing steps','transaction schedules, approvals, closing certificates and integration records'],
  ['data-processing-agreement','Data Processing Agreement','Corporate & Legal','Allocates controller/processor obligations, processing instructions, security and data subject support.','data processing;privacy;controller;processor','the processing of personal data by a service provider on documented instructions','data inventory, processing records, subprocessor list and security documentation'],
  ['vendor-risk-agreement','Vendor Risk & Compliance Addendum','Corporate & Legal','Sets supplier security, audit, incident notification, continuity and regulatory cooperation obligations.','vendor risk;compliance;security;audit','the risk management and compliance conditions applicable to a critical third-party supplier','security questionnaires, audit evidence, incident notices and continuity test reports'],
  ['corporate-resolution','Corporate Authorization Resolution','Corporate & Legal','Authorizes named officers to execute a transaction, account, contract or other corporate action.','corporate resolution;authorization;officer;authority','the formal authorization of the specified corporate transaction or delegated action','approved resolution, officer incumbency record and transaction closing file'],

  // Finance & Investment (8)
  ['promissory-note','Promissory Note','Finance & Investment','Records principal, interest, maturity, installments, prepayment and default provisions.','promissory note;principal;interest;repayment','the borrower’s written promise to repay the stated principal amount under agreed terms','repayment schedule, payment receipts, balance statements and maturity notice'],
  ['business-loan-agreement','Business Loan Agreement','Finance & Investment','Sets facility amount, permitted use, interest, repayment, covenants and lender reporting.','business loan;credit facility;borrower;lender','the extension of financing to the borrower for the stated business purpose','funding evidence, repayment schedule, financial statements and covenant certificates'],
  ['secured-loan-agreement','Secured Loan Agreement','Finance & Investment','Documents a loan supported by identified collateral, lien records and enforcement conditions.','secured loan;collateral;security interest;lender','the lending of funds supported by the agreed collateral and security package','collateral schedule, filing confirmations, insurance records and lien release'],
  ['debt-repayment-agreement','Debt Repayment & Workout Agreement','Finance & Investment','Restructures outstanding debt through installments, revised dates and settlement conditions.','debt repayment;workout;installments;arrears','the restructuring and repayment of the identified outstanding obligation','revised amortization schedule, receipts, updated balance and completion confirmation'],
  ['investment-subscription-agreement','Investment Subscription Agreement','Finance & Investment','Documents an investor subscription, security allocation, funding and closing conditions.','investment;subscription;securities;investor','the investor subscription for the specified securities or ownership interest','subscription form, investor details, funding confirmation and securities register update'],
  ['convertible-note-agreement','Convertible Note Agreement','Finance & Investment','Sets note principal, interest, maturity and conversion triggers into future equity.','convertible note;startup;conversion;equity','the issuance of a debt instrument that may convert into equity upon defined events','note schedule, conversion cap table, notice of conversion and payment records'],
  ['revenue-share-financing-agreement','Revenue Share Financing Agreement','Finance & Investment','Defines an advance repaid through a percentage of defined revenue and reporting.','revenue share;financing;receipts;remittance','the provision of financing repaid from an agreed portion of specified revenue receipts','revenue statements, calculation worksheets, remittance records and reconciliation'],
  ['equipment-financing-agreement','Equipment Financing Agreement','Finance & Investment','Sets equipment acquisition financing, payment schedule, maintenance and end-of-term options.','equipment finance;asset;installment;secured','the financing or acquisition of the identified equipment for business use','equipment schedule, delivery acceptance, insurance and installment ledger'],

  // Technology & Data (8)
  ['saas-subscription-agreement','SaaS Subscription Agreement','Technology & Data','Sets hosted software access, subscription term, fees, availability, support and data handling.','SaaS;software subscription;cloud;SLA','the customer’s subscription to the provider-hosted software services','account provisioning, subscription records, service reports and data export package'],
  ['api-license-agreement','API License & Access Agreement','Technology & Data','Defines API credentials, rate limits, permitted integration, security and usage fees.','API;license;integration;developer','the authorized integration with and use of the specified application programming interface','API credentials, integration documentation, usage logs and key rotation record'],
  ['software-development-agreement','Software Development Agreement','Technology & Data','Covers requirements, milestones, testing, acceptance, source code and intellectual property.','software development;source code;milestones;QA','the design, coding and delivery of a specified software product or feature set','requirements specification, source repository, test results, deployment package and documentation'],
  ['service-level-agreement','Technology Service Level Agreement','Technology & Data','Defines service availability, support response, maintenance windows and service credits.','SLA;availability;uptime;support','the service performance and support standards for the identified technology service','uptime reports, incident tickets, maintenance notices and service credit calculations'],
  ['cloud-hosting-agreement','Cloud Hosting & Infrastructure Agreement','Technology & Data','Sets hosting resources, security controls, backup, capacity, support and migration duties.','cloud hosting;infrastructure;backup;availability','the hosting and operation of the customer’s applications and data on designated infrastructure','environment configuration, backup reports, capacity records and migration package'],
  ['data-processing-technology-agreement','Technology Data Processing Addendum','Technology & Data','Details technical processing, security measures, retention, deletion and subprocessors.','data processing;security;privacy;subprocessor','the processing of customer or end-user data by the technology provider','data maps, security controls, subprocessor list and deletion certificates'],
  ['cybersecurity-incident-response','Cybersecurity Incident Response Services Agreement','Technology & Data','Defines incident readiness, containment, investigation, communications and post-incident reporting.','cybersecurity;incident response;forensics;recovery','the provision of cybersecurity response and forensic support after a suspected security incident','incident timeline, evidence log, containment actions and lessons-learned report'],
  ['software-maintenance-agreement','Software Maintenance & Support Agreement','Technology & Data','Covers maintenance scope, patches, support hours, version updates and escalation.','software maintenance;support;patches;updates','the maintenance and technical support of the identified software system','patch notes, release records, support tickets and maintenance reports'],

  // Marketing & Partnerships (5)
  ['influencer-campaign-agreement','Influencer Campaign Agreement','Marketing & Partnerships','Defines creator deliverables, campaign dates, compensation, approvals and advertising disclosures.','influencer;creator campaign;social media;endorsement','the creator’s production and publication of sponsored social media content','content brief, draft approvals, post URLs, disclosure screenshots and performance report'],
  ['brand-sponsorship-agreement','Brand Sponsorship Agreement','Marketing & Partnerships','Sets sponsor benefits, event placement, brand use, payment and activation obligations.','sponsorship;brand;event;activation','the sponsorship of the named event, property or campaign in return for defined benefits','sponsor asset pack, placement plan, activation photos and post-event report'],
  ['affiliate-marketing-agreement','Affiliate Marketing Agreement','Marketing & Partnerships','Defines tracking, eligible referrals, commission, disclosures and prohibited promotion methods.','affiliate;commission;tracking;referral','the promotion of products or services through approved affiliate links and tracking methods','tracking links, referral reports, disclosure statements and commission reconciliations'],
  ['marketing-campaign-services','Marketing Campaign Services Agreement','Marketing & Partnerships','Covers campaign planning, media production, approvals, spend, reporting and usage rights.','marketing campaign;agency;media;creative','the planning and execution of the identified marketing campaign across agreed channels','campaign strategy, creative assets, media schedule, spend report and performance review'],
  ['co-marketing-partnership','Co-Marketing Partnership Agreement','Marketing & Partnerships','Coordinates joint promotion, audience access, brand approvals, lead handling and campaign costs.','co-marketing;partnership;joint promotion;leads','the joint promotion of the parties’ products, services or events to agreed audiences','joint campaign calendar, co-branded assets, lead report and campaign closeout'],

  // Personal & General (5)
  ['personal-loan-agreement','Personal Loan Agreement','Personal & General','Records a private loan, repayment dates, interest if any and payment evidence.','personal loan;borrower;lender;repayment','the personal lending of the stated amount between the named individuals','payment schedule, receipts, balance record and repayment confirmation'],
  ['bill-of-sale','Bill of Sale','Personal & General','Documents transfer of identified personal property, price, condition and delivery.','bill of sale;personal property;ownership;transfer','the sale and transfer of the specifically identified personal property','item description, condition notes, payment receipt and delivery acknowledgment'],
  ['personal-property-transfer-agreement','Personal Property Transfer Agreement','Personal & General','Sets a private transfer or gift of identified belongings, condition and acceptance.','property transfer;gift;personal belongings;ownership','the transfer of the described personal property from the transferor to the recipient','item inventory, condition photographs and signed receipt'],
  ['event-services-agreement','Private Event Services Agreement','Personal & General','Defines event services, schedule, location, fees, cancellation and setup requirements.','event services;private event;vendor;venue','the provision of event-related services at a specified private event','event schedule, setup plan, staffing details and completion checklist'],
  ['mutual-settlement-and-release','Mutual Settlement & Release Agreement','Personal & General','Records compromise of a defined personal dispute, payment, release and remaining duties.','mutual release;settlement;dispute;personal','the negotiated resolution of the specific dispute and reciprocal release of identified claims','settlement receipt, signed release and completion confirmation']
];

const CATEGORY_BLUEPRINTS: Record<TemplateCategory, {
  documentType: DocumentType;
  sectionTitles: string[];
  partyA: string;
  partyB: string;
  performanceHeading: string;
  moneyHeading: string;
  moneyLead: string;
  rightsHeading: string;
  rightsLead: string;
  riskHeading: string;
  riskLead: string;
}> = {
  'Music & Entertainment': {
    sectionTitles: ["Engagement, Masters & Scope","Recording Services & Deliverables","Compensation, Royalties & Accounting","Master, Composition & Credits","Release, Clearances & Termination","Notices, Schedules & Execution"],
    documentType: 'legal_agreement',
    partyA: 'ARTIST / RIGHTS HOLDER',
    partyB: 'PRODUCER / LICENSEE / SERVICE PROVIDER',
    performanceHeading: 'Creative Services, Deliverables & Approval',
    moneyHeading: 'Compensation, Royalties & Accounting',
    moneyLead: 'The parties shall record all fees, advances, recoupable costs, royalty rates, revenue definitions, payment triggers and statement periods in Schedule A. No percentage or royalty rate is implied by this template.',
    rightsHeading: 'Master Rights, Composition Rights & Credits',
    rightsLead: 'The parties must identify separately the underlying composition, sound recording master, artwork, performances, samples, name/image/likeness and any third-party material. Ownership and license scope must be expressly selected for each right.',
    riskHeading: 'Release Obligations, Clearances & Termination',
    riskLead: 'Before public release or exploitation, the responsible party shall document all required permissions, contributor consents, credits, registrations and platform metadata. Clearance responsibility and takedown procedures must be completed in the applicable schedule.'
  },
  'Business & Commercial': {
    sectionTitles: ["Commercial Engagement & Scope","Services, Deliverables & Acceptance","Fees, Expenses & Invoicing","Work Product & Confidentiality","Commercial Risk & Exit","Notices, Schedules & Execution"],
    documentType: 'business_proposal',
    partyA: 'CUSTOMER / PRINCIPAL',
    partyB: 'PROVIDER / COMMERCIAL PARTNER',
    performanceHeading: 'Service Levels, Work Orders & Acceptance',
    moneyHeading: 'Fees, Expenses, Taxes & Invoicing',
    moneyLead: 'The parties shall specify fixed fees, rate cards, approved expenses, taxes, invoice frequency, payment currency, late-payment treatment and any milestone holdbacks in the commercial schedule.',
    rightsHeading: 'Work Product, Business Records & Confidential Information',
    rightsLead: 'The parties shall classify pre-existing materials, new work product, customer records, confidential information and permitted-use rights. No assignment or broad license is created unless expressly stated in the signed schedule.',
    riskHeading: 'Commercial Risk, Change Control & Exit',
    riskLead: 'Changes to scope, personnel, delivery dates or assumptions must be documented in an approved change order. The parties shall define cure periods, suspension rights, liability allocation and transition assistance.'
  },
  'Real Estate & Rentals': {
    sectionTitles: ["Property, Premises & Occupancy","Permitted Use, Access & Condition","Rent, Deposits & Charges","Property Rights & Maintenance","Default, Notices & Surrender","Notices, Schedules & Execution"],
    documentType: 'legal_agreement',
    partyA: 'OWNER / LANDLORD / TRANSFEROR',
    partyB: 'TENANT / OCCUPANT / TRANSFEREE',
    performanceHeading: 'Premises, Permitted Use & Occupancy Duties',
    moneyHeading: 'Rent, Deposits, Utilities & Other Charges',
    moneyLead: 'The property schedule shall state the rent or purchase consideration, due dates, deposit treatment, utilities, common-area charges, taxes, payment method and any applicable reconciliation process.',
    rightsHeading: 'Access, Condition, Repairs & Property Records',
    rightsLead: 'The parties shall document the property address, included areas, inventory, condition report, keys or access credentials, inspection protocol, maintenance responsibility and notice process.',
    riskHeading: 'Property Condition, Default & Surrender',
    riskLead: 'The parties shall define permitted notices, inspection rights, repair remedies, casualty procedures, default and cure rules, holdover or extension terms, and the condition required at surrender or closing.'
  },
  'Creative & Freelance': {
    sectionTitles: ["Creative Brief & Project Scope","Concepts, Revisions & Delivery","Creative Fees & Milestones","Copyright, License & Source Files","Approval, Cancellation & Handover","Notices, Schedules & Execution"],
    documentType: 'business_proposal',
    partyA: 'CLIENT / COMMISSIONING PARTY',
    partyB: 'CREATOR / FREELANCER',
    performanceHeading: 'Creative Brief, Milestones & Revision Process',
    moneyHeading: 'Creative Fee, Expenses & Payment Milestones',
    moneyLead: 'The parties shall list the project fee, deposit, milestone payments, approved expenses, taxes, additional revision rates and payment dates. Work outside the agreed brief requires written approval.',
    rightsHeading: 'Copyright, Source Files, License & Portfolio Use',
    rightsLead: 'The parties shall identify draft concepts, final deliverables, source files, third-party assets, usage media, territory, term, exclusivity and whether rights are licensed or assigned. Unpaid or unapproved concepts remain subject to the selected written rights arrangement.',
    riskHeading: 'Approval, Cancellation & Final Handover',
    riskLead: 'The parties shall define review windows, consolidated feedback, client dependencies, pause/cancellation fees, delivery formats, archival periods and post-project support.'
  },
  'Employment & HR': {
    sectionTitles: ["Role, Appointment & Scope","Responsibilities & Workplace Standards","Compensation & Benefits","Confidentiality & Work Product","Performance, Separation & Transition","Notices, Schedules & Execution"],
    documentType: 'legal_agreement',
    partyA: 'EMPLOYER / ORGANIZATION',
    partyB: 'EMPLOYEE / CANDIDATE',
    performanceHeading: 'Position, Responsibilities & Workplace Standards',
    moneyHeading: 'Compensation, Benefits & Reimbursement',
    moneyLead: 'The offer or employment schedule shall identify base compensation, pay frequency, approved incentive plans, benefit eligibility, reimbursable expenses and the conditions for any variable compensation.',
    rightsHeading: 'Confidentiality, Work Product & Company Property',
    rightsLead: 'The parties shall define protected information, permitted disclosures, work product created within the role, invention disclosure procedures, security duties and company property return.',
    riskHeading: 'Performance Review, Leave & Separation',
    riskLead: 'The parties shall describe review procedures, notice and cure where applicable, leave and accommodation processes, separation payments if any, required notices and post-separation transition.'
  },
  'Corporate & Legal': {
    sectionTitles: ["Transaction, Entity & Scope","Governance, Authority & Closing","Capital, Consideration & Distributions","Corporate Records & Reserved Matters","Representations, Compliance & Exit","Notices, Schedules & Execution"],
    documentType: 'legal_agreement',
    partyA: 'COMPANY / ISSUER / TRANSFEROR',
    partyB: 'MEMBER / SHAREHOLDER / COUNTERPARTY',
    performanceHeading: 'Governance, Authority & Transaction Mechanics',
    moneyHeading: 'Capitalization, Consideration & Distribution',
    moneyLead: 'The transaction or governance schedule shall identify capital contributions, purchase consideration, equity allocation, voting thresholds, distributions, valuation mechanics and required approvals.',
    rightsHeading: 'Corporate Records, Information & Reserved Matters',
    rightsLead: 'The parties shall identify the governing documents, statutory registers, information rights, transfer restrictions, reserved matters, delegated authority and approval evidence required for the transaction.',
    riskHeading: 'Representations, Compliance & Transaction Exit',
    riskLead: 'The parties shall allocate responsibility for due diligence, regulatory filings, corporate approvals, conditions precedent, indemnity procedures, default remedies and post-closing actions.'
  },
  'Finance & Investment': {
    sectionTitles: ["Facility, Investment & Scope","Funding, Use of Proceeds & Covenants","Principal, Interest & Repayment","Collateral & Financial Records","Default, Remedies & Recovery","Notices, Schedules & Execution"],
    documentType: 'financial_report',
    partyA: 'LENDER / INVESTOR',
    partyB: 'BORROWER / ISSUER',
    performanceHeading: 'Funding, Use of Proceeds & Financial Covenants',
    moneyHeading: 'Principal, Interest, Repayment & Consideration',
    moneyLead: 'The financing schedule shall specify the principal or investment amount, currency, interest or return formula, accrual method, payment dates, maturity, prepayment and any conversion or revenue participation formula.',
    rightsHeading: 'Collateral, Financial Information & Records',
    rightsLead: 'The parties shall identify collateral, perfection or filing steps, reporting covenants, financial statements, permitted liens, recordkeeping and any required account or security controls.',
    riskHeading: 'Default, Acceleration & Recovery',
    riskLead: 'The parties shall enumerate payment and non-payment defaults, notice and cure periods, acceleration, collateral enforcement, restructuring, dispute procedures and release conditions.'
  },
  'Technology & Data': {
    sectionTitles: ["Platform, System & Scope","Technical Delivery & Service Levels","Subscription, Usage & Fees","Software, Data & Security","Incidents, Continuity & Exit","Notices, Schedules & Execution"],
    documentType: 'technical_spec',
    partyA: 'CUSTOMER / DATA CONTROLLER',
    partyB: 'PROVIDER / PROCESSOR',
    performanceHeading: 'Technical Scope, Service Levels & Support',
    moneyHeading: 'Subscription Fees, Usage Charges & Service Credits',
    moneyLead: 'The service schedule shall specify subscription tiers, usage metrics, overages, renewal periods, taxes, support tiers, service credits and any implementation or migration fees.',
    rightsHeading: 'Software, Data, Security & Processing Instructions',
    rightsLead: 'The parties shall document software ownership, customer data, permitted processing, access controls, security safeguards, subprocessors, retention, backups, incident notice and data export or deletion.',
    riskHeading: 'Service Continuity, Incidents & Termination',
    riskLead: 'The parties shall specify incident severity, notification times, recovery targets, planned maintenance, vulnerability response, service suspension, exit assistance and secure data return or deletion.'
  },
  'Marketing & Partnerships': {
    sectionTitles: ["Campaign, Brand & Scope","Content, Approvals & Activation","Fees, Commissions & Reporting","Brand Assets, Content & Disclosures","Compliance, Changes & Withdrawal","Notices, Schedules & Execution"],
    documentType: 'business_proposal',
    partyA: 'BRAND / SPONSOR / CLIENT',
    partyB: 'CREATOR / AGENCY / PARTNER',
    performanceHeading: 'Campaign Scope, Content & Approval',
    moneyHeading: 'Campaign Fee, Commission & Performance Reporting',
    moneyLead: 'The campaign schedule shall specify fixed fees, production costs, media spend, commission formula, attribution window, payment milestones and reporting frequency.',
    rightsHeading: 'Brand Assets, Content Usage & Advertising Disclosures',
    rightsLead: 'The parties shall document permitted brand use, content usage period, whitelisting or paid amplification, approval rights, disclosure requirements, platform policies and restrictions on claims.',
    riskHeading: 'Campaign Changes, Compliance & Withdrawal',
    riskLead: 'The parties shall set approval windows, content correction procedures, cancellation fees, prohibited practices, takedown requests and contingency plans for delayed or discontinued campaigns.'
  },
  'Personal & General': {
    sectionTitles: ["Subject Matter & Arrangement","Delivery, Responsibilities & Acceptance","Consideration & Payment","Ownership, Condition & Records","Notice, Completion & Remedies","Notices, Schedules & Execution"],
    documentType: 'general',
    partyA: 'FIRST PARTY / TRANSFEROR',
    partyB: 'SECOND PARTY / RECIPIENT',
    performanceHeading: 'Subject Matter, Delivery & Responsibilities',
    moneyHeading: 'Consideration, Payment & Receipts',
    moneyLead: 'The parties shall record any payment, installment, deposit, reimbursement, item valuation or other consideration, including its amount, due date and accepted method of payment.',
    rightsHeading: 'Ownership, Condition & Supporting Records',
    rightsLead: 'The parties shall describe the subject matter, ownership or permission being transferred, condition, included items, supporting records and any restrictions that remain in effect.',
    riskHeading: 'Nonperformance, Notice & Completion',
    riskLead: 'The parties shall describe notice channels, completion conditions, cancellation or return obligations, dispute handling and the records that confirm final performance.'
  }
};

function makeId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

const TAGS_SEPARATOR = ';';

export const DOCUMENT_TEMPLATE_CATALOG: DocumentTemplateDefinition[] = TEMPLATE_SEEDS.map(seed => {
  const [id, title, category, description, tagString, focus, deliverable] = seed;
  return {
    id,
    title,
    category,
    description,
    tags: tagString.split(TAGS_SEPARATOR).map(tag => tag.trim()).filter(Boolean),
    documentType: CATEGORY_BLUEPRINTS[category].documentType,
    focus,
    deliverable,
    sectionTitles: [...resolveTemplateContentProfile(id, category).sectionTitles]
  };
});

export const TEMPLATE_CATEGORY_COUNTS: Record<TemplateCategory, number> = TEMPLATE_CATEGORIES.reduce((counts, category) => {
  counts[category] = DOCUMENT_TEMPLATE_CATALOG.filter(template => template.category === category).length;
  return counts;
}, {} as Record<TemplateCategory, number>);

export function getTemplateById(id: string): DocumentTemplateDefinition | undefined {
  const template = DOCUMENT_TEMPLATE_CATALOG.find(item => item.id === id);
  return template ? { ...template, tags: [...template.tags], sectionTitles: [...template.sectionTitles] } : undefined;
}

export function getTemplateAgreementDefaults(
  template: DocumentTemplateDefinition | null | undefined
): { agreementType: string; documentType: DocumentType | null; brandName?: string } {
  if (!template) return { agreementType: '', documentType: null };
  if (template.id === LIL_SYNN_TEMPLATE_ID) {
    return {
      agreementType: 'Music Agreement',
      documentType: 'music_agreement',
      brandName: 'LIL SYNN'
    };
  }
  return { agreementType: template.title, documentType: template.documentType };
}

export function searchTemplates(query: string, category?: string): DocumentTemplateDefinition[] {
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return DOCUMENT_TEMPLATE_CATALOG.filter(template => {
    if (category && template.category !== category) return false;
    if (!searchTerms.length) return true;
    const searchable = [template.title, template.description, template.category, ...template.tags].join(' ').toLowerCase();
    return searchTerms.every(term => searchable.includes(term));
  }).map(template => ({ ...template, tags: [...template.tags], sectionTitles: [...template.sectionTitles] }));
}

function buildSection(
  sectionIndex: number,
  title: string,
  content: string,
  clauseEntries: Array<[string, string]>
): Section {
  return {
    id: makeId('section'),
    sectionNumber: (sectionIndex + 1) + '.0',
    title,
    content,
    clauses: clauseEntries.map(([heading, clauseContent], clauseIndex) => ({
      id: makeId('clause'),
      clauseNumber: (sectionIndex + 1) + '.' + (clauseIndex + 1),
      heading,
      content: clauseContent,
      orderIndex: clauseIndex + 1
    })),
    orderIndex: sectionIndex + 1
  };
}

export function buildTemplateDocument(templateId: string, agreementType?: string): DocumentModel {
  const template = getTemplateById(templateId);
  if (!template) throw new Error('Unknown document template: ' + templateId);
  const blueprint = CATEGORY_BLUEPRINTS[template.category];
  const resolvedAgreementType = agreementType?.trim() || (template.id === LIL_SYNN_TEMPLATE_ID ? 'Music Agreement' : template.title);
  const parties = [
    {
      id: makeId('party'),
      role: blueprint.partyA,
      name: '[PARTY A LEGAL NAME]',
      title: '[AUTHORIZED SIGNATORY TITLE]',
      company: '[PARTY A ENTITY]',
      date: '',
      signaturePlaceholder: '',
      signed: false
    },
    {
      id: makeId('party'),
      role: blueprint.partyB,
      name: '[PARTY B LEGAL NAME]',
      title: '[AUTHORIZED SIGNATORY TITLE]',
      company: '[PARTY B ENTITY]',
      date: '',
      signaturePlaceholder: '',
      signed: false
    }
  ];
  const profile = resolveTemplateContentProfile(template.id, template.category);
  const sections = [
    buildSection(
      0,
      profile.sectionTitles[0],
      template.description + '\n\n' + profile.guidance[0] + '\n\nDrafting fields: [EFFECTIVE DATE] • [PROJECT / PROPERTY / ACCOUNT IDENTIFIER] • [AUTHORIZED TERRITORY OR LOCATION].',
      [
        [profile.clauseHeadings[0][0], 'The parties enter this ' + template.title + ' to address ' + template.focus + '. ' + profile.guidance[0]],
        [profile.clauseHeadings[0][1], 'The parties shall list every included asset, service, location, account, person or item and expressly identify exclusions, assumptions and third-party dependencies.']
      ]
    ),
    buildSection(
      1,
      profile.sectionTitles[1],
      'This section allocates the operational duties associated with ' + template.focus + '. ' + profile.guidance[1],
      [
        [profile.clauseHeadings[1][0], template.deliverable + '. ' + profile.guidance[1]],
        [profile.clauseHeadings[1][1], 'The parties shall document milestones, review periods, objective acceptance criteria, correction requests and approved changes in scope, quantity, timing or specification. Silence shall not constitute acceptance unless expressly selected in the completed schedule.']
      ]
    ),
    buildSection(
      2,
      profile.sectionTitles[2],
      blueprint.moneyLead + ' ' + profile.guidance[2],
      [
        [profile.clauseHeadings[2][0], '[CURRENCY] [TOTAL AMOUNT OR RATE] • [DEPOSIT / ADVANCE] • [MILESTONE OR INSTALLMENT DATES] • [PAYMENT METHOD]. ' + profile.guidance[2]],
        [profile.clauseHeadings[2][1], 'The responsible party shall maintain invoices, receipts, usage calculations, statements and payment evidence. Any audit right, reconciliation period and objection deadline must be expressly completed.']
      ]
    ),
    buildSection(
      3,
      profile.sectionTitles[3],
      blueprint.rightsLead + ' ' + profile.guidance[3],
      [
        [profile.clauseHeadings[3][0], profile.guidance[3] + ' The schedule shall state the precise rights granted, retained, transferred or excluded.'],
        [profile.clauseHeadings[3][1], 'Each party shall limit access to authorized persons, use protected material only for the stated purpose and retain evidence of approvals, delivery, payment and compliance.']
      ]
    ),
    buildSection(
      4,
      profile.sectionTitles[4],
      blueprint.riskLead + ' ' + profile.guidance[4],
      [
        [profile.clauseHeadings[4][0], profile.guidance[4]],
        [profile.clauseHeadings[4][1], 'The parties shall state applicable notice channels, cure periods, available remedies, responsibility for loss, suspension rights, termination effects and any required transition or handover assistance.']
      ]
    ),
    buildSection(
      5,
      profile.sectionTitles[5],
      profile.guidance[5] + ' All schedules, exhibits, technical requirements, property details and approved changes should be attached and identified by version.',
      [
        [profile.clauseHeadings[5][0], profile.guidance[5] + ' Required approvals, compliance records and supporting documents should be listed in the attached schedule.'],
        [profile.clauseHeadings[5][1], 'The persons signing below confirm that they have reviewed the completed schedules and are authorized to sign for the stated party. Electronic and counterpart execution should be used only as permitted by applicable law and the parties’ agreed process.']
      ]
    )
  ];

  const now = new Date().toISOString();
  return {
    id: makeId('document'),
    title: resolvedAgreementType,
    type: template.id === LIL_SYNN_TEMPLATE_ID ? 'music_agreement' : template.documentType,
    version: 1,
    createdAt: now,
    updatedAt: now,
    author: 'Document Author',
    changeSummary: 'Created from the ' + template.title + ' template. Agreement type: ' + resolvedAgreementType + '.',
    sections,
    signatures: {
      id: makeId('signatures'),
      title: 'SIGNATURES & EXECUTION',
      executionText: 'IN WITNESS WHEREOF, the parties execute this agreement through their authorized representatives.',
      layout: 'side_by_side',
      parties
    },
    styles: {
      fontFamily: 'Inter',
      fontSize: 10.5,
      lineHeight: 1.5,
      paragraphSpacing: 9,
      primaryColor: '#172033',
      accentColor: '#b08a45',
      headingFont: 'Garamond',
      heading1Size: 24,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'none',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: resolvedAgreementType.toUpperCase(),
      footerText: 'CONFIDENTIAL • TEMPLATE DRAFT',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: true
    }
  };
}

export interface TemplateGalleryPreferences {
  favorites: string[];
  recents: string[];
}

export const TEMPLATE_GALLERY_STORAGE_KEY = 'ai-pdf-studio.template-gallery.v1';

export function loadTemplateGalleryPreferences(storage: Pick<Storage, 'getItem'>): TemplateGalleryPreferences {
  try {
    const raw = storage.getItem(TEMPLATE_GALLERY_STORAGE_KEY);
    if (!raw) return { favorites: [], recents: [] };
    const parsed = JSON.parse(raw) as Partial<TemplateGalleryPreferences>;
    const validIds = new Set(DOCUMENT_TEMPLATE_CATALOG.map(template => template.id));
    const uniqueValid = (values: unknown, limit = 100) => Array.isArray(values)
      ? [...new Set(values.filter((value): value is string => typeof value === 'string' && validIds.has(value)))].slice(0, limit)
      : [];
    return { favorites: uniqueValid(parsed.favorites), recents: uniqueValid(parsed.recents, 12) };
  } catch {
    return { favorites: [], recents: [] };
  }
}

export function saveTemplateGalleryPreferences(
  storage: Pick<Storage, 'setItem'>,
  preferences: TemplateGalleryPreferences
): boolean {
  try {
    const validIds = new Set(DOCUMENT_TEMPLATE_CATALOG.map(template => template.id));
    const normalize = (values: string[], limit: number) =>
      [...new Set(values.filter(id => validIds.has(id)))].slice(0, limit);
    storage.setItem(TEMPLATE_GALLERY_STORAGE_KEY, JSON.stringify({
      favorites: normalize(preferences.favorites, 100),
      recents: normalize(preferences.recents, 12)
    }));
    return true;
  } catch {
    return false;
  }
}

export function recordTemplateRecent(preferences: TemplateGalleryPreferences, templateId: string): TemplateGalleryPreferences {
  if (!getTemplateById(templateId)) return {
    favorites: [...preferences.favorites],
    recents: [...preferences.recents]
  };
  return {
    favorites: [...preferences.favorites],
    recents: [templateId, ...preferences.recents.filter(id => id !== templateId)].slice(0, 12)
  };
}
