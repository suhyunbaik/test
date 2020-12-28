import { parseISO, format, formatDistance, subDays } from 'date-fns'

export default function Date({ dateString }) {
    const date = parseISO(dateString)
    return <time dateTime={dateString}>{format(date, 'yyyy-M-d')}</time>
}