import * as React from 'react';
import {createRef, MutableRefObject, useRef, useState} from 'react';
import * as PropTypes from 'prop-types';

import {
    checkDayInDayRange,
    createUniqueRange,
    DateIFace,
    DateRangeIFace,
    deepCloneObject,
    getDateAccordingToMonth,
    getMonthFirstWeekday,
    getMonthLength,
    getMonthName,
    getMonthNumber,
    getToday,
    isBeforeDate,
    isSameDay,
    PERSIAN_MONTHS,
    shallowCloneObject,
    toPersianNumber,
    WEEK_DAYS,
} from './utils';


const dayShape = {
    year: PropTypes.number.isRequired,
    month: PropTypes.number.isRequired,
    day: PropTypes.number.isRequired,
};

export interface CalendarProps {
    selectedDay: DateIFace;
    selectedDayRange: DateRangeIFace;
    onChange: Function;
    onDisabledDayError: Function;
    onDayRangeSelect: Function;
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
    selectorStartingYear: number
    selectorEndingYear: number;
    onDaySelect: Function;

}

interface State {
    status: string;
    cycleCount: number;
    activeDate: DateIFace;
}

const initialState: State = {
    status: 'NEXT',
    cycleCount: 1,
    activeDate: getToday(),
};

export default class Calendar extends React.Component<CalendarProps, State> {
    calendarElement = createRef<HTMLDivElement>();
    monthYearTextWrapper = createRef<HTMLDivElement>();
    calendarSectionWrapper = createRef<HTMLDivElement>();
    monthSelector = createRef<HTMLDivElement>();
    yearSelector = createRef<HTMLDivElement>();
    yearSelectorWrapper = createRef<HTMLDivElement>();
    today: DateIFace;
    colorStyle = {
        '--cl-color-primary': this.colorPrimary,
        '--cl-color-primary-light': this.colorPrimaryLight
    } as React.CSSProperties;

    constructor(props: CalendarProps) {
        super(props);
        this.state = initialState;
        this.today = getToday();

    }
    componentDidMount(): void {
        let activeDate = this.state.activeDate ? (shallowCloneObject(this.state.activeDate) as DateIFace) : null;
        if (!activeDate) this.setActiveDate();
    }

    setActiveDate = () => {
        let activeDate: DateIFace;
        if (this.selectedDay) activeDate = (shallowCloneObject(this.selectedDay) as DateIFace);
        else if (this.selectedDayRange.from) activeDate = (shallowCloneObject(this.selectedDayRange.from) as DateIFace);
        else activeDate = (shallowCloneObject(this.today) as DateIFace);
        this.setState({activeDate});
        console.log(activeDate)
    };


    renderWeekDays = () =>
        Object.keys(WEEK_DAYS).map((key: keyof typeof WEEK_DAYS) => (
            <span key={key} className="Calendar__weekDay">
        {WEEK_DAYS[key][0]}
      </span>
        ));

    getDate = (isThisMonth: boolean): DateIFace => {
        return isThisMonth ? this.state.activeDate : getDateAccordingToMonth(this.state.activeDate, this.state.status);
    };

    getMonthYearText = (isNewMonth: boolean) => {
        const date = this.getDate(!isNewMonth);
        const year = toPersianNumber(date.year);
        const month = getMonthName(date.month);
        return `${month} ${year}`;
    };

    getDayRangeValue = (day: DateIFace) => {
        const clonedDayRange = deepCloneObject(this.selectedDayRange);
        const dayRangeValue =
            clonedDayRange.from && clonedDayRange.to ? {from: null, to: null} : clonedDayRange;
        const dayRangeProp = !dayRangeValue.from ? 'from' : 'to';
        dayRangeValue[dayRangeProp] = day;
        const {from, to} = dayRangeValue;

        // swap from and to values if from is later than to
        if (isBeforeDate(dayRangeValue.to, dayRangeValue.from)) {
            dayRangeValue.from = to;
            dayRangeValue.to = from;
        }

        const checkIncludingDisabledDay = (disabledDay: DateIFace) => {
            return checkDayInDayRange({
                day: disabledDay,
                from: dayRangeValue.from,
                to: dayRangeValue.to,
            });
        };
        const includingDisabledDay = this.disabledDays.find(checkIncludingDisabledDay);
        if (includingDisabledDay) {
            this.onDisabledDayError(includingDisabledDay);
            return this.selectedDayRange;
        }

        return dayRangeValue;
    };

