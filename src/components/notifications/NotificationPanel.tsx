import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { useOperations } from '../../context/OperationsContext';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useOperations();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const navigate = useNavigate();

  const categories = ['ALL', 'Dispatch', 'Capacity', 'Compliance', 'Finance', 'System'];

  const filteredNotifs = notifications.filter((n) => {
    if (filterCategory === 'ALL') return true;
    return n.category === filterCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleAction = (url?: string, notifId?: string) => {
    if (notifId) markNotificationRead(notifId);
    if (url) {
      navigate(url);
      onClose();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-[#B42318] shrink-0" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-[#C2410C] shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-[#5B21B6] shrink-0" />;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      subtitle={`${unreadCount} unread operational alerts`}
      width="lg"
      actions={
        <button
          onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
          className="text-xs text-[#5B21B6] hover:text-[#4C1D95] transition-colors flex items-center gap-1 font-bold"
        >
          <Check className="h-3.5 w-3.5" /> Mark all read
        </button>
      }
    >
      <div className="space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#EEEEF2] pb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                filterCategory === cat
                  ? 'bg-[#EDE9FE] text-[#5B21B6] shadow-soft-sm'
                  : 'bg-[#F7F5FA] text-[#6B6B6B] hover:text-[#1F1F1F]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B]">
              No operational notifications in this category.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={clsx(
                  'rounded-2xl border p-4 transition-all',
                  n.read
                    ? 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B]'
                    : 'border-[#DDD6FE] bg-white text-[#1F1F1F] shadow-soft-sm'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1F1F1F]">{n.title}</h4>
                        <span className="rounded-full bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 text-[10px] font-mono text-[#5B21B6] font-semibold">
                          {n.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B6B] leading-relaxed">{n.description}</p>
                      <span className="mt-1.5 block text-[10px] text-[#9CA3AF] font-mono">{n.timestamp}</span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      title="Mark as read"
                      className="text-[#9CA3AF] hover:text-[#5B21B6] p-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {n.actionLabel && (
                  <div className="mt-3 flex justify-end border-t border-[#EEEEF2] pt-2.5">
                    <button
                      onClick={() => handleAction(n.actionUrl, n.id)}
                      className="rounded-xl bg-[#EDE9FE] px-3 py-1.5 text-[11px] font-bold text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors"
                    >
                      {n.actionLabel} →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
};
