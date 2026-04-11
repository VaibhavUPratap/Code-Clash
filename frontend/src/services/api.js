import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const analyzeData = async (username) => {
  const response = await api.post('/analyze', {
    username: username
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};
