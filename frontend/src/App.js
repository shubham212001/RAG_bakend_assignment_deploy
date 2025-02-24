import React, { useState } from 'react';
import { FaFileUpload, FaSearch } from 'react-icons/fa';
import './App.css'; // IMPORTANT: Ensure this CSS file is imported
const url ="https://rag-bakend-assignment-deploy-4t2h.onrender.com"

function App() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file.');
      return;
    }
    setIsLoading(true);
    setUploadMessage('');
    const formData = new FormData();
    formData.append('document', selectedFile);
    // https://rag-bakend-assignment-deploy-4t2h.onrender.com/
    // http://localhost:4000
    try {
      const res = await fetch(url+'/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setIsUploaded(true);
        setUploadMessage('✅ File uploaded successfully!');
      } else {
        setIsUploaded(false);
        setUploadMessage('❌ File upload failed. Please try again.');
      }
    } catch (error) {
      setIsUploaded(false);
      setUploadMessage('⚠️ Error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!isUploaded) {
      alert('Please upload a file before sending a query.');
      return;
    }
    if (!query) {
      alert('Please enter a query.');
      return;
    }
    setIsQuerying(true);

    try {
      const res = await fetch(url+'/api/search/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Query failed: ', error.message);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">
        <span role="img" aria-label="Document">
          📄
        </span>{' '}
        RAG : Document Upload & Query
      </h1>

      {/* Row containing Upload and Query side by side */}
      <div className="forms-row">
        {/* Upload Section */}
        <div className="upload-container">
          <h2 className="heading">Upload Document (pdf/docx/txt)</h2>
          <FaFileUpload size={40} color="#00aaff" />
          <div style={{ marginTop: '1rem' }}>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.json,.txt"
              className="file-input"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="upload-button"
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
          {uploadMessage && <p className="message">{uploadMessage}</p>}
        </div>

        {/* Query Section */}
        <div className="query-container">
          <h2 className="heading">Ask a Query</h2>
          <FaSearch size={40} color="#00ffcc" />
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query here"
              className="query-input"
            />
          </div>
          <button
            onClick={handleQuery}
            disabled={isQuerying || !isUploaded}
            className="query-button"
          >
            {isQuerying ? 'Processing...' : 'Send Query'}
          </button>
        </div>
      </div>

      {/* Results Section (wider) */}
      <div className="results-container">
        <h3 className="heading">Results:</h3>
        {results.length > 0 ? (
          <div className="results-list">
            {results.map((item, index) => (
              <div key={index} className="result-item">
                <p className="snippet">
                  <strong>Snippet:</strong> {item.text}
                </p>
                <p>
                  <em>Document ID:</em> {item.documentId}
                </p>
                <p>
                  <em>File Name:</em> {item.fileName}
                </p>
                <p>
                  <em>Chunk Index:</em> {item.chunkIndex}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No results yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;



