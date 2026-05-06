import { jsx as _jsx } from "react/jsx-runtime";
import { avatarColor, initials } from '@/lib/themes';
export function Avatar({ name, email, size = 36 }) {
    const bg = avatarColor(email);
    return (_jsx("div", { className: "flex items-center justify-center rounded-full text-white font-medium select-none shrink-0", style: { width: size, height: size, background: bg, fontSize: Math.round(size * 0.42) }, "aria-hidden": true, title: name ?? email, children: initials(name, email) }));
}
