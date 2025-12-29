import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function App() {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [resA, setResA] = useState(null);
  const [resB, setResB] = useState(null);

  const handleFileChange = (e, setFile) => setFile(e.target.files[0]);

  const uploadFile = async (backend, file, setRes) => {
    if (!file) return alert("Please select a file first!");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = backend === 'A' ? '/v1/api/a/upload' : '/v1/api/b/upload';
      const res = await axios.post(API_BASE_URL + endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRes(res.data);
    } catch (err) {
      setRes({ error: "Upload Failed" });
    }
  };

  return (
    <div className='app-container'>
      <div className='split-pane pane-a'>
        <h1>Backend A</h1>
        <input type="file" onChange={(e) => handleFileChange(e, setFileA)} />
        <button className='upload-btn btn-a' onClick={() => uploadFile('A', fileA, setResA)}>
          Upload to A
        </button>
        {resA && <pre>{JSON.stringify(resA, null, 2)}</pre>}
      </div>
      
      <div className='split-pane pane-b'>
        <h1>Backend B</h1>
        <input type="file" onChange={(e) => handleFileChange(e, setFileB)} />
        <button className='upload-btn btn-b' onClick={() => uploadFile('B', fileB, setResB)}>
          Upload to B
        </button>
        {resB && <pre>{JSON.stringify(resB, null, 2)}</pre>}
      </div>
    </div>
  );
}
export default App;