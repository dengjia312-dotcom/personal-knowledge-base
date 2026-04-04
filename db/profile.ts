import { db } from './database';

export interface ProfileRow {
  id: number;
  nickname: string;
  email: string;
  bio: string;
  avatar: string;
}

export function getProfile() {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow;
  const { id: _, ...profile } = row;
  return profile;
}

export function updateProfile(data: Omit<ProfileRow, 'id'>) {
  db.prepare(`
    UPDATE profile SET nickname = @nickname, email = @email, bio = @bio, avatar = @avatar
    WHERE id = 1
  `).run(data);
  return data;
}
