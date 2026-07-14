export function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6 H20" />
      <path d="M4 12 H20" />
      <path d="M4 18 H13" />
    </svg>
  );
}

export function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M6.5 3.5 H17.5 V20.5 L12 16.2 L6.5 20.5 Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSelect() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M6 3 L18 12.5 L11.8 13.4 L14.6 19.6 L11.9 20.8 L9.2 14.7 L6 17.5 Z" />
    </svg>
  );
}

export function IconHl() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <path d="M5 14 L13 6 L17 10 L9 18 H5 Z" />
      <path d="M4 21 H20" />
    </svg>
  );
}

export function IconPen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M5 19 L6.5 14.5 L15.5 5.5 L18.5 8.5 L9.5 17.5 L5 19 Z" />
    </svg>
  );
}

export function IconEraser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 16 L14 9 L18.5 13.5 L11.5 20.5 H9.5 L7 18 Z" />
      <path d="M4 21 H20" />
    </svg>
  );
}

export function IconShape() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="4" width="10" height="10" rx="1" />
      <circle cx="15.5" cy="15.5" r="4.5" />
    </svg>
  );
}

export function IconNote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M5 4 H19 V14 L13 20 H5 Z" />
      <path d="M13 20 V14 H19" />
    </svg>
  );
}

export function IconUndo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5 L3 10 L8 15" />
      <path d="M3 10 H14 a5.5 5.5 0 0 1 0 11 H10" />
    </svg>
  );
}

export function IconRedo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 5 L21 10 L16 15" />
      <path d="M21 10 H10 a5.5 5.5 0 0 0 0 11 H14" />
    </svg>
  );
}

export function IconRect() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="12" height="12" rx="1" />
    </svg>
  );
}

export function IconEllipse() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="6" />
    </svg>
  );
}

export function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14 L14 4" />
      <path d="M8 4 H14 V10" />
    </svg>
  );
}
