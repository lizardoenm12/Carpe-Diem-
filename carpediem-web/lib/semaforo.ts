
export const getBgColor = (nivel: number): string => {
  switch (nivel) {
    case 6: return "#E8F5E4"; // Genial    — verde salvia
    case 5: return "#E4F0EC"; // Tranquilo — verde agua
    case 4: return "#F5F0DC"; // Nervioso  — pergamino
    case 3: return "#F5EBD8"; // Agobiado  — arena durazno
    case 2: return "#F2E4E4"; // Frustrado — rosa palo
    case 1: return "#EDE4E4"; // Burnout   — malva grisáceo
    default: return "#E8F5E4";
  }
};

export const getBorderCard = (nivel: number): string => {
  switch (nivel) {
    case 6: return "#C2DEBB";
    case 5: return "#B8D8CC";
    case 4: return "#DDDBB8";
    case 3: return "#DDCAAA";
    case 2: return "#D8B8B8";
    case 1: return "#CCC0C0";
    default: return "#C2DEBB";
  }
};

export const getTextoPrincipal = (nivel: number): string => {
  switch (nivel) {
    case 6: return "#2A5A2A";
    case 5: return "#2A4A3A";
    case 4: return "#4A4420";
    case 3: return "#4A3018";
    case 2: return "#4A2020";
    case 1: return "#3A2828";
    default: return "#2A5A2A";
  }
};

export const getTextoSecundario = (nivel: number): string => {
  switch (nivel) {
    case 6: return "#5A8A5A";
    case 5: return "#5A7A6A";
    case 4: return "#7A7448";
    case 3: return "#7A6048";
    case 2: return "#7A5050";
    case 1: return "#6A5050";
    default: return "#5A8A5A";
  }
};