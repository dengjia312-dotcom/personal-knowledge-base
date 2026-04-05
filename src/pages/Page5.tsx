import React, { useState, useRef } from 'react';
import { User, Shield, Bell, Palette, Database, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Page5() {
  const { userProfile, updateUserProfile, showToast } = useAppContext();
  const [nickname, setNickname] = useState(userProfile.nickname);
  const [email, setEmail] = useState(userProfile.email);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      showToast('仅支持 JPG, JPEG, PNG 格式的图片');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUserProfile({ nickname, email, bio, avatar });
    showToast('头像与个人资料已保存');
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 py-10 max-w-4xl mx-auto w-full scrollbar-hide">
      <h1 className="text-3xl font-headline font-bold text-on-surface mb-10">设置</h1>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Settings Nav */}
        <div className="w-full md:w-64 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary font-semibold rounded-xl transition-colors">
            <User size={20} />
            <span>个人资料</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl transition-colors">
            <Palette size={20} />
            <span>外观与主题</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl transition-colors">
            <Bell size={20} />
            <span>通知设置</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl transition-colors">
            <Shield size={20} />
            <span>隐私与安全</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl transition-colors">
            <Database size={20} />
            <span>数据导出</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-6">个人资料</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <img 
                src={avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-surface-container"
              />
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/jpeg, image/jpg, image/png" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-surface-container text-on-surface font-medium rounded-lg hover:bg-surface-container-high transition-colors text-sm mb-2"
                >
                  更换头像
                </button>
                <p className="text-xs text-outline">支持 JPG, PNG 格式，最大 5MB</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">昵称</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">邮箱地址</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-on-surface"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">个人简介</label>
                <textarea 
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface resize-none"
                ></textarea>
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex items-center justify-between">
                <button className="flex items-center gap-2 text-error font-medium hover:bg-error/10 px-4 py-2 rounded-lg transition-colors">
                  <LogOut size={18} />
                  退出登录
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                >
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
