import { avatarColor, initials } from '@/lib/themes';

interface AvatarProps {
  name?: string;
  email: string;
  size?: number;
  /**
   * Optional photo URL (data URL or http). If provided, the photo is shown
   * instead of the initials. Falls back to initials on load failure.
   */
  photoUrl?: string;
}

export function Avatar({ name, email, size = 36, photoUrl }: AvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? email}
        title={name ?? email}
        className="rounded-full object-cover shrink-0 select-none"
        style={{ width: size, height: size }}
        // If the image fails to load, the surrounding container shows nothing;
        // the consumer can re-render without photoUrl on error.
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  const bg = avatarColor(email);
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-medium select-none shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.42) }}
      aria-hidden
      title={name ?? email}
    >
      {initials(name, email)}
    </div>
  );
}
