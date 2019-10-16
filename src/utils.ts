import * as moment from 'moment-jalaali';

moment.loadPersian({
  usePersianDigits: true,
  dialect: 'persian-modern'
});

const PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];
export interface DateIFace{
  year: number;
  month: number;
  day: number;
  isStandard?: boolean;
  isDisabled?: boolean;
}
export interface DateIFace{
  year: number;
  month: number;
  day: number;
}
export interface DateRangeIFace{
  day?: DateIFace;
  from: DateIFace;
  to: DateIFace;
}

const WEEK_DAYS = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنجشنبه',
  friday: 'جمعه',
};

const getToday = (): DateIFace => {
  const todayDate = new Date();
  // const todayYear = todayDate.getFullYear();
  // const todayMonth = todayDate.getMonth() + 1;
  // const todayDay = todayDate.getDate();
  // const { jy: J_YEAR, jm: J_MONTH, jd: J_DAY } = jalaali.toJalaali(todayYear, todayMonth, todayDay);
  const m = moment(todayDate);
  const currentDate = { year: m.jYear(), month: m.jMonth()+1, day: m.jDate() };

  return currentDate;
};

const createUniqueRange = (number: number, startingId?: string): Array<any> =>
  Array.from(Array(number).keys()).map(key => ({
    value: key + 1,
    id: `${startingId}-${key}`,
  }));

const toPersianNumber = (number: string|number) =>
  number
    .toString()
    .split('')
    .map(letter => PERSIAN_NUMBERS[Number(letter)])
    .join('');

const getMonthName = (month: number) => PERSIAN_MONTHS[month - 1];

const getMonthNumber = (monthName:string) => PERSIAN_MONTHS.indexOf(monthName) + 1;

const getMonthLength = (date: DateIFace): number => moment.jDaysInMonth(date.year, date.month);

const getMonthFirstWeekday = (_date: DateIFace) => {
  const gregorianFirstDay = toNativeDate({year:_date.year, month:_date.month, day:1});
  const weekday = gregorianFirstDay.getDay()
  console.log(weekday)
  return weekday < 6 ? weekday + 1 : 3;
};

const getDateAccordingToMonth = (date: DateIFace, direction: string) => {
  const toSum = direction === 'NEXT' ? 1 : -1;
  let newMonthIndex = date.month + toSum;
  let newYear = date.year;
  if (newMonthIndex < 1) {
    newMonthIndex = 12;
    newYear -= 1;
  }
  if (newMonthIndex > 12) {
    newMonthIndex = 1;
    newYear += 1;
  }
  const newDate = { year: newYear, month: newMonthIndex, day: 1 };
  return newDate;
};

const isSameDay = (date1: DateIFace, date2: DateIFace) => {
  if (!date1 || !date2) return false;
  return date1.day === date2.day && date1.month === date2.month && date1.year === date2.year;
};

const toNativeDate = (date: DateIFace) => {
  return moment(`${date.year}/${putZero(date.month)}/${putZero(date.day)}`,'jYYYY/jMM/jDD').toDate();
};

const isBeforeDate = (date1: DateIFace, date2: DateIFace) => {
  if (!date1 || !date2) return false;
  return toNativeDate(date1) < toNativeDate(date2);
};

const checkDayInDayRange = (range: DateRangeIFace):boolean => {
  if (!range.day || !range.from || !range.to) return false;
  const nativeDay = toNativeDate(range.day);
  const nativeFrom = toNativeDate(range.from);
  const nativeTo = toNativeDate(range.to);
  if(nativeDay > nativeFrom && nativeDay < nativeTo){
  console.log(range)
  console.log(nativeDay > nativeFrom && nativeDay < nativeTo)}
  return nativeDay > nativeFrom && nativeDay < nativeTo;
};

const putZero = (number: number): string => number  ? (number.toString().length === 1 ? `0${number}` : number + ''): '01';

const shallowCloneObject = (obj: Object) => ({ ...obj });

const deepCloneObject = (obj: Object) => JSON.parse(JSON.stringify(obj));

export {
  WEEK_DAYS,
  PERSIAN_MONTHS,
  getToday,
  toPersianNumber,
  createUniqueRange,
  getMonthName,
  getMonthNumber,
  getMonthLength,
  getMonthFirstWeekday,
  getDateAccordingToMonth,
  isSameDay,
  checkDayInDayRange,
  isBeforeDate,
  putZero,
  shallowCloneObject,
  deepCloneObject,
};
