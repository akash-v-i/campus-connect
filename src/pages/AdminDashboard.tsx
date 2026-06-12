import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Ban, Trash2, Key, Copy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { generateInviteCode, getAllCodes, deleteCode, InviteRole } from '@/lib/invitationCodes';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { user, getAllUsers, blockUser, unblockUser, deleteUser } = useAuth();
  const [users, setUsers] = useState(getAllUsers());
  const [inviteCodes, setInviteCodes] = useState(getAllCodes());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<InviteRole>('Professor');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const refresh = () => {
    setUsers(getAllUsers());
    setInviteCodes(getAllCodes());
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleBlock = (userId: string, isBlocked: boolean) => {
    if (isBlocked) {
      unblockUser(userId);
      toast.success('User unblocked');
    } else {
      blockUser(userId);
      toast.success('User blocked');
    }
    refresh();
  };

  const handleDelete = (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    deleteUser(userId);
    toast.success('User deleted');
    refresh();
  };

  const handleGenerateCode = () => {
    const entry = generateInviteCode(inviteRole, user?.id);
    setGeneratedCode(entry.code);
    setInviteCodes(getAllCodes());
    toast.success(`Invitation code generated for ${inviteRole}`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const handleDeleteCode = (code: string) => {
    deleteCode(code);
    setInviteCodes(getAllCodes());
    toast.success('Invitation code deleted');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold">
            <span className={theme === 'cyber' ? 'gradient-cyber bg-clip-text text-transparent' : ''}>
              User Management
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and invitation codes</p>
        </div>
        <Button onClick={() => { setShowInviteModal(true); setGeneratedCode(null); }}>
          <Key className="h-4 w-4 mr-2" />
          Generate Invite Code
        </Button>
      </div>

      <Card className="p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => {
              const isBlocked = u.is_active === false || u.status === 'BLOCKED';
              const isProtected = u.role === 'Admin';
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isBlocked ? 'destructive' : 'default'}>
                      {isBlocked ? 'BLOCKED' : u.status || 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!isProtected && (
                      <>
                        <Button
                          size="sm"
                          variant={isBlocked ? 'default' : 'outline'}
                          onClick={() => handleBlock(u.id, isBlocked)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          {isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(u.id, u.full_name)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    {isProtected && (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2">Invitation Codes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Only codes listed here are valid for staff registration. Generate new codes for professors, librarians, and canteen staff.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inviteCodes.map((c) => (
              <TableRow key={c.code}>
                <TableCell className="font-mono font-medium">{c.code}</TableCell>
                <TableCell><Badge variant="outline">{c.role}</Badge></TableCell>
                <TableCell>
                  <Badge variant={c.usedBy ? 'secondary' : 'default'}>
                    {c.usedBy ? 'Used' : 'Available'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => copyCode(c.code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  {!c.usedBy && (
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCode(c.code)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invitation Code</DialogTitle>
            <DialogDescription>
              Create a new invitation code for staff registration
            </DialogDescription>
          </DialogHeader>

          {generatedCode ? (
            <div className="py-4 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Share this code with the new staff member:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-primary">{generatedCode}</span>
                <Button variant="outline" size="sm" onClick={() => copyCode(generatedCode)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Role: {inviteRole}</p>
              <Button onClick={() => setShowInviteModal(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InviteRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor (Faculty)</SelectItem>
                    <SelectItem value="Librarian">Librarian</SelectItem>
                    <SelectItem value="Canteen Staff">Canteen In-charge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateCode} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Generate Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
