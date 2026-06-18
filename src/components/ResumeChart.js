import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const labels = {
    daily: 'Daily Resume Generation',
    weekly: 'Weekly Resume Generation',
    monthly: 'Monthly Resume Generation',
};

const ResumeChart = ({ data, granularity = 'daily' }) => (
    <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#455a64' }}>
            {labels[granularity] || 'Resume Generation Over Time'}
        </Typography>
        <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1565c0" stopOpacity={1} />
                            <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#78909c', fontSize: 12 }}
                        axisLine={{ stroke: '#eceff1' }}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        domain={granularity === 'daily' ? [0, 200] : [0, 'auto']}
                        ticks={granularity === 'daily' ? [0, 100, 200] : undefined}
                        tick={{ fill: '#78909c', fontSize: 12 }}
                        axisLine={{ stroke: '#eceff1' }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </Box>
);

export default ResumeChart;
