import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { localeTag } from '../lib/preferences';
import { tr } from '../lib/translations';
import { today } from '../lib/utils';

type Mode = 'day' | 'month' | 'year';

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

export function PeriodPicker({ mode, value, onChange, minYear, maxYear, weekStartDay = 1, label, field = false, minDate, unavailableDays, onViewChange, clearable = false }: {
    mode: Mode;
    value: string;
    onChange: (value: string) => void;
    minYear: number;
    maxYear: number;
    weekStartDay?: number;
    label: string;
    field?: boolean;
    minDate?: string;
    unavailableDays?: string[];
    onViewChange?: (year: number, month: number) => void;
    clearable?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(Number((value || today()).slice(0, 4)));
    const [viewMonth, setViewMonth] = useState(Number((value || today()).slice(5, 7)));
    useEffect(() => { if (open && mode === 'day') onViewChange?.(viewYear, viewMonth); }, [open, mode, viewYear, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps
    const [typedYear, setTypedYear] = useState('');
    const [typedDay, setTypedDay] = useState('');
    const locale = localeTag();
    const year = Number((value || today()).slice(0, 4));
    const triggerText = !value ? tr('Select date') : mode === 'day'
        ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
        : mode === 'month'
            ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(`${value.slice(0, 7)}-01T12:00:00`))
            : String(year);
    const toggle = () => {
        if (!open) {
            setViewYear(year);
            setViewMonth(Number((value || today()).slice(5, 7)));
            setTypedYear('');
        }
        setOpen(current => !current);
    };
    const choose = (next: string) => {
        if (mode === 'day' && ((minDate && next < minDate) || unavailableDays?.includes(next))) return;
        onChange(next);
        setOpen(false);
    };
    const shiftViewMonth = (direction: number) => {
        const date = new Date(viewYear, viewMonth - 1 + direction, 1, 12);
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth() + 1);
    };
    const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, index, 1, 12)));
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
    const typed = Number(typedYear);
    const typedValid = Number.isInteger(typed) && typed >= 1900 && typed <= 2100;

    const parseDay = (text: string) => {
        const match = text.trim().match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})$/) || text.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!match) return null;
        const [y, m, d] = match[3].length === 4 && match[1].length !== 4 ? [Number(match[3]), Number(match[2]), Number(match[1])] : [Number(match[1]), Number(match[2]), Number(match[3])];
        const date = new Date(y, m - 1, d, 12);
        return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && y >= minYear && y <= maxYear && (!minDate || iso(y, m, d) >= minDate) ? iso(y, m, d) : null;
    };
    const parsedDate = parseDay(typedDay);
    const parsedDay = parsedDate && !unavailableDays?.includes(parsedDate) ? parsedDate : null;

    const renderDays = () => {
        const first = new Date(viewYear, viewMonth - 1, 1, 12);
        const offset = (first.getDay() - weekStartDay + 7) % 7;
        const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
        const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + ((weekStartDay + index) % 7), 12)));
        const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
        const todayIso = today();
        return <>
            <form className="period-year-form" onSubmit={event => { event.preventDefault(); if (parsedDay) choose(parsedDay); }}>
                <input className="input" type="text" inputMode="numeric" placeholder={new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(`${todayIso}T12:00:00`))} aria-label={tr("Select date")} value={typedDay} onChange={event => setTypedDay(event.target.value)}/>
                <button type="submit" className="btn btn-primary" disabled={!parsedDay}>OK</button>
            </form>
            <div className="period-popover-head">
                <button type="button" aria-label={tr("Previous period")} onClick={() => shiftViewMonth(-1)}><ChevronLeft size={16}/></button>
                <strong>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(first)}</strong>
                <button type="button" aria-label={tr("Next period")} onClick={() => shiftViewMonth(1)}><ChevronRight size={16}/></button>
            </div>
            <div className="period-days">
                {weekdays.map(day => <span className="period-weekday" key={day}>{day}</span>)}
                {cells.map((day, index) => day === null ? <span key={`blank-${index}`}/> : <button type="button" key={day}
                    className={`${iso(viewYear, viewMonth, day) === value ? 'active' : ''}${iso(viewYear, viewMonth, day) === todayIso ? ' today' : ''}${iso(viewYear, viewMonth, day) < todayIso ? ' past' : unavailableDays?.includes(iso(viewYear, viewMonth, day)) ? ' unavailable' : ''}`}
                    title={iso(viewYear, viewMonth, day) >= todayIso && unavailableDays?.includes(iso(viewYear, viewMonth, day)) ? tr("No available times") : undefined}
                    disabled={(!!minDate && iso(viewYear, viewMonth, day) < minDate) || unavailableDays?.includes(iso(viewYear, viewMonth, day))}
                    onClick={() => choose(iso(viewYear, viewMonth, day))}>{day}</button>)}
            </div>
            <div className="period-popover-foot"><button type="button" disabled={(!!minDate && todayIso < minDate) || unavailableDays?.includes(todayIso)} onClick={() => choose(todayIso)}>{tr("Today")}</button></div>
        </>;
    };

    const renderMonths = () => <>
        <div className="period-popover-head">
            <button type="button" aria-label={tr("Previous period")} disabled={viewYear <= minYear} onClick={() => setViewYear(y => y - 1)}><ChevronLeft size={16}/></button>
            <strong>{viewYear}</strong>
            <button type="button" aria-label={tr("Next period")} disabled={viewYear >= maxYear} onClick={() => setViewYear(y => y + 1)}><ChevronRight size={16}/></button>
        </div>
        <div className="period-months">
            {monthNames.map((name, index) => <button type="button" key={name} className={viewYear === year && index + 1 === Number(value.slice(5, 7)) ? 'active' : ''} onClick={() => choose(iso(viewYear, index + 1, 1))}>{name}</button>)}
        </div>
    </>;

    const renderYears = () => <>
        <form className="period-year-form" onSubmit={event => { event.preventDefault(); if (typedValid) choose(`${typed}-01-01`); }}>
            <input className="input" type="number" inputMode="numeric" min={1900} max={2100} placeholder={tr("Year")} aria-label={tr("Year")} value={typedYear} onChange={event => setTypedYear(event.target.value)}/>
            <button type="submit" className="btn btn-primary" disabled={!typedValid}>OK</button>
        </form>
        <div className="period-years" role="listbox">
            {years.map(item => <button type="button" role="option" aria-selected={item === year} key={item} className={item === year ? 'active' : ''} onClick={() => choose(`${item}-01-01`)}>{item}</button>)}
        </div>
    </>;

    return <div className={`period-picker${field ? ' period-picker-field' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <div className={`period-picker-control${clearable ? ' is-clearable' : ''}`}>
            <button type="button" className={`period-picker-button${value ? '' : ' is-empty'}`} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
                <span>{triggerText}</span>{field && <CalendarDays size={16} aria-hidden="true"/>}
            </button>
            {clearable && value && <button type="button" className="period-picker-clear" aria-label={tr('Clear')} onClick={() => { onChange(''); setOpen(false); }}><X size={15}/></button>}
        </div>
        {open && <div className="period-popover" role="dialog" aria-label={label} tabIndex={-1}>
            {mode === 'day' ? renderDays() : mode === 'month' ? renderMonths() : renderYears()}
        </div>}
    </div>;
}
