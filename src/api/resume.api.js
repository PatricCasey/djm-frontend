import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function generateResume(profileId, jobUrl, jobDesc) {
    const res = await axios.post(
        `${API}/api/resume/generate`,
        { profileId, jobUrl, jobDesc },
        { headers: authHeader(), responseType: 'arraybuffer' }
    );
    return res.data;
}

export async function searchResumes(keyword, page = 1) {
    const res = await axios.get(`${API}/api/resume/search`, {
        headers: authHeader(),
        params: { keyword, page },
    });
    return res.data;
}

export async function getMyProfiles() {
    const res = await axios.get(`${API}/api/users/my-profiles`, { headers: authHeader() });
    return res.data;
}
