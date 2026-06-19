import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getResumeCounts({ granularity, startDate, endDate, profileId } = {}) {
    const params = {};
    if (granularity) params.granularity = granularity;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (profileId) params.profileId = profileId;
    const res = await axios.get(`${API}/api/analytics/resume-counts`, {
        headers: authHeader(),
        params,
    });
    return res.data;
}
