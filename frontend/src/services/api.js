import axios from 'axios';

// Ensure the endpoint matches where Flask is running
const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const analyzeData = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
