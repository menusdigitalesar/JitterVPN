const SITE = {
  brand:       "Jitter VPN",
  tagline:     "Seguro. Rápido. Global.",
  description: "Servidores premium optimizados para HTTP Custom y VPN con infraestructura protegida por Cloudflare.",
  whatsapp:    "5493764734171",   // ← reemplazar con número real
  telegram:    "jittervpn",       // ← reemplazar con usuario real
  email:       "",
  color: {
    primario:  "#00d4ff",   // cian neón
    secundario:"#7c3aed",   // violeta
    acento:    "#f59e0b",   // dorado/naranja (del logo)
  },
  stats: [
    { valor: "5000", sufijo: "+", label: "Usuarios activos" },
    { valor: "99.9", sufijo: "%", label: "Uptime garantizado", dec: 1 },
    { valor: "22",   sufijo: " Mbps", label: "Velocidad promedio" },
    { valor: "1",    sufijo: " País", label: "Argentina 🇦🇷" },
  ],
  planes: [
    {
      nombre: "VPN Diario",
      precio: "$XXX",
      periodo: "/ día",
      icono: "⚡",
      desc: "Acceso 24 horas. Ideal para probar.",
      features: ["1 conexión simultánea", "HTTP Custom", "Servidor Argentina", "Soporte por chat"],
      destacado: false,
    },
    {
      nombre: "VPN Mensual",
      precio: "$XXX",
      periodo: "/ mes",
      icono: "🛡️",
      desc: "El más elegido. Precio inmejorable.",
      features: ["2 conexiones simultáneas", "HTTP Custom", "Servidor Argentina", "Soporte prioritario", "Renovación automática"],
      destacado: true,
    },
    {
      nombre: "Cloudflare por IP",
      precio: "$XXX",
      periodo: "/ IP",
      icono: "☁️",
      desc: "Protección y bypass para tu IP fija.",
      features: ["IP dedicada", "Protección Cloudflare", "Anti-DDoS", "Configuración incluida"],
      destacado: false,
    },
  ],
};
