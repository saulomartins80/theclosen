import * as cron from 'node-cron';
import { User } from '@models/User';

cron.schedule('0 3 * * *', async () => {
  await User.updateMany(
    { 'tokens.expiresAt': { $lt: new Date() } },
    { $pull: { tokens: { expiresAt: { $lt: new Date() } } } }
  );
  console.log('Tokens expirados removidos');
});
