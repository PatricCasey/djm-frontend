import React, { useState } from 'react';
import { login } from '../api/auth.api';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DescriptionIcon from '@mui/icons-material/Description';

const Login = ({ onLogin, onGoRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await login(email, password);
            onLogin(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(160deg, #e8edf5 0%, #d6e0f0 40%, #c9d6e8 100%)',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 0,
                    width: 420,
                    borderRadius: 4,
                    background: '#fff',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}
            >
                {/* Top accent bar */}
                <Box
                    sx={{
                        height: 6,
                        background: 'linear-gradient(90deg, #0d47a1, #1565c0, #1976d2, #42a5f5)',
                    }}
                />

                <Box sx={{ p: 4 }}>
                    {/* Logo and Title */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                                boxShadow: '0 4px 14px rgba(13, 71, 161, 0.3)',
                            }}
                        >
                            <DescriptionIcon sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e', letterSpacing: '-0.5px' }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78909c', mt: 0.5 }}>
                            Sign in to your ResumeAI account
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            type="email"
                            label="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailOutlinedIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    background: '#f8fafc',
                                    borderRadius: 2.5,
                                    '&:hover fieldset': { borderColor: '#90caf9' },
                                    '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                                },
                            }}
                        />
                        <TextField
                            type="password"
                            label="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    background: '#f8fafc',
                                    borderRadius: 2.5,
                                    '&:hover fieldset': { borderColor: '#90caf9' },
                                    '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                                },
                            }}
                        />

                        <Box sx={{ mt: 3, position: 'relative' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                sx={{
                                    background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    py: 1.5,
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px 0 rgba(13, 71, 161, 0.3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #002171 0%, #0d47a1 50%, #1565c0 100%)',
                                        boxShadow: '0 6px 20px 0 rgba(13, 71, 161, 0.4)',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            {loading && (
                                <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px', color: '#fff' }} />
                            )}
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
                                    textAlign: 'center',
                                }}
                            >
                                <Typography sx={{ color: '#c62828', fontWeight: 500, fontSize: '0.85rem' }}>{error}</Typography>
                            </Paper>
                        )}
                    </form>

                    <Divider sx={{ my: 3, color: '#b0bec5', fontSize: '0.8rem' }}>or</Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#78909c' }}>
                            Don't have an account?
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={onGoRegister}
                            fullWidth
                            sx={{
                                mt: 1.5,
                                borderRadius: 2.5,
                                fontWeight: 600,
                                textTransform: 'none',
                                py: 1.2,
                                borderColor: '#bbdefb',
                                color: '#1565c0',
                                '&:hover': {
                                    borderColor: '#1565c0',
                                    background: '#e3f2fd',
                                },
                            }}
                        >
                            Create Account
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default Login;
