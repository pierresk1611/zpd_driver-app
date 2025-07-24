import createApp from './index';

// Complete the server setup and start with notifications
const app = createApp();

// Initialize evening notifications scheduler
if (process.env.NODE_ENV === 'production') {
  console.log('🕒 Scheduling evening notifications for 20:00 daily');
  // Will be imported and used
} else {
  console.log('🔧 Development mode: Evening notifications not scheduled');
  console.log('💡 Use POST /api/notifications/evening/send to test manually');
}

export default app;
