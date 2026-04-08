// ========== DARK/LIGHT MODE ==========
const themeToggle = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update toggle button icon
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }
};

// Initialize theme
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', theme);
  
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggleBtn.addEventListener('click', themeToggle);
  }
};

// ========== MOBILE MENU ==========
const initMobileMenu = () => {
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
};

// ========== BREADCRUMBS ==========
const updateBreadcrumbs = () => {
  const breadcrumbContainer = document.querySelector('.breadcrumbs');
  if (!breadcrumbContainer) return;
  
  const path = window.location.pathname;
  const pageName = path.split('/').pop().replace('.html', '');
  const formattedName = pageName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  let breadcrumbHtml = '<a href="/">Home</a>';
  
  if (path.includes('/tools/')) {
    breadcrumbHtml += ' / <a href="../index.html">Tools</a>';
    breadcrumbHtml += ` / ${formattedName}`;
  } else if (pageName !== 'index') {
    breadcrumbHtml += ` / ${formattedName}`;
  }
  
  breadcrumbContainer.innerHTML = breadcrumbHtml;
};

// ========== UTILITY FUNCTIONS ==========
const showAlert = (message, type = 'success') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.main-container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// PDF.js loading simulation (for tools that need it)
const loadPDFLib = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.pdfjsLib !== 'undefined') {
      resolve(window.pdfjsLib);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
};

// ========== PDF TOOL FUNCTIONS ==========
// Merge PDFs
async function mergePDFs(files) {
  const { PDFDocument } = PDFLib;
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  const pdfBytes = await mergedPdf.save();
  return pdfBytes;
}

// Split PDF
async function splitPDF(file, pageNumbers) {
  const { PDFDocument } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  
  const pages = await newPdf.copyPages(sourcePdf, pageNumbers);
  pages.forEach(page => newPdf.addPage(page));
  
  const pdfBytes = await newPdf.save();
  return pdfBytes;
}

// Rotate PDF
async function rotatePDF(file, rotation) {
  const { PDFDocument, degrees } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  pages.forEach(page => {
    page.setRotation(degrees(rotation));
  });
  
  const pdfBytes = await pdf.save();
  return pdfBytes;
}

// Protect PDF with password
async function protectPDF(file, password) {
  const { PDFDocument } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  pdf.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: { printing: 'highResolution', modifying: true }
  });
  
  const pdfBytes = await pdf.save();
  return pdfBytes;
}

// Compress PDF (simulate by re-saving)
async function compressPDF(file) {
  const { PDFDocument } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pdfBytes = await pdf.save();
  return pdfBytes;
}

// Add watermark
async function addWatermark(file, watermarkText) {
  const { PDFDocument, rgb } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 4,
      y: height / 2,
      size: 48,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.3,
      rotate: 45
    });
  });
  
  const pdfBytes = await pdf.save();
  return pdfBytes;
}

// Extract metadata
async function extractMetadata(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.load(arrayBuffer);
  
  const info = pdf.getInfo();
  const pageCount = pdf.getPageCount();
  
  return { ...info, pageCount, fileSize: file.size };
}

// ========== DOWNLOAD HELPER ==========
function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  updateBreadcrumbs();
  
  // Load PDF.js if needed
  if (document.querySelector('[data-pdf-js]')) {
    loadPDFLib().catch(console.error);
  }
});
