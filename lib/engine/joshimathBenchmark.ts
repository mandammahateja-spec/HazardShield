/**
 * Historical Precedent Comparison Model: 2023 Joshimath Land Subsidence
 * Backtesting HazardShield's DRS + OCI + Evacuation Flow logic against real-world timeline.
 * Note: Illustrative Historical Backtesting Model.
 */

export interface TimelineMilestone {
  date: string;
  stageTitle: string;
  traditionalMethod: {
    action: string;
    alertStatus: 'normal' | 'low' | 'medium' | 'critical';
    delayNotice: string;
  };
  hazardShieldSystem: {
    drsScore: number;
    ociValue: number;
    action: string;
    alertStatus: 'normal' | 'low' | 'medium' | 'critical';
    bottleneckFlagged?: string;
  };
  leadTimeGainedDays: number;
}

export interface JoshimathCaseStudyData {
  title: string;
  subtitle: string;
  eventSummary: string;
  location: string;
  totalPopulationAffected: number;
  structuresDamaged: number;
  benchmarkMetrics: {
    metric: string;
    traditional: string;
    hazardShield: string;
    delta: string;
  }[];
  timeline: TimelineMilestone[];
  keyTakeaways: string[];
}

export const JOSHIMATH_CASE_STUDY: JoshimathCaseStudyData = {
  title: '2023 Joshimath Subsidence Backtest',
  subtitle: 'Comparative Analysis: Proactive AI Geospatial Modeling vs. Traditional Manual Response',
  eventSummary:
    'In January 2023, the Himalayan town of Joshimath (Uttarakhand) suffered widespread land subsidence, fracturing over 860 structures and forcing panicked evacuation. Traditional administrative response was reactive, taking place only after visible fissures appeared.',
  location: 'Joshimath, Chamoli District, Uttarakhand',
  totalPopulationAffected: 24500,
  structuresDamaged: 868,
  benchmarkMetrics: [
    {
      metric: 'Early Warning Lead Time',
      traditional: 'Jan 5, 2023 (After cracks appeared)',
      hazardShield: 'Nov 18, 2022 (42 Days Earlier)',
      delta: '+42 Days Preemptive Notice',
    },
    {
      metric: 'Overcapacity Index (OCI)',
      traditional: 'Not Calculated (No standard metric)',
      hazardShield: 'OCI: 1.38 (Severe Overcapacity)',
      delta: 'Identified Sewage/Load Squeeze',
    },
    {
      metric: 'Evacuation Route Analysis',
      traditional: 'Single NH-7 chokepoint jammed for 36h',
      hazardShield: 'Ford-Fulkerson flagged bridge bottleneck',
      delta: 'Pre-routed to Pipalkoti bypass',
    },
    {
      metric: 'Resettlement Site Selection',
      traditional: 'Ad-hoc temporary hotel requisition',
      hazardShield: 'TOPSIS ranked 3 safe basalt terraces',
      delta: 'Instant Multi-Criteria Sites',
    },
  ],
  timeline: [
    {
      date: '15 Oct 2022',
      stageTitle: 'Initial Subsidence & Subsurface Saturation',
      traditionalMethod: {
        action: 'Routine local complaints noted in ward logs; no civil engineering dispatch.',
        alertStatus: 'normal',
        delayNotice: 'Zero proactive intervention; deemed localized soil settlement.',
      },
      hazardShieldSystem: {
        drsScore: 54,
        ociValue: 1.28,
        action: 'OCI engine flags 28% infrastructure overcapacity due to unlined drainage discharge on moraine slope.',
        alertStatus: 'medium',
      },
      leadTimeGainedDays: 0,
    },
    {
      date: '18 Nov 2022',
      stageTitle: 'Dynamic Risk Score Threshold Breach',
      traditionalMethod: {
        action: 'District administration conducts standard bi-monthly disaster preparedness review. No evacuation warning issued.',
        alertStatus: 'low',
        delayNotice: 'Traditional static hazard maps showed static seismic Zone V without real-time saturation data.',
      },
      hazardShieldSystem: {
        drsScore: 84,
        ociValue: 1.38,
        action: 'Rainfall accumulation (R_cum = 78mm) exceeds terrain threshold (R_thresh = 55mm). DRS shifts to CRITICAL RED (84). Automated DDMA alert dispatched.',
        alertStatus: 'critical',
        bottleneckFlagged: 'Helang-Marwari bypass chokepoint (Capacity: 850 people/hr)',
      },
      leadTimeGainedDays: 48,
    },
    {
      date: '24 Dec 2022',
      stageTitle: 'Macro Fissures Emerge Across 9 Wards',
      traditionalMethod: {
        action: 'Local residents stage sit-in protests as wide fissures split homes in Sunil and Manohar Bagh wards.',
        alertStatus: 'medium',
        delayNotice: 'Administrative assessment teams arrive; formal survey initiates 5 weeks late.',
      },
      hazardShieldSystem: {
        drsScore: 92,
        ociValue: 1.45,
        action: 'TOPSIS Resettlement engine auto-recommends Pipalkoti Shelf (Score: 0.89) and Dhak Village Plateau (Score: 0.76) for phased transfer.',
        alertStatus: 'critical',
      },
      leadTimeGainedDays: 14,
    },
    {
      date: '05 Jan 2023',
      stageTitle: 'Aquifer Rupture & Panicked Mass Evacuation',
      traditionalMethod: {
        action: 'Sudden mud-slurry aquifer burst at JP Colony. Emergency declared. 4,000+ residents evacuated in winter cold under severe road gridlock.',
        alertStatus: 'critical',
        delayNotice: 'Reactive emergency response under crisis conditions.',
      },
      hazardShieldSystem: {
        drsScore: 98,
        ociValue: 1.52,
        action: 'Under HazardShield protocol, 80% of vulnerable families would have completed orderly phased relocation 3 weeks prior.',
        alertStatus: 'critical',
      },
      leadTimeGainedDays: 0,
    },
  ],
  keyTakeaways: [
    'Static portals (Bhuvan, BHUKOSH) only display historical geological boundaries, failing to detect live saturation surges.',
    'HazardShield’s DRS formula dynamically translates rainfall and pore pressure spikes into actionable probability scores.',
    'The OCI index uncovers hidden civil vulnerabilities (water infiltration, building over-density) before structural failure.',
    'Max-flow network routing prevents tragic stampedes and vehicular gridlocks on single-lane mountain passes.',
  ],
};
