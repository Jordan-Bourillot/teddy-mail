import { avatarColor, initials } from '@/lib/themes';

interface AvatarProps {
  name?: string;
  email: string;
  size?: number;
}

export function Avatar({ name, email, size = 36 }: AvatarProps) {
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
