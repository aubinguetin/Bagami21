// Manual script to trigger rating reminders
// Run with: node manual-rating-reminders.js

const http = require('http');

console.log('\n=== Manually Triggering Rating Reminders ===\n');
console.log('This will check all DELIVERED deliveries and send rating reminders');
console.log('for those that have been completed for 3h, 24h, 48h, 96h, or 168h.\n');
console.log('Calling: GET http://localhost:3002/api/cron/rating-reminders\n');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/cron/rating-reminders',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== Response ===');
    console.log('Status Code:', res.statusCode);
    try {
      const result = JSON.parse(data);
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('\n✅ Rating reminders have been processed!');
      console.log(`📨 Reminders sent: ${result.remindersSent || 0}`);
    } catch (e) {
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error:', error.message);
  console.error('\nMake sure your dev server is running on port 3002:');
  console.error('  npm run dev');
  process.exit(1);
});

req.end();
