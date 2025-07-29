async checkDuplicateUser(email: string, phone?: string, deviceId?: string) {
  const duplicateChecks = await Promise.all([
    this.checkEmailDuplicate(email),        // ✅ Same email
    phone ? this.checkPhoneDuplicate(phone) : null,  // ✅ Same phone
  ]);
}