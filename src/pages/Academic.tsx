import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  Loader2,
  KeyRound
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { queryKeys, invalidateQueriesForMutation } from '@/lib/query-utils';
import { getResources, getAssignments, getStudyGroups, getForums, joinStudyGroup } from '@/lib/services/academic';
import {
  getUserGroupMemberships,
  getUserForumMemberships,
  getUserResourceAccess,
  joinGroupByCode,
  joinForumByCode,
  joinResourceByCode,
  validateGroupCode,
  validateForumCode,
  validateResourceCode,
  hasResourceAccess,
} from '@/lib/joinCodes';
import { downloadResourceFile } from '@/lib/resourceFiles';

export default function Academic() {
  const { theme } = useTheme();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState('materials');

  const { data: studyMaterials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: queryKeys.resources.all,
    queryFn: getResources,
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: queryKeys.assignments.all,
    queryFn: async () => {
      const data = await getAssignments();
      return data.map((assignment: any) => ({
        ...assignment,
        userSubmission: (assignment.submissions as any)?.find((s: any) => s.student_id === profile?.id),
      }));
    },
    enabled: !!profile?.id,
  });

  const { data: studyGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: getStudyGroups,
  });

  const { data: forums = [], isLoading: isLoadingForums } = useQuery({
    queryKey: queryKeys.forums.all,
    queryFn: getForums,
  });

  const { data: userGroupIds = [] } = useQuery({
    queryKey: ['group-memberships', profile?.id],
    queryFn: () => profile?.id ? getUserGroupMemberships(profile.id) : [],
    enabled: !!profile?.id,
  });

  const { data: userForumIds = [] } = useQuery({
    queryKey: ['forum-memberships', profile?.id],
    queryFn: () => profile?.id ? getUserForumMemberships(profile.id) : [],
    enabled: !!profile?.id,
  });

  const { data: userResourceIds = [] } = useQuery({
    queryKey: ['resource-access', profile?.id],
    queryFn: () => profile?.id ? getUserResourceAccess(profile.id) : [],
    enabled: !!profile?.id,
  });

  const accessibleMaterials = studyMaterials.filter((m: any) => {
    if (!m.requires_code) return true;
    if (!profile?.id) return false;
    return hasResourceAccess(profile.id, m.id) || userResourceIds.includes(m.id);
  });

  const isUserMember = (groupId: string) => userGroupIds.includes(groupId);
  const isForumMember = (forumId: string) => userForumIds.includes(forumId);
  const canAccessResource = (resourceId: string) => userResourceIds.includes(resourceId) || hasResourceAccess(profile?.id || '', resourceId);

  const downloadMaterial = (material: any) => {
    if (material.file_url?.startsWith('local://')) {
      const resourceId = material.file_url.replace('local://', '');
      if (downloadResourceFile(resourceId, material.file_name || material.title)) {
        toast.success(`Downloading ${material.title}`);
      } else {
        toast.error('File not found. Please contact your professor.');
      }
    } else if (material.file_url) {
      window.open(material.file_url, '_blank');
      toast.success(`Downloading ${material.title}`);
    } else {
      toast.info('No file attached to this material.');
    }
  };

  const joinGroupMutation = useMutation({
    mutationFn: async (group: any) => {
      if (!profile?.id) throw new Error('Please sign in to join groups');
      return joinStudyGroup(group.id, profile.id, profile.full_name || 'Student');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-memberships', profile?.id] });
      invalidateQueriesForMutation(queryClient, 'academic');
      toast.success('Successfully joined the study group!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to join group');
    },
  });

  const joinByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!profile?.id) throw new Error('Please sign in to join');
      const normalized = code.trim().toUpperCase();

      if (validateGroupCode(normalized)) {
        const entry = joinGroupByCode(normalized, profile.id, profile.full_name || 'Student');
        return { type: 'group' as const, entry };
      }
      if (validateForumCode(normalized)) {
        const entry = joinForumByCode(normalized, profile.id, profile.full_name || 'Student');
        return { type: 'forum' as const, entry };
      }
      if (validateResourceCode(normalized)) {
        const entry = joinResourceByCode(normalized, profile.id, profile.full_name || 'Student');
        return { type: 'resource' as const, entry };
      }
      throw new Error('Invalid access code. Please check with your professor.');
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['group-memberships', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['forum-memberships', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['resource-access', profile?.id] });
      invalidateQueriesForMutation(queryClient, 'academic');

      if (result.type === 'group') {
        setActiveTab('groups');
        toast.success(`Joined study group: ${result.entry.name}`);
      } else if (result.type === 'forum') {
        setActiveTab('forums');
        toast.success(`Joined forum: ${result.entry.name}`);
      } else {
        setActiveTab('materials');
        toast.success(`Access granted to resource: ${result.entry.name}`);
      }
      setJoinCode('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to join');
    },
  });

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading academic resources...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
            Academic Hub
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">Access study materials, assignments, and collaborate with peers</p>
      </div>

      <Card className="p-6 mb-8 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Join via Code</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a 6-character access code from your professor to unlock study materials, groups, or forums.
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="Enter join code (e.g. ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="max-w-xs font-mono tracking-widest"
          />
          <Button
            onClick={() => joinByCodeMutation.mutate(joinCode)}
            disabled={!joinCode.trim() || joinByCodeMutation.isPending}
          >
            {joinByCodeMutation.isPending ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <FileText className="h-8 w-8 text-blue-500 mb-2" />
          <p className="font-bold text-2xl">{accessibleMaterials.length}</p>
          <p className="text-sm text-muted-foreground">Accessible Materials</p>
        </Card>
        <Card className="p-6">
          <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
          <p className="font-bold text-2xl">
            {assignments.filter(a => a.userSubmission?.status === 'graded' || a.userSubmission?.status === 'submitted').length}
          </p>
          <p className="text-sm text-muted-foreground">Completed Assignments</p>
        </Card>
        <Card className="p-6">
          <Users className="h-8 w-8 text-purple-500 mb-2" />
          <p className="font-bold text-2xl">{studyGroups.length}</p>
          <p className="text-sm text-muted-foreground">Study Groups</p>
        </Card>
        <Card className="p-6">
          <MessageSquare className="h-8 w-8 text-orange-500 mb-2" />
          <p className="font-bold text-2xl">{forums.length}</p>
          <p className="text-sm text-muted-foreground">Active Discussions</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
          <TabsTrigger value="forums">Forums</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Study Materials</h2>
            {isLoadingMaterials ? <LoadingState /> : accessibleMaterials.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 space-y-2">
                <p>No study materials available yet.</p>
                <p className="text-sm">Enter an access code from your professor above to unlock resources.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessibleMaterials.map((material) => (
                  <Card key={material.id} className="p-4 hover:shadow-card transition-smooth">
                    <h3 className="font-bold text-sm line-clamp-2 mb-1">{material.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{material.subject}</p>
                    <Badge variant="outline" className="mb-2">{material.category}</Badge>
                    {material.file_name && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">{material.file_name}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">By {material.uploaded_by_name || 'Faculty'}</span>
                      {canAccessResource(material.id) ? (
                        <Button size="sm" onClick={() => downloadMaterial(material)}>
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Code Required</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">My Assignments</h2>
            {isLoadingAssignments ? <LoadingState /> : assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assignments available.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">{assignment.title}</h3>
                          <Badge variant={assignment.userSubmission ? 'default' : 'destructive'}>
                            {assignment.userSubmission ? assignment.userSubmission.status : 'Pending'}
                          </Badge>
                          <Badge variant="outline">{assignment.max_marks} points</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {assignment.subject}
                          </span>
                        </div>
                      </div>
                      {assignment.userSubmission ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />Submitted
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => toast.info(`Submit "${assignment.title}" via the Academic Hub`)}>
                          Submit
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Study Groups</h2>
            {isLoadingGroups ? <LoadingState /> : studyGroups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No study groups yet. Ask your professor for a join code.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <h3 className="font-bold mb-2">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
                    <div className="space-y-1 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subject:</span>
                        <span>{group.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Members:</span>
                        <span>{group.member_count || 0} / {group.capacity || 'Unlimited'}</span>
                      </div>
                    </div>
                    {isUserMember(group.id) ? (
                      <Button size="sm" variant="secondary" className="w-full gap-2" disabled>
                        <CheckCircle2 className="h-4 w-4" /> Member
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => joinGroupMutation.mutate(group)}
                        disabled={joinGroupMutation.isPending}
                      >
                        {joinGroupMutation.isPending ? 'Joining...' : 'Join Group'}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="forums">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Academic Forums</h2>
            {isLoadingForums ? <LoadingState /> : forums.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No forums yet. Ask your professor for a join code.
              </p>
            ) : (
              <div className="space-y-4">
                {forums.map((forum) => (
                  <Card key={forum.id} className="p-4 hover:shadow-card transition-smooth">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">{forum.topic}</h3>
                          <Badge variant="outline">{forum.subject}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{forum.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By {forum.author_name || 'Faculty'}</span>
                          <span>•</span>
                          <span>Updated: {new Date(forum.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {isForumMember(forum.id) ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Joined
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info('Use a join code from your professor to access this forum')}
                        >
                          Join Discussion
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
