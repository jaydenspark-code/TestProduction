export const TeamWorkspace = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [sharedCampaigns, setSharedCampaigns] = useState([]);
  const [liveChat, setLiveChat] = useState([]);
  
  useEffect(() => {
    // Real-time presence tracking
    const presenceChannel = supabase.channel('team-presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setActiveUsers(Object.values(newState).flat());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            user_name: user.fullName,
            online_at: new Date().toISOString(),
          });
        }
      });
      
    return () => supabase.removeChannel(presenceChannel);
  }, []);
  
  return (
    <div className="team-workspace">
      <ActiveUsersBar users={activeUsers} />
      <SharedCampaignsList campaigns={sharedCampaigns} />
      <LiveChatPanel messages={liveChat} />
      <CollaborativeWhiteboard />
    </div>
  );
};
