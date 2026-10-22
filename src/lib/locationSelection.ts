export function singleActiveLocationId(
    locations: readonly { id: number; active: boolean }[] | undefined
): number | undefined {
    const activeLocations = locations?.filter(location => location.active) || [];
    return activeLocations.length === 1 ? activeLocations[0].id : undefined;
}
