import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3 } from 'lucide-react';
import { orgApi, json } from '../lib/api';
import { weekdayNames } from '../lib/utils';
import { Button, ErrorState, Loading, Notice } from './UI';
type Interval = {
    from: string;
    to: string;
};
type Day = {
    weekday: number;
    intervals: Interval[];
};
type Week = {
    days: Day[];
};
export function WeekEditor({ org, location, member }: {
    org: number;
    location: number;
    member?: number;
}) {
    const qc = useQueryClient();
    const path = member ? `/locations/${location}/members/${member}/working-hours` : `/locations/${location}/opening-hours`;
    const key = ['hours', org, path];
    const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => orgApi<Week | Day[]>(org, path) });
    const [days, setDays] = useState<Day[]>(weekdayNames.map((_, i) => ({ weekday: i + 1, intervals: [] })));
    const [message, setMessage] = useState('');
    const [failure, setFailure] = useState('');
    useEffect(() => { if (data) {
        const raw = Array.isArray(data) ? data : data.days;
        const normalized = raw?.length && 'intervals' in raw[0] ? raw : weekdayNames.map((_, i) => ({ weekday: i + 1, intervals: (raw || []).filter((r: unknown) => Number((r as {
                weekday: number;
            }).weekday) === i + 1).map((r: unknown) => ({ from: String((r as {
                    from: string;
                }).from).slice(0, 5), to: String((r as {
                    to: string;
                }).to).slice(0, 5) })) }));
        setDays(weekdayNames.map((_, i) => normalized?.find(d => d.weekday === i + 1) || { weekday: i + 1, intervals: [] }));
    } }, [data]);
    const save = useMutation({ mutationFn: () => orgApi(org, path, json('PUT', { days: days.filter(d => d.intervals.length) })), onSuccess: () => { setFailure(''); setMessage(tr('Rozvrh byl uložen.')); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    const change = (weekday: number, intervals: Interval[]) => setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, intervals } : d));
    if (isLoading)
        return <Loading />;
    if (error)
        return <ErrorState error={error}/>;
    return <div className="week-editor">
    {member ? <p className="muted small">{tr('Pro každý den můžete zadat více časových intervalů.')}</p>
      : <div className="section-heading"><div><h3>{tr('Otevírací doba')}</h3><p>{tr('Pro každý den můžete zadat více časových intervalů.')}</p></div><Clock3 size={20}/></div>}
    <Notice message={failure}/><Notice message={message} kind="success"/>
    {days.map(d => <div key={d.weekday} className="week-row"><strong>{tr(weekdayNames[d.weekday - 1])}</strong><div className="week-intervals">{d.intervals.length ? d.intervals.map((interval, i) => <div key={i} className="week-interval"><input type="time" value={interval.from} onChange={e => change(d.weekday, d.intervals.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}/><span>–</span><input type="time" value={interval.to} onChange={e => change(d.weekday, d.intervals.map((x, j) => j === i ? { ...x, to: e.target.value } : x))}/><button className="text-button danger" onClick={() => change(d.weekday, d.intervals.filter((_, j) => j !== i))}>{tr("Odebrat")}</button></div>) : <span className="muted">{tr("Volno / zav\u0159eno")}</span>}</div><button className="text-button" onClick={() => change(d.weekday, [...d.intervals, { from: '09:00', to: '17:00' }])}>+ Interval</button></div>)}
    <div className="form-actions"><Button loading={save.isPending} onClick={() => save.mutate()}>{tr("Ulo\u017Eit rozvrh")}</Button></div>
    {member && <p className="muted small">{tr('Pracovní doba se nesmí překrývat s pracovní dobou na jiné pobočce ani s existujícími rezervacemi.')}</p>}
  </div>;
}
