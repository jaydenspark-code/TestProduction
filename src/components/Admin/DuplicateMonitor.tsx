const channel = supabase
  .channel('duplicate-alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'fraud_alerts'  // ✅ Real-time duplicate alerts
  }, (payload) => {
    // ✅ Instant notification to admin
  })
