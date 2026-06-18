import React from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import AdminPanel from './pages/AdminPanel';
import Calls from './pages/Calls';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhoneIcon from '@mui/icons-material/Phone';
import theme from './theme';

const allNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, roles: ['admin', 'caller', 'bidder'] },
    { key: 'analytics', label: 'Analytics', icon: <BarChartIcon fontSize="small" />, roles: ['admin', 'bidder'] },
    { key: 'search', label: 'Search', icon: <SearchIcon fontSize="small" />, roles: ['admin', 'caller'] },
    { key: 'calls', label: 'Calls', icon: <PhoneIcon fontSize="small" />, roles: ['admin', 'caller'] },
    { key: 'admin', label: 'Admin', icon: <AdminPanelSettingsIcon fontSize="small" />, roles: ['admin'] },
];

function getNavItems(role) {
    return allNavItems.filter(item => item.roles.includes(role || 'bidder'));
}

function App() {
    const getInitial = (key, fallback) => {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return fallback;
            if (key === 'user') return JSON.parse(val);
            return val;
        } catch {
            return fallback;
        }
    };
    const [step, setStep] = React.useState(() => getInitial('step', 'login'));
    const [user, setUser] = React.useState(() => getInitial('user', null));
    const [mainPage, setMainPage] = React.useState(() => getInitial('mainPage', 'dashboard'));
    const [resumeCount, setResumeCount] = React.useState(0);

    const role = user?.role || 'bidder';
    const navItems = getNavItems(role);

    React.useEffect(() => { localStorage.setItem('step', step); }, [step]);
    React.useEffect(() => { localStorage.setItem('mainPage', mainPage); }, [mainPage]);
    React.useEffect(() => { localStorage.setItem('user', user ? JSON.stringify(user) : ''); }, [user]);

    // Reset mainPage if not in allowed items after role change
    React.useEffect(() => {
        const allowedKeys = navItems.map(i => i.key);
        if (!allowedKeys.includes(mainPage)) {
            setMainPage('dashboard');
        }
    }, [role, navItems, mainPage]);

    const handleLogout = () => {
        setUser(null);
        setStep('login');
        localStorage.removeItem('user');
        localStorage.removeItem('step');
        localStorage.removeItem('mainPage');
        localStorage.removeItem('token');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8edf5 0%, #d6e0f0 40%, #c9d6e8 100%)' }}>
                {step === 'login' && (
                    <Login
                        onLogin={data => {
                            localStorage.setItem('token', data.token);
                            setUser(data.user);
                            setStep('dashboard');
                            setMainPage('dashboard');
                        }}
                        onGoRegister={() => setStep('register')}
                    />
                )}
                {step === 'register' && (
                    <>
                        <Register onRegister={() => setStep('login')} />
                        <Box sx={{ textAlign: 'center', mt: 2, pb: 4 }}>
                            <Typography variant="body2" sx={{ color: '#546e7a' }}>Already have an account?</Typography>
                            <Button variant="text" color="primary" onClick={() => setStep('login')} sx={{ fontWeight: 600 }}>Login</Button>
                        </Box>
                    </>
                )}
                {step === 'dashboard' && user && (
                    <>
                        <AppBar
                            position="sticky"
                            elevation={0}
                            sx={{
                                background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Toolbar sx={{ justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <DescriptionIcon sx={{ fontSize: 28, color: '#bbdefb' }} />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 800,
                                            letterSpacing: '-0.5px',
                                            background: 'linear-gradient(90deg, #e3f2fd, #bbdefb)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        ResumeAI
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {navItems.map(item => (
                                        <Button
                                            key={item.key}
                                            startIcon={item.icon}
                                            onClick={() => setMainPage(item.key)}
                                            sx={{
                                                color: mainPage === item.key ? '#fff' : 'rgba(255,255,255,0.7)',
                                                fontWeight: mainPage === item.key ? 700 : 500,
                                                fontSize: '0.85rem',
                                                px: 2,
                                                py: 1,
                                                borderRadius: 2,
                                                background: mainPage === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                                                backdropFilter: mainPage === item.key ? 'blur(10px)' : 'none',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: 'rgba(255,255,255,0.2)',
                                                    color: '#fff',
                                                },
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar
                                        sx={{
                                            width: 34,
                                            height: 34,
                                            bgcolor: '#e3f2fd',
                                            color: '#0d47a1',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, display: { xs: 'none', md: 'block' } }}>
                                        {user.email || 'User'}
                                    </Typography>
                                    <IconButton
                                        onClick={handleLogout}
                                        sx={{
                                            color: 'rgba(255,255,255,0.7)',
                                            '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' },
                                        }}
                                        size="small"
                                    >
                                        <LogoutIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Toolbar>
                        </AppBar>

                        <Box sx={{ mt: 0 }}>
                            {mainPage === 'dashboard' && (
                                <Dashboard user={user} onResumeGenerated={() => setResumeCount(c => c + 1)} />
                            )}
                            {mainPage === 'analytics' && (
                                <Analytics resumeCount={resumeCount} user={user} />
                            )}
                            {mainPage === 'search' && (
                                <Search user={user} />
                            )}
                            {mainPage === 'admin' && role === 'admin' && (
                                <AdminPanel />
                            )}
                            {mainPage === 'calls' && (role === 'caller' || role === 'admin') && (
                                <Calls user={user} />
                            )}
                        </Box>
                    </>
                )}
            </Box>
        </ThemeProvider>
    );
}

export default App;
