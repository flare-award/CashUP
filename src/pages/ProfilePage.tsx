import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Edit3, Plus, Trash2, Users } from 'lucide-react';
import { AVATAR_CATALOG, AvatarIcon } from '../components/ui/AvatarIcon';
import { Modal } from '../components/ui/Modal';
import { STARTER_BALANCE } from '../core/balance';
import { formatSignedCurrency } from '../core/currency';
import { useCashUp } from '../state/CashUpContext';
import { AvatarId, UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const {
    state,
    activeProfile,
    settings,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile,
    formatAmount,
    playSound,
  } = useCashUp();

  const [editOpen, setEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState<AvatarId>('emerald-diamond');

  const [createOpen, setCreateOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newAvatar, setNewAvatar] = useState<AvatarId>('royal-crown');

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  if (!activeProfile) return null;

  const openEditModal = () => {
    playSound('click');
    setEditNickname(activeProfile.nickname);
    setEditAvatar(activeProfile.avatarId);
    setEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNickname.trim()) return;
    updateProfile(activeProfile.id, editNickname.trim(), editAvatar);
    setEditOpen(false);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile(newNickname.trim() || 'Игрок', newAvatar);
    setNewNickname('');
    setCreateOpen(false);
  };

  const createdFormatted = new Date(activeProfile.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = activeProfile.stats;

  return (
    <div className="pageEnter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Active Profile Hero */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <AvatarIcon avatarId={activeProfile.avatarId} size={76} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1>{activeProfile.nickname}</h1>
              <span className="badge badgeNeutral mono">ID: {activeProfile.id}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
              Локальный профиль создан: {createdFormatted}
            </p>
            <div style={{ marginTop: 8 }}>
              <span className="badge badgeEmerald">
                Виртуальный баланс: {formatAmount(activeProfile.balance)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btnSecondary"
            onClick={openEditModal}
          >
            <Edit3 size={16} /> Редактировать профиль
          </button>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => {
              playSound('click');
              setCreateOpen(true);
            }}
          >
            <Plus size={16} /> Новый профиль
          </button>
        </div>
      </section>

      {/* Profile Stats Summary */}
      <section
        aria-label="Сводная статистика профиля"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {[
          { label: 'Текущий вирт. баланс', val: formatAmount(activeProfile.balance) },
          { label: 'Сыграно раундов', val: String(stats.totalRounds) },
          { label: 'Победы / Поражения', val: `${stats.wins} / ${stats.losses}` },
          {
            label: 'Самый крупный выигрыш',
            val: formatAmount(stats.biggestWin),
            gold: true,
          },
          { label: 'Общая сумма ставок', val: formatAmount(stats.totalWagered) },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.label}</div>
            <div
              className="mono"
              style={{
                fontSize: '1.22rem',
                fontWeight: 800,
                marginTop: 5,
                color: item.gold ? 'var(--accent-gold)' : 'var(--text-primary)',
              }}
            >
              {item.val}
            </div>
          </div>
        ))}
      </section>

      {/* Local Multi-Profile Management & Recent History */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Local Profiles Switcher */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Users size={19} style={{ color: 'var(--accent-primary)' }} />
              Локальные профили ({state.profiles.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {state.profiles.map((prof) => {
              const isCurrent = prof.id === activeProfile.id;
              return (
                <div
                  key={prof.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: isCurrent
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1px solid ${
                      isCurrent ? 'var(--border-accent)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <AvatarIcon avatarId={prof.avatarId} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>
                        {prof.nickname}{' '}
                        {isCurrent && (
                          <span className="badge badgeEmerald" style={{ marginLeft: 4 }}>
                            Активен
                          </span>
                        )}
                      </div>
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatAmount(prof.balance)} · Раундов: {prof.stats.totalRounds}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {!isCurrent && (
                      <button
                        type="button"
                        className="btn btnSecondary btnSm"
                        onClick={() => switchProfile(prof.id)}
                      >
                        <Check size={14} /> Выбрать
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btnDanger btnSm"
                      onClick={() => setDeleteTarget(prof)}
                      aria-label={`Удалить профиль ${prof.nickname}`}
                      title="Удалить профиль"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Games History Preview */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h2>История последних игр</h2>
            <Link
              to="/history"
              style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}
            >
              Все записи →
            </Link>
          </div>

          {activeProfile.history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              В этом профиле ещё не сыграно ни одного раунда.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeProfile.history.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{h.gameName}</div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.summary}
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 700,
                      flexShrink: 0,
                      color:
                        h.netChange > 0
                          ? 'var(--accent-primary)'
                          : h.netChange < 0
                            ? 'var(--color-danger)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {formatSignedCurrency(h.netChange, settings.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        title="Редактирование профиля"
        subtitle="Измените локальный никнейм или аватар профиля."
        onClose={() => setEditOpen(false)}
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              htmlFor="edit-profile-nickname"
              style={{ display: 'block', fontSize: '0.84rem', marginBottom: 6, color: 'var(--text-secondary)' }}
            >
              Никнейм
            </label>
            <input
              id="edit-profile-nickname"
              type="text"
              className="inputField"
              maxLength={28}
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              required
            />
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.84rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              Аватар
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {AVATAR_CATALOG.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setEditAvatar(av.id)}
                  aria-label={av.label}
                  style={{
                    padding: 5,
                    borderRadius: 10,
                    border: `2px solid ${
                      editAvatar === av.id ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <AvatarIcon avatarId={av.id} size={38} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btnSecondary" onClick={() => setEditOpen(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btnPrimary">
              Сохранить изменения
            </button>
          </div>
        </form>
      </Modal>

      {/* Create New Profile Modal */}
      <Modal
        open={createOpen}
        title="Создание нового профиля"
        subtitle={`Новому профилю единоразово выдаётся стартовый баланс ${formatAmount(STARTER_BALANCE)}.`}
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              htmlFor="new-profile-nickname"
              style={{ display: 'block', fontSize: '0.84rem', marginBottom: 6, color: 'var(--text-secondary)' }}
            >
              Никнейм нового профиля
            </label>
            <input
              id="new-profile-nickname"
              type="text"
              className="inputField"
              placeholder="Например: NightRunner"
              maxLength={28}
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {AVATAR_CATALOG.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setNewAvatar(av.id)}
                aria-label={av.label}
                style={{
                  padding: 5,
                  borderRadius: 10,
                  border: `2px solid ${
                    newAvatar === av.id ? 'var(--accent-primary)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <AvatarIcon avatarId={av.id} size={38} />
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btnSecondary" onClick={() => setCreateOpen(false)}>
              Отмена
            </button>
            <button type="submit" className="btn btnPrimary">
              Создать профиль
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Удалить локальный профиль?"
        subtitle="Вся статистика, баланс и история игр выбранного профиля будут безвозвратно удалены с устройства."
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AvatarIcon avatarId={deleteTarget.avatarId} size={40} />
              <div>
                <strong>{deleteTarget.nickname}</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  ID: {deleteTarget.id} · Баланс: {formatAmount(deleteTarget.balance)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => setDeleteTarget(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btnDanger"
                onClick={() => {
                  deleteProfile(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Удалить профиль
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
