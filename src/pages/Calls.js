import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listCalls, listAllCalls, createCall, updateCall, deleteCall } from '../api/calls.api';
import { listProfiles, listUsers } from '../api/admin.api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableRow from '@mui/material/TableRow';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableChartIcon from '@mui/icons-material/TableChart';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { keyframes } from '@emotion/react';

const STEPS = ['pre-screening', 'screening', 'technical', 'final'];
const TYPES = ['phone', 'video'];
const STATUSES = ['completed', 'not-completed', 'rescheduled'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const STEP_COLORS = {
    'pre-screening': '#039be5',
    'screening': '#33b679',
    'technical': '#f6c026',
    'final': '#e67c73',
};
const STEP_TEXT_COLORS = {
    'pre-screening': '#fff',
    'screening': '#fff',
    'technical': '#3c4043',
    'final': '#fff',
};
const STATUS_COLORS = {
    'completed': '#2e7d32',
    'not-completed': '#c62828',
    'rescheduled': '#f57c00',
};

function getCallColor(call) {
    if (call.status === 'rescheduled')   return { bg: '#e65100', text: '#fff' };
    if (call.step === 'final')           return { bg: '#ad1457', text: '#fff' };
    if (call.step === 'technical')       return { bg: '#f57f17', text: '#3c4043' };
    if (call.type === 'video')           return { bg: '#1565c0', text: '#fff' };
    if (call.type === 'phone')           return { bg: '#6a1b9a', text: '#fff' };
    if (call.step === 'screening')       return { bg: '#2e7d32', text: '#fff' };
    if (call.step === 'pre-screening')   return { bg: '#0277bd', text: '#fff' };
    return { bg: '#1a73e8', text: '#fff' };
}

const isImportantCall = (call) => call.step === 'technical' || call.step === 'final';

const importantPulse = keyframes`
    0%   { box-shadow: 0 0 4px 2px rgba(255,200,0,0.45), 0 1px 4px rgba(0,0,0,0.18); }
    50%  { box-shadow: 0 0 20px 9px rgba(255,200,0,0.9), 0 2px 10px rgba(0,0,0,0.22); }
    100% { box-shadow: 0 0 4px 2px rgba(255,200,0,0.45), 0 1px 4px rgba(0,0,0,0.18); }
`;

const shimmerSlide = keyframes`
    0%   { left: -80%; }
    55%  { left: 130%; }
    100% { left: 130%; }
`;

const CST = 'America/Chicago';

const cstDateStr = (d = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: CST }).format(d);

const cstHM = (d = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CST, hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(d);
    return {
        h: parseInt(parts.find(p => p.type === 'hour').value, 10),
        m: parseInt(parts.find(p => p.type === 'minute').value, 10),
    };
};

const cstLocaleDate = (dateStr) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { timeZone: CST });

const formatHour = (h) => {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
};

// Shared overlap-layout helper for timed calls
function layoutCalls(timedCalls) {
    const items = timedCalls.map(c => {
        const [h, m] = c.time.split(':').map(Number);
        return { call: c, startMin: h * 60 + m, endMin: h * 60 + m + (c.duration || 60), col: 0, totalCols: 1 };
    });
    for (let i = 0; i < items.length; i++) {
        const used = new Set();
        for (let j = 0; j < i; j++) {
            if (items[j].endMin > items[i].startMin && items[j].startMin < items[i].endMin) used.add(items[j].col);
        }
        let col = 0; while (used.has(col)) col++;
        items[i].col = col;
    }
    for (let i = 0; i < items.length; i++) {
        let max = items[i].col;
        for (let j = 0; j < items.length; j++) {
            if (j !== i && items[j].endMin > items[i].startMin && items[j].startMin < items[i].endMin)
                max = Math.max(max, items[j].col);
        }
        items[i].totalCols = max + 1;
    }
    return items;
}

const emptyForm = {
    caller: '', profile: '', date: '', time: '', step: '', type: '',
    status: 'not-completed', duration: '', note: '', recordingLink: '', recruiterNameOrGmail: '',
};

const inputSx = {
    '& .MuiOutlinedInput-root': {
        background: '#f8fafc', borderRadius: 2,
        '&:hover fieldset': { borderColor: '#90caf9' },
        '&.Mui-focused fieldset': { borderColor: '#1565c0' },
    },
};

