export const generateInvoicePDF = async (element: HTMLElement | null, invoiceNumber: string) => {
  if (!element) {
    console.error('Element not found for PDF generation');
    return;
  }

  try {
    // Import html2canvas and jsPDF dynamically with error handling
    let html2canvas, jsPDF;
    try {
      html2canvas = (await import('html2canvas')).default;
      jsPDF = (await import('jspdf')).default;
    } catch (importError) {
      console.error('Error importing PDF libraries:', importError);
      alert('Failed to load PDF generation libraries. Please try again later.');
      return;
    }

    // Configure html2canvas options for better quality with error handling
    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale: 1.2, // Reduced scale for better performance and smaller size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: Math.min(element.scrollWidth, 750), // Slightly smaller width
        height: Math.min(element.scrollHeight, 1000), // Reduced height to fit A4
        scrollX: 0,
        scrollY: 0,
        windowWidth: 750,
        windowHeight: 1000
      });
    } catch (canvasError) {
      console.error('Error creating canvas:', canvasError);
      alert('Failed to generate PDF. Please try again.');
      return;
    }

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions - A4 size
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    
    // Calculate image dimensions to fit A4
    const imgWidth = pdfWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If image height exceeds A4 height, scale it down
    if (imgHeight > pdfHeight - 15) { // Leave 15mm margin
      imgHeight = pdfHeight - 15;
    }
    
    // Create PDF and add content with error handling
    try {
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });
      
      // Try to add logo to PDF
      try {
        // Add logo to PDF
        const logoUrl = "/logo.jpg";
        // Create a temporary image element to load the logo
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = "Anonymous";  // Important for CORS
          logoImg.src = logoUrl;
        
          // Wait for the image to load with timeout
          await Promise.race([
            new Promise((resolve, reject) => {
              logoImg.onload = resolve;
              logoImg.onerror = reject;
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Logo load timeout')), 3000)
            )
          ]);
        
          // Create a canvas for the logo
          const logoCanvas = document.createElement('canvas');
          logoCanvas.width = logoImg.width;
          logoCanvas.height = logoImg.height;
          const logoCtx = logoCanvas.getContext('2d');
          logoCtx?.drawImage(logoImg, 0, 0);
        
          // Add logo to PDF
          const logoData = logoCanvas.toDataURL('image/png');
          const logoWidth = 15; // Smaller logo in mm
          const logoHeight = 15; // Smaller logo in mm
          const logoX = (pdfWidth - logoWidth) / 2; // Center horizontally
          pdf.addImage(logoData, 'PNG', logoX, 10, logoWidth, logoHeight);
        } catch (logoError) {
          console.warn('Could not add logo to PDF:', logoError);
          // Continue without logo if there's an error
        }
      } catch (logoError) {
        console.warn('Could not add logo to PDF:', logoError);
        // Continue without logo if there's an error
      }
      
      // Add image to PDF, centered and scaled to fit
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download the PDF
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (pdfError) {
      console.error('Error creating or saving PDF:', pdfError);
      alert('Failed to generate PDF. Please try again.');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Fallback: open print dialog
    try {
      window.print();
    } catch (printError) {
      console.error('Print fallback also failed:', printError);
      alert('Failed to generate PDF and print fallback also failed. Please try again later.');
    }
  }
};