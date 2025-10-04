import Redis from 'ioredis';

type Callback<T> = (error: string | null, result: T) => void;

export class RedisCache {
  private static client: Redis;

  static main() {
    if (!this.client) {
      this.client = new Redis({
        host: process.env['REDIS_ENDPOINT'],
        port: Number(process.env['REDIS_PORT']),
        username: process.env['REDIS_USN'],
        password: process.env['REDIS_PWD'],
      });

      this.client.on('connect', () => console.log('Redis Connected!'));
      this.client.on('error', (err) => console.error('Redis Error:', err));
    }
    return this.client;
  }

  static getUser(id: string, callback: Callback<string | boolean | null>) {
    if (!id) return callback(null, false);
    this.main()
      .get(`account-${id}`)
      .then((result) => {
        if (!result) return callback(null, false);
        const account = JSON.parse(result);
        return callback(null, account);
      })
      .catch((error) => {
        return callback(error, null);
      });
  }
}
