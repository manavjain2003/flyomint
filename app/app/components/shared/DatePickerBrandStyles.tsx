export function DatePickerBrandStyles() {
    return (
        <style jsx global>{`
            .react-datepicker {
                font-family: inherit;
                border-color: #e5e7eb;
                border-radius: 1rem;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
            }
            .react-datepicker-popper {
                z-index: 60;
            }
            .react-datepicker__header {
                background-color: #fff;
                border-bottom: 1px solid #f3f4f6;
            }
            .react-datepicker__day--selected,
            .react-datepicker__day--keyboard-selected {
                background-color: #ff7626 !important;
                color: #fff !important;
                border-radius: 9999px;
            }
            .react-datepicker__day:hover {
                background-color: #fff1e8;
                border-radius: 9999px;
            }
            .react-datepicker__day--disabled {
                color: #d1d5db;
            }
            .react-datepicker__triangle {
                display: none;
            }

            /* Dark mode */
            .dark .react-datepicker {
                background-color: #111827;
                border-color: #374151;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            }
            .dark .react-datepicker__header {
                background-color: #111827;
                border-bottom: 1px solid #1f2937;
            }
            .dark .react-datepicker__current-month,
            .dark .react-datepicker-time__header,
            .dark .react-datepicker-year-header {
                color: #f3f4f6;
            }
            .dark .react-datepicker__day-name {
                color: #9ca3af;
            }
            .dark .react-datepicker__day {
                color: #e5e7eb;
            }
            .dark .react-datepicker__day:hover {
                background-color: #1f2937;
                border-radius: 9999px;
            }
            .dark .react-datepicker__day--selected,
            .dark .react-datepicker__day--keyboard-selected {
                background-color: #ff7626 !important;
                color: #fff !important;
                border-radius: 9999px;
            }
            .dark .react-datepicker__day--disabled {
                color: #4b5563;
            }
            .dark .react-datepicker__day--outside-month {
                color: #4b5563;
            }
            .dark .react-datepicker__navigation-icon::before {
                border-color: #9ca3af;
            }
            .dark .react-datepicker__navigation:hover *::before {
                border-color: #f3f4f6;
            }
            .dark .react-datepicker__month {
                background-color: #111827;
            }
        `}</style>
    );
}