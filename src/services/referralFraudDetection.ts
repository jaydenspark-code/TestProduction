async detectFraudulentReferral(referrerId: string, refereeId: string) {
  const fraudChecks = await Promise.all([
    this.checkSelfReferral(referrerId, refereeId),     // ✅ Self-referrals
    this.checkIPSimilarity(referrerId, refereeId),     // ✅ Same IP abuse
    this.checkDeviceSimilarity(referrerId, refereeId), // ✅ Same device abuse
    this.checkRapidSignups(referrerId)                 // ✅ Bot behavior
  ]);
}