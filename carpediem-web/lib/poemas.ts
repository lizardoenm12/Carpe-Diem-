// /lib/poemas.ts
// Biblioteca central de poemas adaptativos para Carpe Diem.
// Uso: import { getPoemaAleatorio } from "@/lib/poemas"
//      const poema = getPoemaAleatorio(nivelEmocion)

export type NivelEmocional = 1 | 2 | 3 | 4 | 5 | 6;

export interface Poema {
  texto: string;
  autor: string;
  obra: string;
}

export const POEMAS_POR_NIVEL: Record<NivelEmocional, Poema[]> = {

  // ─── NIVEL 6 — Genial ───────────────────────────────────────────────────────
  6: [
    {
      texto: "Soy grande, contengo multitudes.",
      autor: "Walt Whitman",
      obra: "Canto a mí mismo",
    },
    {
      texto: "Y si el mundo se acaba mañana,\nhoy planto mi manzano.",
      autor: "Martín Lutero",
      obra: "atribuido",
    },
    {
      texto: "No eres una gota en el océano.\nEres el océano entero en una gota.",
      autor: "Rumi",
      obra: "Masnavi",
    },
    {
      texto: "Existo tal como soy — y eso es suficiente.\nSi nadie más en el mundo lo sabe, me siento contento.",
      autor: "Walt Whitman",
      obra: "Canto a mí mismo",
    },
    {
      texto: "Hay que ser absolutamente moderno.\nVivir el instante con toda su intensidad.",
      autor: "Arthur Rimbaud",
      obra: "Una temporada en el infierno",
    },
    // ── agregados ──
    {
      texto: "¡Oh, capitán, mi capitán!\nNuestro terrible viaje ha terminado.",
      autor: "Walt Whitman",
      obra: "Oh Captain, My Captain",
    },
    {
      texto: "Hoy me es posible la alegría más alta:\ncontemporaneidad con lo que existe.",
      autor: "Alejandra Pizarnik",
      obra: "Diarios",
    },
  ],

  // ─── NIVEL 5 — Tranquilo ────────────────────────────────────────────────────
  5: [
    {
      texto: "Dime, ¿qué piensas hacer\ncon tu única, salvaje y preciosa vida?",
      autor: "Mary Oliver",
      obra: "El día de verano",
    },
    {
      texto: "Deja que el suave animal de tu cuerpo\name lo que ama.",
      autor: "Mary Oliver",
      obra: "Gansos salvajes",
    },
    {
      texto: "La paz de las cosas salvajes\nque no cargan su vida con la angustia del mañana.",
      autor: "Wendell Berry",
      obra: "La paz de las cosas salvajes",
    },
    {
      texto: "No tengas prisa. Lo que tiene que llegar, llegará.\nLo que tiene que irse, ya se fue.",
      autor: "Antonio Machado",
      obra: "Proverbios y cantares",
    },
    {
      texto: "Caminante, son tus huellas\nel camino y nada más.",
      autor: "Antonio Machado",
      obra: "Cantares",
    },
    // ── agregados ──
    {
      texto: "Vivir es tan asombroso\nque apenas queda tiempo para otra cosa.",
      autor: "Emily Dickinson",
      obra: "carta a T.W. Higginson",
    },
    {
      texto: "Pido que me destinen a existir\ncon la misma desmesura con que existo.",
      autor: "Idea Vilariño",
      obra: "Poemas",
    },
  ],

  // ─── NIVEL 4 — Nervioso ─────────────────────────────────────────────────────
  4: [
    {
      texto: "Dos caminos se bifurcaban en un bosque, y yo —\ntomé el menos transitado.",
      autor: "Robert Frost",
      obra: "El camino no tomado",
    },
    {
      texto: "No cesaremos de explorar,\ny al final de toda nuestra búsqueda\nllegaremos al punto de partida.",
      autor: "T.S. Eliot",
      obra: "Little Gidding",
    },
    {
      texto: "Soy el dueño de mi destino,\nsoy el capitán de mi alma.",
      autor: "William Ernest Henley",
      obra: "Invictus",
    },
    {
      texto: "Aun en el caos más oscuro\nhay una estrella que guía.",
      autor: "Friedrich Nietzsche",
      obra: "Así habló Zaratustra",
    },
    {
      texto: "El que tiene un porqué para vivir\npuede soportar casi cualquier cómo.",
      autor: "Friedrich Nietzsche",
      obra: "El crepúsculo de los ídolos",
    },
    // ── agregados ──
    {
      texto: "No entres dócilmente en esa buena noche.\nRabea, rabea contra la muerte de la luz.",
      autor: "Dylan Thomas",
      obra: "No entres dócilmente",
    },
    {
      texto: "Hay un momento en que todo es posible\ny ese momento es ahora.",
      autor: "Mario Benedetti",
      obra: "El momento",
    },
  ],

  // ─── NIVEL 3 — Agobiado ─────────────────────────────────────────────────────
  3: [
    {
      texto: "Puedo escribir los versos más tristes esta noche.\nEscribir, por ejemplo: la noche está estrellada.",
      autor: "Pablo Neruda",
      obra: "Veinte poemas de amor",
    },
    {
      texto: "Hay golpes en la vida, tan fuertes...\nGolpes como del odio de Dios.",
      autor: "César Vallejo",
      obra: "Los heraldos negros",
    },
    {
      texto: "Ningún hombre es una isla,\nentero en sí mismo.",
      autor: "John Donne",
      obra: "Meditación XVII",
    },
    {
      texto: "He medido mi vida con cucharillas de café.",
      autor: "T.S. Eliot",
      obra: "La canción de amor de J. Alfred Prufrock",
    },
    {
      texto: "Todo pasa y todo queda,\npero lo nuestro es pasar.",
      autor: "Antonio Machado",
      obra: "Cantares",
    },
    // ── agregados ──
    {
      texto: "Nada dos veces ocurre,\nni ocurrirá. Por eso nacimos\nsin práctica y moriremos sin rutina.",
      autor: "Wisława Szymborska",
      obra: "Nada dos veces",
    },
    {
      texto: "Aquí me quedo, quieta,\nreuniendo mis fuerzas para mañana.",
      autor: "Rosario Castellanos",
      obra: "Meditación en el umbral",
    },
  ],

  // ─── NIVEL 2 — Frustrado ────────────────────────────────────────────────────
  2: [
    {
      texto: "Si lo vas a intentar, ve hasta el final.\nDe lo contrario, ni empieces.",
      autor: "Charles Bukowski",
      obra: "Lánzate",
    },
    {
      texto: "No entres dócilmente en esa buena noche.\nRabiar, rabiar contra la muerte de la luz.",
      autor: "Dylan Thomas",
      obra: "No entres dócilmente",
    },
    {
      texto: "De las cenizas me levanto\ncon mi pelo rojo y como hombres como aire.",
      autor: "Sylvia Plath",
      obra: "Lady Lazarus",
    },
    {
      texto: "No me resigno.\nAbajo, abajo, abajo hacia la oscuridad de la tumba.",
      autor: "Edna St. Vincent Millay",
      obra: "Elegía sin música",
    },
    {
      texto: "Levántate. Respira.\nLa batalla de hoy aún no ha terminado.",
      autor: "Rudyard Kipling",
      obra: "Si—",
    },
    // ── agregados ──
    {
      texto: "Fui a los bosques porque quería vivir a propósito,\ny no descubrir, al morir, que no había vivido.",
      autor: "Henry David Thoreau",
      obra: "Walden",
    },
    {
      texto: "Para hacer una obra de arte\nes necesaria toda la vida.",
      autor: "Julio Cortázar",
      obra: "Último round",
    },
  ],

  // ─── NIVEL 1 — Burnout ──────────────────────────────────────────────────────
  1: [
    {
      texto: "Este ser humano es una casa de huéspedes.\nCada mañana llega un nuevo visitante — recíbelos a todos.",
      autor: "Rumi",
      obra: "La casa de huéspedes",
    },
    {
      texto: "No tienes que ser buena.\nNo tienes que caminar de rodillas cien millas arrepintiéndote.",
      autor: "Mary Oliver",
      obra: "Gansos salvajes",
    },
    {
      texto: "Incluso la noche más oscura terminará\ny el sol volverá a salir.",
      autor: "Victor Hugo",
      obra: "Los miserables",
    },
    {
      texto: "Descansar no es perder el tiempo.\nEs preparar el alma para el siguiente vuelo.",
      autor: "Paulo Coelho",
      obra: "El Alquimista",
    },
    {
      texto: "Hoy permítete simplemente ser.\nNo hacer. Solo ser.",
      autor: "Lao Tsé",
      obra: "Tao Te Ching",
    },
    // ── agregados ──
    {
      texto: "Incluso la oscuridad tiene su dignidad.\nHay una quietud que sana.",
      autor: "Wendell Berry",
      obra: "La paz de las cosas silvestres",
    },
    {
      texto: "Necesito el mar porque me enseña:\nno sé si aprendo música o conciencia.",
      autor: "Pablo Neruda",
      obra: "La noche en la isla",
    },
  ],
};

// ─── Función principal ───────────────────────────────────────────────────────
/**
 * Devuelve un poema aleatorio para el nivel dado.
 * Acepta un texto a excluir para evitar repetir el poema anterior.
 */
export function getPoemaAleatorio(
  nivel: NivelEmocional,
  excluirTexto?: string
): Poema {
  const lista = POEMAS_POR_NIVEL[nivel];
  const candidatos = excluirTexto
    ? lista.filter((p) => p.texto !== excluirTexto)
    : lista;
  const pool = candidatos.length > 0 ? candidatos : lista;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Versión estable: devuelve siempre el mismo poema para el mismo nivel y día.
 * Útil para que no cambie al re-renderizar dentro de la misma sesión.
 * Ejemplo: getPoemaEstable(nivelEmocion, new Date().toDateString())
 */
export function getPoemaEstable(nivel: NivelEmocional, seed: string): Poema {
  const lista = POEMAS_POR_NIVEL[nivel];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return lista[hash % lista.length];
}