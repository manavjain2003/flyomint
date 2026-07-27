"use client";

type CounterRowProps = {
    title: string;
    subtitle: string;
    titleSuffix?: string;
    value: number;
    options: number[];
    disabledOptions?: number[];
    onChange: (value: number) => void;
};

export default function CounterRow({
    title,
    subtitle,
    titleSuffix,
    value,
    options,
    disabledOptions = [],
    onChange,
}: CounterRowProps) {
    return (
        <div className="mb-1.5">
            <p className="text-xs font-semibold text-gray-900 leading-tight">
                {title}
                {titleSuffix && <span className="font-normal text-gray-400 ml-0.5 text-[10px]">{titleSuffix}</span>}
            </p>
            <p className="text-[10px] text-gray-400 mb-1">{subtitle}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                    const selected = value === opt;
                    const disabled = disabledOptions.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && onChange(opt)}
                            className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center transition-colors ${disabled
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                : selected
                                    ? "bg-[#1c8fc7] text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}