    handleDayClick = (day: DateIFace) => {
        const newDayValue = this.isDayRange ? this.getDayRangeValue(day) : day;
        this.onChange(newDayValue);
    };

    getDayClassNames = (dayItem: DateIFace) => {
        const isToday = isSameDay(dayItem, this.today);
        const isSelected = this.selectedDay ? isSameDay(dayItem, this.selectedDay) : false;
        const {from: startingDay, to: endingDay} = this.selectedDayRange;
        const isStartedDayRange = isSameDay(dayItem, startingDay);
        const isEndingDayRange = isSameDay(dayItem, endingDay);
        const isWithinRange = checkDayInDayRange({day: dayItem, from: startingDay, to: endingDay});
        const classNames = ''
            .concat(isToday && !isSelected ? ` -today ${this.calendarTodayClassName}` : '')
            .concat(!dayItem.isStandard ? ' -blank' : '')
            .concat(isSelected ? ` -selected ${this.calendarSelectedDayClassName}` : '')
            .concat(isStartedDayRange ? ` -selectedStart ${this.calendarRangeStartClassName}` : '')
            .concat(isEndingDayRange ? ` -selectedEnd ${this.calendarRangeEndClassName}` : '')
            .concat(isWithinRange ? ` -selectedBetween ${this.calendarRangeBetweenClassName}` : '')
            .concat(dayItem.isDisabled ? '-disabled' : '');
        return classNames;
    };

    getViewMonthDays = (isNewMonth: boolean) => {
        const date = this.getDate(!isNewMonth);
        const prependingBlankDays = createUniqueRange(getMonthFirstWeekday(date), 'starting-blank');

        // all months will have an additional 7 days(week) for rendering purpose
        const appendingBlankDays = createUniqueRange(7 - getMonthFirstWeekday(date), 'ending-blank');
        const standardDays = createUniqueRange(getMonthLength(date)).map(
            (day: DateIFace) => ({
                ...day,
                isStandard: true,
                month: date.month,
                year: date.year,
            }),
            'standard',
        );
        const allDays = prependingBlankDays.concat(standardDays, appendingBlankDays);
        return allDays;
    };

    renderMonthDays = (isNewMonth: boolean) => {
        const allDays = this.getViewMonthDays(isNewMonth);
        return allDays.map(({id, value: day, month, year, isStandard}) => {
            const dayItem = {day, month, year};
            const isInDisabledDaysRange = this.disabledDays.some(disabledDay =>
                isSameDay(dayItem, disabledDay),
            );
            const isBeforeMinimumDate = isBeforeDate(dayItem, this.minimumDate);
            const isAfterMaximumDate = isBeforeDate(this.maximumDate, dayItem);
            const isNotInValidRange = isStandard && (isBeforeMinimumDate || isAfterMaximumDate);
            const isDisabled = isInDisabledDaysRange || isNotInValidRange;
            const additionalClass = this.getDayClassNames({...dayItem, isStandard, isDisabled});
            return (
                <button
                    tabIndex={-1}
                    key={id}
                    className={`Calendar__day ${additionalClass}`}
                    onClick={() => {
                        if (isDisabled) {
                            this.onDisabledDayError(dayItem); // good for showing error messages
                            return;
                        }
                        this.handleDayClick({day, month, year});
                    }}
                    disabled={!isStandard}
                    type="button"
                >
                    {toPersianNumber(day)}
                </button>
            );
        });
    };

    // animate monthYear text in header and month days
    animateContent = (direction: string, parentRef: MutableRefObject<any>) => {
        const {current: textWrapper} = parentRef;
        const wrapperChildren: any = Array.from(textWrapper.children);
        const shownItem: any = wrapperChildren.find((child: any) => child.classList.contains('-shown'));
        if (!shownItem) return; // prevent simultaneous animations
        const hiddenItem = wrapperChildren.find((child: any) => child !== shownItem);
        const baseClass = shownItem.classList[0];
        const isNextMonth = direction === 'NEXT';
        const getAnimationClass = (value: any) => (value ? '-hiddenNext' : '-hiddenPrevious');
        shownItem.className = `${baseClass} ${getAnimationClass(!isNextMonth)}`;
        hiddenItem.className = `${baseClass} ${getAnimationClass(isNextMonth)}`;
        hiddenItem.classList.add('-shownAnimated');
    };

