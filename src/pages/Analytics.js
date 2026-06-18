import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import ResumeChart from '../components/ResumeChart';
import { getResumeCounts } from '../api/analytics.api';
import { listProfiles } from '../api/admin.api';
import { listCalls, listAllCalls } from '../api/calls.api';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';

const STEP_LABELS = { 'pre-screening': 'Pre-screening', screening: 'Screening', technical: 'Technical', final: 'Final' };
const STEP_COLORS = {
    'pre-screening': '#42a5f5',
    'screening': '#66bb6a',
    'technical': '#ffa726',
    'final': '#ef5350',
};

const Analytics = ({ user }) => {
    const [counts, setCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [granularity, setGranularity] = useState('daily');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [profileId, setProfileId] = useState('');
    const [callsData, setCallsData] = useState([]);
    const [callsLoading, setCallsLoading] = useState(true);

    const isAdmin = user?.role === 'admin';
    const isCaller = user?.role === 'caller';

    useEffect(() => {
        if (isAdmin) {
            listProfiles().then(setProfiles).catch(() => {});
        }
    }, [isAdmin]);

    useEffect(() => {
        if (!isCaller) {
            setCallsLoading(false);
            return;
        }
        setCallsLoading(true);
        listCalls()
            .then(setCallsData)
            .catch(() => {})
            .finally(() => setCallsLoading(false));
    }, [isCaller]);

    const fetchCounts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getResumeCounts({ granularity, startDate, endDate, profileId: profileId || undefined });
            setCounts(data);
        } catch {
            setError('Failed to load analytics');
        }
        setLoading(false);
    }, [granularity, startDate, endDate, profileId]);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);

    const totalCount = counts.reduce((sum, row) => sum + row.count, 0);

    const stepCounts = {
        total: callsData.length,
        'pre-screening': callsData.filter(c => c.step === 'pre-screening').length,
        screening: callsData.filter(c => c.step === 'screening').length,
        technical: callsData.filter(c => c.step === 'technical').length,
        final: callsData.filter(c => c.step === 'final').length,
    };

    const statCards = [
        { key: 'total', label: 'Total Calls', count: stepCounts.total, color: '#1565c0' },
        { key: 'pre-screening', label: 'Pre-screening', count: stepCounts['pre-screening'], color: STEP_COLORS['pre-screening'] },
        { key: 'screening', label: 'Screening', count: stepCounts.screening, color: STEP_COLORS.screening },
        { key: 'technical', label: 'Technical', count: stepCounts.technical, color: STEP_COLORS.technical },
        { key: 'final', label: 'Final', count: stepCounts.final, color: STEP_COLORS.final },
    ];

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            background: '#f8fafc',
            borderRadius: 2,
            '&:hover fieldset': { borderColor: '#90caf9' },
            '&.Mui-focused fieldset': { borderColor: '#1565c0' },
        },
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(13, 71, 161, 0.25)',
                    }}
                >
                    <BarChartIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#263238' }}>
                    Analytics
                </Typography>
                {totalCount > 0 && (
                    <Chip
                        label={`${totalCount} total`}
                        size="small"
                        sx={{ ml: 1, fontWeight: 600, background: '#e3f2fd', color: '#1565c0' }}
                    />
                )}
            </Box>

            {/* Controls */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <TextField
                    select
                    label="Granularity"
                    value={granularity}
                    onChange={e => setGranularity(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150, ...inputSx }}
                >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="total">Total</MenuItem>
                </TextField>

                {isAdmin && (
                    <TextField
                        select
                        label="Profile"
                        value={profileId}
                        onChange={e => setProfileId(e.target.value)}
                        size="small"
                        sx={{ minWidth: 180, ...inputSx }}
                        InputProps={{
                            startAdornment: <PersonIcon sx={{ color: '#90a4ae', fontSize: 18, mr: 0.5 }} />,
                        }}
                    >
                        <MenuItem value="">All Profiles</MenuItem>
                        {profiles.map(p => (
                            <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                        ))}
                    </TextField>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ color: '#90a4ae', fontSize: 18 }} />
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 160, ...inputSx }}
                    />
                    <Typography sx={{ color: '#90a4ae', fontWeight: 500 }}>to</Typography>
                    <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 160, ...inputSx }}
                    />
                </Box>

                {(startDate || endDate) && (
                    <Chip
                        label="Clear dates"
                        size="small"
                        onDelete={() => { setStartDate(''); setEndDate(''); }}
                        sx={{ fontWeight: 500, background: '#fce4ec', color: '#c62828' }}
                    />
                )}
            </Paper>

            {/* Call Statistics — only for caller role */}
            {isCaller && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 2,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        background: '#fff',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PhoneIcon sx={{ fontSize: 20, color: '#546e7a' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#263238' }}>
                            Call Statistics
                        </Typography>
                    </Box>
                    {callsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={28} sx={{ color: '#1565c0' }} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {statCards.map(card => (
                                <Paper
                                    key={card.key}
                                    elevation={0}
                                    sx={{
                                        flex: '1 1 150px',
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        borderLeft: `4px solid ${card.color}`,
                                        background: '#fafbfc',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1.2 }}>
                                        {card.count}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#546e7a', mt: 0.5 }}>
                                        {card.label}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Paper>
            )}

            {/* Chart */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    background: '#fff',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                    </Box>
                ) : error ? (
                    <Typography sx={{ color: '#c62828', textAlign: 'center', py: 4 }}>{error}</Typography>
                ) : counts.length === 0 ? (
                    <Typography sx={{ color: '#90a4ae', textAlign: 'center', py: 4 }}>No data for the selected range.</Typography>
                ) : granularity === 'total' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, color: '#1565c0' }}>{counts[0]?.count || 0}</Typography>
                        <Typography variant="body1" sx={{ color: '#78909c', mt: 1, fontWeight: 500 }}>
                            Total Resumes Generated
                            {startDate && endDate ? ` (${startDate} to ${endDate})` : startDate ? ` (from ${startDate})` : endDate ? ` (until ${endDate})` : ''}
                        </Typography>
                    </Box>
                ) : (
                    <ResumeChart data={counts} granularity={granularity} />
                )}
            </Paper>
        </Box>
    );
};

export default Analytics;
