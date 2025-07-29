async preventDuplicatePayment(userId: string, amount: number, reference: string) {
  const existingPayment = await supabase
    .from('payments')
    .select('id, status')
    .eq('user_id', userId)      // ✅ Same user
    .eq('amount', amount)       // ✅ Same amount
    .eq('reference', reference) // ✅ Same reference
    .gte('created_at', new Date(Date.now() - 300000).toISOString()) // ✅ Time window
}