async findUniqueMatches(userId: string, excludeMatched: boolean = true) {
  if (excludeMatched) {
    const previousMatches = await supabase
      .from('user_matches')
      .select('matched_user_id')
      .eq('user_id', userId);
      
    const matchedIds = previousMatches.data?.map(m => m.matched_user_id) || [];
    potentialMatches = potentialMatches.filter(m => !matchedIds.includes(m.id)); // ✅ No duplicate matches
  }
}