    handleMonthClick = (direction: string) => {

        this.setState({status: direction})
        this.animateContent(direction, this.monthYearTextWrapper);
        this.animateContent(direction, this.calendarSectionWrapper);
    };

    handleAnimationEnd = (evt: any) => {
        evt.target.classList.remove('-hiddenNext');
        evt.target.classList.remove('-hiddenPrevious');
        evt.target.classList.replace('-shownAnimated', '-shown');
    };

    updateDate = () => {
        this.setState({
            cycleCount: this.state.cycleCount + 1,
            activeDate: getDateAccordingToMonth(this.state.activeDate, this.state.status),
        });
    };

    toggleMonthArrows = () => {
        const arrows = this.calendarElement.current.querySelectorAll('.Calendar__monthArrowWrapper');
        arrows.forEach(arrow => {
            arrow.classList.toggle('-hidden');
        });
    };

    toggleMonthSelector = () => {
        this.toggleMonthArrows();
        const monthText: any = this.calendarElement.current.querySelector(
            '.Calendar__monthYear.-shown .Calendar__monthText',
        );
        const yearText: any = monthText.nextSibling;
        const isClosed = yearText.classList.contains('-hidden');
        const scale = isClosed ? 1 : 1.05;
        const translateX = isClosed ? 0 : `-${yearText.offsetWidth / 2}`;
        yearText.style.transform = '';
        monthText.style.transform = `scale(${scale}) translateX(${translateX}px)`;
        monthText.classList.toggle('-activeBackground');
        yearText.classList.toggle('-hidden');
        this.monthSelector.current.classList.toggle('-open');
    };

    toggleYearSelector = () => {
        this.toggleMonthArrows();
        const yearText: any = this.calendarElement.current.querySelector(
            '.Calendar__monthYear.-shown .Calendar__yearText',
        );
        const monthText: any = yearText.previousSibling;
        const isClosed = monthText.classList.contains('-hidden');
        const scale = isClosed ? 1 : 1.05;
        const translateX = isClosed ? 0 : `${monthText.offsetWidth / 2}`;
        const activeSelectorYear: any = this.calendarElement.current.querySelector(
            '.Calendar__yearSelectorText.-active',
        );
        this.yearSelectorWrapper.current.classList.toggle('-faded');
        this.yearSelector.current.scrollTop =
            activeSelectorYear.offsetTop - activeSelectorYear.offsetHeight * 5.8;
        monthText.style.transform = '';
        yearText.style.transform = `scale(${scale}) translateX(${translateX}px)`;
        yearText.classList.toggle('-activeBackground');
        monthText.classList.toggle('-hidden');
        this.yearSelector.current.classList.toggle('-open');
    };

    handleMonthSelect = (newMonthNumber: number) => {
        this.setState({
            ...this.state,
            activeDate: {...this.state.activeDate, month: newMonthNumber}
        });
        this.toggleMonthSelector();
    };

    renderMonthSelectorItems = () =>
        PERSIAN_MONTHS.map(persianMonth => {
            const monthNumber = getMonthNumber(persianMonth);
            const monthDate = {day: 1, month: monthNumber, year: this.state.activeDate.year};
            const isAfterMaximumDate =
                this.maximumDate && isBeforeDate(this.maximumDate, {...monthDate, month: monthNumber});
            const isBeforeMinimumDate =
                this.minimumDate &&
                (isBeforeDate({...monthDate, month: monthNumber + 1}, this.minimumDate) ||
                    isSameDay({...monthDate, month: monthNumber + 1}, this.minimumDate));
            return (
                <div key={persianMonth} className="Calendar__monthSelectorItem">
                    <button
                        tabIndex={-1}
                        onClick={() => {
                            this.handleMonthSelect(monthNumber);
                        }}
                        className={`Calendar__monthSelectorItemText ${
                            monthNumber === this.state.activeDate.month ? '-active' : ''
                            }`}
                        type="button"
                        disabled={isAfterMaximumDate || isBeforeMinimumDate}
                    >
                        {persianMonth}
                    </button>
                </div>
            );
        });

