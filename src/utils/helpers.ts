export function formatErrorMessage(message: string, line: number, column: number): string {
    return `Error: ${message} (Line: ${line}, Column: ${column})`;
}

export function isEmpty(value: any): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function joinArrayWithCommas(array: string[]): string {
    return array.join(', ');
}
