import { DocumentModel, BrandProfile, Section, SignatureParty } from '../types/document';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';

export const SAMPLE_BRAND_PROFILES: BrandProfile[] = [
  {
    id: 'brand_syntient',
    name: 'Syntient Records',
    companyName: 'Syntient Records LLC',
    primaryColor: '#0f172a',
    secondaryColor: '#2563eb',
    fontFamily: 'Times New Roman',
    headerNote: 'SYNTIENT RECORDS | ENTERTAINMENT & IP LEGAL ARCHITECTURE',
    footerDisclaimer: 'CONFIDENTIAL & PROPRIETARY — ALL RIGHTS RESERVED'
  },
  {
    id: 'brand_apex',
    name: 'Corporate Executive (Apex)',
    companyName: 'Apex Global Ventures Inc.',
    primaryColor: '#1e293b',
    secondaryColor: '#059669',
    fontFamily: 'Garamond',
    headerNote: 'APEX GLOBAL VENTURES | STRATEGIC CONTRACT ARCHIVE',
    footerDisclaimer: 'STRICTLY PRIVATE & CONFIDENTIAL'
  },
  {
    id: 'brand_legal',
    name: 'Traditional Legal Counsel',
    companyName: 'Vanguard Legal Attorneys & Solicitors',
    primaryColor: '#000000',
    secondaryColor: '#475569',
    fontFamily: 'Times New Roman',
    headerNote: 'LEGAL DRAFTING & STATUTORY REGISTRATION',
    footerDisclaimer: 'ATTORNEY-CLIENT PRIVILEGED WORK PRODUCT'
  },
  {
    id: 'brand_modern',
    name: 'Modern Minimalist',
    companyName: 'Nova Hypermedia Group',
    primaryColor: '#18181b',
    secondaryColor: '#6366f1',
    fontFamily: 'Inter',
    headerNote: 'NOVA STUDIOS | DOCUMENTATION REPOSITORY',
    footerDisclaimer: 'REGISTERED UNDER INTERNATIONAL COPYRIGHT'
  }
];

export function getInitialDocument(): DocumentModel {
  const { updatedDoc } = buildDocumentFromPrompt(
    'Syntient Records music collaboration and master recording ownership agreement'
  );
  return { ...updatedDoc, agreementType: 'Music Agreement' };
}

