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
        `}</style>
    );
}