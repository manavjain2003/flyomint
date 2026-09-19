export function DatePickerBrandStyles() {
    return (
        <style jsx global>{`
            .react-datepicker {
                font-family: inherit;
                border: none;
                border-radius: 1.25rem;
                overflow: hidden;
                box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.18), 0 4px 12px -4px rgba(15, 23, 42, 0.08);
            }
            .react-datepicker-popper {
                z-index: 60;
                padding-top: 10px !important;
            }
            .react-datepicker__triangle {
                display: none;
            }

            /* Header */
            .react-datepicker__header {
                background: linear-gradient(135deg, #1c8fc7 0%, #03a4d2 100%);
                border-bottom: none;
                padding: 16px 12px 10px;
            }
            .react-datepicker__current-month {
                color: #fff;
                font-size: 0.95rem;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .react-datepicker__day-name {
                color: rgba(255, 255, 255, 0.85);
                font-size: 0.72rem;
                font-weight: 600;
                width: 2.1rem;
                margin: 2px;
            }

            /* Navigation arrows */
            .react-datepicker__navigation {
                top: 10px;
                width: 28px;
                height: 28px;
                border-radius: 9999px;
                background-color: rgba(255, 255, 255, 0.18);
                transition: background-color 0.15s ease;
                color: black;
            }
            .react-datepicker__navigation:hover {
                background-color: rgba(255, 255, 255, 0.32);
            }
            .react-datepicker__navigation-icon::before {
                border-color: #fff;
                border-width: 2px 2px 0 0;
                width: 7px;
                height: 7px;
                top: 10px;
            }
            .react-datepicker__navigation--previous {
                left: 14px;
            }
            .react-datepicker__navigation--next {
                right: 14px;
            }

            /* Days */
            .react-datepicker__month {
                margin: 8px 10px 12px;
            }
            .react-datepicker__day {
                width: 2.1rem;
                line-height: 2.1rem;
                margin: 2px;
                border-radius: 9999px;
                font-size: 0.82rem;
                font-weight: 500;
                transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
            }
            .react-datepicker__day:hover {
                background-color: #fff1e8;
                border-radius: 9999px;
                transform: scale(1.05);
            }
            .react-datepicker__day--disabled {
                color: #d1d5db;
            }
            .react-datepicker__day--disabled:hover {
                background: none;
                transform: none;
            }
            .react-datepicker__day--outside-month {
                color: #d1d5db;
            }

            /* Today marker */
            .react-datepicker__day--today {
                font-weight: 700;
                color: #ff7626;
                position: relative;
            }
            .react-datepicker__day--today::after {
                content: "";
                position: absolute;
                bottom: 3px;
                left: 50%;
                transform: translateX(-50%);
                width: 4px;
                height: 4px;
                border-radius: 9999px;
                background-color: #ff7626;
            }
            .react-datepicker__day--today.react-datepicker__day--selected::after {
                background-color: #fff;
            }

            /* Selected */
            .react-datepicker__day--selected,
            .react-datepicker__day--keyboard-selected {
                background: linear-gradient(135deg, #ff7626 0%, #ff8f4d 100%) !important;
                color: #fff !important;
                border-radius: 9999px;
                font-weight: 700;
                box-shadow: 0 4px 10px -2px rgba(255, 118, 38, 0.45);
            }
            .react-datepicker__day--selected:hover,
            .react-datepicker__day--keyboard-selected:hover {
                background: linear-gradient(135deg, #e6661f 0%, #ff8f4d 100%) !important;
                transform: scale(1.05);
            }

            /* In-range (departure/return span) */
            .react-datepicker__day--in-range,
            .react-datepicker__day--in-selecting-range {
                background-color: #1c8fc71a;
                color: #1c8fc7;
                border-radius: 9999px;
            }
            .react-datepicker__day--range-start,
            .react-datepicker__day--range-end {
                background: linear-gradient(135deg, #ff7626 0%, #ff8f4d 100%) !important;
                color: #fff !important;
            }

            /* Month gap divider (two-month view) */
            .react-datepicker__month-container + .react-datepicker__month-container {
                border-left: 1px solid #f1f5f9;
            }

            /* ===== Dark mode ===== */
            .dark .react-datepicker {
                background-color: #111827;
                box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3);
            }
            .dark .react-datepicker__month {
                background-color: #111827;
            }
            .dark .react-datepicker__day {
                color: #e5e7eb;
            }
            .dark .react-datepicker__day:hover {
                background-color: #1f2937;
            }
            .dark .react-datepicker__day--disabled {
                color: #4b5563;
            }
            .dark .react-datepicker__day--outside-month {
                color: #4b5563;
            }
            .dark .react-datepicker__day--in-range,
            .dark .react-datepicker__day--in-selecting-range {
                background-color: #1c8fc733;
                color: #7dd3fc;
            }
            .dark .react-datepicker__month-container + .react-datepicker__month-container {
                border-left: 1px solid #1f2937;
            }
            .dark .react-datepicker__navigation-icon::before {
                border-color: #f3f4f6;
            }
            .dark .react-datepicker__navigation:hover *::before {
                border-color: #f3f4f6;
            }

.react-datepicker__header {
  background: linear-gradient(120deg, #1780b4 0%, #03a4d2 100%);
  padding: 16px 20px 10px;
}


.react-datepicker__day {
  width: 2.2rem;
  line-height: 2.2rem;
  margin: 2px;
  border-radius: 50%;
  font-size: 0.8rem;
}


.react-datepicker__day--selected {
  background: linear-gradient(135deg, #FF7626, #ff9a56) !important;
  box-shadow: 0 3px 10px rgba(255,118,38,0.38);
}


.react-datepicker__day--in-range {
  background: rgba(28,143,199,0.10);
  color: #1c8fc7;
  border-radius: 0;
}
        `}</style>
    );
}