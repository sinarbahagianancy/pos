# Nancy POS - Context

## Domain Glossary

### Invoice Terms

| Term                 | Definition                                      |
| -------------------- | ----------------------------------------------- |
| **Faktur Penjualan** | Sales invoice document issued to customers      |
| **Quotation**        | Price estimate document, not a proof of payment |
| **Terbilang**        | Amount in words (Indonesian language)           |
| **Keterangan**       | Notes/remarks section on the invoice            |
| **Tanda Terima**     | Receipt acknowledgement / signature area        |
| **Perhatian**        | Warning/disclaimer section                      |
| **PPN**              | Pajak Pertambahan Nilai (Value Added Tax)       |
| **NIK**              | Nomor Induk Kependudukan (National ID Number)   |
| **NPWP**             | Nomor Pokok Wajib Pajak (Tax ID Number)         |
| **Seria**            | Serial number of the product                    |
| **PO**               | Purchase Order                                  |

### Payment Terms

| Term         | Definition                                       |
| ------------ | ------------------------------------------------ |
| **Cash**     | Direct cash payment                              |
| **Debit**    | Debit card payment                               |
| **QRIS**     | Quick Response Code Indonesian Standard          |
| **Transfer** | Bank transfer                                    |
| **Utang**    | Credit/debt (marked as "UTANG (BON)" on invoice) |

### Product Terms

| Term      | Definition                                 |
| --------- | ------------------------------------------ |
| **Merk**  | Brand/manufacturer of the product          |
| **Model** | Product model name                         |
| **SN**    | Serial Number (unique identifier per unit) |
| **COGS**  | Cost of Goods Sold                         |

### Cart Terms

| Term          | Definition                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cart Row**  | A single line item in the POS cart. For Non-SN products it carries a `quantity`; for SN products it represents one specific serial number.               |
| **Quantity**  | The number of units for a Non-SN Cart Row. Adjusted via a stepper in the cart. Does not apply to SN rows (each SN is its own row).                       |
| **SN Picker** | A modal shown when adding an SN product to the cart. Lists all available serial numbers for that product so the user can choose which one(s) to add.     |
| **SN Swap**   | Ability to change the serial number of an SN Cart Row after it's already in the cart, by clicking the SN text and selecting from available alternatives. |

### Store Information

- **Store Name**: Sinar Bahagia
- **Tagline**: TERPERCAYA SEJAK 1960
- **Sub-tagline**: CUTTING EDGE PHOTOGRAPHY
- **Address**: JL. KRAMAT GANTUNG NO.63 SURABAYA 60174 (TIDAK BUKA CABANG) TOKO WARNA KUNING KIRI KANAN JALAN
- **Phone**: 0857. 31. 555. 667
- **Bank**: BCA - 010-175-0085 (DJOKO SUBARDJO DJOHAN)

## Key Decisions

### Invoice Layout

- A5 landscape content on A4 portrait (bottom half)
- 6-column table for items (Seria, Nama Barang, Qty, @Harga, Diskon, Total Harga)
- 3-column bottom section (Pembayaran | Tanda Terima | PERHATIAN)
- Terbilang (amount in words) above Keterangan/Totals

### Number Formatting

- Indonesian format with dots as thousand separators
- No "Rp" prefix in table/totals
- Rounded to integers (no sen/cents)

### Date Format

- DD MMM YYYY (e.g., 05 Jan 2026)

### Icons

- Lucide icons for location (MapPin) and phone (Phone/Smartphone)
- Empty View placeholders for YouTube, Instagram, TikTok, BCA logo
