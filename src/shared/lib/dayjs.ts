import dayjs from 'dayjs';
import 'dayjs/locale/uz-latn';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(updateLocale);

dayjs.locale('uz-latn');
// Hafta dushanbadan boshlanadi
dayjs.updateLocale('uz-latn', { weekStart: 1 });

export default dayjs;
export type { Dayjs } from 'dayjs';
