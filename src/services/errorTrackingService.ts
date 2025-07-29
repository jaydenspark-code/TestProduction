class ErrorTrackingService {
  private errors: ErrorLog[] = [];
  
  logError(error: Error, context: string, userId?: string): void {
    const errorLog = {
      id: crypto.randomUUID(),
      message: error.message,
      stack: error.stack,
      context,
      userId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errors.push(errorLog);
    this.sendToSupabase(errorLog);
  }
  
  private async sendToSupabase(errorLog: ErrorLog): Promise<void> {
    // ... existing code ...
    await supabase.from('error_logs').insert(errorLog);
    // ... existing code ...
  }
}