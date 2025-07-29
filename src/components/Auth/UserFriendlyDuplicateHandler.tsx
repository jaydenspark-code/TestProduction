export const UserFriendlyDuplicateHandler = () => {
  const handleDuplicateError = (error: string, userData: any) => {
    switch (error) {
      case 'email_exists':
        return {
          title: "Welcome back! 👋",
          message: "Looks like you already have an account with us.",
          actions: [
            { label: "Sign In Instead", action: () => redirectToLogin(userData.email) },
            { label: "Forgot Password?", action: () => resetPassword(userData.email) }
          ]
        };
        
      case 'device_duplicate':
        return {
          title: "Multiple Accounts Detected 🔍",
          message: "We found another account from this device. Want to switch accounts?",
          actions: [
            { label: "Switch Account", action: () => showAccountSwitcher() },
            { label: "Contact Support", action: () => openSupportChat() }
          ]
        };
        
      case 'referral_fraud':
        return {
          title: "Referral Issue 🤔",
          message: "This referral couldn't be processed. Our team will review it within 24 hours.",
          actions: [
            { label: "Continue Without Referral", action: () => proceedWithoutReferral() },
            { label: "Contact Support", action: () => openSupportChat() }
          ]
        };
    }
  };
};
