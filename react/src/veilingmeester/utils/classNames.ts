export function cx(...classes: Array<string | null | false | undefined>): string {
    return classes.filter((c): c is string => Boolean(c)).join(" ");
}