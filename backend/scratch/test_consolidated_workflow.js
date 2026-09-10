// test_consolidated_workflow.js
// Complete End-to-End Test for HazardShield Consolidated Architecture

const API_BASE = 'http://localhost:5000/api';

async function testSuite() {
  console.log('================================================================');
  console.log('🚀 HAZARDSHIELD CONSOLIDATED BACKEND END-TO-END TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // Helper request
  async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data, headers: res.headers };
  }

  // 1. Health check
  console.log('--- Step 1: Health Check ---');
  const health = await api('/health');
  assert(health.status === 200 && health.data?.data?.status === 'healthy', 'Health check is operational');

  // 2. Authentication & Dual-Role Logins
  console.log('\n--- Step 2: Dual-Role Authentication ---');
  // Citizen login
  const citizenLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'citizen@hazardshield.com',
      password: 'citizen123',
      loginType: 'community',
    })
  });
  assert(citizenLogin.status === 200 && citizenLogin.data?.data?.user?.role === 'community', 'Citizen login successful (role: community)');
  const citizenToken = citizenLogin.data?.data?.token;

  // Municipal login
  const municipalLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'municipal@hazardshield.com',
      password: 'muni123',
      loginType: 'authority',
    })
  });
  assert(municipalLogin.status === 200 && municipalLogin.data?.data?.user?.authorityLevel === 'Municipal', 'Municipal authority login successful');
  const municipalToken = municipalLogin.data?.data?.token;

  // DistrictAdmin login
  const districtLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'district@hazardshield.com',
      password: 'district123',
      loginType: 'authority',
    })
  });
  assert(districtLogin.status === 200 && districtLogin.data?.data?.user?.authorityLevel === 'DistrictAdmin', 'DistrictAdmin login successful');
  const districtToken = districtLogin.data?.data?.token;

  // StateDMA login
  const stateLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'state@hazardshield.com',
      password: 'state123',
      loginType: 'authority',
    })
  });
  assert(stateLogin.status === 200 && stateLogin.data?.data?.user?.authorityLevel === 'StateDMA', 'StateDMA login successful');
  const stateToken = stateLogin.data?.data?.token;

  // MHA login
  const mhaLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@hazardshield.com',
      password: 'admin123',
      loginType: 'authority',
    })
  });
  assert(mhaLogin.status === 200 && mhaLogin.data?.data?.user?.authorityLevel === 'MHA', 'MHA National Admin login successful');
  const mhaToken = mhaLogin.data?.data?.token;

  // 3. Community-Side APIs
  console.log('\n--- Step 3: Community-Side APIs ---');
  const commDash = await api('/community/dashboard', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(commDash.status === 200 && commDash.data?.data?.assignedZone !== null, 'Community dashboard returns assigned zone & live risk');

  const commRisk = await api('/community/risk-status', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(commRisk.status === 200 && typeof commRisk.data?.data?.advisory === 'string', 'Community risk-status returns localized advisory');

  // Community user tries to access authority dashboard -> should be 403 Forbidden
  const commDenied = await api('/authority/dashboard', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(commDenied.status === 403, 'Community user blocked from Authority dashboard (403 Forbidden)');

  // 4. Citizen Reports Hazard
  console.log('\n--- Step 4: Citizen Submits Hazard Report ---');
  const sampleZoneId = commDash.data?.data?.zone?._id || commDash.data?.data?.assignedZone;
  const newReport = await api('/community/report-hazard', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      zoneId: sampleZoneId,
      title: 'Embankment Overflow Threat',
      description: 'Yamuna water breached embankment near sector 4 drain; severe local flooding observed.',
      hazardType: 'flood',
      severity: 'high',
      location: { latitude: 28.615, longitude: 77.265 }
    })
  });
  assert(newReport.status === 201 && newReport.data?.data?.report?.status === 'pending_review', 'Hazard report created with pending_review status');
  const reportId = newReport.data?.data?.report?._id;

  // 5. Authority Review & Role-Gated Verification
  console.log('\n--- Step 5: Authority Hazard Review & Verification ---');
  // Municipal tries to verify report -> should be 403 Forbidden (requires DistrictAdmin+)
  const municipalVerifyAttempt = await api(`/authority/hazard-reports/${reportId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${municipalToken}` },
    body: JSON.stringify({ status: 'verified', notes: 'Municipal attempting verification' })
  });
  assert(municipalVerifyAttempt.status === 403, 'Municipal user blocked from verifying report (Requires DistrictAdmin+)');

  // DistrictAdmin verifies report -> should be 200 OK
  const districtVerify = await api(`/authority/hazard-reports/${reportId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${districtToken}` },
    body: JSON.stringify({ status: 'verified', notes: 'Inspected on-site by DDMA team, verified imminent embankment overflow' })
  });
  assert(districtVerify.status === 200 && districtVerify.data?.data?.report?.status === 'verified', 'DistrictAdmin successfully verified citizen hazard report');

  // 6. Risk Engine Microservice Scoring
  console.log('\n--- Step 6: Risk Engine Microservice Zone Scoring ---');
  const scoreResult = await api(`/authority/zones/${sampleZoneId}/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${districtToken}` },
    body: JSON.stringify({
      rainfallMm: 220.0,
      targetEvacHours: 4.0
    })
  });
  assert(
    scoreResult.status === 200 &&
    scoreResult.data?.data?.scoreResult?.drs_score !== undefined &&
    scoreResult.data?.data?.scoreResult?.ecc_capacity !== undefined &&
    scoreResult.data?.data?.scoreResult?.classification === 'red',
    'Zone re-scored via Risk Engine: DRS, ECC, and Red classification returned'
  );
  console.log(`   Scored DRS: ${scoreResult.data?.data?.scoreResult?.drs_score}, ECC: ${scoreResult.data?.data?.scoreResult?.ecc_capacity}, Limiting Factor: ${scoreResult.data?.data?.scoreResult?.limiting_factor}`);

  // 7. Relocation Plan Approval Role-Gating
  console.log('\n--- Step 7: Relocation Plan State Approval Workflow ---');
  // Fetch relocation plans
  const relPlansRes = await api('/relocation-priority', {
    headers: { Authorization: `Bearer ${districtToken}` }
  });
  const planList = Array.isArray(relPlansRes.data?.data) ? relPlansRes.data?.data : (relPlansRes.data?.data?.plans || []);
  const firstPlan = planList[0];
  assert(firstPlan !== undefined, 'Found relocation plan in queue');

  const planId = firstPlan?._id;

  // DistrictAdmin attempts to approve relocation -> should be 403 Forbidden (requires StateDMA+)
  const districtRelocAttempt = await api(`/authority/relocation/${planId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${districtToken}` },
    body: JSON.stringify({ approvalNotes: 'District approval attempt' })
  });
  assert(districtRelocAttempt.status === 403, 'DistrictAdmin blocked from approving relocation plan (Requires StateDMA/MHA)');

  // StateDMA approves relocation -> should be 200 OK
  const stateRelocApprove = await api(`/authority/relocation/${planId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${stateToken}` },
    body: JSON.stringify({
      status: 'approved',
      shelterId: 'Dwarka Relocation Transit Complex'
    })
  });
  assert(stateRelocApprove.status === 200 && stateRelocApprove.data?.data?.plan?.status === 'approved', 'StateDMA successfully approved relocation plan');

  // 8. Emergency Alert Dispatch
  console.log('\n--- Step 8: Multi-Channel Emergency Alert Dispatch ---');
  const alertDispatch = await api('/authority/alerts/dispatch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${districtToken}` },
    body: JSON.stringify({
      zoneId: sampleZoneId,
      title: 'EVACUATION NOTICE: Rising Water Levels',
      message: 'Immediate evacuation advised for low-lying sectors near Yamuna Bank. Transit buses deployed.',
      severity: 'critical',
      channels: ['sms', 'email', 'in_app']
    })
  });
  assert(
    alertDispatch.status === 200 &&
    alertDispatch.data?.data?.alert?.title !== undefined &&
    alertDispatch.data?.data?.recipientsCount > 0,
    'Emergency alert dispatched to SMS, Email, and In-App channels'
  );

  // 9. Community Receives Alert
  console.log('\n--- Step 9: Citizen Alert Ingestion ---');
  const citizenAlerts = await api('/community/alerts', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(
    citizenAlerts.status === 200 &&
    citizenAlerts.data?.data?.alerts?.length > 0 &&
    citizenAlerts.data?.data?.alerts[0]?.title?.includes('EVACUATION NOTICE'),
    'Citizen successfully receives the dispatched emergency alert in /api/community/alerts'
  );

  // 10. Authority Dossier Export
  console.log('\n--- Step 10: DDMA Authority Dossier Export ---');
  const jsonExport = await api('/authority/reports/export?format=json', {
    headers: { Authorization: `Bearer ${mhaToken}` }
  });
  assert(jsonExport.status === 200 && jsonExport.data?.data?.zones?.length > 0, 'Authority JSON dossier exported with high-risk zones');

  const pdfExport = await api('/authority/reports/export?format=pdf', {
    headers: { Authorization: `Bearer ${mhaToken}` }
  });
  assert(pdfExport.status === 200, 'Authority DDMA PDF dossier generated and streamed');

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testSuite().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
