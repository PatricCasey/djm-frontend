import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Users
export async function listUsers() {
    const res = await axios.get(`${API}/api/admin/users`, { headers: authHeader() });
    return res.data;
}

export async function changeRole(userId, role) {
    const res = await axios.put(`${API}/api/admin/users/${userId}/role`, { role }, { headers: authHeader() });
    return res.data;
}

export async function assignProfile(userId, profileId) {
    const res = await axios.put(`${API}/api/admin/users/${userId}/assign-profile`, { profileId }, { headers: authHeader() });
    return res.data;
}

export async function assignProfiles(callerId, profileIds) {
    const res = await axios.put(`${API}/api/admin/users/${callerId}/assign-profiles`, { profileIds }, { headers: authHeader() });
    return res.data;
}

export async function toggleApproval(userId) {
    const res = await axios.put(`${API}/api/admin/users/${userId}/toggle-approval`, {}, { headers: authHeader() });
    return res.data;
}

// Profiles
export async function listProfiles() {
    const res = await axios.get(`${API}/api/admin/profiles`, { headers: authHeader() });
    return res.data;
}

export async function createProfile(data) {
    const res = await axios.post(`${API}/api/admin/profiles`, data, { headers: authHeader() });
    return res.data;
}

export async function updateProfile(profileId, data) {
    const res = await axios.put(`${API}/api/admin/profiles/${profileId}`, data, { headers: authHeader() });
    return res.data;
}

export async function deleteProfile(profileId) {
    const res = await axios.delete(`${API}/api/admin/profiles/${profileId}`, { headers: authHeader() });
    return res.data;
}

// Duplicates
export async function getDuplicateJobUrls(threshold, profileId) {
    const params = {};
    if (threshold) params.threshold = threshold;
    if (profileId) params.profileId = profileId;
    const res = await axios.get(`${API}/api/admin/duplicate-urls`, { headers: authHeader(), params });
    return res.data;
}
