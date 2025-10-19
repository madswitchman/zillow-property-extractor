// Zillow Address Extractor - Content Script
// Extracts property addresses from Zillow search results

(function() {
    'use strict';

    // Only run on search results pages
    if (!window.location.href.includes('zillow.com')) {
        return;
    }

    // Create and inject the extract button
    function createExtractButton() {

        const button = document.createElement('button');
        button.id = 'zillow-extract-btn';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z"/>
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
            </svg>
            Download Excel
        `;
        button.addEventListener('click', extractAndDownloadExcel);
        document.body.appendChild(button);
    }

    // Extract property data (address and days on market) from the page
    function extractAddresses(debug = false) {
        const properties = [];

        // Get all property cards (articles)
        const articles = document.querySelectorAll('article');
        if (debug) console.log(`Found ${articles.length} article elements`);

        articles.forEach((article, index) => {
            // Extract address
            const addressEl = article.querySelector('address');
            if (!addressEl) return;

            let addressText = addressEl.textContent.trim();
            addressText = addressText.replace(/\s+/g, ' ').trim();

            if (!addressText || addressText.length < 5) return;

            // Extract days on market - try multiple methods
            let daysOnMarket = '';

            // Method 1: Search all text content for patterns
            const allText = article.textContent;
            const domMatch = allText.match(/(\d+)\s+days?\s+on\s+Zillow/i) ||
                           allText.match(/(\d+)\s+days?\s+ago/i) ||
                           allText.match(/(\d+)\s+day/i);

            if (domMatch) {
                daysOnMarket = domMatch[1];
            } else {
                // Method 2: Try specific DOM selectors
                const domSelectors = [
                    '[data-test="property-card-dom"]',
                    '.list-card-variable',
                    '.list-card-statusText',
                ];

                for (const selector of domSelectors) {
                    const domEl = article.querySelector(selector);
                    if (domEl) {
                        const text = domEl.textContent;
                        const match = text.match(/(\d+)\s+day/i);
                        if (match) {
                            daysOnMarket = match[1];
                            break;
                        }
                    }
                }
            }

            // Default to N/A if not found
            if (!daysOnMarket) {
                daysOnMarket = 'N/A';
            }

            properties.push({
                address: addressText,
                daysOnMarket: daysOnMarket
            });

            if (debug && index < 3) {
                console.log(`  Property ${index + 1}: ${addressText} (${daysOnMarket} days)`);
            }
        });

        if (debug) {
            console.log(`Total properties extracted: ${properties.length}`);
            if (properties.length > 3) console.log(`  ... and ${properties.length - 3} more`);
        }

        return properties;
    }

    // Auto-scroll to load all properties (Zillow uses lazy loading)
    async function scrollToLoadAll() {
        return new Promise(async (resolve) => {
            let lastCount = 0;
            let stableCount = 0;
            const maxStableChecks = 5; // If count stays same for 5 checks, we're done

            console.log('Starting auto-scroll to load all properties...');

            // Scroll down gradually and wait for new content to load
            for (let i = 0; i < 30; i++) {
                // Scroll to bottom
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });

                // Wait for content to load (longer wait)
                await new Promise(r => setTimeout(r, 1000));

                // Check how many properties we have now
                const currentCount = extractAddresses().length;
                console.log(`Scroll ${i + 1}: Found ${currentCount} properties`);

                // If count hasn't changed, increment stable counter
                if (currentCount === lastCount) {
                    stableCount++;
                    console.log(`Count stable for ${stableCount} checks`);

                    if (stableCount >= maxStableChecks) {
                        console.log('No new properties loading, stopping scroll');
                        break;
                    }
                } else {
                    stableCount = 0; // Reset if we found new properties
                }

                lastCount = currentCount;
            }

            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await new Promise(r => setTimeout(r, 500));

            console.log('Auto-scroll complete');
            resolve();
        });
    }

    // Find the "Next" button for pagination
    function findNextButton() {
        // Look for common "Next" button patterns on Zillow
        const nextSelectors = [
            'a[title="Next page"]',
            'button[title="Next page"]',
            'a[rel="next"]',
            '[data-test="pagination-next-button"]',
            'a[aria-label="Next page"]',
            'button[aria-label="Next page"]',
            // Generic next button selectors
            'nav[role="navigation"] a:last-child:not(.disabled)',
            '.pagination a:last-child:not(.disabled)',
        ];

        for (const selector of nextSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Check if it's actually enabled/clickable
                const isDisabled = element.hasAttribute('disabled') ||
                                  element.classList.contains('disabled') ||
                                  element.getAttribute('aria-disabled') === 'true';

                if (!isDisabled) {
                    console.log('Found Next button:', selector, element);
                    return element;
                }
            }
        }

        return null;
    }

    // Extract and download addresses as Excel (with multi-page support)
    async function extractAndDownloadExcel() {
        const button = document.getElementById('zillow-extract-btn');
        const originalHTML = button.innerHTML;

        // Show loading state
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 11.5V8h2v3.5h-2zM7 4.5V7h2V4.5h-2z"/>
            </svg>
            Loading page 1...
        `;
        button.disabled = true;

        let allAddresses = [];
        let currentPage = 1;
        let hasMorePages = true;

        try {
            while (hasMorePages) {
                console.log(`\n=== PAGE ${currentPage} ===`);

                // Update button text
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 11.5V8h2v3.5h-2zM7 4.5V7h2V4.5h-2z"/>
                    </svg>
                    Loading page ${currentPage}...
                `;
                showNotification(`Processing page ${currentPage}... (${allAddresses.length} addresses so far)`, 'info');

                // Scroll to load all properties on current page
                await scrollToLoadAll();

                // Extract properties from current page
                const pageProperties = extractAddresses(true);
                console.log(`Extracted ${pageProperties.length} properties from page ${currentPage}`);

                // Add to collection (avoid duplicates based on address)
                pageProperties.forEach(prop => {
                    const isDuplicate = allAddresses.some(existing => existing.address === prop.address);
                    if (!isDuplicate) {
                        allAddresses.push(prop);
                    }
                });

                console.log(`Total properties collected: ${allAddresses.length}`);

                // Store in sessionStorage as backup in case of redirect
                try {
                    sessionStorage.setItem('zillow_addresses_backup', JSON.stringify(allAddresses));
                    sessionStorage.setItem('zillow_pages_processed', currentPage.toString());
                } catch (e) {
                    console.warn('Could not save to sessionStorage:', e);
                }

                // DOWNLOAD AFTER EACH PAGE (progressive backup)
                console.log(`📥 Downloading cumulative Excel file (${allAddresses.length} properties from ${currentPage} page(s))...`);
                const today = new Date().toISOString().split('T')[0];

                // Create Excel workbook using SheetJS
                // Convert data to worksheet format (array of objects with proper headers)
                const worksheetData = allAddresses.map(prop => ({
                    'Address': prop.address,
                    'Days on Market': prop.daysOnMarket
                }));

                // Create worksheet from data
                const worksheet = XLSX.utils.json_to_sheet(worksheetData);

                // Set column widths for better readability
                worksheet['!cols'] = [
                    { wch: 50 },  // Address column width
                    { wch: 15 }   // Days on Market column width
                ];

                // Enable autofilter for sortable/filterable columns
                // Calculate the range (A1 to B[lastRow])
                const lastRow = allAddresses.length + 1; // +1 for header row
                worksheet['!autofilter'] = { ref: `A1:B${lastRow}` };

                // Create workbook and add worksheet
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

                // Generate Excel file
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `zillow-properties-progress-page${currentPage}-${today}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);
                console.log(`✓ Progress Excel file downloaded`);

                // Check if there's a Next button
                const nextButton = findNextButton();

                if (nextButton) {
                    console.log('Next button found, will navigate to next page...');

                    // Log current URL before navigation
                    const urlBeforeClick = window.location.href;
                    console.log(`URL before click: ${urlBeforeClick}`);
                    console.log(`Next button href:`, nextButton.href);

                    // Scroll to the next button to make sure it's visible
                    nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(r => setTimeout(r, 500));

                    // Click the next button
                    nextButton.click();
                    currentPage++;

                    // Wait for page to start loading
                    console.log('Waiting for navigation to start...');
                    await new Promise(r => setTimeout(r, 1000));

                    // Wait for page to fully load
                    console.log('Waiting for page to finish loading...');
                    await new Promise(r => setTimeout(r, 4000)); // Longer wait - 4 seconds

                    // Log URL after navigation
                    const urlAfterClick = window.location.href;
                    console.log(`URL after click: ${urlAfterClick}`);

                    // Check if we're still on a search results page
                    const isOnSearchResults =
                        urlAfterClick.includes('/homes/') ||
                        urlAfterClick.includes('_p/') || // Zillow pagination pattern
                        urlAfterClick.match(/\/\d+_p\//); // Matches /2_p/, /3_p/, etc.

                    if (!isOnSearchResults) {
                        console.log('⚠️ Detected redirect away from search results');
                        console.log(`Expected pattern with /homes/ or /_p/, got: ${urlAfterClick}`);

                        // IMMEDIATELY download what we have before anything else happens
                        console.log('🚨 Downloading data immediately before we lose it...');
                        const emergencyToday = new Date().toISOString().split('T')[0];

                        // Create emergency Excel workbook
                        const emergencyData = allAddresses.map(prop => ({
                            'Address': prop.address,
                            'Days on Market': prop.daysOnMarket
                        }));
                        const emergencySheet = XLSX.utils.json_to_sheet(emergencyData);
                        emergencySheet['!cols'] = [{ wch: 50 }, { wch: 15 }];

                        // Enable autofilter for sortable columns
                        const emergencyLastRow = allAddresses.length + 1;
                        emergencySheet['!autofilter'] = { ref: `A1:B${emergencyLastRow}` };

                        const emergencyWorkbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(emergencyWorkbook, emergencySheet, 'Properties');
                        const emergencyBuffer = XLSX.write(emergencyWorkbook, { bookType: 'xlsx', type: 'array' });

                        const blob = new Blob([emergencyBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `zillow-properties-partial-${emergencyToday}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        console.log(`✓ Emergency download initiated! (${allAddresses.length} properties)`);

                        // Wait for download to complete
                        await new Promise(r => setTimeout(r, 2000));

                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        hasMorePages = false;
                        // Break out immediately - don't try to download again
                        break;
                    } else {
                        console.log('✓ Still on search results page, continuing...');
                        // Wait for content to be ready
                        await new Promise(r => setTimeout(r, 1500));
                    }
                } else {
                    console.log('No more pages found');
                    hasMorePages = false;
                }

                // Safety limit to prevent infinite loops
                if (currentPage > 100) {
                    console.log('⚠️ Reached safety limit of 100 pages');
                    hasMorePages = false;
                }
            }

            console.log(`\n=== COMPLETED ===`);
            console.log(`Total pages processed: ${currentPage}`);
            console.log(`Total properties collected: ${allAddresses.length}`);
            console.log(`✓ Downloaded progress Excel files for all ${currentPage} page(s)`);
            console.log(`📁 Latest file has all ${allAddresses.length} properties with Days on Market`);

            if (allAddresses.length === 0) {
                const btn = document.getElementById('zillow-extract-btn');
                if (btn) {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }
                showNotification('No properties found. Make sure you\'re on a search results page.', 'error');
                return;
            }

            // We already downloaded after each page, so just confirm completion
            console.log('✓ All progress downloads completed successfully!');

            // Clear backup from sessionStorage
            try {
                sessionStorage.removeItem('zillow_addresses_backup');
                sessionStorage.removeItem('zillow_pages_processed');
            } catch (e) {
                console.warn('Could not clear sessionStorage:', e);
            }

            // Show success and update button (if it still exists)
            const successMessage = `Downloaded ${allAddresses.length} properties from ${currentPage} page(s)! Check your Downloads folder.`;
            showNotification(successMessage, 'success');

            const btn = document.getElementById('zillow-extract-btn');
            if (btn) {
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                    Downloaded ${allAddresses.length}! (${currentPage} pages)
                `;
                btn.classList.add('success');

                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('success');
                    btn.disabled = false;
                }, 5000);
            }

        } catch (error) {
            console.error('Error during extraction:', error);

            // Try to recover from sessionStorage backup
            try {
                const backup = sessionStorage.getItem('zillow_addresses_backup');
                if (backup) {
                    const addresses = JSON.parse(backup);
                    const pages = sessionStorage.getItem('zillow_pages_processed');

                    console.log('⚠️ Error occurred, but backup found!');
                    console.log(`Backup contains ${addresses.length} addresses from ${pages} page(s)`);
                    console.log('You can recover by running window.zillowRecoverBackup() in console');
                }
            } catch (e) {
                console.error('Could not recover backup:', e);
            }

            const btn = document.getElementById('zillow-extract-btn');
            if (btn) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
            showNotification('An error occurred. Check console for details.', 'error');
        }
    }

    // Add a helper function to the window for manual recovery
    window.zillowRecoverBackup = function() {
        try {
            const backup = sessionStorage.getItem('zillow_addresses_backup');
            if (!backup) {
                console.log('No backup found in sessionStorage');
                return;
            }

            const properties = JSON.parse(backup);
            const pages = sessionStorage.getItem('zillow_pages_processed') || 'unknown';

            console.log(`Recovering ${properties.length} properties from ${pages} page(s)...`);

            // Create Excel workbook from backup data
            const recoveryData = properties.map(prop => ({
                'Address': prop.address,
                'Days on Market': prop.daysOnMarket
            }));
            const recoverySheet = XLSX.utils.json_to_sheet(recoveryData);
            recoverySheet['!cols'] = [{ wch: 50 }, { wch: 15 }];

            // Enable autofilter for sortable columns
            const recoveryLastRow = properties.length + 1;
            recoverySheet['!autofilter'] = { ref: `A1:B${recoveryLastRow}` };

            const recoveryWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(recoveryWorkbook, recoverySheet, 'Properties');
            const recoveryBuffer = XLSX.write(recoveryWorkbook, { bookType: 'xlsx', type: 'array' });

            const blob = new Blob([recoveryBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zillow-properties-recovered-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✓ Recovery download initiated!');

            // Clear backup after successful recovery
            sessionStorage.removeItem('zillow_addresses_backup');
            sessionStorage.removeItem('zillow_pages_processed');

        } catch (error) {
            console.error('Recovery failed:', error);
        }
    };

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existing = document.getElementById('zillow-extract-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'zillow-extract-notification';
        notification.className = `zillow-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Wait for page to load, then create button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createExtractButton);
    } else {
        createExtractButton();
    }

    // Also listen for dynamic page updates (Zillow uses client-side routing)
    const observer = new MutationObserver(() => {
        if (!document.getElementById('zillow-extract-btn')) {
            createExtractButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
