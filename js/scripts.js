// 1. CONFIGURACIÓN DE LA BASE DE DATOS LOCAL (Dexie)
const db = new Dexie("EncuestasDB");
db.version(1).stores({ votos: '++id, carita, fecha' });

let miGrafica = null; // Variable para almacenar la instancia del gráfico de Chart.js

// Solicitar persistencia de almacenamiento en Android/Chrome
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist();
}

// =========================================================================
// 2. FUNCIÓN DE VOTACIÓN (¡ESTA ES LA QUE FALTA EN TU ARCHIVO!)
// =========================================================================
async function votar(tipoCarita) {
  try {
    // Guardar el registro de forma local en IndexedDB
    await db.votos.add({
      carita: tipoCarita,
      fecha: new Date().toISOString()
    });

    // Cambiar de pantalla de forma visual
    document.getElementById('seccion-encuesta').style.display = 'none';
    document.getElementById('seccion-gracias').style.display = 'flex';

    // Temporizador de 2 segundos para limpiar y regresar a las caritas
    setTimeout(() => {
      document.getElementById('seccion-gracias').style.display = 'none';
      document.getElementById('seccion-encuesta').style.display = 'block';
    }, 2000);

  } catch (error) {
    console.error("Error guardando el voto localmente:", error);
    alert("Hubo un problema al registrar tu voto.");
  }
}

// =========================================================================
// 3. LÓGICA DEL DASHBOARD Y ACCESO ADMINISTRATIVO
// =========================================================================
function solicitarAcceso() {
  const pin = prompt("Introduce el PIN de administrador para acceder al Dashboard:");
  if (pin === "1234") { // Cambia aquí tu contraseña si lo deseas
    abrirDashboard();
  } else if (pin !== null) {
    alert("PIN Incorrecto.");
  }
}

async function abrirDashboard() {
  const ahora = new Date();
  const prefijoMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  try {
    // 1. Consultar IndexedDB filtrando por el mes en curso
    const votosDelMes = await db.votos
      .where('fecha')
      .startsWith(prefijoMes)
      .toArray();

    // 2. Agrupar totales
    const totales = { Excelente: 0, Bueno: 0, Regular: 0, Malo: 0 };
    votosDelMes.forEach(voto => {
      if (totales[voto.carita] !== undefined) totales[voto.carita]++;
    });

    // 3. Renderizar la tabla de texto
    const listaMetricas = document.getElementById('lista-metricas');
    listaMetricas.innerHTML = `
      <div class="metric-row"><span>🤩 Excelente:</span> <strong>${totales.Excelente}</strong></div>
      <div class="metric-row"><span>😊 Bueno:</span> <strong>${totales.Bueno}</strong></div>
      <div class="metric-row"><span>😐 Regular:</span> <strong>${totales.Regular}</strong></div>
      <div class="metric-row"><span>😡 Malo:</span> <strong>${totales.Malo}</strong></div>
      <div class="metric-row" style="border:none; margin-top:10px; font-size:1.4rem;">
        <span>Total:</span> <strong>${votosDelMes.length} votos</strong>
      </div>
    `;

    // 4. Renderizar o actualizar la gráfica de Chart.js
    const ctx = document.getElementById('graficaVotos').getContext('2d');
    
    if (miGrafica) miGrafica.destroy();

    miGrafica = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Excelente', 'Bueno', 'Regular', 'Malo'],
        datasets: [{
          data: [totales.Excelente, totales.Bueno, totales.Regular, totales.Malo],
          backgroundColor: ['#4ADE80', '#6EE7B7', '#FCD34D', '#FCA5A5'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Mostrar contenedor del dashboard
    document.getElementById('dashboard').style.display = 'flex';

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
  }
}

function cerrarDashboard() {
  document.getElementById('dashboard').style.display = 'none';
}

// 5. Función integrada para exportar un archivo CSV con todo el histórico
async function exportarCSV() {
  const todosLosVotos = await db.votos.toArray();
  if (todosLosVotos.length === 0) return alert("No hay datos que exportar.");

  let csvContent = "data:text/csv;charset=utf-8,ID,Carita,Fecha\n";
  todosLosVotos.forEach(v => {
    csvContent += `${v.id},${v.carita},${v.fecha}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `reporte_votos_${new Date().toISOString().slice(0,7)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
