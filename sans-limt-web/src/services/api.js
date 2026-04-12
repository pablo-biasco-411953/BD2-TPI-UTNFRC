import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5286/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

/* (Opcional - Nivel Dios) 
  Si el día de mañana agregás tokens JWT de seguridad en tu backend, 
  se configuran acá para que viajen en todas las peticiones automáticamente:
*/
api.interceptors.request.use(
    (config) => {
        // const token = localStorage.getItem('token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;