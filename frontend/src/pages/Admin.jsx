import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Admin() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/access-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching access requests:', err);
    }
  };

  const approve = async (email) => {
    try {
      const res = await axios.post('http://localhost:3001/api/approve-user', {
        email,
        role: 'user',
      });
      setMessage(res.data.message);
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error(err);
      setMessage('Failed to approve user.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Admin Panel - Pending Access Requests</h2>
        <div>
          <span style={{ marginRight: '1rem' }}>👤 {user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        requests.map((r) => (
          <div key={r.id} style={{ marginBottom: '1rem' }}>
            <strong>{r.email}</strong>
            <button onClick={() => approve(r.email)} style={{ marginLeft: '1rem' }}>
              Approve
            </button>
          </div>
        ))
      )}

      {message && <p style={{ marginTop: '1rem', color: 'green' }}>{message}</p>}
    </div>
  );
}

export default Admin;
