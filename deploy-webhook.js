const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const SECRET = 'my-super-secret-webhook-2024'; // Ganti dengan secret yang sama dengan GitHub

app.use(express.json());

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Check if push to main branch
  if (req.body.ref === 'refs/heads/main') {
    console.log('Deploying latest changes...');
    
    // Execute deployment script
    exec('bash /path/to/your/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error}`);
        return res.status(500).send('Deployment failed');
      }
      
      console.log(`Deployment output: ${stdout}`);
      res.status(200).send('Deployment successful');
    });
  } else {
    res.status(200).send('Not main branch, skipping deployment');
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
