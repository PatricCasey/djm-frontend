import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function login(email, password) {
    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    return res.data;
}

export async function register({ email, password }) {
    const res = await axios.post(`${API}/api/auth/register`, { email, password });
    return res.data;
}
