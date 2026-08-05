import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// Each caller gets their own calendar colour — first caller blue, second red,
// and so on. Assignment is by position in the caller list (sorted by email) so
// the same person keeps the same colour across views and reloads. An admin can
// override any of them, which is stored on the user as `callColor`.
export const CALLER_PALETTE = [
    { bg: '#1a73e8', text: '#fff', name: 'Blue' },
    { bg: '#d93025', text: '#fff', name: 'Red' },
    { bg: '#188038', text: '#fff', name: 'Green' },
    { bg: '#8e24aa', text: '#fff', name: 'Purple' },
    { bg: '#e8710a', text: '#fff', name: 'Orange' },
    { bg: '#00796b', text: '#fff', name: 'Teal' },
    { bg: '#c2185b', text: '#fff', name: 'Pink' },
    { bg: '#5d4037', text: '#fff', name: 'Brown' },
    { bg: '#3949ab', text: '#fff', name: 'Indigo' },
    { bg: '#827717', text: '#fff', name: 'Olive' },
    { bg: '#0097a7', text: '#fff', name: 'Cyan' },
    { bg: '#6d4c41', text: '#fff', name: 'Mocha' },
];

export const UNASSIGNED_COLOR = { bg: '#9aa0a6', text: '#fff', name: 'Unassigned' };

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Readable foreground for an arbitrary admin-picked background.
export function textOn(hex) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#fff';
    const n = parseInt(m[1], 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.62 ? '#3c4043' : '#fff';
}

// Everyone who can own a call, in the stable order the palette is handed out in.
export function callerListFromUsers(users) {
    return (users || [])
        .filter(u => u.role === 'caller' || u.role === 'admin')
        .map(u => ({ id: u._id, email: u.email || '', callColor: u.callColor || null }))
        .sort((a, b) => a.email.localeCompare(b.email));
}

// Builds id → colour entry. `callerList` must already be in a stable order.
// A colour the admin picked for a caller always wins over the palette slot.
export function buildCallerColors(callerList) {
    const map = {};
    callerList.forEach((c, i) => {
        const auto = CALLER_PALETTE[i % CALLER_PALETTE.length];
        map[c.id] = c.callColor
            ? { bg: c.callColor, text: textOn(c.callColor), name: 'Custom', email: c.email, custom: true }
            : { ...auto, email: c.email, custom: false };
    });
    return map;
}

// ─── Caller Colour Picker (admin only) ───────────────────────────────────────
// Lets an admin override the auto-assigned calendar colour for one caller.
// `onSave(callerId, hexOrEmptyString)` should reject on failure so the error
// surfaces here; an empty string clears the override.
export default function CallerColorPicker({ anchorEl, caller, currentColor, onSave, onClose }) {
    const [custom, setCustom] = useState(currentColor || '#1a73e8');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setCustom(currentColor || '#1a73e8'); setError(''); }, [caller?.id, currentColor]);

    const commit = async (color) => {
        if (color && !HEX_RE.test(color)) {
            setError('Use a 6-digit hex colour like #1a73e8');
            return;
        }
        setSaving(true); setError('');
        try {
            await onSave(caller.id, color);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Could not save the colour');
            setSaving(false);
        }
    };

    return (
        <Popover open anchorEl={anchorEl} onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, width: 246, boxShadow: '0 4px 24px rgba(0,0,0,0.22)' } } }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#3c4043', mb: 0.25 }}>Calendar colour</Typography>
            <Typography noWrap sx={{ fontSize: '0.7rem', color: '#70757a', mb: 1 }}>{caller?.email}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.75, mb: 1.25 }}>
                {CALLER_PALETTE.map(p => (
                    <Tooltip key={p.bg} title={p.name}>
                        <Box onClick={() => !saving && commit(p.bg)}
                            sx={{
                                width: 28, height: 28, borderRadius: '50%', background: p.bg, cursor: saving ? 'default' : 'pointer',
                                border: (currentColor || '').toLowerCase() === p.bg.toLowerCase() ? '2px solid #3c4043' : '2px solid transparent',
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                                transition: 'transform 0.12s',
                                '&:hover': { transform: saving ? 'none' : 'scale(1.15)' },
                            }} />
                    </Tooltip>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                <Box component="input" type="color" value={HEX_RE.test(custom) ? custom : '#1a73e8'} disabled={saving}
                    onChange={e => setCustom(e.target.value)}
                    sx={{ width: 34, height: 30, p: 0, border: '1px solid #dadce0', borderRadius: 1, background: 'none', cursor: 'pointer', flexShrink: 0 }} />
                <TextField value={custom} onChange={e => setCustom(e.target.value)} size="small" placeholder="#1a73e8"
                    sx={{ flex: 1, '& .MuiInputBase-input': { py: '6px', fontSize: '0.78rem', fontFamily: 'monospace' } }} />
                <Button size="small" variant="contained" disabled={saving} onClick={() => commit(custom)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5, minWidth: 0, px: 1.25, background: 'linear-gradient(135deg, #0d47a1, #1976d2)' }}>
                    Set
                </Button>
            </Box>

            {error && <Typography sx={{ fontSize: '0.72rem', color: '#c62828', mb: 0.75 }}>{error}</Typography>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f0f0f0' }}>
                <Button size="small" disabled={saving || !currentColor} onClick={() => commit('')}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#5f6368', px: 0, minWidth: 0 }}>
                    Reset to auto
                </Button>
                <Button size="small" onClick={onClose} sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#5f6368', px: 0, minWidth: 0 }}>
                    Close
                </Button>
            </Box>
        </Popover>
    );
}