    selectYear = (year: number) => {
        this.setState({
            ...this.state,
            activeDate: {...this.state.activeDate, year},
        });
        this.toggleYearSelector();
    };

    renderSelectorYears = () => {
        // const items =
        const items = [];
        for (let i = this.selectorStartingYear; i <= this.selectorEndingYear; i += 1) {
            items.push(i);
        }
        return items.map(item => {
            const isAfterMaximumDate = this.maximumDate && item > this.maximumDate.year;
            const isBeforeMinimumDate = this.minimumDate && item < this.minimumDate.year;
            return (
                <div key={item} className="Calendar__yearSelectorItem">
                    <button
                        tabIndex={-1}
                        className={`Calendar__yearSelectorText ${this.state.activeDate.year === item ? '-active' : ''}`}
                        type="button"
                        onClick={() => {
                            this.selectYear(item);
                        }}
                        disabled={isAfterMaximumDate || isBeforeMinimumDate}
                    >
                        {toPersianNumber(item)}
                    </button>
                </div>
            );
        });
    };

    isNextMonthArrowDisabled(): boolean {
        return this.maximumDate &&
        isBeforeDate(this.maximumDate, {
            ...this.state.activeDate,
            month: this.state.activeDate.month + 1,
            day: 1
        });
    }
    isPreviousMonthArrowDisabled(): boolean {
        return this.minimumDate &&
        (isBeforeDate({...this.state.activeDate, day: 1}, this.minimumDate) ||
            isSameDay(this.minimumDate, {...this.state.activeDate, day: 1}));
    }
    // determine the hidden animated item
    isCycleCountEven(): boolean {
        return this.state.cycleCount % 2 === 0;
    }

    get isDayRange(): boolean{
        if(this.props.isDayRange) return this.props.isDayRange;
        return true
    }

    get onChange(): Function {
        if(this.props.onChange) return this.props.onChange;
        return (): any => null;
    }

    get onDisabledDayError(): Function {
        if(this.props.onDisabledDayError) return this.props.onDisabledDayError;
        return (): any => null;
    }
    get selectedDay(): DateIFace {
        if(this.props.selectedDay) return this.props.selectedDay;
        return null;
    }

    get selectedDayRange(): DateRangeIFace {
        if(this.props.selectedDayRange) return this.props.selectedDayRange;
        return {
            from: null,
            to: null,
        }
    }

    get minimumDate(): DateIFace {
        if(this.props.minimumDate) return this.props.minimumDate;
        return null;
    }

    get maximumDate(): DateIFace {
        if(this.props.maximumDate) return this.props.maximumDate;
        return null;
    }

    get disabledDays(): Array<DateIFace> {
        if(this.props.disabledDays) return this.props.disabledDays;
        return [];
    }

    get colorPrimary(): string {
        if(this.props.colorPrimary) return this.props.colorPrimary;
        return '#0eca2d';
    }

    get colorPrimaryLight(): string {
        if(this.props.colorPrimaryLight) return this.props.colorPrimaryLight;
        return '#cff4d5';
    }

    get calendarClassName(): string {
        if(this.props.calendarClassName) return this.props.calendarClassName;
        return '';
    }

    get calendarTodayClassName(): string {
        if(this.props.calendarTodayClassName) return this.props.calendarTodayClassName;
        return '';
    }

    get calendarSelectedDayClassName(): string {
        if(this.props.calendarSelectedDayClassName) return this.props.calendarSelectedDayClassName;
        return '';
    }

    get calendarRangeStartClassName(): string {
        if(this.props.calendarRangeStartClassName) return this.props.calendarRangeStartClassName;
        return '';
    }

    get calendarRangeBetweenClassName(): string {
        if(this.props.calendarRangeBetweenClassName) return this.props.calendarRangeBetweenClassName;
        return '';
    }

