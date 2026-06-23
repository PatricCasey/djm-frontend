import { useState, useEffect, useCallback } from 'react';
import {
    listUsers, changeRole, assignProfile, assignProfiles,
    toggleApproval, listProfiles, createProfile, updateProfile,
    deleteProfile, getDuplicateJobUrls,
} from '../api/admin.api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';

const inputSx = {
    '& .MuiOutlinedInput-root': {
        background: '#f8fafc',
        borderRadius: 2,
        '&:hover fieldset': { borderColor: '#90caf9' },
        '&.Mui-focused fieldset': { borderColor: '#1565c0' },
    },
};

const ROLE_COLORS = { admin: '#7b1fa2', caller: '#1565c0', bidder: '#2e7d32' };

// ─── Profile Form ────────────────────────────────────────────────────────────

const emptyProfile = {
    name: '', email: '', phone: '', address: '', birthday: '',
    resumeStyle: 1,
    education: { bachelor: { university: '', graduation: '' }, master: { university: '', graduation: '' } },
    companies: [],
};

function ProfileDialog({ open, onClose, initial, onSaved }) {
    const [form, setForm] = useState(initial || emptyProfile);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setForm(initial || emptyProfile); setError(''); }, [initial, open]);

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const setEdu = (degree, field, value) =>
        setForm(f => ({ ...f, education: { ...f.education, [degree]: { ...f.education[degree], [field]: value } } }));

    const addCompany = () =>
        setForm(f => ({ ...f, companies: [...(f.companies || []), { name: '', start: '', end: '' }] }));
    const setCompany = (i, field, value) =>
        setForm(f => {
            const companies = [...(f.companies || [])];
            companies[i] = { ...companies[i], [field]: value };
            return { ...f, companies };
        });
    const removeCompany = (i) =>
        setForm(f => ({ ...f, companies: f.companies.filter((_, idx) => idx !== i) }));

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            if (initial?._id) {
                await updateProfile(initial._id, form);
            } else {
                await createProfile(form);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save profile');
        }
        setSaving(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: '#1a237e' }}>
                {initial?._id ? 'Edit Profile' : 'Create Profile'}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField label="Full Name" value={form.name} onChange={e => set('name', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                        <TextField label="Email" value={form.email} onChange={e => set('email', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                        <TextField label="Birthday" type="date" value={form.birthday ? form.birthday.slice(0, 10) : ''}
                            onChange={e => set('birthday', e.target.value)}
                            size="small" fullWidth InputLabelProps={{ shrink: true }} sx={inputSx} />
                    </Box>
                    <TextField label="Address" value={form.address} onChange={e => set('address', e.target.value)}
                        size="small" fullWidth sx={inputSx} />
                    <TextField
                        select label="Resume Style" value={form.resumeStyle}
                        onChange={e => set('resumeStyle', Number(e.target.value))}
                        size="small" fullWidth sx={inputSx}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <MenuItem key={n} value={n}>Style {n}</MenuItem>)}
                    </TextField>

                    <Typography sx={{ fontWeight: 600, color: '#546e7a', mt: 0.5 }}>Education</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField label="Bachelor University"
                            value={form.education?.bachelor?.university || ''}
                            onChange={e => setEdu('bachelor', 'university', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                        <TextField label="Graduation Year"
                            value={form.education?.bachelor?.graduation || ''}
                            onChange={e => setEdu('bachelor', 'graduation', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField label="Master University"
                            value={form.education?.master?.university || ''}
                            onChange={e => setEdu('master', 'university', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                        <TextField label="Graduation Year"
                            value={form.education?.master?.graduation || ''}
                            onChange={e => setEdu('master', 'graduation', e.target.value)}
                            size="small" fullWidth sx={inputSx} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, color: '#546e7a' }}>Companies</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={addCompany}
                            sx={{ color: '#1565c0', textTransform: 'none' }}>Add</Button>
                    </Box>
                    {(form.companies || []).map((c, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField label="Company" value={c.name} onChange={e => setCompany(i, 'name', e.target.value)}
                                size="small" sx={{ flex: 2, ...inputSx }} />
                            <TextField label="Start" value={c.start} onChange={e => setCompany(i, 'start', e.target.value)}
                                size="small" sx={{ flex: 1, ...inputSx }} />
                            <TextField label="End" value={c.end} onChange={e => setCompany(i, 'end', e.target.value)}
                                size="small" sx={{ flex: 1, ...inputSx }} />
                            <IconButton size="small" onClick={() => removeCompany(i)} sx={{ color: '#ef5350' }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}

                    {error && <Typography sx={{ color: '#c62828', fontSize: '0.85rem' }}>{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ color: '#546e7a', borderRadius: 2 }}>Cancel</Button>
                <Button
                    onClick={handleSave} disabled={saving} variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2,
                        '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' },
                    }}
                >
                    {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

const AdminPanel = () => {
    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [profilesLoading, setProfilesLoading] = useState(true);

    // Profile dialog
    const [profileDialog, setProfileDialog] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [deleteProfileId, setDeleteProfileId] = useState(null);

    // Assign dialog
    const [assignDialog, setAssignDialog] = useState(false);
    const [assignUser, setAssignUser] = useState(null);
    const [assignSelected, setAssignSelected] = useState([]);
    const [assignSaving, setAssignSaving] = useState(false);

    // Duplicates
    const [duplicates, setDuplicates] = useState([]);
    const [dupLoading, setDupLoading] = useState(false);
    const [dupThreshold, setDupThreshold] = useState(3);
    const [dupProfileId, setDupProfileId] = useState('');
    const [copiedUrl, setCopiedUrl] = useState(null);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try { setUsers(await listUsers()); } catch { setUsers([]); }
        setUsersLoading(false);
    }, []);

    const fetchProfiles = useCallback(async () => {
        setProfilesLoading(true);
        try { setProfiles(await listProfiles()); } catch { setProfiles([]); }
        setProfilesLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

    const handleToggleApproval = async (userId) => {
        try {
            const updated = await toggleApproval(userId);
            setUsers(u => u.map(x => x._id === updated._id ? updated : x));
        } catch { }
    };

    const handleChangeRole = async (userId, role) => {
        try {
            const updated = await changeRole(userId, role);
            setUsers(u => u.map(x => x._id === updated._id ? updated : x));
        } catch { }
    };

    const openAssign = (user) => {
        setAssignUser(user);
        if (user.role === 'bidder') {
            setAssignSelected(user.assignedProfile ? [user.assignedProfile._id || user.assignedProfile] : []);
        } else if (user.role === 'caller') {
            setAssignSelected((user.assignedProfiles || []).map(p => p._id || p));
        }
        setAssignDialog(true);
    };

    const handleAssignSave = async () => {
        setAssignSaving(true);
        try {
            if (assignUser.role === 'bidder') {
                const updated = await assignProfile(assignUser._id, assignSelected[0] || '');
                setUsers(u => u.map(x => x._id === updated._id ? updated : x));
            } else if (assignUser.role === 'caller') {
                const updated = await assignProfiles(assignUser._id, assignSelected);
                setUsers(u => u.map(x => x._id === updated._id ? updated : x));
            }
            setAssignDialog(false);
        } catch { }
        setAssignSaving(false);
    };

    const hasAssignedProfile = (user) => (
        (user.role === 'bidder' && !!user.assignedProfile) ||
        (user.role === 'caller' && (user.assignedProfiles || []).length > 0)
    );

    const handleRemoveUserProfile = async (user) => {
        try {
            const updated = user.role === 'bidder'
                ? await assignProfile(user._id, '')
                : await assignProfiles(user._id, []);
            setUsers(u => u.map(x => x._id === updated._id ? updated : x));
        } catch { }
    };

    const handleDeleteProfile = async () => {
        if (!deleteProfileId) return;
        try {
            await deleteProfile(deleteProfileId);
            setDeleteProfileId(null);
            fetchProfiles();
        } catch { setDeleteProfileId(null); }
    };

    const fetchDuplicates = async () => {
        setDupLoading(true);
        try {
            const data = await getDuplicateJobUrls(dupThreshold, dupProfileId || undefined);
            setDuplicates(data);
        } catch { setDuplicates([]); }
        setDupLoading(false);
    };

    useEffect(() => {
        if (tab === 2) fetchDuplicates();
    }, [tab]); // eslint-disable-line

    const copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 1500);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(13,71,161,0.25)',
                }}>
                    <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#263238' }}>Admin Panel</Typography>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}
                TabIndicatorProps={{ style: { background: '#1565c0' } }}>
                <Tab label="Users" icon={<GroupIcon fontSize="small" />} iconPosition="start"
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#546e7a', '&.Mui-selected': { color: '#1565c0' } }} />
                <Tab label="Profiles" icon={<PersonIcon fontSize="small" />} iconPosition="start"
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#546e7a', '&.Mui-selected': { color: '#1565c0' } }} />
                <Tab label="Duplicates" icon={<LinkIcon fontSize="small" />} iconPosition="start"
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#546e7a', '&.Mui-selected': { color: '#1565c0' } }} />
            </Tabs>

            {/* ── Users Tab ── */}
            {tab === 0 && (
                usersLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                    </Box>
                ) : users.length === 0 ? (
                    <Typography sx={{ color: '#90a4ae', textAlign: 'center', py: 6 }}>No users found.</Typography>
                ) : (
                    users.map(user => (
                        <Paper key={user._id} elevation={0} sx={{
                            p: 2.5, mb: 2, borderRadius: 2.5,
                            border: '1px solid rgba(0,0,0,0.06)', background: '#fff',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: '#90caf9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontWeight: 600, color: '#263238', flex: 1, minWidth: 180 }}>
                                    {user.email}
                                </Typography>

                                {/* Role */}
                                <Chip
                                    label={user.role}
                                    size="small"
                                    sx={{
                                        fontWeight: 700,
                                        background: `${ROLE_COLORS[user.role]}18`,
                                        color: ROLE_COLORS[user.role],
                                        border: `1px solid ${ROLE_COLORS[user.role]}33`,
                                    }}
                                />

                                {/* Approval */}
                                <Chip
                                    icon={user.approved ? <CheckCircleIcon /> : <CancelIcon />}
                                    label={user.approved ? 'Approved' : 'Pending'}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        background: user.approved ? '#e8f5e9' : '#fce4ec',
                                        color: user.approved ? '#2e7d32' : '#c62828',
                                    }}
                                />

                                {/* Assigned profile/profiles */}
                                {user.role === 'bidder' && user.assignedProfile && (
                                    <Chip label={`Profile: ${user.assignedProfile.name || user.assignedProfile.email}`}
                                        size="small" sx={{ background: '#e3f2fd', color: '#1565c0', fontWeight: 500 }} />
                                )}
                                {user.role === 'caller' && (user.assignedProfiles || []).length > 0 && (
                                    <Chip
                                        label={`${user.assignedProfiles.length} profile${user.assignedProfiles.length !== 1 ? 's' : ''}`}
                                        size="small" sx={{ background: '#e3f2fd', color: '#1565c0', fontWeight: 500 }} />
                                )}

                                {/* Actions */}
                                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                    <Tooltip title={user.approved ? 'Revoke approval' : 'Approve'}>
                                        <Button size="small" variant="outlined"
                                            onClick={() => handleToggleApproval(user._id)}
                                            sx={{
                                                borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                                                borderColor: user.approved ? '#ef9a9a' : '#a5d6a7',
                                                color: user.approved ? '#c62828' : '#2e7d32',
                                                '&:hover': { background: user.approved ? '#fce4ec' : '#e8f5e9' },
                                            }}>
                                            {user.approved ? 'Revoke' : 'Approve'}
                                        </Button>
                                    </Tooltip>

                                    {user.role !== 'admin' && (
                                        <TextField
                                            select value={user.role}
                                            onChange={e => handleChangeRole(user._id, e.target.value)}
                                            size="small"
                                            sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { borderRadius: 2, background: '#f8fafc', fontSize: '0.82rem' } }}
                                        >
                                            <MenuItem value="bidder">bidder</MenuItem>
                                            <MenuItem value="caller">caller</MenuItem>
                                        </TextField>
                                    )}

                                    {user.role !== 'admin' && (
                                        <Button size="small" variant="outlined"
                                            onClick={() => openAssign(user)}
                                            sx={{
                                                borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                                                borderColor: '#bbdefb', color: '#1565c0',
                                                '&:hover': { background: '#e3f2fd', borderColor: '#1565c0' },
                                            }}>
                                            Assign
                                        </Button>
                                    )}

                                    {user.role !== 'admin' && hasAssignedProfile(user) && (
                                        <Button size="small" variant="outlined"
                                            onClick={() => handleRemoveUserProfile(user)}
                                            sx={{
                                                borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                                                borderColor: '#ffcdd2', color: '#c62828',
                                                '&:hover': { background: '#ffebee', borderColor: '#c62828' },
                                            }}>
                                            Remove Profile
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    ))
                )
            )}

            {/* ── Profiles Tab ── */}
            {tab === 1 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained" startIcon={<AddIcon />}
                            onClick={() => { setEditingProfile(null); setProfileDialog(true); }}
                            sx={{
                                background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2,
                                fontWeight: 700, textTransform: 'none',
                                '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' },
                            }}
                        >
                            New Profile
                        </Button>
                    </Box>

                    {profilesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                        </Box>
                    ) : profiles.length === 0 ? (
                        <Typography sx={{ color: '#90a4ae', textAlign: 'center', py: 6 }}>No profiles yet.</Typography>
                    ) : (
                        profiles.map(p => (
                            <Paper key={p._id} elevation={0} sx={{
                                p: 2.5, mb: 2, borderRadius: 2.5,
                                border: '1px solid rgba(0,0,0,0.06)', background: '#fff',
                                display: 'flex', alignItems: 'center', gap: 2,
                                '&:hover': { borderColor: '#90caf9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                            }}>
                                <PersonIcon sx={{ color: '#1565c0', fontSize: 28 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 700, color: '#263238' }}>{p.name}</Typography>
                                    <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.82rem' }}>
                                        {p.email}{p.phone ? ` · ${p.phone}` : ''}{p.resumeStyle ? ` · Style ${p.resumeStyle}` : ''}
                                    </Typography>
                                    {p.companies?.length > 0 && (
                                        <Typography variant="body2" sx={{ color: '#90a4ae', fontSize: '0.78rem', mt: 0.3 }}>
                                            {p.companies.map(c => c.name).filter(Boolean).join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" sx={{ color: '#1565c0' }}
                                            onClick={() => { setEditingProfile(p); setProfileDialog(true); }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" sx={{ color: '#ef5350' }}
                                            onClick={() => setDeleteProfileId(p._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        ))
                    )}
                </>
            )}

            {/* ── Duplicates Tab ── */}
            {tab === 2 && (
                <>
                    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                label="Min Count" type="number" value={dupThreshold}
                                onChange={e => setDupThreshold(Number(e.target.value))}
                                size="small" sx={{ width: 120, ...inputSx }} inputProps={{ min: 1 }}
                            />
                            <TextField
                                select label="Profile" value={dupProfileId}
                                onChange={e => setDupProfileId(e.target.value)}
                                size="small" sx={{ minWidth: 180, ...inputSx }}
                            >
                                <MenuItem value="">All Profiles</MenuItem>
                                {profiles.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                            </TextField>
                            <Button variant="contained" onClick={fetchDuplicates} disabled={dupLoading}
                                sx={{
                                    background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2,
                                    textTransform: 'none', fontWeight: 700,
                                    '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' },
                                }}>
                                {dupLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
                            </Button>
                        </Box>
                    </Paper>

                    {dupLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                        </Box>
                    ) : duplicates.length === 0 ? (
                        <Typography sx={{ color: '#90a4ae', textAlign: 'center', py: 6 }}>No duplicates found.</Typography>
                    ) : (
                        duplicates.map((d, i) => (
                            <Paper key={i} elevation={0} sx={{
                                p: 2.5, mb: 2, borderRadius: 2.5,
                                border: '1px solid rgba(0,0,0,0.06)', background: '#fff',
                                '&:hover': { borderColor: '#90caf9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Chip label={`${d.count}x`} size="small"
                                                sx={{ fontWeight: 800, background: '#fce4ec', color: '#c62828' }} />
                                            {d.profile && (
                                                <Chip label={d.profile.name || d.profile.email} size="small"
                                                    sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0' }} />
                                            )}
                                            <Chip
                                                label={`Last: ${d.lastUsed ? new Date(d.lastUsed).toLocaleDateString() : '--'}`}
                                                size="small" sx={{ fontWeight: 500, background: '#f5f5f5', color: '#546e7a' }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LinkIcon sx={{ fontSize: 14, color: '#90a4ae' }} />
                                            <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#455a64', wordBreak: 'break-all' }}>
                                                {d.jobUrl}
                                            </Typography>
                                        </Box>
                                        {d.users?.length > 0 && (
                                            <Typography variant="body2" sx={{ color: '#90a4ae', fontSize: '0.78rem', mt: 0.5 }}>
                                                Used by: {d.users.map(u => u.email).join(', ')}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Tooltip title={copiedUrl === d.jobUrl ? 'Copied!' : 'Copy URL'}>
                                        <IconButton size="small" onClick={() => copyUrl(d.jobUrl)}
                                            sx={{ color: copiedUrl === d.jobUrl ? '#2e7d32' : '#90a4ae' }}>
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        ))
                    )}
                </>
            )}

            {/* Profile Dialog */}
            <ProfileDialog
                open={profileDialog}
                onClose={() => setProfileDialog(false)}
                initial={editingProfile}
                onSaved={() => { fetchProfiles(); }}
            />

            {/* Delete Profile Confirm */}
            <Dialog open={!!deleteProfileId} onClose={() => setDeleteProfileId(null)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete Profile</DialogTitle>
                <DialogContent>
                    <Typography>Delete this profile? This will unassign it from all users.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteProfileId(null)} sx={{ color: '#546e7a', borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleDeleteProfile} variant="contained" color="error"
                        sx={{ borderRadius: 2, fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Assign Profile Dialog */}
            <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#1a237e' }}>
                    Assign Profile{assignUser?.role === 'caller' ? 's' : ''} — {assignUser?.email}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {assignUser?.role === 'bidder' ? (
                        <TextField
                            select label="Profile" value={assignSelected[0] || ''} fullWidth size="small"
                            onChange={e => setAssignSelected(e.target.value ? [e.target.value] : [])}
                            sx={{ mt: 1, ...inputSx }}
                        >
                            <MenuItem value="">— None —</MenuItem>
                            {profiles.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                        </TextField>
                    ) : (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                            <InputLabel>Profiles</InputLabel>
                            <Select
                                multiple
                                value={assignSelected}
                                onChange={e => setAssignSelected(e.target.value)}
                                input={<OutlinedInput label="Profiles" />}
                                renderValue={selected =>
                                    profiles.filter(p => selected.includes(p._id)).map(p => p.name).join(', ')
                                }
                                sx={{ background: '#f8fafc', borderRadius: 2 }}
                            >
                                {profiles.map(p => (
                                    <MenuItem key={p._id} value={p._id}>
                                        <Checkbox checked={assignSelected.includes(p._id)} size="small" />
                                        <ListItemText primary={p.name} secondary={p.email} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setAssignDialog(false)} sx={{ color: '#546e7a', borderRadius: 2 }}>Cancel</Button>
                    <Button
                        onClick={handleAssignSave} disabled={assignSaving} variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2,
                            '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' },
                        }}
                    >
                        {assignSaving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel;
