export const useDuplicateProtection = () => {
  const preventDuplicateRegistration = async (userData: any) => {
    try {
      // ✅ Check all duplicate scenarios
      await duplicatePreventionService.checkDuplicateUser(
        userData.email,
        userData.phone,
        userData.deviceId
      );
      
      // ✅ Generate fingerprint
      const fingerprint = await duplicatePreventionService.generateUserFingerprint(
        navigator.userAgent,
        userData.ip,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      
      if (fingerprint.isDuplicate) {
        throw new Error('Account already exists from this device');
      }
      
      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: error.message };
    }
  };
  
  return { preventDuplicateRegistration };
};