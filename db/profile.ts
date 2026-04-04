import { pool } from './database';

export interface UserProfile {
  nickname: string;
  email: string;
  bio: string;
  avatar: string;
}

export async function getProfile(): Promise<UserProfile> {
  const { rows } = await pool.query('SELECT nickname, email, bio, avatar FROM profile WHERE id = 1');
  return rows[0];
}

export async function updateProfile(data: UserProfile): Promise<UserProfile> {
  await pool.query(
    'UPDATE profile SET nickname=$1, email=$2, bio=$3, avatar=$4 WHERE id=1',
    [data.nickname, data.email, data.bio, data.avatar]
  );
  return data;
}
