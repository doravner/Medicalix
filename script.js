document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const resultDiv = document.getElementById('result');
    const matchingWordsList = document.getElementById('matching-words');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const excelFile = document.getElementById('excel-file').files[0];
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (!excelFile || !pdfFile) {
            alert('Please upload both Excel and PDF files.');
            return;
        }

        const excelWords = await processExcelFile(excelFile);
        const pdfText = await processPdfFile(pdfFile);

        const matchingWords = findMatchingWords(excelWords, pdfText);
        displayResults(matchingWords);
    });

    async function processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const column = [];

                for (let cell in worksheet) {
                    if (cell.startsWith('A') && cell !== 'A1') {
                        column.push(worksheet[cell].v);
                    }
                }
                resolve([...new Set(column)]); // Remove duplicates from Excel list
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function processPdfFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
        }

        return fullText.toLowerCase();
    }

    function findMatchingWords(excelWords, pdfText) {
        // Use a Set to automatically remove duplicates
        return [...new Set(excelWords.filter(word => pdfText.includes(word.toLowerCase())))];
    }

    function displayResults(matchingWords) {
        matchingWordsList.innerHTML = '';
        matchingWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            matchingWordsList.appendChild(li);
        });
        resultDiv.classList.remove('hidden');
    }
});