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

export async function listMyProfiles() {
    const res = await axios.get(`${API}/api/users/my-profiles`, { headers: authHeader() });
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

// Self-service assignment: the signed-in caller takes an unassigned call.
export async function claimCall(callId) {
    const res = await axios.put(`${API}/api/calls/${callId}/claim`, {}, { headers: authHeader() });
    return res.data;
}

// Hand a call back to the unassigned pool.
export async function releaseCall(callId) {
    const res = await axios.put(`${API}/api/calls/${callId}/release`, {}, { headers: authHeader() });
    return res.data;
}

export async function deleteCall(callId) {
    const res = await axios.delete(`${API}/api/calls/${callId}`, { headers: authHeader() });
    return res.data;
}
