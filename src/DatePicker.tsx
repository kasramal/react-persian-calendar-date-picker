import * as React from 'react';
import { useState, useRef, useEffect} from 'react';
import * as PropTypes from 'prop-types';

import Calendar from './Calendar';
import DatePickerInput from './DatePickerInput';
import {DateIFace, DateRangeIFace} from "./utils";

interface MousePosition {
  x: number;
  y: number;
}
let shouldPreventFocus: boolean;
let mousePosition: MousePosition;

export interface DatePickerProps {

  selectedDay: DateIFace;
  selectedDayRange: DateRangeIFace;
  onChange: Function;
  onDisabledDayError: Function;
  isDayRange: boolean;
  calendarClassName: string;
  calendarTodayClassName: string;
  calendarSelectedDayClassName: string;
  calendarRangeStartClassName: string;
  calendarRangeBetweenClassName: string;
  calendarRangeEndClassName: string;
  disabledDays: Array<DateIFace>;
  colorPrimary: string;
  colorPrimaryLight: string;
  minimumDate: DateIFace;
  maximumDate: DateIFace;
  selectorStartingYear: number;
  selectorEndingYear: number;

  inputPlaceholder: string;
  inputClassName: string;
  formatInputText: Function;
  renderInput: Function;
  wrapperClassName: string;

}
const DatePicker = (props: DatePickerProps) => {
  const calendarContainerElement = useRef(null);
  const dateInputElement = useRef(null);
  const [isCalendarOpen, setCalendarVisiblity] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    const { clientX: x, clientY: y } = e;
    mousePosition = { x, y };
  };

  // get mouse live position
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, false);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, false);
    };
  }, []);

  // handle input focus/blur
  useEffect(() => {
    const shouldCloseCalendar = !props.isDayRange
      ? !isCalendarOpen
      : !isCalendarOpen && props.selectedDayRange.from && props.selectedDayRange.to;
    if (shouldCloseCalendar) dateInputElement.current.blur();
  }, [props.selectedDay, isCalendarOpen]);

  const toggleCalendar = () => setCalendarVisiblity(!isCalendarOpen);

  // keep calendar open if clicked inside the calendar
  const handleBlur = (e: any) => {
    e.persist();
    if (!isCalendarOpen) return;
    const { current: calendar } = calendarContainerElement;
    const calendarPosition = calendar.getBoundingClientRect();
    const isInBetween = (value: number, start: number, end: number) => value >= start && value <= end;
    const isInsideCalendar =
      isInBetween(mousePosition.x, calendarPosition.left, calendarPosition.right) &&
      isInBetween(mousePosition.y, calendarPosition.top, calendarPosition.bottom);
    if (isInsideCalendar) {
      shouldPreventFocus = true;
      e.target.focus();
      shouldPreventFocus = false;
      return;
    }
    toggleCalendar();
  };

  const handleFocus = () => {
    if (shouldPreventFocus) return;
    toggleCalendar();
  };

  const handleDaySelect = (day: DateIFace) => {
    props.onChange(day);
    toggleCalendar();
  };

  const handleDayRangeSelect = (range: DateRangeIFace) => {
    props.onChange(range);
    if (range.from && range.to) toggleCalendar();
  };

  // Keep the calendar in the screen bounds if input is near the window edges
  const getCalendarPosition = () => {
    if (!calendarContainerElement.current) return;
    const previousLeft = calendarContainerElement.current.style.left;
    if (previousLeft) return { left: previousLeft };
    const { left, width } = calendarContainerElement.current.getBoundingClientRect();
    const { clientWidth } = document.documentElement;
    const isOverflowingFromRight = left + width > clientWidth;
    const overflowFromRightDistance = left + width - clientWidth;
    const isOverflowingFromLeft = left < 0;
    const overflowFromLeftDistance = Math.abs(left);
    const rightPosition = isOverflowingFromLeft ? overflowFromLeftDistance : 0;
    const leftStyle = isOverflowingFromRight
      ? `calc(50% - ${overflowFromRightDistance}px)`
      : `calc(50% + ${rightPosition}px)`;
    return { left: leftStyle };
  };

  return (
    <div className={`DatePicker ${isCalendarOpen ? '-calendarOpen' : ''} ${props.wrapperClassName}`}>
      <div
        ref={calendarContainerElement}
        className="DatePicker__calendarContainer"
        style={getCalendarPosition()}
      >
        <Calendar
          onDaySelect={handleDaySelect}
          selectedDay={props.selectedDay}
          onChange={props.isDayRange ? handleDayRangeSelect : handleDaySelect}
          selectedDayRange={props.selectedDayRange}
          onDayRangeSelect={handleDayRangeSelect}
          isDayRange={props.isDayRange}
          calendarClassName={props.calendarClassName}
          calendarTodayClassName={props.calendarTodayClassName}
          calendarSelectedDayClassName={props.calendarSelectedDayClassName}
          calendarRangeStartClassName={props.calendarRangeStartClassName}
          calendarRangeBetweenClassName={props.calendarRangeBetweenClassName}
          calendarRangeEndClassName={props.calendarRangeEndClassName}
          disabledDays={props.disabledDays}
          colorPrimary={props.colorPrimary}
          colorPrimaryLight={props.colorPrimaryLight}
          onDisabledDayError={props.onDisabledDayError}
          minimumDate={props.minimumDate}
          maximumDate={props.maximumDate}
          selectorStartingYear={props.selectorStartingYear}
          selectorEndingYear={props.selectorEndingYear}
        />
      </div>
      <DatePickerInput
        ref={dateInputElement}
        onFocus={handleFocus}
        onBlur={handleBlur}
        formatInputText={props.formatInputText}
        selectedDay={props.selectedDay}
        selectedDayRange={props.selectedDayRange}
        inputPlaceholder={props.inputPlaceholder}
        inputClassName={props.inputClassName}
        renderInput={props.renderInput}
        isDayRange={props.isDayRange}
      />
    </div>
  );
};

DatePicker.defaultProps = {
  wrapperClassName: '',
};

DatePicker.propTypes = {
  wrapperClassName: PropTypes.string,
};

export default DatePicker;