    get calendarRangeEndClassName(): string {
        if(this.props.calendarRangeEndClassName) return this.props.calendarRangeEndClassName;
        return '';
    }

    get selectorEndingYear(): number {
        if(this.props.selectorEndingYear) return this.props.selectorEndingYear;
        return 1450;
    }

    get selectorStartingYear(): number {
        if(this.props.selectorStartingYear) return this.props.selectorStartingYear;
        return 1300;
    }

    render() {
        return (
            <div
                className={`Calendar ${this.calendarClassName}`}
                style={this.colorStyle}
                ref={this.calendarElement}>
                <div className="Calendar__header">
                    <button
                        tabIndex={-1}
                        className="Calendar__monthArrowWrapper -right"
                        onClick={() => this.handleMonthClick('PREVIOUS')}
                        aria-label="ماه قبل"
                        type="button"
                        disabled={this.isPreviousMonthArrowDisabled()}>
                        <span className="Calendar__monthArrow">
                        &nbsp;
                        </span>
                    </button>
                    <div className="Calendar__monthYearContainer" ref={this.monthYearTextWrapper}>
                        &nbsp;
                        <div onAnimationEnd={this.handleAnimationEnd} className="Calendar__monthYear -shown">
                            <button
                                tabIndex={-1}
                                onClick={this.toggleMonthSelector}
                                type="button"
                                className="Calendar__monthText"
                            >
                                {this.getMonthYearText(this.isCycleCountEven()).split(' ')[0]}
                            </button>
                            <button
                                tabIndex={-1}
                                onClick={this.toggleYearSelector}
                                type="button"
                                className="Calendar__yearText"
                            >
                                {this.getMonthYearText(this.isCycleCountEven()).split(' ')[1]}
                            </button>
                        </div>
                        <div onAnimationEnd={this.handleAnimationEnd} className="Calendar__monthYear -hiddenNext">
                            <button
                                tabIndex={-1}
                                onClick={this.toggleMonthSelector}
                                type="button"
                                className="Calendar__monthText"
                            >
                                {this.getMonthYearText(!this.isCycleCountEven).split(' ')[0]}
                            </button>
                            <button
                                tabIndex={-1}
                                onClick={this.toggleYearSelector}
                                type="button"
                                className="Calendar__yearText"
                            >
                                {this.getMonthYearText(!this.isCycleCountEven).split(' ')[1]}
                            </button>
                        </div>
                    </div>
                    <button
                        tabIndex={-1}
                        className="Calendar__monthArrowWrapper -left"
                        onClick={() => this.handleMonthClick('NEXT')}
                        aria-label="ماه بعد"
                        type="button"
                        disabled={this.isNextMonthArrowDisabled()}
                    >
                        <span className="Calendar__monthArrow">
                        &nbsp;
                        </span>
                    </button>
                </div>
                <div className="Calendar__monthSelectorAnimationWrapper">
                    <div className="Calendar__monthSelectorWrapper">
                        <div ref={this.monthSelector} className="Calendar__monthSelector">
                            {this.renderMonthSelectorItems()}
                        </div>
                    </div>
                </div>

                <div className="Calendar__yearSelectorAnimationWrapper">
                    <div ref={this.yearSelectorWrapper} className="Calendar__yearSelectorWrapper">
                        <div ref={this.yearSelector} className="Calendar__yearSelector">
                            {this.renderSelectorYears()}
                        </div>
                    </div>
                </div>
                <div className="Calendar__weekDays">{this.renderWeekDays()}</div>
                <div ref={this.calendarSectionWrapper} className="Calendar__sectionWrapper">
                    <div
                        onAnimationEnd={e => {
                            this.handleAnimationEnd(e);
                            this.updateDate();
                        }}
                        className="Calendar__section -shown"
                    >
                        {this.renderMonthDays(this.isCycleCountEven())}
                    </div>
                    <div
                        onAnimationEnd={e => {
                            this.handleAnimationEnd(e);
                            this.updateDate();
                        }}
                        className="Calendar__section -hiddenNext"
                    >
                        {this.renderMonthDays(!this.isCycleCountEven())}
                    </div>
                </div>
            </div>
        );
    }
}