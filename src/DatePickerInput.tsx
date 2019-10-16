import * as React from 'react';
import * as PropTypes from 'prop-types';

import {toPersianNumber, putZero, DateIFace, DateRangeIFace} from './utils';
import {FocusEventHandler} from "react";


export interface DatePickerInputProps {
    onFocus: FocusEventHandler<any>;
    onBlur: FocusEventHandler<any>;
    selectedDay: DateIFace;
    selectedDayRange: DateRangeIFace;
    inputPlaceholder: string;
    inputClassName: string;
    formatInputText: Function;
    renderInput: Function;
    isDayRange: boolean;
}

const DatePickerInput = React.forwardRef(
  (props: DatePickerInputProps, ref: any) => {
    const getSelectedDayValue = () => {
      if (!props.selectedDay) return '';
      const year = toPersianNumber(props.selectedDay.year);
      const month = toPersianNumber(putZero(props.selectedDay.month));
      const day = toPersianNumber(putZero(props.selectedDay.day));
      return `${year}/${month}/${day}`;
    };

    const getSelectedRangeValue = () => {
      if (!props.selectedDayRange.from || !props.selectedDayRange.to) return '';
      const { from, to } = props.selectedDayRange;
      const fromText = `${toPersianNumber(putZero(from.year))
        .toString()
        .slice(-2)}/${toPersianNumber(putZero(from.month))}/${toPersianNumber(putZero(from.day))}`;
      const toText = `${toPersianNumber(putZero(to.year))
        .toString()
        .slice(-2)}/${toPersianNumber(putZero(to.month))}/${toPersianNumber(putZero(to.day))}`;
      return `از ${fromText} تا ${toText}`;
    };
    const getValue = () => {
      if (props.formatInputText()) return props.formatInputText();
      return props.isDayRange ? getSelectedRangeValue() : getSelectedDayValue();
    };

    const render = () => {
        const renderInputArgs ={ ref, onFocus: props.onFocus, onBlur: props.onBlur };
      return (
          props.renderInput(renderInputArgs) || (
          <input
            readOnly
            ref={ref}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            value={getValue()}
            placeholder={props.inputPlaceholder}
            className={`DatePicker__input ${props.inputClassName}`}
            aria-label="انتخاب تاریخ"
          />
        )
      );
    };

    return render();
  },
);

DatePickerInput.defaultProps = {
  formatInputText: () => '',
  renderInput: (): any => null,
  inputPlaceholder: 'انتخاب',
  inputClassName: '',
};

DatePickerInput.propTypes = {
  formatInputText: PropTypes.func,
  inputPlaceholder: PropTypes.string,
  inputClassName: PropTypes.string,
  renderInput: PropTypes.func,
};

export default DatePickerInput;
