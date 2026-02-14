interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function FloatingButton({ onClick, isOpen }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        pointer-events-auto
        fixed bottom-6 right-6 z-[1102]
        w-14 h-14 rounded-full
        bg-[#fc4d50] hover:bg-[#e03e41]
        text-white shadow-lg
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110
        ${isOpen ? 'rotate-45' : ''}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isOpen ? (
          <path d="M18 6L6 18M6 6l12 12" />
        ) : (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        )}
      </svg>
    </button>
  );
}
