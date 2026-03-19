declare module 'vinted-api' {
    interface VintedPhoto {
        url: string;
        high_resolution: {
            timestamp: string;
        };
    }

    interface VintedItem {
        id: number;
        title: string;
        url: string;
        price: number | string;
        size_title: string;
        photo: VintedPhoto;
    }

    interface VintedSearchResult {
        items?: VintedItem[];
    }

    interface VintedSearchOptions {
        per_page?: string;
    }

    const vinted: {
        search(
            url: string,
            disableFilters: boolean,
            disableProxy: boolean,
            options?: VintedSearchOptions
        ): Promise<VintedSearchResult>;
    };

    export default vinted;
}
