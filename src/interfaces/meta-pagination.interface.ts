
export interface MetaPagination {
    page:            number;
    take:            number;
    totalCount:      number;
    pageCount:       number;
    hasPreviousPage: boolean;
    hasNextPage:     boolean;
}
