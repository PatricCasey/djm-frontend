import { useState, useEffect } from 'react';
import { searchResumes } from '../api/resume.api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const Search = ({ user }) => {
    const [keyword, setKeyword] = useState('');
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    useEffect(() => {
        setLoading(true);
        searchResumes(keyword, page)
            .then(data => {
                setResumes(data.resumes || []);
                setTotal(data.total || 0);
                setPages(data.pages || 1);
            })
            .catch(() => {
                setResumes([]);
                setTotal(0);
                setPages(1);
            })
            .finally(() => setLoading(false));
    }, [keyword, page]);

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
                    <SearchIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#263238' }}>
                    Search Resumes
                </Typography>
                {total > 0 && (
                    <Chip
                        label={`${total} result${total !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            ml: 1,
                            fontWeight: 600,
                            background: '#e3f2fd',
                            color: '#1565c0',
                        }}
                    />
                )}
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    background: '#fff',
                }}
            >
                <TextField
                    placeholder="Search by keyword..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            background: '#f8fafc',
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: '#90caf9' },
                            '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                        },
                    }}
                />
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={36} sx={{ color: '#1565c0' }} />
                </Box>
            ) : resumes.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        background: '#fff',
                    }}
                >
                    <SearchIcon sx={{ fontSize: 48, color: '#cfd8dc', mb: 1 }} />
                    <Typography sx={{ color: '#90a4ae', fontWeight: 500 }}>No resumes found</Typography>
                </Paper>
            ) : (
                <>
                    {resumes.map(resume => (
                        <Paper
                            key={resume._id}
                            elevation={0}
                            sx={{
                                p: 2.5,
                                mb: 2,
                                borderRadius: 2.5,
                                border: '1px solid rgba(0,0,0,0.06)',
                                background: '#fff',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#90caf9',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <PictureAsPdfIcon sx={{ color: '#ef5350', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#263238', fontSize: '0.95rem', flex: 1 }}>
                                    {resume.profile?.name || 'Unknown'} - {resume.jobUrl || 'No URL'}
                                </Typography>
                                {resume.profile && (
                                    <Chip
                                        icon={<PersonIcon />}
                                        label={resume.profile.name || resume.profile.email}
                                        size="small"
                                        sx={{ fontWeight: 500, background: '#e3f2fd', color: '#1565c0' }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AccessTimeIcon sx={{ color: '#90a4ae', fontSize: 16 }} />
                                <Typography variant="body2" sx={{ color: '#78909c', fontSize: '0.82rem' }}>
                                    {resume.createdAt ? new Date(resume.createdAt).toLocaleString() : '--'}
                                </Typography>
                            </Box>

                            {resume.jobUrl && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <OpenInNewIcon sx={{ color: '#90a4ae', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                                        <a
                                            href={resume.jobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#1565c0', textDecoration: 'none' }}
                                        >
                                            {resume.jobUrl.length > 80 ? resume.jobUrl.substring(0, 80) + '...' : resume.jobUrl}
                                        </a>
                                    </Typography>
                                </Box>
                            )}

                            {resume.jobDesc && (
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#546e7a' }}>
                                            Job Description
                                        </Typography>
                                        <Tooltip title={copiedId === `jd-${resume._id}` ? 'Copied!' : 'Copy'}>
                                            <IconButton size="small" onClick={() => handleCopy(resume.jobDesc, `jd-${resume._id}`)}
                                                sx={{ color: copiedId === `jd-${resume._id}` ? '#2e7d32' : '#90a4ae', p: 0.3 }}>
                                                {copiedId === `jd-${resume._id}` ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        component="pre"
                                        sx={{
                                            color: '#78909c',
                                            fontSize: '0.82rem',
                                            p: 1.5,
                                            background: '#f8fafc',
                                            borderRadius: 1.5,
                                            border: '1px solid #eceff1',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontFamily: 'inherit',
                                            userSelect: 'text',
                                            cursor: 'text',
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {resume.jobDesc}
                                    </Typography>
                                </Box>
                            )}

                            {resume.resumeText && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0' }}>
                                            Resume Text
                                        </Typography>
                                        <Tooltip title={copiedId === `rt-${resume._id}` ? 'Copied!' : 'Copy'}>
                                            <IconButton size="small" onClick={() => handleCopy(resume.resumeText.replace(/<<|>>/g, ''), `rt-${resume._id}`)}
                                                sx={{ color: copiedId === `rt-${resume._id}` ? '#2e7d32' : '#90a4ae', p: 0.3 }}>
                                                {copiedId === `rt-${resume._id}` ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        component="pre"
                                        sx={{
                                            color: '#455a64',
                                            fontSize: '0.82rem',
                                            p: 1.5,
                                            background: '#f1f8ff',
                                            borderRadius: 1.5,
                                            border: '1px solid #bbdefb',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontFamily: 'inherit',
                                            userSelect: 'text',
                                            cursor: 'text',
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {resume.resumeText.replace(/<<|>>/g, '')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 2,
                            mt: 3,
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            startIcon={<NavigateBeforeIcon />}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: '#bbdefb',
                                color: '#1565c0',
                                '&:hover': { borderColor: '#1565c0', background: '#e3f2fd' },
                            }}
                        >
                            Previous
                        </Button>
                        <Chip
                            label={`${page} / ${pages}`}
                            size="small"
                            sx={{ fontWeight: 600, background: '#e3f2fd', color: '#1565c0', px: 1 }}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={page >= pages}
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            endIcon={<NavigateNextIcon />}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: '#bbdefb',
                                color: '#1565c0',
                                '&:hover': { borderColor: '#1565c0', background: '#e3f2fd' },
                            }}
                        >
                            Next
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default Search;