// ─── Call Form Dialog ─────────────────────────────────────────────────────────
function CallFormDialog({ open, onClose, editCall, profiles, onSaved, isAdmin, users, currentUser }) {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        if (editCall) {
            setForm({
                caller: editCall.caller?._id || editCall.caller || '',
                profile: editCall.profile?._id || editCall.profile || '',
                date: editCall.date ? editCall.date.slice(0, 10) : '',
                time: editCall.time || '',
                step: editCall.step || '',
                type: editCall.type || '',
                status: editCall.status || 'not-completed',
                duration: editCall.duration ?? '',
                note: editCall.note || '',
                recordingLink: editCall.recordingLink || '',
                recruiterNameOrGmail: editCall.recruiterNameOrGmail || '',
            });
        } else {
            setForm({ ...emptyForm, caller: isAdmin ? '' : (currentUser?._id || '') });
        }
        setError('');
    }, [open, editCall, isAdmin, currentUser]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const payload = {
                ...form,
                duration: form.duration !== '' ? Number(form.duration) : undefined,
                profile: form.profile || undefined,
                caller: isAdmin ? (form.caller || undefined) : undefined,
            };
            if (editCall?._id) await updateCall(editCall._id, payload);
            else await createCall(payload);
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save call');
        }
        setSaving(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
            <DialogTitle sx={{ fontWeight: 700, color: '#1a237e' }}>
                {editCall?._id ? 'Edit Call' : 'Add Call'}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    {isAdmin ? (
                        <TextField select label="Caller" name="caller"
                            value={form.caller} onChange={handleChange} size="small" fullWidth sx={inputSx}>
                            <MenuItem value="">— None —</MenuItem>
                            {users.filter(u => u.role === 'caller' || u.role === 'admin').map(u => <MenuItem key={u._id} value={u._id}>{u.email}</MenuItem>)}
                        </TextField>
                    ) : (
                        <TextField label="Caller" value={currentUser?.email || ''} size="small" fullWidth
                            slotProps={{ input: { readOnly: true } }}
                            sx={{ '& .MuiOutlinedInput-root': { background: '#f1f3f4', borderRadius: 2, '&:hover fieldset': { borderColor: '#90caf9' } } }} />
                    )}
                    <TextField select label="Profile" name="profile"
                        value={form.profile} onChange={handleChange} size="small" fullWidth sx={inputSx}>
                        <MenuItem value="">— None —</MenuItem>
                        {profiles.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                    </TextField>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField label="Date" name="date" type="date" value={form.date} onChange={handleChange}
                            size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
                        <TextField label="Time" name="time" type="time" value={form.time} onChange={handleChange}
                            size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField select label="Step" name="step" value={form.step} onChange={handleChange}
                            size="small" fullWidth sx={inputSx}>
                            <MenuItem value="">— None —</MenuItem>
                            {STEPS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                        <TextField select label="Type" name="type" value={form.type} onChange={handleChange}
                            size="small" fullWidth sx={inputSx}>
                            <MenuItem value="">— None —</MenuItem>
                            {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField select label="Status" name="status" value={form.status} onChange={handleChange}
                            size="small" fullWidth sx={inputSx}>
                            <MenuItem value="">— None —</MenuItem>
                            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                        <TextField label="Duration (min)" name="duration" type="number"
                            value={form.duration} onChange={handleChange} size="small" fullWidth sx={inputSx}
                            slotProps={{ htmlInput: { min: 0 } }} />
                    </Box>
                    <TextField label="Recruiter Name / Gmail" name="recruiterNameOrGmail"
                        value={form.recruiterNameOrGmail} onChange={handleChange} size="small" fullWidth sx={inputSx} />
                    <TextField label="Note (e.g. company name)" name="note"
                        value={form.note} onChange={handleChange} size="small" fullWidth multiline minRows={2} sx={inputSx} />
                    <TextField label="Recording Link" name="recordingLink"
                        value={form.recordingLink} onChange={handleChange} size="small" fullWidth sx={inputSx} />
                    {error && <Typography sx={{ color: '#c62828', fontSize: '0.85rem', fontWeight: 500 }}>{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ color: '#546e7a', borderRadius: 2 }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} variant="contained"
                    sx={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2, fontWeight: 700 }}>
                    {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Mini Monthly Calendar (sidebar) ─────────────────────────────────────────
function MiniCalendar({ weekStart, onWeekChange, callsByDate }) {
    const todayStr = useMemo(() => cstDateStr(), []);

    // Sync mini calendar month when the viewed week changes
    const [month, setMonth] = useState(() => {
        const mid = new Date(weekStart); mid.setDate(mid.getDate() + 3);
        return new Date(mid.getFullYear(), mid.getMonth(), 1);
    });
    useEffect(() => {
        const mid = new Date(weekStart); mid.setDate(mid.getDate() + 3);
        setMonth(new Date(mid.getFullYear(), mid.getMonth(), 1));
    }, [weekStart]);

    const year = month.getFullYear(), mo = month.getMonth();
    const firstDow = new Date(year, mo, 1).getDay();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();

    // Set of date strings in the currently viewed week
    const activeWeek = useMemo(() => new Set(
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart); d.setDate(d.getDate() + i);
            return cstDateStr(d);
        })
    ), [weekStart]);

    // Build cell grid
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, key });
    }
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const jumpToWeek = (key) => {
        const d = new Date(key + 'T12:00:00');
        d.setDate(d.getDate() - d.getDay());
        onWeekChange(d);
    };

    return (
        <Box sx={{ userSelect: 'none' }}>
            {/* Month nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <IconButton size="small" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    sx={{ color: '#5f6368', p: '2px' }}>
                    <ChevronLeftIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography sx={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#3c4043' }}>
                    {MONTH_NAMES[mo]} {year}
                </Typography>
                <IconButton size="small" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    sx={{ color: '#5f6368', p: '2px' }}>
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Day-of-week labels */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.25 }}>
                {['S','M','T','W','T','F','S'].map((l, i) => (
                    <Typography key={i} sx={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 600, color: i === 0 ? '#c62828' : '#70757a', lineHeight: '20px' }}>
                        {l}
                    </Typography>
                ))}
            </Box>

            {/* Weeks */}
            {weeks.map((week, wi) => (
                <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: '1px' }}>
                    {week.map((cell, di) => {
                        if (!cell) return <Box key={di} sx={{ height: 24 }} />;
                        const isToday = cell.key === todayStr;
                        const isActive = activeWeek.has(cell.key);
                        const hasCalls = (callsByDate[cell.key] || []).length > 0;
                        return (
                            <Box key={di} onClick={() => jumpToWeek(cell.key)}
                                sx={{
                                    width: 24, height: 24, mx: 'auto',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%', cursor: 'pointer', position: 'relative',
                                    background: isToday ? '#1a73e8' : isActive ? '#e8f0fe' : 'transparent',
                                    color: isToday ? '#fff' : di === 0 ? '#c62828' : '#3c4043',
                                    fontSize: '0.7rem', fontWeight: isToday ? 700 : isActive ? 600 : 400,
                                    '&:hover': { background: isToday ? '#1557b0' : isActive ? '#d2e3fc' : '#f1f3f4' },
                                }}>
                                {cell.day}
                                {hasCalls && (
                                    <Box sx={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.8)' : '#1a73e8' }} />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            ))}
        </Box>
    );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ calls, onDayDetail, onAdd, onEdit }) {
    const HOUR_HEIGHT = 56;
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const TIME_COL_W = 52;

    const getWeekStart = () => {
        const d = new Date(cstDateStr() + 'T12:00:00');
        d.setDate(d.getDate() - d.getDay());
        return d;
    };

    const [weekStart, setWeekStart] = useState(getWeekStart);
    const [now, setNow] = useState(new Date());
    const scrollRef = useRef(null);
    const todayStr = useMemo(() => cstDateStr(), []);

    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
    }), [weekStart]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll via RAF so the DOM is fully painted first
    useEffect(() => {
        const inThisWeek = days.some(d => cstDateStr(d) === todayStr);
        const { h, m } = cstHM();
        const target = inThisWeek
            ? Math.max(0, (h * 60 + m) * (HOUR_HEIGHT / 60) - 180)
            : 8 * HOUR_HEIGHT;
        requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = target;
        });
    }, [weekStart]); // eslint-disable-line

    // ── Dark mode & profile filter ──
    const [darkMode, setDarkMode] = useState(false);
    const [filterProfile, setFilterProfile] = useState('');

    const wt = darkMode ? {
        bg: '#1e1e2e', header: '#26263a', border: '#3c3f5c', sidebar: '#22222f',
        text: '#cdd6f4', subtext: '#9aa0a6', todayCol: 'rgba(137,180,250,0.08)',
        hourLine: '#313244', halfLine: '#282839', timeText: '#6c7086',
        hover: 'rgba(255,255,255,0.07)', dayNum: '#cdd6f4', sunRed: '#f38ba8',
    } : {
        bg: '#fff', header: '#fff', border: '#dadce0', sidebar: '#fafafa',
        text: '#3c4043', subtext: '#70757a', todayCol: 'rgba(26,115,232,0.03)',
        hourLine: '#e8eaed', halfLine: '#f5f5f5', timeText: '#70757a',
        hover: '#f1f3f4', dayNum: '#3c4043', sunRed: '#c62828',
    };

    const uniqueProfiles = useMemo(() => {
        const seen = new Set();
        const list = [];
        calls.forEach(c => {
            const id = c.profile?._id || c.profile;
            if (id && !seen.has(id)) {
                seen.add(id);
                list.push({ id, name: c.profile?.name || c.profile?.email || String(id) });
            }
        });
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [calls]);

    const visibleCalls = useMemo(() =>
        filterProfile ? calls.filter(c => (c.profile?._id || c.profile) === filterProfile) : calls,
    [calls, filterProfile]);

    const callsByDate = useMemo(() => {
        const map = {};
        visibleCalls.forEach(c => {
            if (!c.date) return;
            const key = c.date.slice(0, 10);
            if (!map[key]) map[key] = [];
            map[key].push(c);
        });
        return map;
    }, [visibleCalls]);

    const layoutByDate = useMemo(() => {
        const result = {};
        days.forEach(d => {
            const key = cstDateStr(d);
            const dc = (callsByDate[key] || []).filter(c => c.time).sort((a, b) => a.time.localeCompare(b.time));
            result[key] = layoutCalls(dc);
        });
        return result;
    }, [callsByDate, days]);

    const { h: nowH, m: nowM } = cstHM(now);
    const nowPx = (nowH * 60 + nowM) * (HOUR_HEIGHT / 60);

    const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    const goToday = () => setWeekStart(getWeekStart());

    // ── Drag-to-create ──
    const [dragState, setDragState] = useState(null); // { dateKey, colEl, startMin, endMin }
    const [callPopover, setCallPopover] = useState(null); // { call, anchorEl }
    const dragRef = useRef(null);
    const onAddRef = useRef(onAdd);
    useEffect(() => { onAddRef.current = onAdd; });

    const handleMouseDown = (e, dateKey, colEl) => {
        if (e.button !== 0) return;
        if (e.target.closest('[data-call]')) return;
        const rect = colEl.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const startMin = Math.max(0, Math.min(Math.floor((relY / (HOUR_HEIGHT / 60)) / 30) * 30, 23 * 60));
        const snap = { dateKey, colEl, startMin, endMin: startMin + 30 };
        dragRef.current = snap;
        setDragState(snap);
        e.preventDefault();
    };

    useEffect(() => {
        const onMove = (e) => {
            if (!dragRef.current) return;
            const { colEl, startMin } = dragRef.current;
            const rect = colEl.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const rawMin = Math.ceil((relY / (HOUR_HEIGHT / 60)) / 30) * 30;
            const endMin = Math.max(rawMin, startMin + 30);
            const next = { ...dragRef.current, endMin };
            dragRef.current = next;
            setDragState({ ...next });
        };
        const onUp = () => {
            if (!dragRef.current) return;
            const { dateKey, startMin, endMin } = dragRef.current;
            dragRef.current = null;
            setDragState(null);
            const h = Math.floor(startMin / 60);
            const m = startMin % 60;
            onAddRef.current(dateKey, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, endMin - startMin);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []); // eslint-disable-line

    const dateRangeLabel = (() => {
        const s = days[0], e = days[6];
        const sf = new Intl.DateTimeFormat('en-US', { timeZone: CST, month: 'short', day: 'numeric' }).format(s);
        const ef = new Intl.DateTimeFormat('en-US', { timeZone: CST, month: 'short', day: 'numeric', year: 'numeric' }).format(e);
        return `${sf} – ${ef}`;
    })();

    return (
        <Box sx={{ background: wt.bg, borderRadius: 2, border: `1px solid ${wt.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* ── Top header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${wt.border}`, flexShrink: 0, background: wt.header }}>
                <Button onClick={goToday} variant="outlined" size="small"
                    sx={{ borderRadius: 20, textTransform: 'none', fontWeight: 500, borderColor: wt.border, color: wt.text, px: 2, whiteSpace: 'nowrap', '&:hover': { background: wt.hover, borderColor: wt.border } }}>
                    Today
                </Button>
                <Box sx={{ display: 'flex' }}>
                    <IconButton onClick={prevWeek} size="small" sx={{ color: wt.text, '&:hover': { background: wt.hover } }}><ChevronLeftIcon /></IconButton>
                    <IconButton onClick={nextWeek} size="small" sx={{ color: wt.text, '&:hover': { background: wt.hover } }}><ChevronRightIcon /></IconButton>
                </Box>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 400, color: wt.text, whiteSpace: 'nowrap' }}>
                    {dateRangeLabel}
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField select size="small" value={filterProfile} onChange={e => setFilterProfile(e.target.value)}
                        sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 20, background: wt.bg, color: wt.text, '& fieldset': { borderColor: wt.border }, '&:hover fieldset': { borderColor: wt.subtext } }, '& .MuiSelect-icon': { color: wt.subtext }, '& .MuiInputBase-input': { py: '6px', fontSize: '0.85rem', color: wt.text } }}>
                        <MenuItem value="">All Profiles</MenuItem>
                        {uniqueProfiles.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </TextField>
                    <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                        <IconButton size="small" onClick={() => setDarkMode(d => !d)} sx={{ color: wt.subtext, '&:hover': { background: wt.hover } }}>
                            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* ── Body: sidebar + grid ── */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ── Left sidebar: mini monthly calendar ── */}
                <Box sx={{ width: 196, flexShrink: 0, borderRight: `1px solid ${wt.border}`, p: 1.5, background: wt.sidebar, overflowY: 'auto' }}>
                    <MiniCalendar
                        weekStart={weekStart}
                        onWeekChange={setWeekStart}
                        callsByDate={callsByDate}
                    />
                    {/* Color legend */}
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${wt.border}` }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: wt.subtext, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Legend</Typography>
                        {[
                            { color: '#e65100', label: 'Rescheduled' },
                            { color: '#ad1457', label: 'Final ✦ (anim)' },
                            { color: '#f57f17', label: 'Technical ✦ (anim)' },
                            { color: '#1565c0', label: 'Video call' },
                            { color: '#6a1b9a', label: 'Phone call' },
                            { color: '#2e7d32', label: 'Screening' },
                            { color: '#0277bd', label: 'Pre-screening' },
                        ].map(({ color, label }) => (
                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', background: color, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.63rem', color: wt.subtext }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── Right: scrollable day grid with sticky day headers ── */}
                <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 230px)', position: 'relative', minWidth: 0 }}>

                    {/* Sticky day-column headers — inside the scroll container so they always align */}
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 10, background: wt.header, borderBottom: `1px solid ${wt.border}`, display: 'flex' }}>
                        <Box sx={{ width: TIME_COL_W, flexShrink: 0 }} />
                        {days.map((d, i) => {
                            const dateKey = cstDateStr(d);
                            const isToday = dateKey === todayStr;
                            const isSun = i === 0;
                            const dayCnt = (callsByDate[dateKey] || []).length;
                            return (
                                <Box key={i} onClick={() => onDayDetail(dateKey)}
                                    sx={{ flex: 1, textAlign: 'center', py: 0.75, borderLeft: `1px solid ${wt.border}`, cursor: 'pointer', minWidth: 0, '&:hover .dn': { background: isToday ? '#1557b0' : wt.hover } }}>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.07em', color: isToday ? '#1a73e8' : isSun ? wt.sunRed : wt.subtext, textTransform: 'uppercase', lineHeight: 1.5 }}>
                                        {DAY_NAMES[i]}
                                    </Typography>
                                    <Box className="dn" sx={{ width: 30, height: 30, borderRadius: '50%', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#1a73e8' : 'transparent', color: isToday ? '#fff' : isSun ? wt.sunRed : wt.dayNum, fontSize: '0.9rem', fontWeight: isToday ? 700 : 400, transition: 'background 0.15s' }}>
                                        {new Intl.DateTimeFormat('en-US', { timeZone: CST, day: 'numeric' }).format(d)}
                                    </Box>
                                    {dayCnt > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '3px', mt: '2px', pb: '2px' }}>
                                            {Array.from({ length: Math.min(dayCnt, 5) }).map((_, ci) => (
                                                <Box key={ci} sx={{ width: 4, height: 4, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.7)' : '#1a73e8' }} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>

                    {/* 24-hour grid */}
                    <Box sx={{ display: 'flex', minHeight: HOUR_HEIGHT * 24 }}>
                        {/* Time labels */}
                        <Box sx={{ width: TIME_COL_W, flexShrink: 0, pt: `${HOUR_HEIGHT / 2}px`, userSelect: 'none' }}>
                            {HOURS.map(h => (
                                <Box key={h} sx={{ height: HOUR_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', pr: 1, mt: h === 0 ? `-${HOUR_HEIGHT / 2}px` : 0 }}>
                                    {h > 0 && <Typography sx={{ fontSize: '0.6rem', color: wt.timeText, fontWeight: 500, mt: '-0.4em', whiteSpace: 'nowrap' }}>{formatHour(h)}</Typography>}
                                </Box>
                            ))}
                        </Box>

                        {/* Day columns */}
                        {days.map((d, di) => {
                            const dateKey = cstDateStr(d);
                            const isToday = dateKey === todayStr;
                            const items = layoutByDate[dateKey] || [];
                            return (
                                <Box key={di}
                                    sx={{ flex: 1, position: 'relative', borderLeft: `1px solid ${wt.border}`, background: isToday ? wt.todayCol : wt.bg, cursor: dragState ? 'ns-resize' : 'crosshair', minWidth: 0, minHeight: HOUR_HEIGHT * 24, userSelect: 'none' }}
                                    onMouseDown={e => handleMouseDown(e, dateKey, e.currentTarget)}
                                >
                                    {HOURS.map(h => (
                                        <Box key={h} sx={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${wt.hourLine}`, position: 'relative' }}>
                                            <Box sx={{ position: 'absolute', top: HOUR_HEIGHT / 2, left: 0, right: 0, borderBottom: `1px dashed ${wt.halfLine}` }} />
                                        </Box>
                                    ))}

                                    {isToday && (
                                        <Box sx={{ position: 'absolute', top: nowPx, left: 0, right: 0, zIndex: 5, pointerEvents: 'none' }}>
                                            <Box sx={{ position: 'absolute', left: -4, top: -4, width: 9, height: 9, borderRadius: '50%', background: '#ea4335' }} />
                                            <Box sx={{ borderTop: '2px solid #ea4335', ml: '4px' }} />
                                        </Box>
                                    )}

                                    {/* Drag-to-create ghost block */}
                                    {dragState && dragState.dateKey === dateKey && (
                                        <Box sx={{ position: 'absolute', top: dragState.startMin * (HOUR_HEIGHT / 60) + 1, left: 2, right: 2, height: Math.max((dragState.endMin - dragState.startMin) * (HOUR_HEIGHT / 60), 8), background: 'rgba(26,115,232,0.15)', border: '2px solid #1a73e8', borderRadius: 1, pointerEvents: 'none', zIndex: 6 }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a73e8', px: 0.5, py: '2px', whiteSpace: 'nowrap' }}>
                                                {`${String(Math.floor(dragState.startMin / 60)).padStart(2, '0')}:${String(dragState.startMin % 60).padStart(2, '0')} – ${String(Math.floor(dragState.endMin / 60)).padStart(2, '0')}:${String(dragState.endMin % 60).padStart(2, '0')}`}
                                            </Typography>
                                        </Box>
                                    )}

                                    {items.map(({ call: c, startMin, endMin, col, totalCols }) => {
                                        const { bg, text: txtColor } = getCallColor(c);
                                        const important = isImportantCall(c);
                                        const topPx = startMin * (HOUR_HEIGHT / 60);
                                        const heightPx = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 18);
                                        return (
                                            <Box key={c._id} data-call="true"
                                                onClick={e => { e.stopPropagation(); setCallPopover({ call: c, anchorEl: e.currentTarget }); }}
                                                sx={{ position: 'absolute', top: topPx + 1, left: `calc(${(col / totalCols) * 100}% + 2px)`, width: `calc(${100 / totalCols}% - 4px)`, minHeight: heightPx, background: bg, color: txtColor, borderRadius: 1, px: 0.5, py: '2px', cursor: 'pointer', overflow: 'hidden', zIndex: 2, boxShadow: important ? 'none' : '0 1px 3px rgba(0,0,0,0.15)', animation: important ? `${importantPulse} 2s ease-in-out infinite` : undefined, '&:after': important ? { content: '""', position: 'absolute', top: 0, left: '-80%', width: '50%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)', animation: `${shimmerSlide} 3s ease-in-out infinite`, pointerEvents: 'none' } : {}, '&:hover': { filter: 'brightness(0.88)', zIndex: 4 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden' }}>
                                                    {c.type === 'video' ? <VideoCallIcon sx={{ fontSize: 9, flexShrink: 0 }} /> : c.type === 'phone' ? <PhoneIcon sx={{ fontSize: 9, flexShrink: 0 }} /> : null}
                                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                        {important ? '★ ' : ''}{c.profile?.name || c.recruiterNameOrGmail || 'Call'}
                                                    </Typography>
                                                    {c.status === 'completed' && <CheckCircleIcon sx={{ fontSize: 9, flexShrink: 0, opacity: 0.9 }} />}
                                                </Box>
                                                {heightPx > 30 && <Typography sx={{ fontSize: '0.59rem', opacity: 0.9, lineHeight: 1.2 }}>{c.time}{c.step ? ` · ${c.step}` : ''}</Typography>}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>

            {/* ── Call detail popover ── */}
            {callPopover && (
                <Popover
                    open
                    anchorEl={callPopover.anchorEl}
                    onClose={() => setCallPopover(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.22)', p: 1.5, minWidth: 230, maxWidth: 290 } } }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#3c4043', flex: 1, mr: 1 }}>
                            {callPopover.call.profile?.name || callPopover.call.recruiterNameOrGmail || 'Call'}
                        </Typography>
                        <IconButton size="small" onClick={() => setCallPopover(null)} sx={{ p: 0.25, color: '#70757a', mt: '-3px' }}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                    {callPopover.call.time && (
                        <Typography sx={{ fontSize: '0.78rem', color: '#5f6368', mb: 0.75 }}>
                            {callPopover.call.time}{callPopover.call.duration ? ` · ${callPopover.call.duration} min` : ''}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                        {callPopover.call.step && <Chip label={callPopover.call.step} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', background: `${STEP_COLORS[callPopover.call.step]}22`, color: STEP_COLORS[callPopover.call.step] }} />}
                        {callPopover.call.type && <Chip label={callPopover.call.type} size="small" icon={callPopover.call.type === 'video' ? <VideoCallIcon sx={{ fontSize: '14px !important' }} /> : <PhoneIcon sx={{ fontSize: '14px !important' }} />} sx={{ fontWeight: 500, fontSize: '0.7rem', background: '#f3e5f5', color: '#7b1fa2' }} />}
                        {callPopover.call.status && <Chip label={callPopover.call.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', background: `${STATUS_COLORS[callPopover.call.status]}18`, color: STATUS_COLORS[callPopover.call.status] }} />}
                    </Box>
                    {callPopover.call.note && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#37474f', mb: 0.5, fontStyle: 'italic' }}>
                            {callPopover.call.note}
                        </Typography>
                    )}
                    {callPopover.call.recruiterNameOrGmail && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', mb: 0.5 }}>
                            Recruiter: {callPopover.call.recruiterNameOrGmail}
                        </Typography>
                    )}
                    <Box sx={{ pt: 1, mt: 0.5, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button size="small" onClick={() => { setCallPopover(null); onDayDetail(callPopover.call.date?.slice(0, 10) || cstDateStr()); }}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#5f6368', borderRadius: 1.5, '&:hover': { background: '#f1f3f4' } }}>
                            View day
                        </Button>
                        <Button size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                            onClick={() => { setCallPopover(null); onEdit(callPopover.call); }}
                            sx={{ textTransform: 'none', fontWeight: 600, color: '#1a73e8', borderRadius: 1.5, '&:hover': { background: '#e8f0fe' } }}>
                            Edit
                        </Button>
                    </Box>
                </Popover>
            )}
        </Box>
    );
}

// ─── Day Detail View ──────────────────────────────────────────────────────────
function DayDetailView({ date, calls, onBack, onEdit, onAdd }) {
    const HOUR_HEIGHT = 64;
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const [now, setNow] = useState(new Date());
    const scrollRef = useRef(null);

    const todayStr = useMemo(() => cstDateStr(), []);
    const isToday = date === todayStr;

    const dayCalls = useMemo(() => calls.filter(c => c.date && c.date.slice(0, 10) === date), [calls, date]);
    const timedCalls = useMemo(() => dayCalls.filter(c => c.time).sort((a, b) => a.time.localeCompare(b.time)), [dayCalls]);
    const untimedCalls = useMemo(() => dayCalls.filter(c => !c.time), [dayCalls]);
    const layoutItems = useMemo(() => layoutCalls(timedCalls), [timedCalls]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!scrollRef.current) return;
        let target;
        if (isToday) {
            const { h, m } = cstHM();
            target = Math.max(0, (h * 60 + m) * (HOUR_HEIGHT / 60) - 180);
        } else if (timedCalls.length > 0) {
            const [h, m] = timedCalls[0].time.split(':').map(Number);
            target = Math.max(0, (h * 60 + m) * (HOUR_HEIGHT / 60) - 100);
        } else {
            target = 8 * HOUR_HEIGHT;
        }
        scrollRef.current.scrollTop = target;
    }, [date]); // eslint-disable-line

    const { h: nowH, m: nowM } = cstHM(now);
    const nowPx = (nowH * 60 + nowM) * (HOUR_HEIGHT / 60);

    const dateObj = new Date(date + 'T12:00:00');
    const dayLabel = dateObj.toLocaleDateString('en-US', { timeZone: CST, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const prevDay = () => {
        const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1);
        onBack(cstDateStr(d));
    };
    const nextDay = () => {
        const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + 1);
        onBack(cstDateStr(d));
    };

    const handleGridClick = (e) => {
        if (e.target.closest('[data-call]')) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const totalMins = Math.floor(relY / (HOUR_HEIGHT / 60));
        const h = Math.min(Math.floor(totalMins / 60), 23);
        const m = (totalMins % 60) < 30 ? 0 : 30;
        onAdd(date, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };

    return (
        <Box>
            {/* Day Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Tooltip title="Back to week">
                    <IconButton onClick={() => onBack(null)} size="small" sx={{ color: '#3c4043', '&:hover': { background: '#f1f3f4' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <IconButton onClick={prevDay} size="small" sx={{ color: '#3c4043', '&:hover': { background: '#f1f3f4' } }}><ChevronLeftIcon /></IconButton>
                <IconButton onClick={nextDay} size="small" sx={{ color: '#3c4043', '&:hover': { background: '#f1f3f4' } }}><ChevronRightIcon /></IconButton>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 500, color: '#3c4043', flex: 1 }}>{dayLabel}</Typography>
                <Chip label={`${dayCalls.length} call${dayCalls.length !== 1 ? 's' : ''}`} size="small"
                    sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0' }} />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => onAdd(date, '')} size="small"
                    sx={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                    Add Call
                </Button>
            </Box>

            {/* Untimed calls */}
            {untimedCalls.length > 0 && (
                <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, border: '1px solid #dadce0', background: '#f8f9fa' }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#70757a', mb: 1, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        No Time Set
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {untimedCalls.map(c => {
                            const { bg, text: txtColor } = getCallColor(c);
                            const important = isImportantCall(c);
                            return (
                                <Box key={c._id} data-call="true" onClick={() => onEdit(c)}
                                    sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, background: bg, color: txtColor, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.8, position: 'relative', overflow: 'hidden', boxShadow: important ? 'none' : '0 1px 3px rgba(0,0,0,0.15)', animation: important ? `${importantPulse} 2s ease-in-out infinite` : undefined, '&:after': important ? { content: '""', position: 'absolute', top: 0, left: '-80%', width: '50%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)', animation: `${shimmerSlide} 3s ease-in-out infinite`, pointerEvents: 'none' } : {}, '&:hover': { filter: 'brightness(0.88)' } }}>
                                    {c.type === 'video' ? <VideoCallIcon sx={{ fontSize: 14 }} /> : c.type === 'phone' ? <PhoneIcon sx={{ fontSize: 14 }} /> : null}
                                    <span>{important ? '★ ' : ''}{c.profile?.name || c.recruiterNameOrGmail || 'Call'}</span>
                                    {c.step && <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>· {c.step}</span>}
                                    {c.status === 'completed' && <CheckCircleIcon sx={{ fontSize: 14, opacity: 0.9 }} />}
                                    {c.status && c.status !== 'completed' && <Box sx={{ ml: 0.5, px: 0.8, py: '1px', borderRadius: 1, background: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>{c.status}</Box>}
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* 24-hour timeline */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #dadce0', overflow: 'hidden' }}>
                <Box ref={scrollRef} sx={{ maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', minHeight: HOUR_HEIGHT * 24 }}>
                        {/* Time labels */}
                        <Box sx={{ width: 56, flexShrink: 0, pt: `${HOUR_HEIGHT / 2}px` }}>
                            {HOURS.map(h => (
                                <Box key={h} sx={{ height: HOUR_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', pr: 1.5, mt: h === 0 ? `-${HOUR_HEIGHT / 2}px` : 0 }}>
                                    {h > 0 && <Typography sx={{ fontSize: '0.65rem', color: '#70757a', fontWeight: 500, lineHeight: 1, mt: '-0.4em' }}>{formatHour(h)}</Typography>}
                                </Box>
                            ))}
                        </Box>
                        {/* Grid */}
                        <Box sx={{ flex: 1, position: 'relative', borderLeft: '1px solid #dadce0', cursor: 'crosshair' }} onClick={handleGridClick}>
                            {HOURS.map(h => (
                                <Box key={h} sx={{ height: HOUR_HEIGHT, position: 'relative', borderBottom: '1px solid #e8eaed' }}>
                                    <Box sx={{ position: 'absolute', top: HOUR_HEIGHT / 2, left: 0, right: 0, borderBottom: '1px dashed #f1f3f4' }} />
                                </Box>
                            ))}
                            {isToday && (
                                <Box sx={{ position: 'absolute', top: nowPx, left: 0, right: 0, zIndex: 5, pointerEvents: 'none' }}>
                                    <Box sx={{ position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%', background: '#ea4335' }} />
                                    <Box sx={{ borderTop: '2px solid #ea4335', ml: '5px' }} />
                                </Box>
                            )}
                            {layoutItems.map(({ call: c, startMin, endMin, col, totalCols }) => {
                                const { bg, text: txtColor } = getCallColor(c);
                                const important = isImportantCall(c);
                                const topPx = startMin * (HOUR_HEIGHT / 60);
                                const heightPx = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 24);
                                return (
                                    <Box key={c._id} data-call="true"
                                        onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                                        sx={{
                                            position: 'absolute',
                                            top: topPx + 1,
                                            left: `calc(${(col / totalCols) * 100}% + 3px)`,
                                            width: `calc(${100 / totalCols}% - 6px)`,
                                            minHeight: heightPx,
                                            background: bg, color: txtColor,
                                            borderRadius: 1.5, px: 1, py: 0.5,
                                            cursor: 'pointer', overflow: 'hidden', zIndex: 2,
                                            boxShadow: important ? 'none' : '0 1px 4px rgba(0,0,0,0.18)',
                                            animation: important ? `${importantPulse} 2s ease-in-out infinite` : undefined,
                                            '&:after': important ? { content: '""', position: 'absolute', top: 0, left: '-80%', width: '50%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.32), transparent)', animation: `${shimmerSlide} 3s ease-in-out infinite`, pointerEvents: 'none' } : {},
                                            '&:hover': { filter: 'brightness(0.88)', zIndex: 4 },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                                            {c.type === 'video' ? <VideoCallIcon sx={{ fontSize: 13, flexShrink: 0 }} /> : c.type === 'phone' ? <PhoneIcon sx={{ fontSize: 13, flexShrink: 0 }} /> : null}
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                {important ? '★ ' : ''}{c.profile?.name || c.recruiterNameOrGmail || 'Call'}
                                            </Typography>
                                            {c.status === 'completed' && <CheckCircleIcon sx={{ fontSize: 14, flexShrink: 0, opacity: 0.9 }} />}
                                        </Box>
                                        {heightPx > 38 && <Typography sx={{ fontSize: '0.68rem', opacity: 0.9, lineHeight: 1.3, mt: '1px' }}>{c.time}{c.duration ? ` · ${c.duration}m` : ''}{c.step ? ` · ${c.step}` : ''}</Typography>}
                                        {heightPx > 58 && c.type && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.4, opacity: 0.85 }}>
                                                {c.type === 'video' ? <VideoCallIcon sx={{ fontSize: 11 }} /> : <PhoneIcon sx={{ fontSize: 11 }} />}
                                                <Typography sx={{ fontSize: '0.65rem' }}>{c.type}</Typography>
                                            </Box>
                                        )}
                                        {heightPx > 76 && c.status && (
                                            <Box sx={{ display: 'inline-block', mt: 0.5, px: 0.8, py: '1px', borderRadius: 1, background: 'rgba(255,255,255,0.25)', fontSize: '0.63rem', fontWeight: 600 }}>{c.status}</Box>
                                        )}
                                        {heightPx > 96 && c.recruiterNameOrGmail && (
                                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.85, mt: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.recruiterNameOrGmail}</Typography>
                                        )}
                                        {heightPx > 116 && c.recordingLink && (
                                            <Box component="a" href={c.recordingLink} target="_blank" rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.4, color: 'inherit', opacity: 0.85, fontSize: '0.65rem', textDecoration: 'none', '&:hover': { opacity: 1, textDecoration: 'underline' } }}>
                                                <LinkIcon sx={{ fontSize: 10 }} /> Recording
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {dayCalls.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, color: '#90a4ae' }}>
                    <PhoneIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>No calls on this day. Click the grid to add one.</Typography>
                </Box>
            )}
        </Box>
    );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function TableView({ calls, onEdit, onDelete }) {
    const [sortField, setSortField] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

    const headSx = { fontWeight: 700, fontSize: '0.78rem', color: '#5f6368', background: '#f8f9fa', whiteSpace: 'nowrap', py: 1.5, borderBottom: '2px solid #e0e0e0' };
    const cellSx = { fontSize: '0.82rem', color: '#3c4043', py: 1.2, borderBottom: '1px solid #f0f0f0' };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const getVal = (call, field) => {
        switch (field) {
            case 'date':     return call.date ? new Date(call.date).getTime() : -Infinity;
            case 'time':     return call.time || '';
            case 'caller':   return (call.caller?.email || '').toLowerCase();
            case 'profile':  return (call.profile?.name || call.profile?.email || '').toLowerCase();
            case 'step':     return call.step || '';
            case 'type':     return call.type || '';
            case 'status':   return call.status || '';
            case 'duration': return call.duration ?? -1;
            case 'recruiter': return (call.recruiterNameOrGmail || '').toLowerCase();
            case 'note':      return (call.note || '').toLowerCase();
            default:         return '';
        }
    };

    const sorted = [...calls].sort((a, b) => {
        const av = getVal(a, sortField);
        const bv = getVal(b, sortField);
        let cmp = 0;
        if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
        } else {
            cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const SortHead = ({ field, label, align }) => (
        <TableCell sx={{ ...headSx, ...(align ? { textAlign: align } : {}) }}>
            <TableSortLabel
                active={sortField === field}
                direction={sortField === field ? sortDir : 'asc'}
                onClick={() => handleSort(field)}
                sx={{ '& .MuiTableSortLabel-icon': { opacity: sortField === field ? 1 : 0.3 } }}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    );

    return (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 260px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <SortHead field="date"      label="Date" />
                            <SortHead field="time"      label="Time" />
                            <SortHead field="caller"    label="Caller" />
                            <SortHead field="profile"   label="Profile" />
                            <SortHead field="step"      label="Step" />
                            <SortHead field="type"      label="Type" />
                            <SortHead field="status"    label="Status" />
                            <SortHead field="duration"  label="Duration" />
                            <SortHead field="recruiter" label="Recruiter" />
                            <SortHead field="note"      label="Note" />
                            <TableCell sx={{ ...headSx, textAlign: 'center' }}>Rec.</TableCell>
                            <TableCell sx={{ ...headSx, textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow><TableCell colSpan={12} sx={{ textAlign: 'center', py: 6, color: '#90a4ae' }}>No calls recorded yet</TableCell></TableRow>
                        ) : sorted.map(call => (
                            <TableRow key={call._id} hover sx={{ '&:hover': { background: '#f8f9fa' } }}>
                                <TableCell sx={cellSx}>{call.date ? cstLocaleDate(call.date.slice(0, 10)) : '—'}</TableCell>
                                <TableCell sx={cellSx}>{call.time || '—'}</TableCell>
                                <TableCell sx={cellSx}><Typography sx={{ fontSize: '0.78rem', color: '#70757a' }}>{call.caller?.email || '—'}</Typography></TableCell>
                                <TableCell sx={cellSx}>
                                    {call.profile ? <Chip label={call.profile.name || call.profile.email} size="small" sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0', fontSize: '0.72rem' }} /> : '—'}
                                </TableCell>
                                <TableCell sx={cellSx}>
                                    {call.step ? <Chip label={call.step} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem', background: `${STEP_COLORS[call.step]}22`, color: STEP_COLORS[call.step], border: `1px solid ${STEP_COLORS[call.step]}44` }} /> : '—'}
                                </TableCell>
                                <TableCell sx={cellSx}>
                                    {call.type ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {call.type === 'video' ? <VideoCallIcon sx={{ fontSize: 15, color: '#7b1fa2' }} /> : <PhoneIcon sx={{ fontSize: 15, color: '#7b1fa2' }} />}
                                        <Typography sx={{ fontSize: '0.78rem', color: '#7b1fa2' }}>{call.type}</Typography>
                                    </Box> : '—'}
                                </TableCell>
                                <TableCell sx={cellSx}>
                                    {call.status ? <Chip label={call.status} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem', background: `${STATUS_COLORS[call.status]}18`, color: STATUS_COLORS[call.status] }} /> : '—'}
                                </TableCell>
                                <TableCell sx={cellSx}>{call.duration != null ? `${call.duration} min` : '—'}</TableCell>
                                <TableCell sx={{ ...cellSx, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.recruiterNameOrGmail || '—'}</TableCell>
                                <TableCell sx={{ ...cellSx, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.note || '—'}</TableCell>
                                <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                                    {call.recordingLink ? <Tooltip title="Open recording"><IconButton size="small" component="a" href={call.recordingLink} target="_blank" rel="noopener noreferrer" sx={{ color: '#1565c0' }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip> : '—'}
                                </TableCell>
                                <TableCell sx={{ ...cellSx, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(call)} sx={{ color: '#1565c0' }}><EditIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                    <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(call._id)} sx={{ color: '#ef5350' }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

// ─── Caller List View ─────────────────────────────────────────────────────────
function CallerList({ calls, onEdit, onDelete }) {
    return calls.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
            <PhoneIcon sx={{ fontSize: 52, color: '#cfd8dc', mb: 1 }} />
            <Typography sx={{ color: '#90a4ae', fontWeight: 500 }}>No calls recorded yet</Typography>
        </Paper>
    ) : calls.map(call => (
        <Paper key={call._id} elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.06)', background: '#fff', transition: 'all 0.2s ease', '&:hover': { borderColor: '#90caf9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {call.profile && <Chip icon={<PersonIcon />} label={call.profile.name || call.profile.email} size="small" sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0' }} />}
                        {call.step && <Chip label={call.step} size="small" sx={{ fontWeight: 600, background: `${STEP_COLORS[call.step]}22`, color: STEP_COLORS[call.step], border: `1px solid ${STEP_COLORS[call.step]}44` }} />}
                        {call.type && <Chip icon={call.type === 'video' ? <VideoCallIcon /> : <PhoneIcon />} label={call.type} size="small" sx={{ fontWeight: 500, background: '#f3e5f5', color: '#7b1fa2' }} />}
                        {call.status && <Chip label={call.status} size="small" sx={{ fontWeight: 600, background: `${STATUS_COLORS[call.status]}18`, color: STATUS_COLORS[call.status] }} />}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {(call.date || call.time) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 15, color: '#90a4ae' }} />
                                <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.82rem' }}>
                                    {call.date ? cstLocaleDate(call.date.slice(0, 10)) : ''}{call.date && call.time ? ' ' : ''}{call.time || ''}
                                </Typography>
                            </Box>
                        )}
                        {call.duration != null && <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.82rem' }}>{call.duration} min</Typography>}
                    </Box>
                    {call.note && <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.82rem', mt: 0.5, fontStyle: 'italic' }}>{call.note}</Typography>}
                    {call.recruiterNameOrGmail && <Typography variant="body2" sx={{ color: '#546e7a', fontSize: '0.82rem', mt: 0.5 }}>Recruiter: {call.recruiterNameOrGmail}</Typography>}
                    {call.recordingLink && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LinkIcon sx={{ fontSize: 14, color: '#90a4ae' }} />
                            <a href={call.recordingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#1565c0', fontSize: '0.82rem', textDecoration: 'none' }}>
                                {call.recordingLink.length > 60 ? call.recordingLink.slice(0, 60) + '...' : call.recordingLink}
                            </a>
                        </Box>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(call)} sx={{ color: '#1565c0' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(call._id)} sx={{ color: '#ef5350' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            </Box>
        </Paper>
    ));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Calls = ({ user }) => {
    const isAdmin = user?.role === 'admin';
    const [calls, setCalls] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminTab, setAdminTab] = useState(0); // 0 = week, 1 = table
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editCall, setEditCall] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const fetchCalls = useCallback(async () => {
        setLoading(true);
        try {
            const data = isAdmin ? await listAllCalls() : await listCalls();
            setCalls(data);
        } catch { setCalls([]); }
        setLoading(false);
    }, [isAdmin]);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);
    useEffect(() => { listProfiles().then(setProfiles).catch(() => {}); }, []);
    useEffect(() => { if (isAdmin) listUsers().then(setUsers).catch(() => {}); }, [isAdmin]);

    const openCreate = (prefilledDate = '', prefilledTime = '', prefilledDuration = '') => {
        setEditCall((prefilledDate || prefilledTime)
            ? { date: prefilledDate ? `${prefilledDate}T00:00:00.000Z` : '', time: prefilledTime || '', duration: prefilledDuration || '' }
            : null);
        setDialogOpen(true);
    };

    const openEdit = (call) => { setEditCall(call); setDialogOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await deleteCall(deleteId); } catch { }
        setDeleteId(null);
        fetchCalls();
    };

    const handleDayBack = (dayOrNull) => setSelectedDay(dayOrNull);

    return (
        <Box sx={{ p: 3, maxWidth: isAdmin ? 1200 : 1000, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #0d47a1, #1976d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(13,71,161,0.25)' }}>
                    <PhoneIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#263238', flex: 1 }}>
                    {isAdmin ? 'All Calls' : 'My Calls'}
                </Typography>
                <Chip label={`${calls.length} record${calls.length !== 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0' }} />
                {!selectedDay && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreate()}
                        sx={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 2px 8px rgba(13,71,161,0.3)', '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' } }}>
                        Add Call
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                </Box>
            ) : isAdmin ? (
                <>
                    {selectedDay ? (
                        <DayDetailView
                            date={selectedDay}
                            calls={calls}
                            onBack={handleDayBack}
                            onEdit={openEdit}
                            onAdd={openCreate}
                        />
                    ) : (
                        <>
                            <Tabs value={adminTab} onChange={(_, v) => setAdminTab(v)}
                                sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', minHeight: 40 }}
                                slotProps={{ indicator: { style: { background: '#1a73e8' } } }}>
                                <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label="Week"
                                    sx={{ textTransform: 'none', fontWeight: 500, minHeight: 40, color: '#5f6368', fontSize: '0.9rem', '&.Mui-selected': { color: '#1a73e8', fontWeight: 600 } }} />
                                <Tab icon={<TableChartIcon fontSize="small" />} iconPosition="start" label="Table"
                                    sx={{ textTransform: 'none', fontWeight: 500, minHeight: 40, color: '#5f6368', fontSize: '0.9rem', '&.Mui-selected': { color: '#1a73e8', fontWeight: 600 } }} />
                            </Tabs>
                            {adminTab === 0 && <WeekView calls={calls} onDayDetail={setSelectedDay} onAdd={openCreate} onEdit={openEdit} />}
                            {adminTab === 1 && <TableView calls={calls} onEdit={openEdit} onDelete={setDeleteId} />}
                        </>
                    )}
                </>
            ) : (
                <CallerList calls={calls} onEdit={openEdit} onDelete={setDeleteId} />
            )}

            <CallFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editCall={editCall} profiles={profiles} onSaved={fetchCalls} isAdmin={isAdmin} users={users} currentUser={user} />

            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete Call</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this call record?</Typography></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ color: '#546e7a', borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Calls;
