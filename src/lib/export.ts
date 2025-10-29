import html2canvas from 'html2canvas-pro';

/**
 * Exporta un elemento DOM como imagen PNG con tooltips visibles
 * @param elementId - ID del elemento a exportar
 * @param fileName - Nombre del archivo a descargar (sin extensión)
 */
export async function exportChartAsImage(elementId: string, fileName: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Elemento con ID ${elementId} no encontrado`);
      return;
    }

    // Simular hover en el gráfico para mostrar tooltips
    const svgElement = element.querySelector('svg');
    if (svgElement) {
      // Crear evento de mouse move en el centro del gráfico
      const rect = svgElement.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const mouseEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + centerX,
        clientY: rect.top + centerY,
      });

      svgElement.dispatchEvent(mouseEvent);

      // Esperar a que se renderice el tooltip
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Configurar opciones para html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });

    // Convertir canvas a blob y descargar
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error al exportar el gráfico:', error);
  }
}

/**
 * Exporta múltiples elementos como un único PNG
 * @param elementIds - Array de IDs de elementos a exportar
 * @param fileName - Nombre del archivo a descargar (sin extensión)
 */
export async function exportMultipleChartsAsImage(elementIds: string[], fileName: string): Promise<void> {
  try {
    const canvases: HTMLCanvasElement[] = [];

    // Capturar cada elemento
    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Elemento con ID ${elementId} no encontrado`);
        continue;
      }

      // Simular hover para mostrar tooltips
      const svgElement = element.querySelector('svg');
      if (svgElement) {
        const rect = svgElement.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const mouseEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + centerX,
          clientY: rect.top + centerY,
        });

        svgElement.dispatchEvent(mouseEvent);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      canvases.push(canvas);
    }

    if (canvases.length === 0) {
      console.error('No se capturaron gráficos');
      return;
    }

    // Combinar canvases en uno solo
    const totalHeight = canvases.reduce((sum, c) => sum + c.height + 20, 0);
    const maxWidth = Math.max(...canvases.map(c => c.width));

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;

    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) return;

    let currentY = 0;
    canvases.forEach((canvas) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, currentY, maxWidth, canvas.height + 20);
      ctx.drawImage(canvas, 0, currentY);
      currentY += canvas.height + 20;
    });

    // Descargar
    combinedCanvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error al exportar los gráficos:', error);
  }
}

