import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/register-request', { email });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong.');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>Request Access</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ padding: '0.5rem', width: '300px' }}
      />
      <br /><br />
      <button onClick={handleRegister} style={{ padding: '0.5rem 1rem' }}>
        Submit Request
      </button>
      <br /><br />
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
