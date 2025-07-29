export const LiveWorkspace = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  
  useEffect(() => {
    // Real-time presence
    const channel = supabase.channel('workspace-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCollaborators(Object.values(state).flat());
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, []);
  
  return (
    <div className="live-workspace">
      <CollaboratorsList users={collaborators} />
      <SharedProjectsGrid projects={sharedProjects} />
      <LiveChatPanel />
      <ScreenSharingWidget />
    </div>
  );
};
