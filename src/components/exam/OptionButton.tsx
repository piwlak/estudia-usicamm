"use client";

interface OptionButtonProps {
  indice: number;
  texto: string;
  seleccionada: boolean;
  esCorrecta: boolean | null; // null = not revealed yet
  deshabilitada: boolean;
  onClick: () => void;
}

const LETRAS = ["A", "B", "C"];

export default function OptionButton({
  indice,
  texto,
  seleccionada,
  esCorrecta,
  deshabilitada,
  onClick,
}: OptionButtonProps) {
  let claseBase =
    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3";

  if (esCorrecta === true) {
    claseBase +=
      " border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400";
  } else if (esCorrecta === false && seleccionada) {
    claseBase +=
      " border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400";
  } else if (seleccionada) {
    claseBase +=
      " border-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/20 shadow-sm";
  } else {
    claseBase +=
      " border-slate-200 dark:border-slate-700 hover:border-[var(--primary)] hover:bg-slate-50 dark:hover:bg-slate-800/50";
  }

  if (deshabilitada && !seleccionada && esCorrecta === null) {
    claseBase += " opacity-60 cursor-not-allowed";
  }

  return (
    <button
      onClick={onClick}
      disabled={deshabilitada}
      className={claseBase}
    >
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          esCorrecta === true
            ? "bg-emerald-500 text-white"
            : esCorrecta === false && seleccionada
            ? "bg-red-500 text-white"
            : seleccionada
            ? "bg-[var(--primary)] text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        {LETRAS[indice]}
      </span>
      <span className="text-sm leading-relaxed pt-0.5 text-slate-800 dark:text-slate-200">{texto}</span>
      {esCorrecta === true && (
        <svg
          className="w-5 h-5 ml-auto flex-shrink-0 text-emerald-500 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {esCorrecta === false && seleccionada && (
        <svg
          className="w-5 h-5 ml-auto flex-shrink-0 text-red-500 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
