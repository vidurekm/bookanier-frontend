import { useState } from 'react';

export function useFormDraft<T>(initial: T) {
    const [value, setValue] = useState(initial);
    const [baseline, setBaseline] = useState(initial);
    const dirty = JSON.stringify(value) !== JSON.stringify(baseline);
    const reset = (next: T) => {
        setValue(next);
        setBaseline(next);
    };
    return [value, setValue, dirty, reset] as const;
}
