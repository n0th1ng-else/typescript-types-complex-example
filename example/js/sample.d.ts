// sample.d.ts

export const pageSize: number;
export const pageSizes: [number, number, number];
export const getOffset: (page: number, pageSize: number) => number;
