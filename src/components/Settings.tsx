import React, { useState, useEffect } from 'react';
import { updateUser, changePassword, User } from '../api';
import { ExportButton } from './ExportButton';
import { PageHeader, Section, Card, Button, Chip } from './ui';

interface Props {
  userId: number;
  user: User | null;
  onUserChange: (user: User) => void;
  onLogout: () => void;
}

interface FormValues {
  handle: string;
  daily_target_count: string;
  rating_min: string;
  rating_max: string;
  selected_tags: string[];
}

const EMPTY_FORM: FormValues = { handle: '', daily_target_count: '', rating_min: '', rating_max: '', selected_tags: [] };

export const Settings: React.FC<Props> = ({ userId, user, onUserChange, onLogout }) => {
  const [formData, setFormData] = useState<FormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Password change state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }
    setChangingPass(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      const res = await changePassword(oldPass, newPass);
      setPassSuccess(res.message || 'Password updated successfully!');
      setOldPass('');
      setNewPass('');
      setTimeout(() => setPassSuccess(null), 4000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        handle: user.handle,
        daily_target_count: String(user.daily_target_count),
        rating_min: String(user.rating_min),
        rating_max: String(user.rating_max),
        selected_tags: user.selected_tags,
      });
    }
  }, [user]);

  if (!user) return <div className="font-mono text-[var(--color-red)]">Error loading user</div>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Pick<FormValues, 'daily_target_count' | 'rating_min' | 'rating_max' | 'handle'>
  ) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        selected_tags: [...(prev.selected_tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      selected_tags: (prev.selected_tags || []).filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const minRating = parseInt(formData.rating_min, 10) || 0;
    const maxRating = parseInt(formData.rating_max, 10) || 0;
    
    if (maxRating > 0 && minRating > maxRating) {
      setSaveError('Min rating cannot be greater than max rating');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateUser(userId, {
        handle: formData.handle,
        daily_target_count: parseInt(formData.daily_target_count, 10) || 3,
        rating_min: minRating,
        rating_max: maxRating,
        selected_tags: formData.selected_tags,
      });
      onUserChange(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2 pb-8">
      <PageHeader title="Settings" subtitle="Configure your practice range, targets and data export." />

      <Section num="01" title="Practice Settings">
        <Card className="p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Codeforces Handle</label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => handleChange(e, 'handle')}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Daily Target Count (1-20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.daily_target_count}
                  onChange={(e) => handleChange(e, 'daily_target_count')}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Min Rating</label>
                  <input
                    type="number"
                    step="100"
                    value={formData.rating_min}
                    onChange={(e) => handleChange(e, 'rating_min')}
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Max Rating</label>
                  <input
                    type="number"
                    step="100"
                    value={formData.rating_max}
                    onChange={(e) => handleChange(e, 'rating_max')}
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Focus Tags (optional)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagAdd}
                placeholder="Type tag and press Enter"
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {(formData.selected_tags || []).map(t => (
                  <Chip key={t} className="py-1 px-3 rounded-full">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)] leading-none">&times;</button>
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Browser Reminders</label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-xl">
                <div className="min-w-0">
                  <div className="text-sm font-mono text-[var(--color-text)]">Daily Practice Reminder</div>
                  <div className="text-xs font-mono text-[var(--color-text-dim)]">Notify me if today's quota is unfinished</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if ('Notification' in window) {
                      const perm = await Notification.requestPermission();
                      if (perm === 'granted') {
                        const cur = localStorage.getItem('notifications_enabled') === 'true';
                        localStorage.setItem('notifications_enabled', (!cur).toString());
                        if (!cur) {
                          new Notification('Codeforces Companion', {
                            body: 'Daily reminders are now active! Happy grinding.',
                            icon: '/favicon.ico'
                          });
                        }
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      } else {
                        setSaveError('Notification permission was denied in browser settings.');
                      }
                    } else {
                      setSaveError('Browser does not support notifications.');
                    }
                  }}
                  className="text-xs shrink-0"
                >
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && localStorage.getItem('notifications_enabled') === 'true'
                    ? 'ENABLED (CLICK TO TOGGLE)'
                    : 'ENABLE NOTIFICATIONS'}
                </Button>
              </div>
            </div>

            {saveError && <div className="text-[var(--color-red)] font-mono text-sm break-words">{saveError}</div>}
            {saveSuccess && <div className="text-[var(--color-green)] font-mono text-sm">Settings saved successfully.</div>}

            <div className="pt-4 border-t border-[var(--color-border)]">
              <Button type="submit" variant="primary" disabled={saving} className="w-full py-3">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>
      </Section>

      <Section num="02" title="Security & Password">
        <Card className="p-5 md:p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-[var(--color-text-dim)] font-mono">
              Update your login password for this Codeforces account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-dim)] uppercase mb-2">New Password (min 6 chars)</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] p-3 rounded-lg font-mono text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {passError && <div className="text-[var(--color-red)] font-mono text-sm">{passError}</div>}
            {passSuccess && <div className="text-[var(--color-green)] font-mono text-sm">{passSuccess}</div>}

            <Button type="submit" variant="primary" disabled={changingPass} className="py-2.5 px-6">
              {changingPass ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </Section>

      <Section num="03" title="Data Export">
        <Card className="p-5 md:p-6">
          <p className="text-sm text-[var(--color-text-dim)] font-mono mb-4">
            Download your daily solve history and generated targets.
          </p>
          <div className="flex flex-wrap gap-3">
            <ExportButton userId={userId} format="json" />
            <ExportButton userId={userId} format="csv" />
          </div>
        </Card>
      </Section>

      <div className="text-center pt-8 border-t border-[var(--color-border)]">
        <button
          onClick={onLogout}
          className="text-[var(--color-red)] font-mono uppercase text-sm tracking-wider hover:underline"
        >
          Logout / Switch Account
        </button>
      </div>
    </div>
  );
};
