import { useEffect, useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');

export function TimePicker({ value, onChange, label, minuteStep = 5 }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    minuteStep?: number;
}) {
    const [open, setOpen] = useState(false);
    const popover = useRef<HTMLDivElement>(null);
    const [hour, minute] = /^\d{1,2}:\d{2}/.test(value) ? value.split(':').map(Number) : [NaN, NaN];
    const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);
    if (Number.isFinite(minute) && !minutes.includes(minute)) minutes.push(minute);
    minutes.sort((a, b) => a - b);
    useEffect(() => {
        if (!open) return;
        popover.current?.querySelectorAll<HTMLElement>('.time-col').forEach(column => {
            const active = column.querySelector<HTMLElement>('.active');
            column.scrollTop = active ? active.offsetTop - column.clientHeight / 2 + active.clientHeight / 2 : 0;
        });
    }, [open]);
    const pick = (nextHour: number, nextMinute: number) => onChange(`${pad(nextHour)}:${pad(nextMinute)}`);
    return <div className="period-picker period-picker-field time-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <button type="button" className="period-picker-button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)}>
            <span>{Number.isFinite(hour) ? `${pad(hour)}:${pad(minute)}` : '--:--'}</span><Clock3 size={16} aria-hidden="true"/>
        </button>
        {open && <div className="period-popover time-popover" role="dialog" aria-label={label} tabIndex={-1} ref={popover}>
            <div className="time-col" role="listbox">
                {Array.from({ length: 24 }, (_, h) => <button type="button" role="option" aria-selected={h === hour} key={h} className={h === hour ? 'active' : ''} onClick={() => pick(h, Number.isFinite(minute) ? minute : 0)}>{pad(h)}</button>)}
            </div>
            <div className="time-col" role="listbox">
                {minutes.map(m => <button type="button" role="option" aria-selected={m === minute} key={m} className={m === minute ? 'active' : ''} onClick={() => { pick(Number.isFinite(hour) ? hour : 9, m); setOpen(false); }}>{pad(m)}</button>)}
            </div>
        </div>}
    </div>;
}
