/** Physical label sheet (TP870 S / S3): 100 mm × 150 mm — Print slip. */
export const LABEL_SHEET_WIDTH_MM = 100
export const LABEL_SHEET_HEIGHT_MM = 150

/** Landscape print box for slip — matches print dialog Layout: Landscape. */
export const LABEL_PRINT_WIDTH_MM = 150
export const LABEL_PRINT_HEIGHT_MM = 100

/** Barcode max width inside slip label padding (4 mm each side). */
export const LABEL_BARCODE_MAX_WIDTH_MM = LABEL_PRINT_WIDTH_MM - 8

/** Small thermal sticker: 50 mm × 30 mm landscape — Print sticker. */
export const STICKER_WIDTH_MM = 50
export const STICKER_HEIGHT_MM = 30

export const STICKER_PADDING_MM = 1

/** Barcode max width inside sticker padding (2 mm each side). */
export const STICKER_BARCODE_MAX_WIDTH_MM = STICKER_WIDTH_MM - STICKER_PADDING_MM * 2

/** Sticker CODE128 width cap as a fraction of label width (centered). */
export const STICKER_BARCODE_WIDTH_FRACTION = 0.9

/** Bar height (px) for sticker/micro CODE128 on 30 mm labels. */
export const STICKER_BARCODE_HEIGHT_PX = 40
