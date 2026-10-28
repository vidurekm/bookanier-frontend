import { Plus, Trash2 } from 'lucide-react';
import { tr } from '../lib/translations';
import { Field } from './UI';
import { TimePicker } from './TimePicker';

export type TimeInterval = { from: string; to: string };

export function TimeIntervalRows({ intervals, onChange, rowClassName, showLabels = false }: {
    intervals: TimeInterval[];
    onChange: (intervals: TimeInterval[]) => void;
    rowClassName?: string;
    showLabels?: boolean;
}) {
    const rowClass = ['time-interval-row', rowClassName].filter(Boolean).join(' ');
    const picker = (value: string, label: string, onPickerChange: (value: string) => void) => {
        const timePicker = <TimePicker label={tr(label)} value={value} onChange={onPickerChange}/>;
        return showLabels ? <Field label={tr(label)}>{timePicker}</Field> : timePicker;
    };

    return <div className="time-interval-rows">{intervals.map((interval, index) => <div className={rowClass} key={index}>
        {picker(interval.from, 'From', value => onChange(intervals.map((item, itemIndex) => itemIndex === index ? { ...item, from: value } : item)))}
        <span>–</span>
        {picker(interval.to, 'To', value => onChange(intervals.map((item, itemIndex) => itemIndex === index ? { ...item, to: value } : item)))}
        <button type="button" className="icon-button time-interval-remove" aria-label={tr('Remove interval')} title={tr('Remove interval')} onClick={() => onChange(intervals.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={17} aria-hidden="true"/>
        </button>
    </div>)}</div>;
}

export function AddTimeIntervalButton({ onClick, className = '' }: {
    onClick: () => void;
    className?: string;
}) {
    return <button type="button" className={`text-button ${className}`.trim()} onClick={onClick}>
        <Plus size={16} aria-hidden="true"/>{tr('Add interval')}
    </button>;
}
