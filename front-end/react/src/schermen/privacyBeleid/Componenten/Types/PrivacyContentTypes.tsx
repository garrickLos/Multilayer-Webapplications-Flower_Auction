export interface ContentBlock {
    type: 'paragraph' | 'list';
    content: string | string[];
}