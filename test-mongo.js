const mongoose = require('mongoose');

// Use raw IPs instead of hostnames to completely bypass DNS
const MONGODB_URI = "mongodb://truongtranquang773_db_user:17072001truong@34.80.74.216:27017,34.80.39.85:27017,34.80.66.198:27017/NhatKyBeXinhDB?tls=true&replicaSet=atlas-11nq13-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  tls: true,
  servername: 'ac-g3vxeo3-shard-00-00.fij7mjt.mongodb.net', // Required for Atlas SNI
}).then(() => {
  console.log('Connected successfully with IPs and tlsServerName!');
  process.exit(0);
}).catch(err => {
  console.error('Connection error:', err);
  if (err.reason && err.reason.servers) {
      for (const [server, desc] of err.reason.servers) {
          console.error(`Server ${server} error:`, desc.error);
      }
  }
  process.exit(1);
});