// 1. Exclusive Beat License & Producer Royalty Agreement
export function getBeatLicenseDocument(): DocumentModel {
  return {
    id: `doc_beat_license_${Date.now()}`,
    title: 'Exclusive Instrumental Beat License & Producer Agreement',
    type: 'music_agreement',
    version: 1,
    author: 'Syntient Music Legal Group',
    brandProfileId: 'brand_syntient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Exclusive Beat License & Producer Agreement template.',
    sections: [
      {
        id: 'sec_bl_1',
        sectionNumber: '1.0',
        title: 'ENGAGEMENT, MASTER INSTRUMENTAL & DELIVERABLES',
        content: 'This Exclusive Beat License & Producer Agreement ("Agreement") is entered into as of the Effective Date between the Producer and the Recording Artist for the exclusive acquisition and exploitation of the instrumental musical composition and sound recording described herein.',
        clauses: [
          {
            id: 'cl_bl_1_1',
            clauseNumber: '1.1',
            heading: 'Identification of Beat',
            content: 'Producer hereby licenses exclusively to Artist the instrumental musical work tentatively entitled "[Beat Title / Project Code]" (BPM: 140, Key: C Minor, Track ID: SYN-BEAT-2026).',
            orderIndex: 1
          },
          {
            id: 'cl_bl_1_2',
            clauseNumber: '1.2',
            heading: 'Delivery Format & Audio Stems',
            content: 'Producer warrants immediate electronic delivery to Artist of uncompressed 24-bit / 48kHz WAV audio files, including individual separated multitrack stem files (Drums, Bass, Synths, FX, Melodic Leads) free from audio clipping or limiting.',
            orderIndex: 2
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_bl_2',
        sectionNumber: '2.0',
        title: 'GRANT OF EXCLUSIVE RIGHTS & TERRITORY',
        content: 'Producer hereby grants to Artist the sole and unencumbered worldwide exclusive right to record vocal performances over the Beat and commercialize the resulting Master Recording across all channels.',
        clauses: [
          {
            id: 'cl_bl_2_1',
            clauseNumber: '2.1',
            heading: 'Exclusivity & De-Listing Commitment',
            content: 'Upon receipt of the License Fee, Producer covenants to permanently remove the Beat from all digital marketplaces, beat stores, and public streaming channels, and warrants no prior exclusive license has been granted.',
            orderIndex: 1
          },
          {
            id: 'cl_bl_2_2',
            clauseNumber: '2.2',
            heading: 'Worldwide Exploitation Channels',
            content: 'The rights granted herein encompass unlimited commercial audio streams (Spotify, Apple Music, Tidal), physical reproduction, music videos, broadcast radio, and digital monetization without unit caps.',
            orderIndex: 2
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_bl_3',
        sectionNumber: '3.0',
        title: 'COMPENSATION, ADVANCE FEE & PRODUCER ROYALTY POINTS',
        content: 'In consideration of the exclusive rights granted herein, Artist agrees to pay Producer the agreed license fee and recurring master royalty points as detailed in Schedule 3.1 below:',
        clauses: [
          {
            id: 'cl_bl_3_1',
            clauseNumber: '3.1',
            heading: 'Non-Refundable Upfront Fee',
            content: 'Artist shall tender to Producer a one-time non-refundable buyout advance fee of $2,500.00 USD upon execution of this Agreement.',
            orderIndex: 1
          },
          {
            id: 'cl_bl_3_2',
            clauseNumber: '3.2',
            heading: 'Master Streaming Royalty Points',
            content: 'In addition to the upfront advance, Producer shall receive four (4) Producer Points (equal to 4.0% of retail receipts or 20.0% of net artist streaming revenue) calculated on a quarterly accounting basis.',
            orderIndex: 2
          }
        ],
        tables: [
          {
            id: 'tbl_bl_splits',
            title: 'Schedule 3.1: Beat Exploitation & Royalty Revenue Splits',
            caption: 'Defines master point allocations and PRO writer share registrations',
            headers: [
              { id: 'h1', content: 'Participant / Contributor' },
              { id: 'h2', content: 'Role' },
              { id: 'h3', content: 'Master Royalty Share' },
              { id: 'h4', content: 'Publishing / Writer Share' }
            ],
            rows: [
              [
                { id: 'c1', content: 'Marcus Vance (Producer)' },
                { id: 'c2', content: 'Beatmaker / Music Producer' },
                { id: 'c3', content: '20.0% Net Receipts' },
                { id: 'c4', content: '50.0% (Music / Melody)' }
              ],
              [
                { id: 'c5', content: 'Featured Recording Artist' },
                { id: 'c6', content: 'Vocalist / Lyricist' },
                { id: 'c7', content: '80.0% Net Receipts' },
                { id: 'c8', content: '50.0% (Lyrics / Topline)' }
              ]
            ]
          }
        ],
        orderIndex: 3
      },
      {
        id: 'sec_bl_4',
        sectionNumber: '4.0',
        title: 'PUBLISHING SPLITS & PERFORMANCE RIGHTS REGISTRATION',
        content: 'Underlying musical composition publishing shall be held and administered according to statutory PRO guidelines:',
        clauses: [
          {
            id: 'cl_bl_4_1',
            clauseNumber: '4.1',
            heading: '50/50 Publishing Split',
            content: 'The musical composition (music and lyrics) embodied in the finished work shall be owned 50.0% by Producer (Music) and 50.0% by Artist (Lyrics/Vocal Melody).',
            orderIndex: 1
          },
          {
            id: 'cl_bl_4_2',
            clauseNumber: '4.2',
            heading: 'PRO Work Registration',
            content: 'Both Parties agree to promptly register the completed title with their respective Performance Rights Organizations (ASCAP, BMI, SESAC, PRS) listing the agreed IPI numbers and split percentages.',
            orderIndex: 2
          }
        ],
        orderIndex: 4
      },
      {
        id: 'sec_bl_5',
        sectionNumber: '5.0',
        title: 'MANDATORY PRODUCER CREDITS & ATTRIBUTION',
        content: 'Artist covenants to afford Producer credit on all commercial releases in the following exact format:',
        clauses: [
          {
            id: 'cl_bl_5_1',
            clauseNumber: '5.1',
            heading: 'Digital DSP & Liner Credit',
            content: 'All releases on Spotify, Apple Music, YouTube, and physical liner notes shall read: "Produced by Marcus Vance (Synith)" or "Prod. by Synith".',
            orderIndex: 1
          },
          {
            id: 'cl_bl_5_2',
            clauseNumber: '5.2',
            heading: 'Social Media & Promotional Tagging',
            content: 'Artist shall include Producer handle and production credit tags in primary metadata and social media video captions.',
            orderIndex: 2
          }
        ],
        orderIndex: 5
      },
      {
        id: 'sec_bl_6',
        sectionNumber: '6.0',
        title: 'SAMPLE CLEARANCE & ORIGINALITY WARRANTIES',
        content: 'Producer warrants and represents that the Beat is an original musical creation:',
        clauses: [
          {
            id: 'cl_bl_6_1',
            clauseNumber: '6.1',
            heading: 'Zero Uncleared Third-Party Samples',
            content: 'Producer warrants that the Beat contains no uncleared samples, unauthorized audio interpolations, or copyrighted musical elements requiring third-party licensing.',
            orderIndex: 1
          },
          {
            id: 'cl_bl_6_2',
            clauseNumber: '6.2',
            heading: 'Indemnification Defense',
            content: 'Producer agrees to indemnify and hold harmless Artist and distributors from any copyright claims, liabilities, or legal defense expenses arising from a breach of this warranty.',
            orderIndex: 2
          }
        ],
        orderIndex: 6
      }
    ],
    signatures: {
      id: 'sig_bl',
      title: 'EXECUTION OF BEAT LICENSE AGREEMENT',
      parties: [
        {
          id: 'p_bl_1',
          role: 'PRODUCER',
          name: 'Marcus Vance',
          title: 'Managing Producer',
          company: 'Syntient Sound Productions LLC',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Marcus Vance (Producer)'
        },
        {
          id: 'p_bl_2',
          role: 'RECORDING ARTIST',
          name: 'Elena Rostova',
          title: 'Recording Artist',
          company: 'Rostova Entertainment Group',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Elena Rostova (Artist)'
        }
      ]
    },
    styles: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      headingFont: 'Times New Roman',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'EXCLUSIVE BEAT LICENSE & PRODUCTION AGREEMENT',
      footerText: 'SYNTIENT RECORDS LLC • CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 2. Featured Vocalist Performance & Clearance Agreement
export function getFeaturedArtistDocument(): DocumentModel {
  return {
    id: `doc_featured_artist_${Date.now()}`,
    title: 'Featured Vocalist Performance & Release Clearance Agreement',
    type: 'music_agreement',
    version: 1,
    author: 'Syntient Entertainment Counsel',
    brandProfileId: 'brand_syntient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Featured Vocalist Performance & Release Clearance Agreement.',
    sections: [
      {
        id: 'sec_fa_1',
        sectionNumber: '1.0',
        title: 'ENGAGEMENT OF FEATURED ARTIST & STUDIO DELIVERABLES',
        content: 'Primary Artist and Featured Artist agree to the terms governing the guest vocal performance and commercial release of the collaborative sound recording.',
        clauses: [
          {
            id: 'cl_fa_1_1',
            clauseNumber: '1.1',
            heading: 'Vocal Performance Delivery',
            content: 'Featured Artist agrees to deliver fully tracked lead vocals, harmonies, ad-libs, and doubles for the musical track entitled "[Single Title]".',
            orderIndex: 1
          },
          {
            id: 'cl_fa_1_2',
            clauseNumber: '1.2',
            heading: 'Technical Delivery Standards',
            content: 'Vocals shall be rendered dry (without non-creative reverb/delay) as 24-bit 96kHz broadcast WAV files with zero digital distortion.',
            orderIndex: 2
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_fa_2',
        sectionNumber: '2.0',
        title: 'NAME, IMAGE, LIKENESS & PROMOTIONAL CLEARANCE',
        content: 'Featured Artist grants comprehensive promotional clearance for single rollout:',
        clauses: [
          {
            id: 'cl_fa_2_1',
            clauseNumber: '2.1',
            heading: 'Approved Billing Credit',
            content: 'Featured Artist shall receive front-cover and digital DSP billing format: "[Primary Artist] feat. [Featured Artist]" on all streaming channels.',
            orderIndex: 1
          },
          {
            id: 'cl_fa_2_2',
            clauseNumber: '2.2',
            heading: 'Name & Likeness Grant',
            content: 'Featured Artist grants the non-exclusive right to utilize their professional name, approved press photos, and biographical materials solely in connection with the marketing of the single.',
            orderIndex: 2
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_fa_3',
        sectionNumber: '3.0',
        title: 'ROYALTY PARTICIPATION, FEE & ACCOUNTING',
        content: 'Financial compensation for the featured vocal contribution shall be structured as follows:',
        clauses: [
          {
            id: 'cl_fa_3_1',
            clauseNumber: '3.1',
            heading: 'Featured Fee Advance',
            content: 'Primary Artist shall pay Featured Artist a flat fee of $3,500.00 USD upon delivery of final vocals.',
            orderIndex: 1
          },
          {
            id: 'cl_fa_3_2',
            clauseNumber: '3.2',
            heading: 'Master Streaming Share',
            content: 'Featured Artist shall receive thirty-five percent (35.0%) of all digital streaming and download Net Receipts derived from the Master Recording.',
            orderIndex: 2
          }
        ],
        orderIndex: 3
      },
      {
        id: 'sec_fa_4',
        sectionNumber: '4.0',
        title: 'EXCLUSIVE WINDOW & RELEASE RESTRICTIONS',
        content: 'To maximize commercial impact, Featured Artist agrees to customary release window covenants:',
        clauses: [
          {
            id: 'cl_fa_4_1',
            clauseNumber: '4.1',
            heading: 'Thirty-Day Release Blackout',
            content: 'Featured Artist agrees not to release any solo single or competing guest appearance within thirty (30) days prior to or following the official release date of the Single.',
            orderIndex: 1
          }
        ],
        orderIndex: 4
      }
    ],
    signatures: {
      id: 'sig_fa',
      title: 'SIGNATURES & EXECUTION',
      parties: [
        {
          id: 'p_fa_1',
          role: 'PRIMARY ARTIST / PRODUCER',
          name: 'Marcus Vance',
          title: 'Primary Producer & Artist',
          company: 'Syntient Records LLC',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Marcus Vance'
        },
        {
          id: 'p_fa_2',
          role: 'FEATURED GUEST VOCALIST',
          name: 'Elena Rostova',
          title: 'Recording Artist',
          company: 'Elena Rostova Solo Publishing',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Elena Rostova'
        }
      ]
    },
    styles: {
      fontFamily: 'Inter',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      headingFont: 'Inter',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'FEATURED ARTIST PERFORMANCE & CLEARANCE AGREEMENT',
      footerText: 'STRICTLY CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 3. Film/TV/Advertising Synchronization & Master Use License
export function getSyncLicenseDocument(): DocumentModel {
  return {
    id: `doc_sync_license_${Date.now()}`,
    title: 'Master Use & Synchronization Rights Licensing Agreement',
    type: 'music_agreement',
    version: 1,
    author: 'Vanguard Media & Entertainment Law',
    brandProfileId: 'brand_legal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Synchronization & Master Use Rights Licensing Agreement.',
    sections: [
      {
        id: 'sec_sync_1',
        sectionNumber: '1.0',
        title: 'IDENTIFICATION OF WORK & PERMITTED MOTION PICTURE',
        content: 'This Synchronization and Master Use License Agreement is entered into between Licensor (Syntient Records LLC) and Licensee (Apex Media Productions Inc.):',
        clauses: [
          {
            id: 'cl_sync_1_1',
            clauseNumber: '1.1',
            heading: 'Licensed Master & Composition',
            content: 'Song Title: "Neon Solitude", Performed by Marcus Vance feat. Elena Rostova, ISRC: US-SYN-26-00101, Duration: 3 minutes 42 seconds.',
            orderIndex: 1
          },
          {
            id: 'cl_sync_1_2',
            clauseNumber: '1.2',
            heading: 'Description of Production',
            content: 'Production: Feature Film tentatively entitled "Cybernetics Tomorrow", Director: James Cameron Productions, Release: Worldwide Theatrical & Streaming.',
            orderIndex: 2
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_sync_2',
        sectionNumber: '2.0',
        title: 'SCOPE OF USAGE, MEDIA & TERRITORY',
        content: 'Licensor grants to Licensee the non-exclusive synchronization and master use right under the following terms:',
        clauses: [
          {
            id: 'cl_sync_2_1',
            clauseNumber: '2.1',
            heading: 'Permitted Media',
            content: 'Worldwide in perpetuity across all media formats now known or hereafter devised, including Theatrical, SVOD (Netflix, Amazon, Apple TV), Cable TV, and Promotional Trailers.',
            orderIndex: 1
          },
          {
            id: 'cl_sync_2_2',
            clauseNumber: '2.2',
            heading: 'Scene Cue Placement',
            content: 'Up to one hundred and twenty seconds (120 sec) in background vocal placement during the pivotal climax sequence and end roller credits.',
            orderIndex: 2
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_sync_3',
        sectionNumber: '3.0',
        title: 'SYNCHRONIZATION & MASTER USE FEES',
        content: 'Licensee shall pay the agreed master and sync fees upon delivery of audio stems:',
        clauses: [
          {
            id: 'cl_sync_3_1',
            clauseNumber: '3.1',
            heading: 'MFN Status & Combined Fee',
            content: 'Licensee shall pay a total synchronization fee of $25,000.00 USD ($12,500.00 for Master Use and $12,500.00 for Composition Sync) on a Most Favored Nations (MFN) basis with all other featured music.',
            orderIndex: 1
          }
        ],
        orderIndex: 3
      },
      {
        id: 'sec_sync_4',
        sectionNumber: '4.0',
        title: 'CUE SHEET REPORTING & PRO FILING',
        content: 'Licensee covenants to deliver an official Music Cue Sheet to Licensor within thirty (30) days of theatrical lock, specifying title, timing, usage type, and writer PRO percentages.',
        clauses: [
          {
            id: 'cl_sync_4_1',
            clauseNumber: '4.1',
            heading: 'Cue Sheet Submission',
            content: 'Cue sheets shall be accurately submitted to ASCAP, BMI, and relevant international collection societies for secondary performance royalty distributions.',
            orderIndex: 1
          }
        ],
        orderIndex: 4
      }
    ],
    signatures: {
      id: 'sig_sync',
      title: 'LICENSOR & LICENSEE EXECUTION',
      parties: [
        {
          id: 'p_sync_1',
          role: 'LICENSOR (MASTER & PUBLISHING)',
          name: 'Marcus Vance',
          title: 'Head of Licensing',
          company: 'Syntient Records LLC',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Marcus Vance (Licensor)'
        },
        {
          id: 'p_sync_2',
          role: 'LICENSEE (PRODUCTION COMPANY)',
          name: 'Sarah Connor',
          title: 'VP of Music Supervision',
          company: 'Apex Media Productions Inc.',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Sarah Connor (Licensee)'
        }
      ]
    },
    styles: {
      fontFamily: 'Garamond',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#000000',
      accentColor: '#475569',
      headingFont: 'Garamond',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'SYNC MASTER & SYNCHRONIZATION RIGHTS AGREEMENT',
      footerText: 'VANGUARD LEGAL • STRICTLY CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 4. Record Label Single Release & Distribution 360 Agreement
export function getRecordLabel360Document(): DocumentModel {
  return {
    id: `doc_label_360_${Date.now()}`,
    title: 'Single Master Recording & 360 Digital Distribution Agreement',
    type: 'music_agreement',
    version: 1,
    author: 'Syntient Records Legal Directorate',
    brandProfileId: 'brand_syntient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Single Master 360 Digital Distribution Agreement.',
    sections: [
      {
        id: 'sec_rl_1',
        sectionNumber: '1.0',
        title: 'EXCLUSIVE RECORDING APPOINTMENT & TERM',
        content: 'Record Label engages Artist on an exclusive basis for the worldwide digital distribution and promotion of the Master Recording for an initial term of three (3) years from commercial release date.',
        clauses: [
          {
            id: 'cl_rl_1_1',
            clauseNumber: '1.1',
            heading: 'Territory',
            content: 'The territory shall be the Universe, encompassing all terrestrial and extraterrestrial communication channels.',
            orderIndex: 1
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_rl_2',
        sectionNumber: '2.0',
        title: 'ROYALTY RECOUPMENT & PARTICIPATION TIERS',
        content: 'Label shall recoup approved marketing and video expenditures from 70% of gross proceeds, transitioning to an ongoing 50/50 profit split once recouped.',
        clauses: [
          {
            id: 'cl_rl_2_1',
            clauseNumber: '2.1',
            heading: 'Marketing Advance Recoupment',
            content: 'Label shall advance an initial marketing budget of $15,000.00 USD dedicated to DSP playlist pitching, digital ad spend, and PR outreach.',
            orderIndex: 1
          }
        ],
        tables: [
          {
            id: 'tbl_rl_splits',
            title: 'Schedule 2.1: Revenue Participation Breakdown',
            caption: 'Defines label and artist allocations pre and post-recoupment',
            headers: [
              { id: 'rh1', content: 'Revenue Stream' },
              { id: 'rh2', content: 'Pre-Recoupment Split' },
              { id: 'rh3', content: 'Post-Recoupment Split' }
            ],
            rows: [
              [
                { id: 'rc1', content: 'Digital DSP Streaming (Spotify/Apple)' },
                { id: 'rc2', content: '70% Label / 30% Artist' },
                { id: 'rc3', content: '50% Label / 50% Artist' }
              ],
              [
                { id: 'rc4', content: 'Sync Licensing Placements' },
                { id: 'rc5', content: '50% Label / 50% Artist' },
                { id: 'rc6', content: '50% Label / 50% Artist' }
              ],
              [
                { id: 'rc7', content: 'Official Merchandise' },
                { id: 'rc8', content: '20% Label / 80% Artist' },
                { id: 'rc9', content: '15% Label / 85% Artist' }
              ]
            ]
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_rl_3',
        sectionNumber: '3.0',
        title: 'ACCOUNTING STATEMENTS & AUDIT COVENANTS',
        content: 'Label shall render quarterly statements within 45 days of each calendar quarter with automated ACH disbursements.',
        clauses: [
          {
            id: 'cl_rl_3_1',
            clauseNumber: '3.1',
            heading: 'Audit Rights',
            content: 'Artist may audit Label records once per calendar year upon thirty (30) days prior notice through a certified public accountant.',
            orderIndex: 1
          }
        ],
        orderIndex: 3
      }
    ],
    signatures: {
      id: 'sig_rl',
      title: 'EXECUTION OF RECORDING AGREEMENT',
      parties: [
        {
          id: 'p_rl_1',
          role: 'RECORD LABEL',
          name: 'David Sterling',
          title: 'President & A&R Director',
          company: 'Syntient Records LLC',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ David Sterling (President)'
        },
        {
          id: 'p_rl_2',
          role: 'RECORDING ARTIST',
          name: 'Marcus Vance',
          title: 'Recording Artist',
          company: 'Vance Audio Works',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Marcus Vance (Artist)'
        }
      ]
    },
    styles: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      headingFont: 'Times New Roman',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'RECORD LABEL 360 DIGITAL DISTRIBUTION AGREEMENT',
      footerText: 'SYNTIENT RECORDS • CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 5. Clean Minimalist Blank Document
export function getBlankDocument(): DocumentModel {
  return {
    id: `doc_blank_${Date.now()}`,
    title: 'Untitled Document',
    type: 'general',
    version: 1,
    author: 'Document Author',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Created fresh blank document canvas.',
    sections: [
      {
        id: `sec_initial_${Date.now()}`,
        sectionNumber: '1.0',
        title: 'SECTION TITLE',
        content: 'Type your agreement, memorandum, or document introduction here. Use the formatting ribbon above or the left outline to add sections and clauses.',
        clauses: [
          {
            id: `cl_init_1`,
            clauseNumber: '1.1',
            heading: 'Primary Provision',
            content: 'The Parties agree to the following terms and covenants set forth herein.',
            orderIndex: 1
          }
        ],
        orderIndex: 1
      }
    ],
    signatures: {
      id: `sig_blank`,
      title: 'SIGNATURES & EXECUTION',
      parties: [
        {
          id: 'p_blank_1',
          role: 'PARTY A',
          name: 'Authorized Signatory',
          title: 'Managing Officer',
          company: 'Entity Name',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Authorized Representative'
        },
        {
          id: 'p_blank_2',
          role: 'PARTY B',
          name: 'Counterparty Signatory',
          title: 'Authorized Agent',
          company: 'Counterparty LLC',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Counterparty'
        }
      ]
    },
    styles: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      headingFont: 'Times New Roman',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: '',
      footerText: 'CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 6. Enterprise SaaS Master Agreement
export function getSaaSDocument(): DocumentModel {
  return {
    id: `doc_saas_${Date.now()}`,
    title: 'Enterprise Software-as-a-Service (SaaS) Master Agreement',
    type: 'business_proposal',
    version: 1,
    author: 'Legal Engineering Directorate',
    brandProfileId: 'brand_apex',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Enterprise SaaS Master Agreement with SLAs and Data Security.',
    sections: [
      {
        id: 'sec_saas_1',
        sectionNumber: '1.0',
        title: 'DEFINITIONS & SUBSCRIPTION SERVICES',
        content: 'This Master Subscription Agreement governs Customer access to Provider cloud platform and associated APIs.',
        clauses: [
          {
            id: 'cl_saas_1_1',
            clauseNumber: '1.1',
            heading: 'Provision of Services',
            content: 'Provider shall make the SaaS Platform available pursuant to this Agreement and applicable Order Forms during each Subscription Term.',
            orderIndex: 1
          },
          {
            id: 'cl_saas_1_2',
            clauseNumber: '1.2',
            heading: 'Service Level Agreement (SLA)',
            content: 'Provider warrants ninety-nine and nine-tenths percent (99.9%) system availability each calendar month, excluding scheduled maintenance windows.',
            orderIndex: 2
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_saas_2',
        sectionNumber: '2.0',
        title: 'DATA PROTECTION, PRIVACY & SECURITY STANDARDS',
        content: 'Provider maintains rigorous administrative, physical, and technical safeguards complying with SOC 2 Type II and GDPR standards.',
        clauses: [
          {
            id: 'cl_saas_2_1',
            clauseNumber: '2.1',
            heading: 'Customer Data Ownership',
            content: 'Customer retains all right, title, and interest in and to all data uploaded or processed through the Subscription Services.',
            orderIndex: 1
          },
          {
            id: 'cl_saas_2_2',
            clauseNumber: '2.2',
            heading: 'Encryption Standards',
            content: 'Customer Data shall be encrypted in transit using TLS 1.3 and at rest using AES-256 bit encryption.',
            orderIndex: 2
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_saas_3',
        sectionNumber: '3.0',
        title: 'FEES, PAYMENT TERMS & AUDIT',
        content: 'Customer shall pay all fees specified in Order Forms within thirty (30) days of invoice date.',
        clauses: [
          {
            id: 'cl_saas_3_1',
            clauseNumber: '3.1',
            heading: 'Taxes & Currency',
            content: 'All fees are stated in USD and exclude applicable value-added, sales, or withholding taxes.',
            orderIndex: 1
          }
        ],
        orderIndex: 3
      },
      {
        id: 'sec_saas_4',
        sectionNumber: '4.0',
        title: 'LIMITATION OF LIABILITY & MUTUAL INDEMNITY',
        content: 'Except for willful misconduct or IP infringement, neither party liability shall exceed total fees paid in prior 12 months.',
        clauses: [
          {
            id: 'cl_saas_4_1',
            clauseNumber: '4.1',
            heading: 'Consequential Damages Exclusion',
            content: 'Neither party shall be liable for lost profits, loss of goodwill, or punitive damages.',
            orderIndex: 1
          }
        ],
        orderIndex: 4
      }
    ],
    signatures: {
      id: 'sig_saas',
      title: 'EXECUTION OF SAAS AGREEMENT',
      parties: [
        {
          id: 'p_saas_1',
          role: 'SAAS PROVIDER',
          name: 'Alexander Sterling',
          title: 'Chief Commercial Officer',
          company: 'Apex Cloud Systems Inc.',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Alexander Sterling'
        },
        {
          id: 'p_saas_2',
          role: 'ENTERPRISE CUSTOMER',
          name: 'Jennifer Wu',
          title: 'VP of Information Technology',
          company: 'Global Enterprises Corp',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Jennifer Wu'
        }
      ]
    },
    styles: {
      fontFamily: 'Inter',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#1e293b',
      accentColor: '#059669',
      headingFont: 'Inter',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'APEX ENTERPRISE SAAS MASTER SUBSCRIPTION AGREEMENT',
      footerText: 'STRICTLY CONFIDENTIAL',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}

// 7. Series A Investment Term Sheet
export function getTermSheetDocument(): DocumentModel {
  return {
    id: `doc_series_a_${Date.now()}`,
    title: 'Series A Preferred Stock Investment Term Sheet',
    type: 'financial_report',
    version: 1,
    author: 'Venture Capital Syndication Counsel',
    brandProfileId: 'brand_apex',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeSummary: 'Initialized Series A Preferred Stock Term Sheet with Liquidation Preference.',
    sections: [
      {
        id: 'sec_ts_1',
        sectionNumber: '1.0',
        title: 'INVESTMENT SUMMARY & FINANCING STRUCTURE',
        content: 'This Term Sheet summarizes the principal financing terms of the Series A Preferred Stock offering for Apex Technologies Inc.',
        clauses: [
          {
            id: 'cl_ts_1_1',
            clauseNumber: '1.1',
            heading: 'Financing Amount',
            content: 'Eight Million United States Dollars ($8,000,000.00 USD) in newly issued Series A Preferred Stock.',
            orderIndex: 1
          },
          {
            id: 'cl_ts_1_2',
            clauseNumber: '1.2',
            heading: 'Pre-Money Valuation',
            content: 'Pre-Money Valuation of Twenty-Four Million United States Dollars ($24,000,000.00 USD).',
            orderIndex: 2
          }
        ],
        tables: [
          {
            id: 'tbl_ts_cap',
            title: 'Schedule 1.1: Post-Closing Capitalization Table',
            caption: 'Fully diluted share ownership and option pool expansion',
            headers: [
              { id: 'th1', content: 'Securityholder Group' },
              { id: 'th2', content: 'Share Class' },
              { id: 'th3', content: 'Ownership %' }
            ],
            rows: [
              [
                { id: 'tc1', content: 'Founders & Core Team' },
                { id: 'tc2', content: 'Common Stock' },
                { id: 'tc3', content: '60.0%' }
              ],
              [
                { id: 'tc4', content: 'Series A Lead Investors' },
                { id: 'tc5', content: 'Series A Preferred' },
                { id: 'tc6', content: '25.0%' }
              ],
              [
                { id: 'tc7', content: 'Unallocated Option Pool' },
                { id: 'tc8', content: 'Common Options' },
                { id: 'tc9', content: '15.0%' }
              ]
            ]
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_ts_2',
        sectionNumber: '2.0',
        title: 'LIQUIDATION PREFERENCE & DIVIDENDS',
        content: 'Series A Preferred Stock shall have priority rights upon any Deemed Liquidation Event:',
        clauses: [
          {
            id: 'cl_ts_2_1',
            clauseNumber: '2.1',
            heading: '1x Non-Participating Preference',
            content: 'Series A Preferred carries a 1x non-participating liquidation preference, plus declared but unpaid dividends, before any distribution to Common Stock.',
            orderIndex: 1
          }
        ],
        orderIndex: 2
      },
      {
        id: 'sec_ts_3',
        sectionNumber: '3.0',
        title: 'GOVERNANCE, BOARD SEATS & PROTECTIVE PROVISIONS',
        content: 'The Board of Directors shall consist of five (5) members: two designated by Founders, one designated by Series A Lead, and two independent directors.',
        clauses: [
          {
            id: 'cl_ts_3_1',
            clauseNumber: '3.1',
            heading: 'Protective Veto Provisions',
            content: 'So long as 25% of Series A shares remain outstanding, investor majority consent shall be required for any merger, acquisition, dividend, or creation of senior securities.',
            orderIndex: 1
          }
        ],
        orderIndex: 3
      }
    ],
    signatures: {
      id: 'sig_ts',
      title: 'CONFIRMATION OF TERMS',
      parties: [
        {
          id: 'p_ts_1',
          role: 'SERIES A LEAD INVESTOR',
          name: 'Katherine Vance',
          title: 'Managing General Partner',
          company: 'Apex Horizon Ventures Fund IV',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Katherine Vance'
        },
        {
          id: 'p_ts_2',
          role: 'COMPANY FOUNDER & CEO',
          name: 'Marcus Vance',
          title: 'Chief Executive Officer',
          company: 'Apex Technologies Inc.',
          date: new Date().toLocaleDateString(),
          signaturePlaceholder: '/s/ Marcus Vance (CEO)'
        }
      ]
    },
    styles: {
      fontFamily: 'Garamond',
      fontSize: 11,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      primaryColor: '#1e293b',
      accentColor: '#059669',
      headingFont: 'Garamond',
      heading1Size: 18,
      heading2Size: 14,
      heading3Size: 12,
      headingCase: 'uppercase',
      alignment: 'left'
    },
    pageConfig: {
      pageSize: 'LETTER',
      orientation: 'portrait',
      margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
      headerText: 'SERIES A PREFERRED STOCK TERM SHEET — STRICTLY CONFIDENTIAL',
      footerText: 'APEX HORIZON VENTURES • LEGAL MEMORANDUM',
      showPageNumbers: true,
      pageNumberFormat: 'PAGE_X_OF_Y',
      firstPageDifferent: false
    }
  };
}
