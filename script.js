document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const results = document.getElementById('results');
    const moleculeCount = document.getElementById('molecule-count');
    const moleculeList = document.getElementById('molecule-list');
    const markedText = document.getElementById('marked-text');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const excelFile = document.getElementById('excel-file').files[0];
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (!excelFile || !pdfFile) {
            alert('Please select both an Excel file and a PDF file.');
            return;
        }

        try {
            const molecules = await extractMoleculesFromExcel(excelFile);
            const { foundMolecules, extractedText } = await searchMoleculesInPDF(pdfFile, molecules);
            displayResults(foundMolecules, extractedText);
        } catch (error) {
            console.error('Error processing files:', error);
            alert('An error occurred while processing the files. Please try again.');
        }
    });

    async function extractMoleculesFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const molecules = XLSX.utils.sheet_to_json(firstSheet, {header: 1})
                    .map(row => row[0])
                    .filter(molecule => molecule && typeof molecule === 'string');
                resolve(molecules);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function searchMoleculesInPDF(file, molecules) {
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        const foundMolecules = new Set();
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += pageText + '\n\n';

            molecules.forEach(molecule => {
                const regex = new RegExp(`\\b${molecule}\\b`, 'gi');
                if (regex.test(pageText)) {
                    foundMolecules.add(molecule);
                }
            });
        }

        return { foundMolecules: Array.from(foundMolecules), extractedText };
    }

    function displayResults(foundMolecules, extractedText) {
        moleculeCount.textContent = `Found ${foundMolecules.length} unique molecules`;
        moleculeList.innerHTML = foundMolecules.map(molecule => `<li>${molecule}</li>`).join('');
        
        foundMolecules.forEach(molecule => {
            const regex = new RegExp(`\\b${molecule}\\b`, 'gi');
            extractedText = extractedText.replace(regex, match => `<span class="marked-molecule">${match}</span>`);
        });
        
        markedText.innerHTML = extractedText;
        results.classList.remove('hidden');
    }
});

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
