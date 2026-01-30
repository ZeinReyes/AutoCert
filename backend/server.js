import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors({ origin: 'https://autocertsite.onrender.com' }));
app.use(express.json());

app.post('/api/generate-certificate', async (req, res) => {
  try {
    const response = await fetch(
      'https://infinityw.com/webhook/generate-certificate', 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        redirect: 'follow'
      }
    );

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
      console.log('JSON data received from n8n webhook:', JSON.stringify(data, null, 2));
      res.status(response.status)
         .header('Content-Type', 'application/json')
         .send(data);
    } else {
      data = await response.text();
      console.log('Text data received from n8n webhook:', data);
      res.status(response.status)
         .header('Content-Type', 'text/plain')
         .send(data);
    }

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500)
       .header('Content-Type', 'application/json')
       .json({ error: err.message });
  }
});

app.listen(5010, () => console.log('Proxy server running on port 5010'));
