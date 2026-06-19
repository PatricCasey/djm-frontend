import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listCalls() {
    const res = await axios.get(`${API}/api/calls`, { headers: authHeader() });
    return res.data;
}

export async function listAllCalls() {
    const res = await axios.get(`${API}/api/calls/all`, { headers: authHeader() });
    return res.data;
}

export async function createCall(data) {
    const res = await axios.post(`${API}/api/calls`, data, { headers: authHeader() });
    return res.data;
}

export async function updateCall(callId, data) {
    const res = await axios.put(`${API}/api/calls/${callId}`, data, { headers: authHeader() });
    return res.data;
}

export async function deleteCall(callId) {
    const res = await axios.delete(`${API}/api/calls/${callId}`, { headers: authHeader() });
    return res.data;
}
