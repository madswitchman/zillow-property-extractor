# Zillow Property Extractor - Chrome Extension

A Chrome extension that adds a "Download Excel" button to Zillow search results pages, automatically extracting ALL property addresses with Days on Market data and downloading them as sortable Excel spreadsheets - perfect for your postcard campaign.

## Support

If you find this extension helpful, consider buying me a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow.svg?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/madswitchman)

## Features

- **One-Click Automation**: Automatically paginates through ALL pages and downloads property data
- **Sortable Excel Spreadsheets**: Downloads as native Excel files (.xlsx) with sortable/filterable columns
- **Days on Market**: Each property includes address AND days on market in separate columns
- **Progressive Downloads**: Downloads an Excel file after each page (latest file has all data)
- **Survives Redirects**: Even if Zillow interrupts, you keep all data collected so far
- **Excel Ready**: Opens directly in Excel or Google Sheets with proper formatting and column widths
- **Clean Interface**: Floating button that doesn't interfere with Zillow's layout
- **Visual Feedback**: Shows current page and property count in real-time
- **Dated Filenames**: Files named like `zillow-properties-progress-page10-2025-10-19.xlsx`

## Installation Instructions

### Step 1: Download the Extension
1. Locate the `zillow-address-extractor` folder on your computer
2. Make sure all 5 files are present:
   - `manifest.json`
   - `content.js`
   - `xlsx.full.min.js` (Excel export library)
   - `styles.css`
   - `icon.png`

### Step 2: Install in Chrome
1. Open Google Chrome
2. Type `chrome://extensions` in the address bar and press Enter
3. Toggle "Developer mode" ON (switch in top-right corner)
4. Click "Load unpacked" button (top-left)
5. Select the `zillow-address-extractor` folder
6. The extension is now installed!

### Step 3: Use the Extension
1. Go to Zillow.com
2. Search for properties (e.g., "Nashville, TN")
3. You'll see a blue "Download Excel" button in the bottom-right corner
4. Click the button and wait (it will auto-paginate through ALL pages)
5. **Multiple Excel files download** - one after each page is processed
6. The **latest file** contains ALL properties (cumulative)
7. Open the latest .xlsx file in Excel or Google Sheets
8. Done! Each property has two sortable columns: **Address** and **Days on Market**

**Note:** The extension downloads an Excel file after each page as a safety backup. If Zillow stops the pagination early, you'll still have all properties collected up to that point in the latest file.

## Usage Tips

- **Daily Workflow**:
  - Check your Zillow saved search email alerts
  - Click "View all new listings" link
  - **IMPORTANT**: Resize your browser window to be narrower (around 1200px wide or less) to get list-only view with 40+ properties per page instead of 9
  - Or manually click the "List" button if available to hide the map
  - Click the "Download Excel" button
  - Wait for it to paginate through all pages (you'll see multiple Excel downloads)
  - Use the **latest/highest page number** Excel file - it has ALL properties with Days on Market data
  - **Sort by Days on Market** in Excel to prioritize newest listings (just click the column header!)

- **Multiple Downloads**:
  - You'll get one Excel file per page processed (e.g., page1.xlsx, page2.xlsx, page3.xlsx...)
  - Each new file contains ALL properties from all previous pages (cumulative)
  - **You only need the latest file** - older files can be deleted
  - Example: If you have page1.xlsx, page2.xlsx, page3.xlsx - just use page3.xlsx

- **Days on Market Column** (Sortable!):
  - Shows how many days each property has been listed on Zillow (when available)
  - Zillow doesn't show days on market for all properties - some show badges like "Price reduced" or "Updated bathrooms" instead
  - When days data isn't available, shows "N/A"
  - **Excel Sorting**: Click the "Days on Market" column header in Excel to sort ascending (newest first!)
  - **Excel Filtering**: Use Excel's filter feature to hide "N/A" entries and focus on properties with actual day counts

- **Safety Feature**:
  - Downloads happen AFTER each page is processed
  - If Zillow redirects or stops the automation, you still have all data up to that point
  - The extension can process up to 100 pages before auto-stopping

- **Filtering Results**:
  - Use Zillow's filters to narrow down to only new listings
  - The extension downloads whatever matches your filters

## Troubleshooting

**Button doesn't appear:**
- Make sure you're on a Zillow search results page (not a single property page)
- Try refreshing the page
- Check that the extension is enabled at `chrome://extensions`

**Downloads not appearing:**
- Check your browser's download permissions
- Make sure pop-ups aren't blocked for Zillow
- Look in your Downloads folder for files named `zillow-properties-progress-page*.xlsx`
- Check if Chrome is asking for permission to download multiple files

**Extension stops early:**
- Zillow sometimes redirects after several pages of automation
- Don't worry! You still have all data in the latest downloaded Excel file
- The extension saved an Excel file after each page, so no data is lost

**Too many files downloaded:**
- This is normal! You get one Excel file per page
- Each file is cumulative (contains all properties from all previous pages)
- **Just use the file with the highest page number** - delete the rest

**Addresses look wrong:**
- The extension grabs visible text from Zillow's address fields
- You may need to clean up formatting in Excel
- Zillow may have changed their layout - let me know and I can update the extension

## Sharing with Your Friend

To share this extension:
1. Zip the entire `zillow-address-extractor` folder
2. Send the zip file to your friend
3. Have them follow the installation instructions above

## Privacy & Security

- This extension only runs on Zillow.com pages
- It does NOT collect, store, or send any data
- It only accesses the addresses visible on your screen
- All processing happens locally in your browser

## Updates

If Zillow changes their website layout and the extension stops working:
1. Let me know
2. I can update the selectors in `content.js`
3. You'll just need to reload the extension folder

---

**Created for:** Extracting newly listed property addresses for mailer campaigns

**Version:** 1.2.1

**Last Updated:** October 2025
