import { useState, useRef, useEffect } from 'react';
import { generateResume, generateApplicationAnswer, getMyProfiles } from '../api/resume.api';
import { listProfiles } from '../api/admin.api';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import LinkIcon from '@mui/icons-material/Link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';

const Dashboard = ({ user, onResumeGenerated }) => {
    const [jobUrl, setJobUrl] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [resume, setResume] = useState('');
    const callInProgress = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfFileName, setPdfFileName] = useState('resume.pdf');
    const [clearanceDialog, setClearanceDialog] = useState(false);
    const [clearanceWords, setClearanceWords] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [answerLoading, setAnswerLoading] = useState(false);
    const [answerError, setAnswerError] = useState('');
    const match = jobUrl.match(/jk=([^&]+)/);
    const jkValue = match ? match[1] : jobUrl;

    const isCaller = user.role === 'caller';
    const isAdmin = user.role === 'admin';
    const isBidder = user.role === 'bidder';

    useEffect(() => {
        if (isAdmin) {
            // Admin sees all profiles
            listProfiles()
                .then(data => {
                    setProfiles(data);
                    if (data.length > 0) setSelectedProfileId(data[0]._id);
                })
                .catch(() => setProfiles([]));
        } else {
            // Bidder and caller use their assigned profiles
            getMyProfiles()
                .then(data => {
                    setProfiles(data);
                    if (data.length > 0) setSelectedProfileId(data[0]._id);
                })
                .catch(() => setProfiles([]));
        }
    }, [isCaller, isAdmin, isBidder]);

    const sanitizeFilePart = (value, fallback) => {
        const cleaned = String(value || '')
            .trim()
            .replace(/[^a-z0-9._-]+/gi, '-')
            .replace(/^-+|-+$/g, '');
        return cleaned || fallback;
    };

    const getResumeFileName = () => {
        const selectedProfile = profiles.find(p => p._id === selectedProfileId);
        const profileName = sanitizeFilePart(selectedProfile?.name, 'resume');
        const jobKey = sanitizeFilePart(jkValue, 'job');
        return `${profileName}-${jobKey}.pdf`;
    };

    const downloadPdf = (url, fileName) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        }));
        document.body.removeChild(link);
    };

    const handleGenerate = async () => {
        if (callInProgress.current) return;

        // Check for clearance/federal keywords
        const lowerDesc = jobDesc.toLowerCase();
        const found = [];
        if (lowerDesc.includes('clearance')) found.push('clearance');
        if (lowerDesc.includes('federal')) found.push('federal');
        if (found.length > 0) {
            setClearanceWords(found);
            setClearanceDialog(true);
            return;
        }

        if (!selectedProfileId) {
            setError(isBidder ? 'No profile assigned. Contact your admin.' : 'Please select a profile');
            return;
        }

        callInProgress.current = true;
        setLoading(true);
        setError('');
        setResume('');
        setQuestion('');
        setAnswer('');
        setAnswerError('');
        try {
            const pdfBlob = await generateResume(selectedProfileId, jobUrl, jobDesc);
            setResume('Resume generated!');
            if (onResumeGenerated) onResumeGenerated();
            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
            const fileName = getResumeFileName();
            setPdfUrl(url);
            setPdfFileName(fileName);
            downloadPdf(url, fileName);
        } catch (err) {
            setError('Failed to generate resume');
        }
        finally {
            setLoading(false);
            callInProgress.current = false;
        }
    };

    const handleDownloadCurrentResume = () => {
        if (pdfUrl) downloadPdf(pdfUrl, pdfFileName);
    };

    const handleClearResume = () => {
        if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setPdfFileName('resume.pdf');
        setResume('');
        setJobUrl('');
        setJobDesc('');
        setError('');
        setQuestion('');
        setAnswer('');
        setAnswerError('');
    };

    const handleGenerateAnswer = async () => {
        if (!selectedProfileId) {
            setAnswerError(isBidder ? 'No profile assigned. Contact your admin.' : 'Please select a profile');
            return;
        }
        if (!jobDesc.trim()) {
            setAnswerError('Job description is required');
            return;
        }
        if (!question.trim()) {
            setAnswerError('Enter a question first');
            return;
        }

        setAnswerLoading(true);
        setAnswerError('');
        setAnswer('');
        try {
            const data = await generateApplicationAnswer(selectedProfileId, jobUrl, jobDesc, question);
            setAnswer(data.answer || '');
        } catch (err) {
            setAnswerError(err.response?.data?.error || 'Failed to generate answer');
        } finally {
            setAnswerLoading(false);
        }
    };

    const showProfileSelector = (isCaller || isAdmin) && profiles.length > 0;

    return (
        <>
            {/* Clearance/Federal Warning Dialog */}
            <Dialog
                open={clearanceDialog}
                onClose={() => setClearanceDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 1,
                        minWidth: 420,
                        border: '2px solid #ef5350',
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#c62828', fontWeight: 700 }}>
                    <GavelIcon sx={{ color: '#ef5350', fontSize: 28 }} />
                    Clearance / Federal Detected
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2, color: '#424242' }}>
                        The job description contains restricted keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {clearanceWords.map(word => (
                            <Chip
                                key={word}
                                label={`"${word}"`}
                                color="error"
                                variant="outlined"
                                icon={<WarningAmberIcon />}
                                sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                            />
                        ))}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#616161' }}>
                        Resume generation has been stopped. This position requires clearance or federal qualification.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setClearanceDialog(false)}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Main Layout */}
            <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'linear-gradient(160deg, #e8edf5 0%, #d6e0f0 40%, #c9d6e8 100%)' }}>
                {/* Left Sidebar */}
                <Paper
                    elevation={0}
                    sx={{
                        width: '28%',
                        minWidth: 280,
                        borderRadius: 0,
                        borderRight: '1px solid rgba(0,0,0,0.08)',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <DescriptionOutlinedIcon sx={{ color: '#1565c0', fontSize: 22 }} />
                        <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 700, fontSize: '1.05rem', flex: 1 }}>
                            Job Details
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleClearResume}
                            disabled={loading}
                            startIcon={<ClearIcon />}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                borderColor: '#cfd8dc',
                                color: '#546e7a',
                                '&:hover': { background: '#eceff1', borderColor: '#90a4ae' },
                            }}
                        >
                            Clear
                        </Button>
                    </Box>

                    {showProfileSelector && (
                        <TextField
                            select
                            label="Select Profile"
                            value={selectedProfileId}
                            onChange={e => setSelectedProfileId(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    background: '#f8fafc',
                                    borderRadius: 2,
                                    '&:hover fieldset': { borderColor: '#90caf9' },
                                    '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                                },
                            }}
                        >
                            {profiles.map(p => (
                                <MenuItem key={p._id} value={p._id}>{p.name} ({p.email})</MenuItem>
                            ))}
                        </TextField>
                    )}

                    {isBidder && profiles.length > 0 && (
                        <Paper elevation={0} sx={{ p: 1.5, mb: 2, background: '#e3f2fd', borderRadius: 2, border: '1px solid #bbdefb' }}>
                            <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '0.85rem' }}>
                                Profile: {profiles[0].name}
                            </Typography>
                        </Paper>
                    )}

                    {isBidder && profiles.length === 0 && (
                        <Paper elevation={0} sx={{ p: 1.5, mb: 2, background: '#fff3e0', borderRadius: 2, border: '1px solid #ffe0b2' }}>
                            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 500, fontSize: '0.85rem' }}>
                                No profile assigned. Contact your admin.
                            </Typography>
                        </Paper>
                    )}

                    <TextField
                        label="Job URL"
                        value={jobUrl}
                        onChange={e => setJobUrl(e.target.value)}
                        fullWidth
                        margin="none"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LinkIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                background: '#f8fafc',
                                borderRadius: 2,
                                '&:hover fieldset': { borderColor: '#90caf9' },
                                '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                            },
                        }}
                    />

                    <TextField
                        label="Job Description"
                        value={jobDesc}
                        onChange={e => setJobDesc(e.target.value)}
                        fullWidth
                        multiline
                        rows={18}
                        margin="none"
                        sx={{
                            mb: 2,
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                                background: '#f8fafc',
                                borderRadius: 2,
                                alignItems: 'flex-start',
                                '&:hover fieldset': { borderColor: '#90caf9' },
                                '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                            },
                        }}
                    />

                    <Box sx={{ position: 'relative', mt: 'auto' }}>
                        <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleGenerate}
                                disabled={loading}
                                startIcon={loading ? null : <AutoAwesomeIcon />}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
                                    boxShadow: '0 4px 14px 0 rgba(13, 71, 161, 0.35)',
                                    textTransform: 'none',
                                    letterSpacing: '0.3px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #002171 0%, #0d47a1 50%, #1565c0 100%)',
                                        boxShadow: '0 6px 20px 0 rgba(13, 71, 161, 0.45)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:disabled': {
                                        background: '#b0bec5',
                                    },
                                }}
                            >
                                {loading ? 'Generating...' : 'Generate Resume'}
                            </Button>
                            {loading && (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        mt: '-12px',
                                        ml: '-12px',
                                        color: '#fff',
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {error && (
                        <Paper
                            elevation={0}
                            sx={{
                                mt: 2,
                                p: 1.5,
                                background: '#fce4ec',
                                borderRadius: 2,
                                border: '1px solid #ef9a9a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <WarningAmberIcon sx={{ color: '#c62828', fontSize: 20 }} />
                            <Typography sx={{ color: '#c62828', fontWeight: 500, fontSize: '0.85rem' }}>{error}</Typography>
                        </Paper>
                    )}

                    {resume && !error && (
                        <Paper
                            elevation={0}
                            sx={{
                                mt: 2,
                                p: 1.5,
                                background: '#e8f5e9',
                                borderRadius: 2,
                                border: '1px solid #a5d6a7',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
                            <Typography sx={{ color: '#2e7d32', fontWeight: 500, fontSize: '0.85rem' }}>{resume}</Typography>
                        </Paper>
                    )}
                </Paper>

                {/* Right Preview Panel */}
                <Box sx={{ flex: 1, p: 3, display: 'grid', gridTemplateColumns: 'minmax(620px, 0.58fr) minmax(420px, 0.42fr)', gap: 2, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5" sx={{ color: '#263238', fontWeight: 700, fontSize: '1.3rem' }}>
                                Preview
                            </Typography>
                            {pdfUrl && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="PDF Ready"
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownloadCurrentResume}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderColor: '#bbdefb',
                                            color: '#1565c0',
                                            '&:hover': { background: '#e3f2fd', borderColor: '#1565c0' },
                                        }}
                                    >
                                        Download
                                    </Button>
                                </Box>
                            )}
                        </Box>
                        <Paper
                            elevation={0}
                            sx={{
                                flex: 1,
                                minHeight: 0,
                                border: '1px solid rgba(0,0,0,0.08)',
                                background: '#fff',
                                borderRadius: 3,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}
                        >
                            {pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                    title="Resume Preview"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <DescriptionOutlinedIcon sx={{ fontSize: 64, color: '#cfd8dc', mb: 2 }} />
                                    <Typography sx={{ color: '#90a4ae', fontSize: '1rem', fontWeight: 500 }}>
                                        Paste a job description and click Generate
                                    </Typography>
                                    <Typography sx={{ color: '#b0bec5', fontSize: '0.85rem', mt: 0.5 }}>
                                        Your resume will appear here
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            alignSelf: 'stretch',
                            p: 2,
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: '#fff',
                            borderRadius: 3,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <QuestionAnswerIcon sx={{ color: '#1565c0', fontSize: 22 }} />
                            <Typography variant="h6" sx={{ color: '#263238', fontWeight: 700, fontSize: '1.05rem', flex: 1 }}>
                                Question & Answer
                            </Typography>
                            {answerLoading && <CircularProgress size={20} sx={{ color: '#1565c0' }} />}
                        </Box>
                        <TextField
                            label="Application Question"
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            size="small"
                            placeholder="Paste the company's question here"
                            sx={{
                                mb: 1.5,
                                '& .MuiOutlinedInput-root': {
                                    background: '#f8fafc',
                                    borderRadius: 2,
                                    '&:hover fieldset': { borderColor: '#90caf9' },
                                    '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                                },
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                onClick={handleGenerateAnswer}
                                disabled={answerLoading || loading}
                                startIcon={answerLoading ? null : <AutoAwesomeIcon />}
                                fullWidth
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    py: 1.15,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                                    '&:hover': { background: 'linear-gradient(135deg, #002171, #0d47a1)' },
                                }}
                            >
                                {answerLoading ? 'Generating...' : 'Generate Answer'}
                            </Button>
                        </Box>
                        {answerError && (
                            <Paper elevation={0} sx={{ mt: 1.5, p: 1.25, background: '#fce4ec', borderRadius: 2, border: '1px solid #ef9a9a' }}>
                                <Typography sx={{ color: '#c62828', fontWeight: 500, fontSize: '0.85rem' }}>{answerError}</Typography>
                            </Paper>
                        )}
                        {answer && (
                            <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, background: '#f8fafc', borderRadius: 2, border: '1px solid #dbe4ef', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                <Typography sx={{ color: '#263238', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                                    {answer}
                                </Typography>
                            </Paper>
                        )}
                    </Paper>
                </Box>
            </Box>
        </>
    );
};

export default Dashboard;
