import { tr } from '../lib/translations';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orgApi, json } from '../lib/api';
import { weekdayNames } from '../lib/utils';
import { ErrorState, Loading } from './UI';
import { AddTimeIntervalButton, TimeIntervalRows } from './TimeIntervalEditor';
import { useMemberDetailSave } from './MemberDetailSaveContext';
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
    const [savedDays, setSavedDays] = useState<Day[]>(weekdayNames.map((_, i) => ({ weekday: i + 1, intervals: [] })));
    useEffect(() => { if (data) {
        const raw = Array.isArray(data) ? data : data.days;
        const normalized = raw?.length && 'intervals' in raw[0] ? raw : weekdayNames.map((_, i) => ({ weekday: i + 1, intervals: (raw || []).filter((r: unknown) => Number((r as {
                weekday: number;
            }).weekday) === i + 1).map((r: unknown) => ({ from: String((r as {
                    from: string;
                }).from).slice(0, 5), to: String((r as {
                    to: string;
                }).to).slice(0, 5) })) }));
        const nextDays = weekdayNames.map((_, i) => normalized?.find(d => d.weekday === i + 1) || { weekday: i + 1, intervals: [] });
        setDays(nextDays);
        setSavedDays(nextDays);
    } }, [data]);
    const dirty = JSON.stringify(days) !== JSON.stringify(savedDays);
    const saveDraft = useCallback(async () => {
        await orgApi(org, path, json('PUT', { days: days.filter(d => d.intervals.length) }));
        setSavedDays(days);
        await qc.invalidateQueries({ queryKey: key });
    }, [days, key, org, path, qc]);
    useMemberDetailSave(`hours-${location}-${member ?? 'location'}`, 2, dirty, saveDraft);
    const change = (weekday: number, intervals: Interval[]) => setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, intervals } : d));
    if (isLoading)
        return <Loading />;
    if (error)
        return <ErrorState error={error}/>;
    return <div className="week-editor">
    {member ? <p className="muted small">{tr('You can add multiple time intervals for each day.')}</p>
      : <div className="section-heading"><div><h3>{tr('Opening hours')}</h3><p>{tr('You can add multiple time intervals for each day.')}</p></div></div>}
    {days.map(d => <div key={d.weekday} className="week-row"><strong>{tr(weekdayNames[d.weekday - 1])}</strong><div className="week-intervals">{d.intervals.length ? <TimeIntervalRows intervals={d.intervals} onChange={intervals => change(d.weekday, intervals)} rowClassName="week-interval"/> : <span className="muted">{tr("Day off / closed")}</span>}</div><AddTimeIntervalButton className="week-add-interval" onClick={() => change(d.weekday, [...d.intervals, { from: '09:00', to: '17:00' }])}/></div>)}
    {member && <p className="muted small">{tr('Working hours must not overlap between locations or with existing bookings.')}</p>}
  </div>;
}
