import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Loader2, TrendingUp, Users, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { UploadResourceDialog } from "@/components/dialogs/UploadResourceDialog";
import { CreateAssignmentDialog } from "@/components/dialogs/CreateAssignmentDialog";
import { CreateStudyGroupDialog } from "@/components/dialogs/CreateStudyGroupDialog";
import { ForumManagementDialog } from "@/components/dialogs/ForumManagementDialog";
import { EditResourceDialog } from "@/components/dialogs/EditResourceDialog";
import { EditAssignmentDialog } from "@/components/dialogs/EditAssignmentDialog";
import { EditStudyGroupDialog } from "@/components/dialogs/EditStudyGroupDialog";
import { EditForumDialog } from "@/components/dialogs/EditForumDialog";
import { DeleteConfirmationDialog } from "@/components/dialogs/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { getResources, getAssignments, getStudyGroups, getForums, getStudyGroupsWithMembers, deleteResource, deleteAssignment, deleteStudyGroup, deleteForum } from "@/lib/services/academic";
import { getGroupCode, getForumCode, getResourceCode } from "@/lib/joinCodes";
import { queryKeys, invalidateQueriesForMutation } from "@/lib/query-utils";

const LoadingState = () => (
  <div className="flex justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function FacultyDashboard() {
  const { theme } = useTheme();
  const location = useLocation();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const tab = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'resources';
  }, [location.search]);

  const [resourceSearch, setResourceSearch] = React.useState("");
  const [testSearch, setTestSearch] = React.useState("");
  const [groupSearch, setGroupSearch] = React.useState("");
  const [forumSearch, setForumSearch] = React.useState("");

  // Fetch Resources (Study Materials uploaded by this professor)
  const { data: resources = [], isLoading: loadingResources } = useQuery({
    queryKey: queryKeys.resources.all,
    queryFn: getResources,
  });

  // Filter to show only current faculty's resources
  const myResources = React.useMemo(() => {
    return resources.filter((r: any) => r.uploaded_by === profile?.id && r.title.toLowerCase().includes(resourceSearch.toLowerCase()));
  }, [resources, profile?.id, resourceSearch]);

  // Fetch Tests & Assignments
  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: queryKeys.assignments.all,
    queryFn: getAssignments,
  });

  // Filter to show only current faculty's assignments
  const myTests = React.useMemo(() => {
    return tests.filter((a: any) => a.created_by === profile?.id && a.title.toLowerCase().includes(testSearch.toLowerCase()));
  }, [tests, profile?.id, testSearch]);

  // Fetch Project Groups with Members
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: getStudyGroupsWithMembers,
  });

  // Filter to show only current faculty's groups
  const myGroups = React.useMemo(() => {
    return groups.filter((g: any) => g.created_by === profile?.id && g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  }, [groups, profile?.id, groupSearch]);

  // Fetch Forums
  const { data: forums = [], isLoading: loadingForums } = useQuery({
    queryKey: queryKeys.forums.all,
    queryFn: getForums,
  });

  // Filter to show only current faculty's forums
  const myForums = React.useMemo(() => {
    return forums.filter((f: any) => f.author_id === profile?.id && f.topic.toLowerCase().includes(forumSearch.toLowerCase()));
  }, [forums, profile?.id, forumSearch]);

  const performanceStats = React.useMemo(() => {
    const resourceAccess = JSON.parse(localStorage.getItem('campus_resource_access') || '[]');
    const groupMembers = JSON.parse(localStorage.getItem('campus_group_memberships') || '[]');
    const myResourceIds = myResources.map((r: any) => r.id);
    const studentsWithResourceAccess = resourceAccess.filter((a: any) => myResourceIds.includes(a.resourceId));
    const myGroupIds = myGroups.map((g: any) => g.id);
    const studentsInGroups = groupMembers.filter((m: any) => myGroupIds.includes(m.resourceId));
    const uniqueStudents = new Set([
      ...studentsWithResourceAccess.map((s: any) => s.userId),
      ...studentsInGroups.map((s: any) => s.userId),
    ]);
    return {
      totalResources: myResources.length,
      totalAssignments: myTests.length,
      totalGroups: myGroups.length,
      studentsReached: uniqueStudents.size,
      resourceAccessCount: studentsWithResourceAccess.length,
      groupMemberships: studentsInGroups.length,
      assignmentSubmissions: myTests.reduce((sum: number, t: any) => sum + (t.submissions?.count || t.submissions?.[0]?.count || 0), 0),
    };
  }, [myResources, myTests, myGroups]);

  const isDataLoading = tab !== 'performance' && (loadingResources || loadingTests || loadingGroups || loadingForums);

  if (isDataLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
            Faculty Dashboard
          </span>
        </h1>
        <p className="text-muted-foreground mb-6">Manage resources, tests, and student performance</p>
      </div>

      {tab === 'resources' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Academic Resources</CardTitle>
            <UploadResourceDialog
              onCreate={() => {
                invalidateQueriesForMutation(queryClient, 'resource');
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources by title..."
                className="pl-8"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>
            {loadingResources ? <LoadingState /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Title</th>
                    <th className="py-2 px-4 text-left">Category</th>
                    <th className="py-2 px-4 text-left">Access Code</th>
                    <th className="py-2 px-4 text-left">Uploaded</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myResources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No resources found.
                      </td>
                    </tr>
                  ) : (
                    myResources.map((res: any) => (
                      <tr key={res.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-4 align-middle">{res.title}</td>
                      <td className="py-2 px-4 align-middle">{res.category}</td>
                      <td className="py-2 px-4 align-middle">
                        <Badge variant="secondary" className="font-mono">
                          {res.join_code || getResourceCode(res.id) || '—'}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 align-middle">{new Date(res.created_at).toLocaleDateString()}</td>
                      <td className="py-2 px-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <EditResourceDialog 
                            resource={res} 
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'resource')} 
                          />
                          <DeleteConfirmationDialog
                            title="Delete Resource"
                            description={`Are you sure you want to delete "${res.title}"?`}
                            onConfirm={() => deleteResource(res.id)}
                            successMessage={`✅ "${res.title}" deleted successfully!`}
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'resource')}
                          />
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'tests' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Tests & Assignments</CardTitle>
            <CreateAssignmentDialog
              onCreate={() => {
                invalidateQueriesForMutation(queryClient, 'assignment');
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments by title..."
                className="pl-8"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
              />
            </div>
            {loadingTests ? <LoadingState /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Title</th>
                    <th className="py-2 px-4 text-left">Due Date</th>
                    <th className="py-2 px-4 text-left">Submissions</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myTests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No assignments found.
                      </td>
                    </tr>
                  ) : (
                    myTests.map((test: any) => (
                      <tr key={test.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-4 align-middle font-medium">{test.title}</td>
                      <td className="py-2 px-4 align-middle">{new Date(test.due_date).toLocaleDateString()}</td>
                      <td className="py-2 px-4 align-middle">
                        <Badge variant="outline">{test.submissions?.[0]?.count || 0} Submissions</Badge>
                      </td>
                      <td className="py-2 px-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <EditAssignmentDialog 
                            assignment={test} 
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'assignment')} 
                          />
                          <DeleteConfirmationDialog
                            title="Delete Assignment"
                            description={`Are you sure you want to delete "${test.title}"?`}
                            onConfirm={() => deleteAssignment(test.id)}
                            successMessage={`✅ "${test.title}" deleted successfully!`}
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'assignment')}
                          />
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'groups' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Project Groups</CardTitle>
            <CreateStudyGroupDialog
              onCreate={() => {
                invalidateQueriesForMutation(queryClient, 'group');
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups by name..."
                className="pl-8"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
              />
            </div>
            {loadingGroups ? <LoadingState /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Group Name</th>
                    <th className="py-2 px-4 text-left">Subject</th>
                    <th className="py-2 px-4 text-left">Join Code</th>
                    <th className="py-2 px-4 text-left">Members</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No groups found.
                      </td>
                    </tr>
                  ) : (
                    myGroups.map((group: any) => (
                      <tr key={group.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-4 align-middle font-medium">{group.name}</td>
                      <td className="py-2 px-4 align-middle font-medium">{group.subject}</td>
                      <td className="py-2 px-4 align-middle">
                        <Badge variant="secondary" className="font-mono">
                          {group.join_code || getGroupCode(group.id) || '—'}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{group.members?.length || 0} Joined</Badge>
                          {group.members?.length > 0 && (
                            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                              {group.members.slice(0, 3).map((m: any) => m.full_name).join(', ')}
                              {group.members.length > 3 && ` +${group.members.length - 3} more`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <EditStudyGroupDialog 
                            group={group} 
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'group')} 
                          />
                          <DeleteConfirmationDialog
                            title="Delete Group"
                            description={`Are you sure you want to delete "${group.name}"?`}
                            onConfirm={() => deleteStudyGroup(group.id)}
                            successMessage={`✅ "${group.name}" deleted successfully!`}
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'group')}
                          />
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resources Shared</p>
                  <p className="text-3xl font-bold">{performanceStats.totalResources}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="text-3xl font-bold">{performanceStats.totalAssignments}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Groups</p>
                  <p className="text-3xl font-bold">{performanceStats.totalGroups}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students Reached</p>
                  <p className="text-3xl font-bold">{performanceStats.studentsReached}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Engagement Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Resource Access (students who unlocked materials)</span>
                    <span className="font-medium">{performanceStats.resourceAccessCount}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, performanceStats.resourceAccessCount * 10)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Group Memberships</span>
                    <span className="font-medium">{performanceStats.groupMemberships}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, performanceStats.groupMemberships * 10)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Assignment Submissions</span>
                    <span className="font-medium">{performanceStats.assignmentSubmissions}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, performanceStats.assignmentSubmissions * 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per-Resource Access</CardTitle>
            </CardHeader>
            <CardContent>
              {myResources.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Upload resources to track student access.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Resource</th>
                      <th className="py-2 px-4 text-left">Access Code</th>
                      <th className="py-2 px-4 text-left">Students with Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myResources.map((res: any) => {
                      const accessList = JSON.parse(localStorage.getItem('campus_resource_access') || '[]')
                        .filter((a: any) => a.resourceId === res.id);
                      return (
                        <tr key={res.id} className="border-b">
                          <td className="py-2 px-4">{res.title}</td>
                          <td className="py-2 px-4 font-mono">{res.join_code || getResourceCode(res.id) || '—'}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{accessList.length} student{accessList.length !== 1 ? 's' : ''}</Badge>
                            {accessList.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {accessList.map((a: any) => a.fullName).join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'forums' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Academic Forums</CardTitle>
            <ForumManagementDialog
              onCreate={() => {
                invalidateQueriesForMutation(queryClient, 'forum');
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forums by topic..."
                className="pl-8"
                value={forumSearch}
                onChange={(e) => setForumSearch(e.target.value)}
              />
            </div>
            {loadingForums ? <LoadingState /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Topic</th>
                    <th className="py-2 px-4 text-left">Join Code</th>
                    <th className="py-2 px-4 text-left">Posts</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myForums.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No forums found.
                      </td>
                    </tr>
                  ) : (
                    myForums.map((forum: any) => (
                      <tr key={forum.id} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-4 align-middle font-medium">{forum.topic}</td>
                      <td className="py-2 px-4 align-middle">
                        <Badge variant="secondary" className="font-mono">
                          {forum.join_code || getForumCode(forum.id) || '—'}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 align-middle">{forum.posts?.[0]?.count || 0}</td>
                      <td className="py-2 px-4 align-middle">{forum.is_solved ? <Badge>Solved</Badge> : <Badge variant="outline">Open</Badge>}</td>
                      <td className="py-2 px-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <EditForumDialog 
                            forum={forum} 
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'forum')} 
                          />
                          <DeleteConfirmationDialog
                            title="Delete Forum"
                            description={`Are you sure you want to delete "${forum.topic}"?`}
                            onConfirm={() => deleteForum(forum.id)}
                            successMessage={`✅ "${forum.topic}" deleted successfully!`}
                            onSuccess={() => invalidateQueriesForMutation(queryClient, 'forum')}
                          />
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
