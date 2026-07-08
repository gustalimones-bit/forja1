import { useGameStore } from '@/store/gameStore';

export default function NotificationContainer() {
  const notifications = useGameStore((s) => s.notifications);
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className={`animate-slide-in px-4 py-2 rounded-lg font-bold text-lg shadow-lg border-2 pointer-events-auto ${n.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-300' : n.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-yellow-300' : n.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-300' : 'bg-blue-900/90 border-blue-500 text-blue-300'}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}